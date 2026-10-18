"""Bot aleatorio: la referencia más baja."""

from __future__ import annotations

from ..actions import Action
from ..game import Observation
from ..player import Player


class RandomBot(Player):
    """Elige una acción legal al azar. Sirve de línea base."""

    name = "aleatorio"
    authors = ["Equipo PC Mus"]
    description = "Elige cualquier acción legal al azar."

    def choose_action(self, observation: Observation, legal_actions: list[Action]) -> Action:
        return self.rng.choice(legal_actions)
