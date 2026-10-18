"""Naipes y baraja española de 40 cartas.

En el mus a 8 reyes los treses cuentan como reyes y los doses como ases.
Esa equivalencia se resuelve aquí, en :attr:`Card.rank`, para que el resto
del motor no tenga que acordarse de ella.
"""

from __future__ import annotations

import random
from dataclasses import dataclass

SUITS: tuple[str, ...] = ("oros", "copas", "espadas", "bastos")
NUMBERS: tuple[int, ...] = (1, 2, 3, 4, 5, 6, 7, 10, 11, 12)

_NAMES = {1: "As", 2: "Dos", 3: "Tres", 10: "Sota", 11: "Caballo", 12: "Rey"}


@dataclass(frozen=True, order=True)
class Card:
    """Un naipe de la baraja española.

    Attributes:
        number: número impreso en el naipe (1-7, 10 sota, 11 caballo, 12 rey).
        suit: palo (``oros``, ``copas``, ``espadas`` o ``bastos``).
    """

    number: int
    suit: str

    def __post_init__(self) -> None:
        if self.number not in NUMBERS:
            raise ValueError(f"Número de naipe no válido: {self.number}")
        if self.suit not in SUITS:
            raise ValueError(f"Palo no válido: {self.suit}")

    @property
    def rank(self) -> int:
        """Valor para ordenar a la grande y a la chica.

        Rey y tres = 10, caballo = 9, sota = 8, 7..4 su número, as y dos = 1.
        """
        if self.number in (3, 12):
            return 10
        if self.number == 11:
            return 9
        if self.number == 10:
            return 8
        if self.number in (1, 2):
            return 1
        return self.number

    @property
    def points(self) -> int:
        """Valor para sumar al juego y al punto (figuras y treses valen 10, ases y doses 1)."""
        if self.number in (3, 10, 11, 12):
            return 10
        if self.number in (1, 2):
            return 1
        return self.number

    def code(self) -> str:
        """Código corto y estable, p. ej. ``"12-oros"``. Útil para JSON y la web."""
        return f"{self.number}-{self.suit}"

    @classmethod
    def from_code(cls, code: str) -> Card:
        """Crea un naipe a partir de :meth:`code`."""
        number, suit = code.split("-")
        return cls(int(number), suit)

    def __str__(self) -> str:
        name = _NAMES.get(self.number, str(self.number))
        return f"{name} de {self.suit}"


def full_deck() -> list[Card]:
    """Devuelve las 40 cartas, ordenadas."""
    return [Card(n, s) for s in SUITS for n in NUMBERS]


class Deck:
    """Mazo con pila de descartes. Cuando el mazo se agota, se barajan los descartes."""

    def __init__(self, rng: random.Random) -> None:
        self._rng = rng
        self._cards: list[Card] = full_deck()
        self._rng.shuffle(self._cards)
        self._discards: list[Card] = []

    def __len__(self) -> int:
        return len(self._cards)

    def draw(self, n: int) -> list[Card]:
        """Roba ``n`` cartas, rebarajando los descartes si hace falta."""
        drawn: list[Card] = []
        for _ in range(n):
            if not self._cards:
                if not self._discards:
                    raise RuntimeError("No quedan cartas en el mazo ni en los descartes")
                self._cards = self._discards
                self._discards = []
                self._rng.shuffle(self._cards)
            drawn.append(self._cards.pop())
        return drawn

    def discard(self, cards: list[Card]) -> None:
        """Añade cartas a la pila de descartes."""
        self._discards.extend(cards)
