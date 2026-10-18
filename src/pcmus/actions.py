"""Las acciones que un jugador puede hacer en su turno."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

MUS = "mus"
CORTO = "corto"
DESCARTE = "descarte"
PASO = "paso"
ENVIDO = "envido"
QUIERO = "quiero"
NO_QUIERO = "no_quiero"
ORDAGO = "ordago"

KINDS: tuple[str, ...] = (MUS, CORTO, DESCARTE, PASO, ENVIDO, QUIERO, NO_QUIERO, ORDAGO)


@dataclass(frozen=True)
class Action:
    """Una acción del jugador que tiene el turno.

    Usa los constructores (``Action.mus()``, ``Action.envido(2)``...) en vez de
    crearla a mano.

    Attributes:
        kind: tipo de acción (una de :data:`KINDS`).
        amount: piedras que se envidan. Si ya hay un envite del rival, son las
            piedras que se suben *por encima* de él (``envido 2 más``).
        discard: posiciones (0-3) de las cartas que se tiran en el descarte.
    """

    kind: str
    amount: int = 0
    discard: tuple[int, ...] = field(default_factory=tuple)

    def __post_init__(self) -> None:
        if self.kind not in KINDS:
            raise ValueError(f"Acción desconocida: {self.kind!r}")
        object.__setattr__(self, "discard", tuple(sorted(self.discard)))

    # Constructores ------------------------------------------------------
    @classmethod
    def mus(cls) -> Action:
        return cls(MUS)

    @classmethod
    def corto(cls) -> Action:
        """«No hay mus»: se corta y se empieza a jugar los lances."""
        return cls(CORTO)

    @classmethod
    def descarte(cls, positions: tuple[int, ...] | list[int]) -> Action:
        return cls(DESCARTE, discard=tuple(positions))

    @classmethod
    def paso(cls) -> Action:
        return cls(PASO)

    @classmethod
    def envido(cls, amount: int = 2) -> Action:
        return cls(ENVIDO, amount=amount)

    @classmethod
    def quiero(cls) -> Action:
        return cls(QUIERO)

    @classmethod
    def no_quiero(cls) -> Action:
        return cls(NO_QUIERO)

    @classmethod
    def ordago(cls) -> Action:
        return cls(ORDAGO)

    # Serialización -----------------------------------------------------
    def to_dict(self) -> dict[str, Any]:
        data: dict[str, Any] = {"kind": self.kind}
        if self.kind == ENVIDO:
            data["amount"] = self.amount
        if self.kind == DESCARTE:
            data["discard"] = list(self.discard)
        return data

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Action:
        return cls(
            str(data["kind"]),
            amount=int(data.get("amount", 0)),
            discard=tuple(int(i) for i in data.get("discard", ())),
        )

    def __str__(self) -> str:
        if self.kind == ENVIDO:
            return f"envido {self.amount}"
        if self.kind == DESCARTE:
            return f"descarte de {len(self.discard)}"
        if self.kind == CORTO:
            return "no hay mus"
        if self.kind == NO_QUIERO:
            return "no quiero"
        if self.kind == ORDAGO:
            return "órdago"
        return self.kind


class IllegalActionError(ValueError):
    """Se lanza al intentar una acción que no está permitida en el estado actual."""
