"""API para escribir un jugador (bot) de mus a dos.

Un bot es una subclase de :class:`Player` que:

1. declara tres atributos de clase: ``name``, ``authors`` y ``description``;
2. implementa :meth:`Player.choose_action`.

El árbitro nunca le pasa el objeto :class:`~pcmus.game.MusGame`: solo una
:class:`~pcmus.game.Observation` con sus cartas y la información pública, y la
lista de acciones legales. Así ningún bot puede ver las cartas del rival.

Ejemplo mínimo::

    from pcmus import Player, Action

    class SiempreMus(Player):
        name = "siempre-mus"
        authors = ["Ana"]
        description = "Pide mus siempre que puede y luego pasa."

        def choose_action(self, observation, legal_actions):
            for action in legal_actions:
                if action.kind in ("mus", "paso", "no_quiero"):
                    return action
            return legal_actions[0]
"""

from __future__ import annotations

import random
from abc import ABC, abstractmethod
from typing import Any, ClassVar

from .actions import Action
from .game import Observation


class Player(ABC):
    """Clase base de todos los bots.

    Attributes:
        name: nombre único del bot (se usa en el torneo y en la web).
        authors: lista con los nombres de los autores.
        description: una o dos frases sobre su estrategia.
        rng: generador aleatorio propio, sembrado por el árbitro. Úsalo en lugar
            del módulo ``random`` para que las partidas sean reproducibles.
    """

    name: ClassVar[str] = ""
    authors: ClassVar[list[str]] = []
    description: ClassVar[str] = ""

    def __init__(self, seed: int | None = None) -> None:
        self.rng = random.Random(seed)

    @abstractmethod
    def choose_action(self, observation: Observation, legal_actions: list[Action]) -> Action:
        """Elige una acción para el turno actual.

        Args:
            observation: lo que el bot sabe ahora mismo.
            legal_actions: acciones permitidas. También es legal cualquier
                ``Action.envido(n)`` con ``n`` entre 2 y lo que falte hasta la
                meta, aunque no aparezca en la lista.

        Returns:
            La acción elegida. Si es ilegal, lanza una excepción o tarda
            demasiado, el bot pierde la partida.
        """

    def on_game_start(self, player_index: int, target: int) -> None:
        """Se llama al empezar cada partida. Opcional."""

    def on_hand_end(self, summary: dict[str, Any]) -> None:
        """Se llama tras cada recuento, con las cartas de ambos ya descubiertas.
        Opcional: útil para bots que aprenden del estilo del rival."""


def check_player_class(cls: type) -> list[str]:
    """Devuelve la lista de problemas de una clase de bot (vacía si es válida)."""
    problems: list[str] = []
    if not isinstance(cls, type) or not issubclass(cls, Player):
        return [f"{cls!r} no hereda de pcmus.Player"]
    if getattr(cls, "__abstractmethods__", None):
        problems.append("no implementa choose_action")
    if not isinstance(cls.name, str) or not cls.name.strip():
        problems.append("falta el atributo de clase 'name'")
    elif not all(ch.isalnum() or ch in "-_" for ch in cls.name):
        problems.append("'name' solo puede tener letras, números, '-' y '_'")
    if (
        not isinstance(cls.authors, list)
        or not cls.authors
        or not all(isinstance(a, str) and a.strip() for a in cls.authors)
    ):
        problems.append("'authors' debe ser una lista no vacía de nombres")
    if not isinstance(cls.description, str) or not cls.description.strip():
        problems.append("falta el atributo de clase 'description'")
    return problems
