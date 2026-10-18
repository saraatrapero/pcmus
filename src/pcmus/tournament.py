"""Torneo todos contra todos y clasificación.

Cada partida se juega en un **proceso aparte** con un tiempo máximo. Si un bot
se cuelga, el proceso se mata y ese bot pierde la partida; el torneo sigue.
Un bot que lanza una excepción, hace una jugada ilegal o se pasa de tiempo en
una decisión también pierde, sin afectar al resto.

Uso::

    python -m pcmus tournament --games 20 --out results
"""

from __future__ import annotations

import json
import multiprocessing as mp
from concurrent.futures import ThreadPoolExecutor
from dataclasses import asdict, dataclass, field
from datetime import UTC, datetime
from itertools import combinations
from pathlib import Path
from typing import Any

from .arena import GameResult, play_game
from .registry import PlayerSpec

ELO_START = 1500.0
ELO_K = 24.0


@dataclass
class TournamentConfig:
    games_per_pair: int = 20
    target: int = 30
    move_time_limit: float = 2.0
    game_timeout: float = 120.0
    seed: int = 2026
    processes: int = 0  # 0 = tantos como núcleos


@dataclass
class Standing:
    name: str
    group: str
    authors: list[str]
    description: str
    games: int = 0
    wins: int = 0
    losses: int = 0
    forfeits: int = 0
    points_for: int = 0
    points_against: int = 0
    elo: float = ELO_START
    think_time: float = 0.0

    @property
    def win_rate(self) -> float:
        return self.wins / self.games if self.games else 0.0

    def to_dict(self) -> dict[str, Any]:
        d = asdict(self)
        d["win_rate"] = round(self.win_rate, 4)
        d["elo"] = round(self.elo, 1)
        d["avg_think_time"] = round(self.think_time / self.games, 4) if self.games else 0.0
        del d["think_time"]
        return d


@dataclass
class Match:
    a: str
    b: str
    wins_a: int = 0
    wins_b: int = 0
    notes: list[str] = field(default_factory=list)


# --------------------------------------------------------------------------- #
# Una partida aislada en su propio proceso                                    #
# --------------------------------------------------------------------------- #
def _child(specs, seed, first_mano, config, turn, queue) -> None:  # pragma: no cover - otro proceso
    try:
        players = [s.load()(seed=seed * 2 + i) for i, s in enumerate(specs)]
    except Exception as exc:  # noqa: BLE001
        queue.put({"error": f"no se pudo crear el bot: {exc!r}", "faulty": turn.value})
        return

    def mark(p: int) -> None:
        turn.value = p

    result = play_game(
        players,
        target=config.target,
        seed=seed,
        first_mano=first_mano,
        move_time_limit=config.move_time_limit,
        on_turn=mark,
    )
    queue.put(result.to_dict())


def run_isolated_game(
    a: PlayerSpec, b: PlayerSpec, seed: int, first_mano: int, config: TournamentConfig
) -> GameResult:
    """Juega ``a`` (jugador 0) contra ``b`` (jugador 1) en otro proceso."""
    ctx = mp.get_context("spawn")
    queue = ctx.Queue()
    turn = ctx.Value("i", 0)
    proc = ctx.Process(target=_child, args=((a, b), seed, first_mano, config, turn, queue))
    proc.start()
    try:
        data = queue.get(timeout=config.game_timeout)
    except Exception:  # noqa: BLE001 - cola vacía: el bot se ha colgado
        data = None
    proc.join(timeout=2)
    if proc.is_alive():
        proc.kill()
        proc.join()
    if data is None:
        faulty = turn.value
        return GameResult(1 - faulty, (0, 0), 0, forfeit="partida colgada (timeout)", faulty=faulty)
    if "error" in data:
        faulty = data["faulty"]
        return GameResult(1 - faulty, (0, 0), 0, forfeit=data["error"], faulty=faulty)
    return GameResult(
        winner=data["winner"],
        scores=tuple(data["scores"]),
        hands=data["hands"],
        forfeit=data["forfeit"],
        faulty=data["faulty"],
        moves=data["moves"],
        think_time=data["think_time"],
    )


def _game_job(args):
    a, b, seed, first_mano, config = args
    return run_isolated_game(a, b, seed, first_mano, config)


# --------------------------------------------------------------------------- #
# Torneo                                                                      #
# --------------------------------------------------------------------------- #
def _elo_update(winner: Standing, loser: Standing) -> None:
    expected = 1 / (1 + 10 ** ((loser.elo - winner.elo) / 400))
    winner.elo += ELO_K * (1 - expected)
    loser.elo -= ELO_K * (1 - expected)


def run_tournament(specs: list[PlayerSpec], config: TournamentConfig | None = None) -> dict:
    """Enfrenta a todos contra todos y devuelve la clasificación como diccionario."""
    config = config or TournamentConfig()
    standings = {s.name: Standing(s.name, s.group, list(s.authors), s.description) for s in specs}
    jobs, keys = [], []
    for i, j in combinations(range(len(specs)), 2):
        for g in range(config.games_per_pair):
            # Se alternan asiento y mano para que el reparto sea justo.
            a, b = (specs[i], specs[j]) if g % 2 == 0 else (specs[j], specs[i])
            seed = config.seed * 100_003 + i * 1_009 + j * 101 + g
            jobs.append((a, b, seed, (g // 2) % 2, config))
            keys.append((specs[i].name, specs[j].name))

    # Cada partida ya es un proceso; los hilos solo sirven para lanzar varias a la vez.
    workers = config.processes or max(1, mp.cpu_count())
    with ThreadPoolExecutor(max_workers=workers) as pool:
        results = list(pool.map(_game_job, jobs))

    matches: dict[tuple[str, str], Match] = {k: Match(*k) for k in dict.fromkeys(keys)}
    for job, key, res in zip(jobs, keys, results, strict=False):
        a, b = job[0], job[1]
        seat = (standings[a.name], standings[b.name])
        win, lose = seat[res.winner], seat[1 - res.winner]
        for idx, st in enumerate(seat):
            st.games += 1
            st.points_for += res.scores[idx]
            st.points_against += res.scores[1 - idx]
            st.think_time += res.think_time[idx] if idx < len(res.think_time) else 0.0
        win.wins += 1
        lose.losses += 1
        if res.faulty is not None:
            seat[res.faulty].forfeits += 1
            matches[key].notes.append(f"{seat[res.faulty].name}: {res.forfeit}")
        _elo_update(win, lose)
        m = matches[key]
        if win.name == m.a:
            m.wins_a += 1
        else:
            m.wins_b += 1

    table = sorted(standings.values(), key=lambda s: (-s.win_rate, -s.elo, s.name))
    return {
        "generated_at": datetime.now(UTC).isoformat(timespec="seconds"),
        "config": asdict(config),
        "standings": [s.to_dict() for s in table],
        "matches": [{**asdict(m), "notes": sorted(set(m.notes))[:5]} for m in matches.values()],
    }


def to_markdown(board: dict) -> str:
    """Tabla en Markdown para el README o la documentación."""
    lines = [
        f"_Actualizado: {board['generated_at']} · {board['config']['games_per_pair']} "
        f"partidas por pareja a {board['config']['target']} piedras_",
        "",
        "| # | Bot | Autores | Partidas | Victorias | % | Elo | Fallos |",
        "|---|-----|---------|---------:|----------:|--:|----:|-------:|",
    ]
    for i, s in enumerate(board["standings"], 1):
        lines.append(
            f"| {i} | `{s['name']}` | {', '.join(s['authors'])} | {s['games']} | {s['wins']} | "
            f"{s['win_rate'] * 100:.0f} | {s['elo']:.0f} | {s['forfeits']} |"
        )
    return "\n".join(lines) + "\n"


def write_results(board: dict, out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "leaderboard.json").write_text(
        json.dumps(board, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (out_dir / "leaderboard.md").write_text(to_markdown(board), encoding="utf-8")
