"""Razonamiento con incertidumbre sobre la mano del rival.

El bot no ve las cartas del rival, así que mantiene una *creencia*: una muestra
de posibles manos rivales con un peso cada una. Se construye en dos pasos:

1. **Prior**: manos de 4 cartas sacadas al azar de las cartas que el bot no ve.
   Se descartan las que contradicen lo declarado en público (si el rival ha
   dicho que tiene pares o juego, solo valen las manos que los tengan).
2. **Verosimilitud**: cada acción del rival en la mano actual actualiza el
   peso de cada muestra con la regla de Bayes, usando un modelo sencillo de
   rival: quien envida suele tener buena mano en ese lance, quien pasa suele
   tenerla floja y quien corta el mus suele llevar juego.

Con esa creencia se estima la probabilidad de ganar cada lance.
"""

from __future__ import annotations

import math
import random
from collections.abc import Sequence
from dataclasses import dataclass

from .. import hands as H
from ..cards import Card, full_deck
from ..game import Observation

LANCES = ("grande", "chica", "pares", "juego", "punto")


def hand_strength(cards: Sequence[Card], lance: str) -> float:
    """Fuerza aproximada (0 a 1) de una mano en un lance, barata de calcular."""
    ranks = sorted((c.rank for c in cards), reverse=True)
    if lance == "grande":
        return (ranks[0] * 0.45 + ranks[1] * 0.3 + ranks[2] * 0.15 + ranks[3] * 0.1) / 10
    if lance == "chica":
        low = sorted(ranks)
        return 1 - ((low[0] * 0.45 + low[1] * 0.3 + low[2] * 0.15 + low[3] * 0.1) - 1) / 9
    if lance == "pares":
        kind, top, _ = H.pares_key(cards)
        return 0.0 if kind == 0 else (kind - 1) / 3 + top / 30
    if lance == "juego":
        return H.juego_key(cards) / 8
    if lance == "punto":
        return H.points(cards) / 30
    raise ValueError(lance)


def _beats(mine: Sequence[Card], theirs: Sequence[Card], lance: str, i_am_mano: bool) -> bool:
    if lance == "grande":
        a, b = H.grande_key(mine), H.grande_key(theirs)
    elif lance == "chica":
        a, b = H.chica_key(mine), H.chica_key(theirs)
    elif lance == "pares":
        a, b = H.pares_key(mine), H.pares_key(theirs)
    elif lance == "juego":
        a, b = H.juego_key(mine), H.juego_key(theirs)
    else:
        a, b = H.punto_key(mine), H.punto_key(theirs)
    return a > b or (a == b and i_am_mano)


@dataclass
class Belief:
    """Muestra ponderada de posibles manos del rival."""

    hands: list[tuple[Card, ...]]
    weights: list[float]

    def normalized(self) -> list[float]:
        total = sum(self.weights) or 1.0
        return [w / total for w in self.weights]

    def win_probability(self, mine: Sequence[Card], lance: str, i_am_mano: bool) -> float:
        """Probabilidad de ganar ``lance`` con ``mine`` según la creencia."""
        if not self.hands:
            return 0.5
        total = sum(self.weights) or 1.0
        won = sum(
            w
            for h, w in zip(self.hands, self.weights, strict=False)
            if _beats(mine, h, lance, i_am_mano)
        )
        return won / total


def unseen_cards(hand: Sequence[Card]) -> list[Card]:
    """Cartas que pueden estar en la mano del rival (todas menos las propias)."""
    mine = set(hand)
    return [c for c in full_deck() if c not in mine]


def _consistent(cards: Sequence[Card], obs: Observation) -> bool:
    opp = obs.opponent
    pares = obs.declarations.get("pares")
    if pares is not None and (H.pares_type(cards) > 0) != pares[opp]:
        return False
    juego = obs.declarations.get("juego")
    if juego is not None and H.has_juego(cards) != juego[opp]:
        return False
    return True


def _likelihood(cards: Sequence[Card], obs: Observation, bluff: float = 0.1) -> float:
    """P(acciones públicas del rival | su mano), con un modelo de rival sencillo.

    ``bluff`` es la probabilidad estimada de que el rival envide sin tener nada:
    con 0 el modelo cree todos sus envites, con 1 no les da ningún crédito.
    """
    opp = obs.opponent
    weight = 1.0
    for entry in obs.history:
        if entry["player"] != opp:
            continue
        phase, action = entry["phase"], entry["action"]
        if phase == "mus":
            juego = hand_strength(cards, "juego")
            pares = hand_strength(cards, "pares")
            good = max(juego, pares)
            weight *= 0.35 + 0.65 * good if action == "corto" else 1.0 - 0.5 * good
        elif phase in LANCES:
            s = hand_strength(cards, phase)
            if action in ("envido", "ordago"):
                weight *= bluff + (1 - bluff) * (0.12 + 0.88 * s**2)
            elif action == "quiero":
                weight *= 0.2 + 0.8 * s
            elif action in ("paso", "no_quiero"):
                weight *= 1.0 - 0.7 * s**2
    return weight


def build_belief(
    obs: Observation, rng: random.Random, samples: int = 200, bluff: float = 0.1
) -> Belief:
    """Construye la creencia sobre la mano del rival a partir de lo observado."""
    pool = unseen_cards(obs.hand)
    hands: list[tuple[Card, ...]] = []
    attempts = 0
    while len(hands) < samples and attempts < samples * 30:
        attempts += 1
        cand = tuple(rng.sample(pool, 4))
        if _consistent(cand, obs):
            hands.append(cand)
    weights = [_likelihood(h, obs, bluff) for h in hands]
    return Belief(hands, weights)


def game_win_probability(mine: int, theirs: int, target: int) -> float:
    """Estimación rápida de la probabilidad de ganar la partida según el marcador."""
    if mine >= target:
        return 1.0
    if theirs >= target:
        return 0.0
    scale = max(4.0, target * 0.22)
    return 1 / (1 + math.exp(-(mine - theirs) / scale))
