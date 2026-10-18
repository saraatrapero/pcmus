"""Línea de comandos: ``python -m pcmus <orden>``.

Órdenes:

* ``play``: juega en la terminal contra un bot.
* ``tournament``: torneo todos contra todos y clasificación en ``results/``.
* ``validate``: comprueba que todos los bots admitidos cargan y juegan limpio.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .actions import Action, IllegalActionError
from .game import MusGame


def _format_cards(cards) -> str:
    return "  ".join(f"[{i}] {c}" for i, c in enumerate(cards))


def _ask(prompt: str) -> str:
    try:
        return input(prompt).strip()
    except EOFError:
        sys.exit(0)


def cmd_play(args: argparse.Namespace) -> int:
    from .registry import discover

    specs = {s.name: s for s in discover()}
    if args.bot not in specs:
        print(f"Bot desconocido. Disponibles: {', '.join(specs)}")
        return 1
    bot = specs[args.bot].load()(seed=args.seed)
    game = MusGame(target=args.target, seed=args.seed)
    human = 0
    bot.on_game_start(1, args.target)
    last = 0
    print(f"Mus a dos contra {bot.name}. Llegas a {args.target} piedras y ganas.\n")
    while not game.is_over:
        if len(game.hand_summaries) > last:
            last = len(game.hand_summaries)
            s = game.hand_summaries[-1]
            print(f"\n— Recuento ({s['ended_by']}) —")
            print(f"  Tú:  {s['hands'][0]}  ({s['descriptions'][0]})")
            print(f"  Bot: {s['hands'][1]}  ({s['descriptions'][1]})")
            for line in s["count"]:
                who = "Tú" if line["player"] == human else "Bot"
                print(f"  {line['lance']}: {who} +{line['amount']} ({line['reason']})")
            print(f"  Marcador: tú {game.scores[0]} – bot {game.scores[1]}\n")
            bot.on_hand_end(s)
        if game.turn == human:
            obs = game.observation(human)
            print(
                f"Mano {obs.hand_number} · fase {obs.phase} · {'eres mano' if obs.is_mano else 'eres postre'}"
            )
            print("  " + _format_cards(obs.hand))
            if obs.phase == "descarte":
                raw = _ask("  ¿Qué cartas tiras? (posiciones separadas por espacios): ")
                try:
                    action = Action.descarte([int(x) for x in raw.split()])
                except ValueError:
                    print("  Escribe números del 0 al 3.")
                    continue
            else:
                legal = game.legal_actions()
                for i, a in enumerate(legal):
                    print(f"   {i}) {a}")
                raw = _ask("  Elige: ")
                if not raw.isdigit() or int(raw) >= len(legal):
                    print("  Opción no válida.")
                    continue
                action = legal[int(raw)]
            try:
                game.step(action)
            except IllegalActionError as exc:
                print(f"  {exc}")
        else:
            action = bot.choose_action(game.observation(1), game.legal_actions())
            print(f"  {bot.name}: {action}")
            game.step(action)
    print("¡Has ganado!" if game.winner == human else f"Gana {bot.name}.")
    return 0


def cmd_tournament(args: argparse.Namespace) -> int:
    from .registry import discover
    from .tournament import TournamentConfig, run_tournament, to_markdown, write_results

    specs = discover()
    config = TournamentConfig(
        games_per_pair=args.games,
        target=args.target,
        move_time_limit=args.move_time,
        game_timeout=args.game_timeout,
        seed=args.seed,
        processes=args.processes,
    )
    print(f"Torneo con {len(specs)} bots: {', '.join(s.name for s in specs)}")
    board = run_tournament(specs, config)
    write_results(board, Path(args.out))
    print(to_markdown(board))
    return 0


def cmd_validate(args: argparse.Namespace) -> int:
    from .arena import play_game
    from .bots import RandomBot
    from .registry import RegistryError, discover

    try:
        specs = discover()
    except RegistryError as exc:
        print(f"ERROR: {exc}")
        return 1
    ok = True
    for spec in specs:
        cls = spec.load()
        for g in range(args.games):
            pair = (
                (cls(seed=g), RandomBot(seed=g)) if g % 2 == 0 else (RandomBot(seed=g), cls(seed=g))
            )
            res = play_game(pair, seed=g, move_time_limit=args.move_time)
            me = 0 if g % 2 == 0 else 1
            if res.faulty == me:
                print(f"✗ {spec.name}: {res.forfeit}")
                ok = False
                break
        else:
            print(f"✓ {spec.name} ({spec.group})")
    return 0 if ok else 1


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="pcmus", description="Mus a dos: juego, bots y torneo.")
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("play", help="jugar en la terminal contra un bot")
    p.add_argument("--bot", default="tio-paco")
    p.add_argument("--target", type=int, default=30)
    p.add_argument("--seed", type=int, default=None)
    p.set_defaults(func=cmd_play)

    t = sub.add_parser("tournament", help="torneo todos contra todos")
    t.add_argument("--games", type=int, default=20, help="partidas por pareja (par)")
    t.add_argument("--target", type=int, default=30)
    t.add_argument("--move-time", type=float, default=2.0)
    t.add_argument("--game-timeout", type=float, default=120.0)
    t.add_argument("--seed", type=int, default=2026)
    t.add_argument("--processes", type=int, default=0)
    t.add_argument("--out", default="results")
    t.set_defaults(func=cmd_tournament)

    v = sub.add_parser("validate", help="comprobar los bots admitidos")
    v.add_argument("--games", type=int, default=10)
    v.add_argument("--move-time", type=float, default=2.0)
    v.set_defaults(func=cmd_validate)

    args = parser.parse_args(argv)
    return int(args.func(args))
