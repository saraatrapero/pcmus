"""Evaluación de manos para los cuatro lances.

Cada función devuelve una *clave* comparable: a mayor clave, mejor mano
en ese lance. Los empates los resuelve el motor a favor de la mano.
"""

from __future__ import annotations

from collections import Counter
from collections.abc import Sequence

from .cards import Card

#: Orden del juego: 31 es la mejor, luego 32, 40, 37, 36, 35, 34 y 33.
JUEGO_ORDER: tuple[int, ...] = (31, 32, 40, 37, 36, 35, 34, 33)

PARES_NONE, PAR, MEDIAS, DUPLES = 0, 1, 2, 3
PARES_NAMES = {PARES_NONE: "sin pares", PAR: "par", MEDIAS: "medias", DUPLES: "duples"}


def grande_key(cards: Sequence[Card]) -> tuple[int, ...]:
    """Clave de la grande: las cartas de mayor a menor, comparadas en orden."""
    return tuple(sorted((c.rank for c in cards), reverse=True))


def chica_key(cards: Sequence[Card]) -> tuple[int, ...]:
    """Clave de la chica: gana la mano más baja, así que se niegan los valores."""
    return tuple(-r for r in sorted(c.rank for c in cards))


def pares_type(cards: Sequence[Card]) -> int:
    """Tipo de pares: ``PARES_NONE``, ``PAR``, ``MEDIAS`` o ``DUPLES``."""
    counts = sorted(Counter(c.rank for c in cards).values(), reverse=True)
    if counts[0] == 4 or counts[:2] == [2, 2]:
        return DUPLES
    if counts[0] == 3:
        return MEDIAS
    if counts[0] == 2:
        return PAR
    return PARES_NONE


def pares_key(cards: Sequence[Card]) -> tuple[int, int, int]:
    """Clave de los pares: (tipo, rango principal, rango secundario)."""
    counter = Counter(c.rank for c in cards)
    kind = pares_type(cards)
    if kind == PARES_NONE:
        return (0, 0, 0)
    if kind == DUPLES:
        repeated = sorted((r for r, n in counter.items() if n >= 2), reverse=True)
        if len(repeated) == 1:  # cuatro iguales: duples de la misma figura
            return (DUPLES, repeated[0], repeated[0])
        return (DUPLES, repeated[0], repeated[1])
    top = max(r for r, n in counter.items() if n == (3 if kind == MEDIAS else 2))
    return (kind, top, 0)


def pares_value(cards: Sequence[Card]) -> int:
    """Piedras que cobra quien gana los pares: 1 por par, 2 por medias, 3 por duples."""
    return pares_type(cards)


def points(cards: Sequence[Card]) -> int:
    """Suma de puntos de la mano (figuras y treses 10, ases y doses 1)."""
    return sum(c.points for c in cards)


def has_juego(cards: Sequence[Card]) -> bool:
    """``True`` si la mano suma 31 o más."""
    return points(cards) >= 31


def juego_key(cards: Sequence[Card]) -> int:
    """Clave del juego (0 si no hay juego; 8 para 31, 7 para 32, ...)."""
    total = points(cards)
    if total < 31:
        return 0
    return len(JUEGO_ORDER) - JUEGO_ORDER.index(total)


def juego_value(cards: Sequence[Card]) -> int:
    """Piedras del juego: 3 por la 31 y 2 por cualquier otro juego."""
    total = points(cards)
    if total < 31:
        return 0
    return 3 if total == 31 else 2


def punto_key(cards: Sequence[Card]) -> int:
    """Clave del punto: gana quien más se acerque a 30 (solo si nadie tiene juego)."""
    return points(cards)


def describe(cards: Sequence[Card]) -> str:
    """Resumen legible, p. ej. ``"medias, juego 31"``."""
    parts = [PARES_NAMES[pares_type(cards)]]
    total = points(cards)
    parts.append(f"juego {total}" if total >= 31 else f"punto {total}")
    return ", ".join(parts)
