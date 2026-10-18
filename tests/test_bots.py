"""Tests que debe pasar cualquier bot admitido (también los de pull requests)."""

import pytest

from pcmus.arena import play_game
from pcmus.bots import RandomBot
from pcmus.player import check_player_class
from pcmus.registry import discover

SPECS = discover()


@pytest.mark.parametrize("spec", SPECS, ids=[s.name for s in SPECS])
def test_metadatos_validos(spec):
    assert check_player_class(spec.load()) == []


@pytest.mark.parametrize("spec", SPECS, ids=[s.name for s in SPECS])
def test_juega_limpio_contra_aleatorio(spec):
    cls = spec.load()
    for g in range(6):
        seat = g % 2
        pair = [RandomBot(seed=g), RandomBot(seed=g)]
        pair[seat] = cls(seed=g)
        result = play_game(tuple(pair), seed=100 + g, first_mano=g % 2, move_time_limit=2.0)
        assert result.faulty != seat, result.forfeit


@pytest.mark.parametrize("spec", SPECS, ids=[s.name for s in SPECS])
def test_es_reproducible_con_la_misma_semilla(spec):
    cls = spec.load()
    a = play_game((cls(seed=1), RandomBot(seed=2)), seed=3)
    b = play_game((cls(seed=1), RandomBot(seed=2)), seed=3)
    assert (a.winner, a.scores, a.moves) == (b.winner, b.scores, b.moves)


def test_nombres_unicos():
    names = [s.name for s in SPECS]
    assert len(names) == len(set(names))


def test_los_de_referencia_ganan_al_aleatorio():
    from pcmus.bots import HeuristicBot

    wins = sum(
        play_game((HeuristicBot(seed=s), RandomBot(seed=s)), seed=s, first_mano=s % 2).winner == 0
        for s in range(60)
    )
    assert wins >= 42  # >= 70 %
