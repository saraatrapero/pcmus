"""Bot probabilístico: estima con muestreo la probabilidad de ganar cada lance.

Para cada decisión construye una creencia sobre la mano del rival
(:mod:`pcmus.bots.inference`), calcula la probabilidad de ganar y elige la
acción de mayor valor esperado. En el descarte simula robos posibles para
escoger qué cartas tirar.
"""

from __future__ import annotations

from itertools import combinations

from .. import hands as H
from ..actions import Action
from ..cards import Card
from ..game import Observation
from ..player import Player
from .inference import Belief, build_belief, game_win_probability, hand_strength, unseen_cards

#: Valor típico (en piedras) de ganar cada lance, para evaluar una mano entera.
LANCE_VALUE = {"grande": 1.6, "chica": 1.3, "pares": 1.8, "juego": 2.6, "punto": 1.2}


def hand_equity(hand: tuple[Card, ...], belief: Belief, i_am_mano: bool) -> float:
    """Piedras esperadas de una mano contra la creencia (sin contar envites)."""
    total = belief.win_probability(hand, "grande", i_am_mano) * LANCE_VALUE["grande"]
    total += belief.win_probability(hand, "chica", i_am_mano) * LANCE_VALUE["chica"]
    if H.pares_type(hand):
        total += belief.win_probability(hand, "pares", i_am_mano) * (
            LANCE_VALUE["pares"] + H.pares_value(hand) - 1
        )
    if H.has_juego(hand):
        total += belief.win_probability(hand, "juego", i_am_mano) * LANCE_VALUE["juego"]
    else:
        total += 0.6 * belief.win_probability(hand, "punto", i_am_mano) * LANCE_VALUE["punto"]
    return total


class MonteCarloBot(Player):
    """Decide por valor esperado usando una creencia bayesiana sobre el rival."""

    name = "montecarlo"
    authors = ["Equipo PC Mus"]
    description = (
        "Muestrea manos rivales compatibles con lo que ha visto, las pondera por "
        "verosimilitud (Bayes) y juega la acción de mayor valor esperado."
    )

    samples = 160
    discard_draws = 10
    cut_equity = 4.4
    bluff_rate = 0.06

    def __init__(self, seed: int | None = None) -> None:
        super().__init__(seed)
        # Beta(1, 6): de entrada supone que el rival farolea poco (~14 %).
        self._bluffs = 1.0
        self._honest = 6.0

    @property
    def opponent_bluff_rate(self) -> float:
        """Probabilidad estimada de que un envite del rival sea un farol."""
        return self._bluffs / (self._bluffs + self._honest)

    def on_game_start(self, player_index: int, target: int) -> None:
        self._me = player_index

    def on_hand_end(self, summary: dict) -> None:
        """Actualiza la estimación de faroles con las cartas ya descubiertas."""
        me = getattr(self, "_me", 0)
        opp_cards = tuple(Card.from_code(c) for c in summary["hands"][1 - me])
        for entry in summary.get("history", []):
            if entry["player"] == me or entry["action"] not in ("envido", "ordago"):
                continue
            phase = entry["phase"]
            if phase in LANCE_VALUE:
                if hand_strength(opp_cards, phase) < 0.5:
                    self._bluffs += 1
                else:
                    self._honest += 1

    def _belief(self, obs: Observation, samples: int) -> Belief:
        return build_belief(obs, self.rng, samples, bluff=self.opponent_bluff_rate)

    def choose_action(self, observation: Observation, legal_actions: list[Action]) -> Action:
        phase = observation.phase
        if phase == "mus":
            return self._mus(observation, legal_actions)
        if phase == "descarte":
            return self._discard(observation)
        return self._bet(observation, legal_actions)

    # Mus y descarte ------------------------------------------------------
    def _mus(self, obs: Observation, legal: list[Action]) -> Action:
        if not any(a.kind == "mus" for a in legal):
            return Action.corto()
        belief = self._belief(obs, self.samples)
        equity = hand_equity(obs.hand, belief, obs.is_mano)
        return Action.corto() if equity >= self.cut_equity else Action.mus()

    def _discard(self, obs: Observation) -> Action:
        hand = obs.hand
        pool = unseen_cards(hand)
        belief = self._belief(obs, 60)
        best: tuple[float, tuple[int, ...]] = (-1.0, (0,))
        for k in range(1, 5):
            for positions in combinations(range(4), k):
                kept = [c for i, c in enumerate(hand) if i not in positions]
                score = 0.0
                for _ in range(self.discard_draws):
                    new = tuple(kept + self.rng.sample(pool, k))
                    score += hand_equity(new, belief, obs.is_mano)
                score /= self.discard_draws
                if score > best[0]:
                    best = (score, positions)
        return Action.descarte(best[1])

    # Envites ---------------------------------------------------------------
    def _bet(self, obs: Observation, legal: list[Action]) -> Action:
        lance = obs.phase
        belief = self._belief(obs, self.samples)
        p = belief.win_probability(obs.hand, lance, obs.is_mano)
        me, opp = obs.scores[obs.player], obs.scores[obs.opponent]
        g_now = game_win_probability(me, opp, obs.target)
        bet = obs.bet or {}
        pending = bet.get("pending")
        kinds = {a.kind for a in legal}

        if pending is None:
            if p > 0.9 and p > g_now + 0.2:
                return Action.ordago()
            if p > 0.82:
                return Action.envido(5 if obs.target - me > 8 else 2)
            if p > 0.66 or self.rng.random() < self.bluff_rate:
                return Action.envido(2)
            return Action.paso()

        withdraw = bet.get("withdraw", 1)
        if bet.get("ordago"):
            # Rechazar: el rival cobra 'withdraw' y la partida sigue.
            g_refuse = game_win_probability(me, opp + withdraw, obs.target)
            return Action.quiero() if p > g_refuse else Action.no_quiero()

        # Querer: gano o pierdo 'pending'. No querer: pierdo 'withdraw'.
        ev_call = (2 * p - 1) * pending
        if p > 0.88 and "envido" in kinds and pending + 2 <= obs.target:
            return Action.envido(2)
        return Action.quiero() if ev_call > -withdraw else Action.no_quiero()
