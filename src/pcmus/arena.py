"""Árbitro: enfrenta a dos jugadores en una partida completa.

Un jugador pierde la partida (sin romper nada) si:

* lanza una excepción,
* devuelve algo que no es una acción legal,
* o tarda más de ``move_time_limit`` segundos en una decisión.

Los bots que se cuelgan del todo (bucles infinitos) se controlan en el torneo,
que ejecuta cada partida en un proceso aparte (ver :mod:`pcmus.tournament`).
"""

from __future__ import annotations

import time
import traceback
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

from .actions import Action
from .game import MusGame
from .player import Player


@dataclass
class GameResult:
    """Resultado de una partida.

    Attributes:
        winner: índice del ganador (0 o 1).
        scores: piedras finales.
        hands: repartos jugados.
        forfeit: si alguien perdió por fallo, la causa (``None`` si no).
        faulty: índice del jugador que falló (``None`` si no).
    """

    winner: int
    scores: tuple[int, int]
    hands: int
    forfeit: str | None = None
    faulty: int | None = None
    moves: int = 0
    think_time: list[float] = field(default_factory=lambda: [0.0, 0.0])

    def to_dict(self) -> dict[str, Any]:
        return {
            "winner": self.winner,
            "scores": list(self.scores),
            "hands": self.hands,
            "forfeit": self.forfeit,
            "faulty": self.faulty,
            "moves": self.moves,
            "think_time": [round(t, 4) for t in self.think_time],
        }


def play_game(
    players: tuple[Player, Player] | list[Player],
    *,
    target: int = 30,
    seed: int | None = None,
    first_mano: int = 0,
    move_time_limit: float = 2.0,
    max_moves: int = 5000,
    on_turn: Callable[[int], None] | None = None,
) -> GameResult:
    """Juega una partida entre ``players[0]`` y ``players[1]``.

    Ejemplo::

        from pcmus.arena import play_game
        from pcmus.bots import RandomBot, MonteCarloBot

        result = play_game((RandomBot(seed=1), MonteCarloBot(seed=2)), seed=7)
        print(result.winner, result.scores)
    """
    game = MusGame(target=target, seed=seed, first_mano=first_mano)
    think = [0.0, 0.0]
    seen_hands = 0

    def forfeit(player: int, reason: str) -> GameResult:
        return GameResult(
            winner=1 - player,
            scores=(game.scores[0], game.scores[1]),
            hands=game.hand_number,
            forfeit=reason,
            faulty=player,
            moves=moves,
            think_time=think,
        )

    moves = 0
    for i, p in enumerate(players):
        try:
            p.on_game_start(i, target)
        except Exception as exc:  # noqa: BLE001 - el árbitro no debe caerse nunca
            return forfeit(i, f"error en on_game_start: {exc!r}")

    while not game.is_over:
        if moves >= max_moves:
            leader = 0 if game.scores[0] >= game.scores[1] else 1
            return GameResult(
                leader,
                (game.scores[0], game.scores[1]),
                game.hand_number,
                forfeit="límite de jugadas",
                moves=moves,
                think_time=think,
            )
        player = game.turn
        assert player is not None
        if on_turn is not None:
            on_turn(player)
        obs = game.observation(player)
        legal = game.legal_actions()
        start = time.perf_counter()
        try:
            action = players[player].choose_action(obs, list(legal))
        except Exception:  # noqa: BLE001
            return forfeit(player, "excepción: " + traceback.format_exc(limit=2).strip())
        elapsed = time.perf_counter() - start
        think[player] += elapsed
        if elapsed > move_time_limit:
            return forfeit(player, f"tiempo excedido ({elapsed:.2f}s > {move_time_limit}s)")
        if not isinstance(action, Action) or not game.is_legal(action):
            return forfeit(player, f"acción ilegal: {action!r}")
        game.step(action)
        moves += 1

        if len(game.hand_summaries) > seen_hands:
            seen_hands = len(game.hand_summaries)
            summary = game.hand_summaries[-1]
            for i, p in enumerate(players):
                try:
                    p.on_hand_end(summary)
                except Exception as exc:  # noqa: BLE001
                    return forfeit(i, f"error en on_hand_end: {exc!r}")

    assert game.winner is not None
    return GameResult(
        winner=game.winner,
        scores=(game.scores[0], game.scores[1]),
        hands=game.hand_number,
        moves=moves,
        think_time=think,
    )
