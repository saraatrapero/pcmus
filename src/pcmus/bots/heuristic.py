"""Bot de reglas fijas, como juega un aficionado de taberna."""

from __future__ import annotations

from .. import hands as H
from ..actions import DESCARTE, ENVIDO, Action
from ..game import Observation
from ..player import Player
from .inference import hand_strength


def keep_score(card_rank: int) -> int:
    """Cuánto interesa conservar una carta: reyes y ases sobre todo."""
    if card_rank == 10:
        return 3
    if card_rank == 1:
        return 2
    return 0


def rule_discard(hand: tuple, protect_pairs: bool = True) -> tuple[int, ...]:
    """Tira todo lo que no sea rey, as o parte de una pareja. Al menos una carta."""
    counts: dict[int, int] = {}
    for c in hand:
        counts[c.rank] = counts.get(c.rank, 0) + 1
    out = [
        i
        for i, c in enumerate(hand)
        if keep_score(c.rank) == 0 and not (protect_pairs and counts[c.rank] >= 2)
    ]
    if not out:  # mano "perfecta": se tira la carta menos útil
        out = [min(range(4), key=lambda i: (keep_score(hand[i].rank), hand[i].rank))]
    return tuple(out)


class HeuristicBot(Player):
    """Reglas fijas: corta con buenas manos, se queda con reyes y ases y envida
    cuando la fuerza de su mano en el lance pasa de un umbral."""

    name = "heuristico"
    authors = ["Equipo PC Mus"]
    description = "Reglas de taberna: guarda reyes y ases y envida con manos fuertes."

    bet_threshold = 0.72
    call_threshold = 0.55

    def choose_action(self, observation: Observation, legal_actions: list[Action]) -> Action:
        hand = observation.hand
        kinds = {a.kind for a in legal_actions}
        phase = observation.phase

        if phase == "mus":
            strong = (
                H.pares_type(hand) >= H.MEDIAS
                or H.points(hand) in (31, 32)
                or sum(c.rank == 10 for c in hand) >= 3
            )
            return Action.corto() if strong or "mus" not in kinds else Action.mus()

        if phase == "descarte":
            return Action(DESCARTE, discard=rule_discard(hand))

        strength = hand_strength(hand, phase)
        if observation.is_mano:
            strength += 0.04  # los empates son de la mano
        bet = observation.bet or {}
        if bet.get("pending") is None:
            if strength > 0.93 and phase in ("pares", "juego"):
                return Action.ordago()
            if strength > self.bet_threshold:
                return Action(ENVIDO, amount=2 if strength < 0.85 else 5)
            return Action.paso()
        if bet.get("ordago"):
            return Action.quiero() if strength > 0.9 else Action.no_quiero()
        if strength > 0.9 and "envido" in kinds:
            return Action.envido(2)
        return Action.quiero() if strength > self.call_threshold else Action.no_quiero()
