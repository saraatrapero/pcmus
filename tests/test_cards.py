import random

import pytest

from pcmus.cards import Card, Deck, full_deck


def test_baraja_tiene_40_cartas_distintas():
    deck = full_deck()
    assert len(deck) == 40
    assert len(set(deck)) == 40


def test_equivalencias_de_8_reyes():
    assert Card(3, "oros").rank == Card(12, "copas").rank == 10
    assert Card(2, "oros").rank == Card(1, "copas").rank == 1
    assert Card(3, "oros").points == 10
    assert Card(2, "bastos").points == 1
    assert Card(7, "bastos").points == 7


def test_codigo_ida_y_vuelta():
    for c in full_deck():
        assert Card.from_code(c.code()) == c


@pytest.mark.parametrize("number,suit", [(8, "oros"), (9, "copas"), (5, "picas")])
def test_naipes_invalidos(number, suit):
    with pytest.raises(ValueError):
        Card(number, suit)


def test_mazo_rebaraja_descartes():
    deck = Deck(random.Random(0))
    hand = deck.draw(36)
    deck.discard(hand[:10])
    drawn = deck.draw(10)  # 4 del mazo + 6 de los descartes
    assert len(drawn) == 10
    with pytest.raises(RuntimeError):
        deck.draw(100)
