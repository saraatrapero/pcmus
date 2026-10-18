import pytest

from pcmus.cards import Card


@pytest.fixture
def cards():
    """Construye una mano a partir de códigos: cards("12-oros", "3-copas", ...)."""

    def make(*codes: str) -> tuple[Card, ...]:
        return tuple(Card.from_code(c) for c in codes)

    return make
