import random

import pytest

from pcmus import Action, IllegalActionError, MusGame
from pcmus.cards import Card


def play_random(seed: int, target: int = 30) -> MusGame:
    game = MusGame(target=target, seed=seed)
    rng = random.Random(seed)
    for _ in range(20_000):
        if game.is_over:
            return game
        game.step(rng.choice(game.legal_actions()))
    raise AssertionError("la partida no termina")


@pytest.mark.parametrize("seed", range(300))
def test_partidas_aleatorias_terminan_bien(seed):
    game = play_random(seed)
    assert game.winner in (0, 1)
    assert game.scores[game.winner] == game.target
    assert game.scores[1 - game.winner] < game.target
    assert game.legal_actions() == []


def test_misma_semilla_misma_partida():
    a, b = play_random(7), play_random(7)
    assert a.scores == b.scores and a.hand_summaries == b.hand_summaries


def test_se_reparten_8_cartas_distintas():
    game = MusGame(seed=3)
    all_cards = game.hand_of(0) + game.hand_of(1)
    assert len(set(all_cards)) == 8


def test_acciones_ilegales_se_rechazan():
    game = MusGame(seed=1)
    with pytest.raises(IllegalActionError):
        game.step(Action.quiero())  # en la fase de mus no se puede querer
    with pytest.raises(IllegalActionError):
        game.step("mus")  # type: ignore[arg-type]
    game.step(Action.mus())
    game.step(Action.mus())
    for bad in ([], [0, 0], [4], [0, 1, 2, 3, 0]):
        assert not game.is_legal(Action.descarte(bad))
    with pytest.raises(IllegalActionError):
        game.step(Action.descarte([7]))


def test_envite_fuera_de_rango():
    game = MusGame(seed=1, target=30)
    game.step(Action.corto())
    assert not game.is_legal(Action.envido(1))
    assert not game.is_legal(Action.envido(31))
    assert game.is_legal(Action.envido(7))  # no sugerido, pero legal


def test_descarte_cambia_solo_las_cartas_tiradas():
    game = MusGame(seed=5)
    before = [list(game.hand_of(p)) for p in (0, 1)]
    game.step(Action.mus())
    game.step(Action.mus())
    game.step(Action.descarte([0, 1]))
    game.step(Action.descarte([3]))
    after = [list(game.hand_of(p)) for p in (0, 1)]
    assert after[0][2:] == before[0][2:]
    assert after[1][:3] == before[1][:3]
    assert game.phase == "mus" and game.mus_round == 1
    assert len(set(after[0] + after[1])) == 8


def test_tras_el_maximo_de_descartes_hay_que_cortar():
    game = MusGame(seed=2, max_mus_rounds=1)
    game.step(Action.mus())
    game.step(Action.mus())
    game.step(Action.descarte([0]))
    game.step(Action.descarte([0]))
    assert [a.kind for a in game.legal_actions()] == ["corto"]


def test_no_quiero_da_una_piedra_al_primer_envite():
    game = MusGame(seed=4)
    game.step(Action.corto())  # grande
    game.step(Action.envido(2))  # mano (jugador 0) envida
    game.step(Action.no_quiero())
    assert game.scores == [1, 0]
    assert game.phase == "chica"


def test_no_quiero_a_un_reenvite_da_lo_aceptado():
    game = MusGame(seed=4)
    game.step(Action.corto())
    game.step(Action.envido(2))
    game.step(Action.envido(5))  # postre sube a 7
    game.step(Action.no_quiero())
    assert game.scores == [0, 2]


def test_ordago_querido_acaba_la_partida():
    game = MusGame(seed=9)
    game.step(Action.corto())
    game.step(Action.ordago())
    game.step(Action.quiero())
    assert game.is_over
    assert game.winner == game.lance_winner("grande") or game.hand_summaries
    assert max(game.scores) == game.target


def test_empates_son_para_la_mano():
    game = MusGame(seed=0)
    same = [Card(12, "oros"), Card(12, "copas"), Card(4, "oros"), Card(5, "oros")]
    twin = [Card(3, "bastos"), Card(3, "espadas"), Card(4, "copas"), Card(5, "copas")]
    game.hands = [same, twin]
    assert game.lance_winner("grande") == game.mano
    game.mano = 1
    assert game.lance_winner("grande") == 1


def test_recuento_se_para_al_llegar_a_la_meta():
    game = MusGame(seed=11, target=5)
    game.scores = [4, 0]
    game.step(Action.corto())
    for _ in range(2):  # grande y chica en paso
        game.step(Action.paso())
        game.step(Action.paso())
    while not game.is_over and game.hand_number == 1:
        game.step(Action.paso())
    summary = game.hand_summaries[0]
    assert max(game.scores) <= 5
    assert sum(1 for line in summary["count"] if game.scores[line["player"]] >= 5) <= 1


def test_la_mano_alterna():
    game = MusGame(seed=6)
    assert game.mano == 0
    game.step(Action.corto())
    while game.hand_number == 1 and not game.is_over:
        game.step(Action.paso())
    if not game.is_over:
        assert game.mano == 1 and game.turn == 1
