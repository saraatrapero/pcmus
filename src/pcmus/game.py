"""Motor del mus a dos (un jugador contra otro).

El motor es una máquina de estados. Solo hay un jugador con el turno
(:attr:`MusGame.turn`), que elige una de las acciones de
:meth:`MusGame.legal_actions` y la aplica con :meth:`MusGame.step`.

Reglas implementadas (resumen; el reglamento completo está en la documentación):

* Baraja de 40 cartas, mus a 8 reyes (treses = reyes, doses = ases).
* Cada mano se reparten 4 cartas por jugador. La *mano* habla primero y
  gana los empates. La mano alterna en cada reparto.
* Fase de mus: si los dos piden mus, ambos se descartan de 1 a 4 cartas.
  Tras ``max_mus_rounds`` descartes ya solo se puede cortar.
* Lances en orden: grande, chica, pares y juego (o punto si nadie tiene juego).
  Pares y juego solo se envidan si los dos jugadores los tienen.
* Envites: paso, envido N, subir N más, quiero, no quiero y órdago.
  Un «no quiero» da al que envidó lo que había aceptado antes (1 piedra si era
  el primer envite) de inmediato.
* Recuento al final de la mano: grande, chica, pares y juego/punto, en ese
  orden. En cuanto alguien llega a la meta la partida se acaba y no se
  cuenta nada más.
* Un órdago aceptado se resuelve en el acto: quien gana ese lance gana la partida.
"""

from __future__ import annotations

import random
from dataclasses import asdict, dataclass
from typing import Any

from . import hands as H
from .actions import (
    CORTO,
    DESCARTE,
    ENVIDO,
    MUS,
    NO_QUIERO,
    ORDAGO,
    PASO,
    QUIERO,
    Action,
    IllegalActionError,
)
from .cards import Card, Deck

PHASE_MUS = "mus"
PHASE_DESCARTE = "descarte"
PHASE_GRANDE = "grande"
PHASE_CHICA = "chica"
PHASE_PARES = "pares"
PHASE_JUEGO = "juego"
PHASE_PUNTO = "punto"
PHASE_FIN = "fin"

LANCE_PHASES = (PHASE_GRANDE, PHASE_CHICA, PHASE_PARES, PHASE_JUEGO, PHASE_PUNTO)

#: Envites que se ofrecen en :meth:`MusGame.legal_actions`. Cualquier otro
#: número entre 2 y la meta también es legal.
SUGGESTED_BETS = (2, 3, 5, 10)


@dataclass
class Bet:
    """Estado de las apuestas de un lance."""

    lance: str
    contested: bool = True  # False si el lance no se envida (p. ej. solo uno tiene pares)
    pending: int | None = None  # piedras propuestas y aún no aceptadas
    ordago: bool = False
    withdraw: int = 0  # lo que se lleva quien envidó si le dicen «no quiero»
    bettor: int | None = None
    stake: int = 0  # piedras aceptadas con «quiero»
    passes: int = 0
    en_paso: bool = False
    rejected: bool = False
    closed: bool = False

    def public(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class Observation:
    """Lo que un jugador puede saber en un momento dado. Nunca incluye las
    cartas del rival mientras se juega la mano.

    Attributes:
        player: índice del jugador que observa (0 o 1).
        hand: sus cuatro cartas.
        mano: índice del jugador que es mano en este reparto.
        phase: fase actual (``mus``, ``descarte``, ``grande``... o ``fin``).
        turn: a quién le toca (``None`` si la partida ha terminado).
        scores: piedras de cada jugador, indexadas por jugador.
        target: piedras para ganar la partida.
        hand_number: número de reparto (empieza en 1).
        mus_round: descartes hechos en esta mano.
        max_mus_rounds: descartes permitidos por mano.
        bet: apuestas del lance en curso (``None`` fuera de los lances).
        lances: resumen público de los lances ya cerrados en esta mano.
        declarations: quién ha dicho tener pares / juego (``None`` si aún no se sabe).
        history: acciones públicas de esta mano (los descartes solo dicen cuántas cartas).
        last_hand: recuento de la mano anterior, con las cartas ya descubiertas.
    """

    player: int
    hand: tuple[Card, ...]
    mano: int
    phase: str
    turn: int | None
    scores: tuple[int, int]
    target: int
    hand_number: int
    mus_round: int
    max_mus_rounds: int
    bet: dict[str, Any] | None
    lances: dict[str, dict[str, Any]]
    declarations: dict[str, tuple[bool, bool] | None]
    history: tuple[dict[str, Any], ...]
    last_hand: dict[str, Any] | None

    @property
    def opponent(self) -> int:
        return 1 - self.player

    @property
    def is_mano(self) -> bool:
        return self.player == self.mano

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data["hand"] = [c.code() for c in self.hand]
        data["scores"] = list(self.scores)
        data["history"] = list(self.history)
        data["declarations"] = {
            k: (list(v) if v is not None else None) for k, v in self.declarations.items()
        }
        return data


class MusGame:
    """Una partida de mus a dos.

    Args:
        target: piedras para ganar (30 o 40 son lo habitual).
        seed: semilla para el barajado. Misma semilla y mismas acciones dan la
            misma partida.
        max_mus_rounds: descartes permitidos por mano antes de tener que cortar.
        first_mano: jugador que es mano en el primer reparto.

    Ejemplo::

        game = MusGame(target=30, seed=1)
        while not game.is_over:
            action = game.legal_actions()[0]
            game.step(action)
        print(game.winner, game.scores)
    """

    def __init__(
        self,
        target: int = 40,
        seed: int | None = None,
        max_mus_rounds: int = 4,
        first_mano: int = 0,
    ) -> None:
        if target < 5:
            raise ValueError("La meta debe ser de al menos 5 piedras")
        if first_mano not in (0, 1):
            raise ValueError("first_mano debe ser 0 o 1")
        self.target = target
        self.max_mus_rounds = max_mus_rounds
        self._rng = random.Random(seed)
        self.scores: list[int] = [0, 0]
        self.mano = first_mano
        self.hand_number = 0
        self.winner: int | None = None
        self.hand_summaries: list[dict[str, Any]] = []
        self._deal()

    # ------------------------------------------------------------------ #
    # Consultas públicas                                                  #
    # ------------------------------------------------------------------ #
    @property
    def is_over(self) -> bool:
        return self.winner is not None

    @property
    def postre(self) -> int:
        return 1 - self.mano

    def hand_of(self, player: int) -> tuple[Card, ...]:
        """Cartas de un jugador. Solo para el motor, los tests y el árbitro:
        los bots reciben únicamente su :class:`Observation`."""
        return tuple(self.hands[player])

    def legal_actions(self) -> list[Action]:
        """Acciones legales para el jugador que tiene el turno."""
        if self.is_over:
            return []
        if self.phase == PHASE_MUS:
            options = [Action.corto()]
            if self.mus_round < self.max_mus_rounds:
                options.insert(0, Action.mus())
            return options
        if self.phase == PHASE_DESCARTE:
            return [Action.descarte(p) for p in _all_discards()]
        bet = self.bet
        assert bet is not None
        if bet.pending is None:
            bets = [Action.envido(n) for n in SUGGESTED_BETS if n <= self.target]
            return [Action.paso(), *bets, Action.ordago()]
        options = [Action.quiero(), Action.no_quiero()]
        if not bet.ordago:
            options += [Action.envido(n) for n in SUGGESTED_BETS if bet.pending + n <= self.target]
            options.append(Action.ordago())
        return options

    def is_legal(self, action: Action) -> bool:
        """Comprueba una acción cualquiera (incluidos envites no sugeridos)."""
        if self.is_over:
            return False
        if action.kind == DESCARTE:
            return (
                self.phase == PHASE_DESCARTE
                and 1 <= len(action.discard) <= 4
                and len(set(action.discard)) == len(action.discard)
                and all(0 <= i < 4 for i in action.discard)
            )
        if action.kind == ENVIDO and self.phase in LANCE_PHASES:
            bet = self.bet
            assert bet is not None
            if bet.ordago or action.amount < 2:
                return False
            base = bet.pending or 0
            return base + action.amount <= self.target
        return any(a.kind == action.kind for a in self.legal_actions() if a.kind != ENVIDO)

    def observation(self, player: int) -> Observation:
        """Vista del juego para ``player``: sus cartas y la información pública."""
        if player not in (0, 1):
            raise ValueError("player debe ser 0 o 1")
        return Observation(
            player=player,
            hand=tuple(self.hands[player]),
            mano=self.mano,
            phase=self.phase,
            turn=self.turn,
            scores=(self.scores[0], self.scores[1]),
            target=self.target,
            hand_number=self.hand_number,
            mus_round=self.mus_round,
            max_mus_rounds=self.max_mus_rounds,
            bet=self.bet.public() if self.bet is not None and self.phase in LANCE_PHASES else None,
            lances={k: v.public() for k, v in self.lances.items() if v.closed},
            declarations=dict(self.declarations),
            history=tuple(self.history),
            last_hand=self.hand_summaries[-1] if self.hand_summaries else None,
        )

    # ------------------------------------------------------------------ #
    # Aplicar acciones                                                    #
    # ------------------------------------------------------------------ #
    def step(self, action: Action) -> None:
        """Aplica ``action`` para el jugador que tiene el turno.

        Raises:
            IllegalActionError: si la acción no es legal ahora mismo.
        """
        if not isinstance(action, Action):
            raise IllegalActionError(f"Se esperaba una Action y llegó {type(action).__name__}")
        if not self.is_legal(action):
            raise IllegalActionError(f"Acción ilegal en fase {self.phase}: {action}")
        player = self.turn
        assert player is not None
        self._log(player, action)

        if self.phase == PHASE_MUS:
            self._step_mus(player, action)
        elif self.phase == PHASE_DESCARTE:
            self._step_discard(player, action)
        else:
            self._step_bet(player, action)

    # Fase de mus ---------------------------------------------------------
    def _step_mus(self, player: int, action: Action) -> None:
        if action.kind == CORTO:
            self._start_lances()
        elif player == self.mano:
            self.turn = self.postre
        else:
            self.phase = PHASE_DESCARTE
            self.turn = self.mano
            self._pending_discards: dict[int, tuple[int, ...]] = {}

    def _step_discard(self, player: int, action: Action) -> None:
        self._pending_discards[player] = action.discard
        if player == self.mano:
            self.turn = self.postre
            return
        thrown: list[Card] = []
        for p in (self.mano, self.postre):
            positions = self._pending_discards[p]
            new_cards = self._deck.draw(len(positions))
            for pos, card in zip(positions, new_cards, strict=False):
                thrown.append(self.hands[p][pos])
                self.hands[p][pos] = card
        self._deck.discard(thrown)
        self.mus_round += 1
        self.phase = PHASE_MUS
        self.turn = self.mano

    # Lances -----------------------------------------------------------------
    def _start_lances(self) -> None:
        self._open_lance(PHASE_GRANDE)

    def _open_lance(self, lance: str) -> None:
        self.phase = lance
        self.bet = Bet(lance)
        self.lances[lance] = self.bet
        self.turn = self.mano

    def _step_bet(self, player: int, action: Action) -> None:
        bet = self.bet
        assert bet is not None
        other = 1 - player
        kind = action.kind
        if kind == PASO:
            bet.passes += 1
            if bet.passes == 2:
                bet.en_paso = True
                self._close_lance()
            else:
                self.turn = other
        elif kind == ENVIDO:
            if bet.pending is None:
                bet.withdraw = 1
                bet.pending = action.amount
            else:
                bet.withdraw = bet.pending
                bet.pending += action.amount
            bet.bettor = player
            self.turn = other
        elif kind == ORDAGO:
            bet.withdraw = bet.pending if bet.pending is not None else 1
            bet.pending = self.target
            bet.ordago = True
            bet.bettor = player
            self.turn = other
        elif kind == QUIERO:
            assert bet.pending is not None
            bet.stake = bet.pending
            if bet.ordago:
                self._resolve_ordago(bet.lance)
                return
            self._close_lance()
        elif kind == NO_QUIERO:
            assert bet.bettor is not None
            bet.rejected = True
            bet.stake = 0
            if self._award(bet.bettor, bet.withdraw):
                self._finish_hand(ended_by=f"no quiero a {bet.lance}")
                return
            self._close_lance()

    def _close_lance(self) -> None:
        assert self.bet is not None
        self.bet.closed = True
        lance = self.bet.lance
        if lance == PHASE_GRANDE:
            self._open_lance(PHASE_CHICA)
        elif lance == PHASE_CHICA:
            self._setup_pares()
        elif lance == PHASE_PARES:
            self._setup_juego()
        else:
            self._finish_hand()

    def _setup_pares(self) -> None:
        has = (H.pares_type(self.hands[0]) > 0, H.pares_type(self.hands[1]) > 0)
        self.declarations["pares"] = has
        if all(has):
            self._open_lance(PHASE_PARES)
        else:
            self.lances[PHASE_PARES] = Bet(PHASE_PARES, contested=False, closed=True)
            self._setup_juego()

    def _setup_juego(self) -> None:
        has = (H.has_juego(self.hands[0]), H.has_juego(self.hands[1]))
        self.declarations["juego"] = has
        if all(has):
            self._open_lance(PHASE_JUEGO)
        elif any(has):
            self.lances[PHASE_JUEGO] = Bet(PHASE_JUEGO, contested=False, closed=True)
            self._finish_hand()
        else:
            self._open_lance(PHASE_PUNTO)

    # Recuento ------------------------------------------------------------
    def lance_winner(self, lance: str) -> int | None:
        """Quién gana un lance con las cartas actuales (``None`` si nadie puede
        ganarlo, p. ej. pares sin pares). Los empates son para la mano."""
        a, b = self.hands
        if lance == PHASE_GRANDE:
            keys = (H.grande_key(a), H.grande_key(b))
        elif lance == PHASE_CHICA:
            keys = (H.chica_key(a), H.chica_key(b))
        elif lance == PHASE_PARES:
            keys = (H.pares_key(a), H.pares_key(b))
            if keys[0][0] == 0 and keys[1][0] == 0:
                return None
        elif lance == PHASE_JUEGO:
            keys = (H.juego_key(a), H.juego_key(b))
            if keys == (0, 0):
                return None
        elif lance == PHASE_PUNTO:
            keys = (H.punto_key(a), H.punto_key(b))
        else:
            raise ValueError(lance)
        if keys[0] == keys[1]:
            return self.mano
        return 0 if keys[0] > keys[1] else 1

    def _resolve_ordago(self, lance: str) -> None:
        winner = self.lance_winner(lance)
        assert winner is not None
        self.scores[winner] = self.target
        self.winner = winner
        self._finish_hand(ended_by=f"órdago a {lance}", count=False)

    def _award(self, player: int, amount: int) -> bool:
        """Suma piedras y devuelve ``True`` si con eso se gana la partida."""
        if self.winner is not None or amount <= 0:
            return self.winner is not None
        self.scores[player] = min(self.target, self.scores[player] + amount)
        self._awards.append({"player": player, "amount": amount})
        if self.scores[player] >= self.target:
            self.winner = player
            return True
        return False

    def _count(self) -> list[dict[str, Any]]:
        """Recuento lance a lance. Se para en cuanto alguien llega a la meta."""
        lines: list[dict[str, Any]] = []
        for lance in LANCE_PHASES:
            bet = self.lances.get(lance)
            if bet is None:
                continue
            winner = self.lance_winner(lance)
            if winner is None:
                continue
            amount, reason = 0, ""
            if lance in (PHASE_GRANDE, PHASE_CHICA):
                if bet.en_paso:
                    amount, reason = 1, "en paso"
                elif bet.stake:
                    amount, reason = bet.stake, "querido"
            elif lance == PHASE_PARES:
                value = H.pares_value(self.hands[winner])
                amount = value + bet.stake
                reason = H.PARES_NAMES[value] + (f" + {bet.stake} queridas" if bet.stake else "")
            elif lance == PHASE_JUEGO:
                value = H.juego_value(self.hands[winner])
                amount = value + bet.stake
                reason = f"juego ({value})" + (f" + {bet.stake} queridas" if bet.stake else "")
            elif lance == PHASE_PUNTO:
                amount = 1 + bet.stake
                reason = "punto" + (f" + {bet.stake} queridas" if bet.stake else "")
            if amount <= 0:
                continue
            lines.append({"lance": lance, "player": winner, "amount": amount, "reason": reason})
            if self._award(winner, amount):
                break
        return lines

    def _finish_hand(self, ended_by: str = "recuento", count: bool = True) -> None:
        lines = self._count() if count and self.winner is None else []
        self.hand_summaries.append(
            {
                "hand_number": self.hand_number,
                "mano": self.mano,
                "hands": [[c.code() for c in h] for h in self.hands],
                "descriptions": [H.describe(h) for h in self.hands],
                "ended_by": ended_by,
                "count": lines,
                "awards": list(self._awards),
                "history": list(self.history),
                "scores": list(self.scores),
            }
        )
        if self.winner is not None:
            self.phase = PHASE_FIN
            self.turn = None
            self.bet = None
            return
        self.mano = 1 - self.mano
        self._deal()

    # Reparto -------------------------------------------------------------
    def _deal(self) -> None:
        self.hand_number += 1
        self._deck = Deck(self._rng)
        self.hands: list[list[Card]] = [[], []]
        for p in (self.mano, 1 - self.mano):
            self.hands[p] = self._deck.draw(4)
        self.phase = PHASE_MUS
        self.turn: int | None = self.mano
        self.mus_round = 0
        self.bet: Bet | None = None
        self.lances: dict[str, Bet] = {}
        self.declarations: dict[str, tuple[bool, bool] | None] = {"pares": None, "juego": None}
        self.history: list[dict[str, Any]] = []
        self._awards: list[dict[str, Any]] = []

    def _log(self, player: int, action: Action) -> None:
        entry: dict[str, Any] = {"player": player, "phase": self.phase, "action": action.kind}
        if action.kind == ENVIDO:
            entry["amount"] = action.amount
        if action.kind == DESCARTE:
            entry["count"] = len(action.discard)  # nunca qué cartas
        self.history.append(entry)


def _all_discards() -> list[tuple[int, ...]]:
    from itertools import combinations

    return [c for k in range(1, 5) for c in combinations(range(4), k)]


__all__ = [
    "MusGame",
    "Observation",
    "Bet",
    "MUS",
    "PHASE_MUS",
    "PHASE_DESCARTE",
    "PHASE_GRANDE",
    "PHASE_CHICA",
    "PHASE_PARES",
    "PHASE_JUEGO",
    "PHASE_PUNTO",
    "PHASE_FIN",
    "LANCE_PHASES",
]
