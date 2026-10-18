import json
import random

import pytest

from pcmus import webapi


def play_through(bot: str, seed: int) -> dict:
    state = json.loads(webapi.new_game(bot, 20, seed))
    rng = random.Random(seed)
    for _ in range(2000):
        if state["winner"] is not None and not state["summary"]:
            return state
        if state["summary"]:
            state = json.loads(webapi.resume())
            if state["winner"] is not None:
                return state
            continue
        assert state["yourTurn"] and state["legal"]
        choice = dict(rng.choice(state["legal"]))
        choice.pop("label")
        if choice["kind"] == "descarte":
            choice["discard"] = sorted(rng.sample(range(4), rng.randint(1, 4)))
        state = json.loads(webapi.act(json.dumps(choice)))
        assert "error" not in state, state["error"]
    raise AssertionError("la partida web no termina")


@pytest.mark.parametrize("bot", ["aleatorio", "tio-paco", "abuela-remedios"])
def test_partida_web_completa(bot):
    state = play_through(bot, seed=3)
    assert max(state["scores"]) == 20


def test_la_web_no_ve_las_cartas_del_bot_durante_la_mano():
    state = json.loads(webapi.new_game("tio-paco", 30, 1))
    session = webapi._session
    bot_cards = {c.code() for c in session.game.hand_of(1)}
    visible = json.dumps({k: v for k, v in state.items() if k != "summary"})
    assert not any(code in visible for code in bot_cards)


def test_jugadas_invalidas_no_rompen_la_partida():
    json.loads(webapi.new_game("aleatorio", 30, 2))
    for bad in ['{"kind": "ordago2"}', "no es json", '{"kind": "descarte", "discard": [9]}']:
        state = json.loads(webapi.act(bad))
        assert "error" in state
    assert json.loads(webapi._session.state())["winner"] is None


def test_bot_desconocido():
    with pytest.raises(ValueError):
        webapi.new_game("no-existe")
