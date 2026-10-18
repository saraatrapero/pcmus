import random

from pcmus import MusGame


def test_la_observacion_no_revela_las_cartas_del_rival():
    for seed in range(100):
        game = MusGame(seed=seed)
        rng = random.Random(seed)
        while not game.is_over:
            for player in (0, 1):
                obs = game.observation(player)
                rival = set(c.code() for c in game.hand_of(1 - player))
                assert obs.hand == game.hand_of(player)
                text = str(obs.to_dict()["history"]) + str(obs.bet) + str(obs.lances)
                assert not any(code in text for code in rival)
                # la mano anterior sí se enseña: ya está recontada
                if obs.last_hand is not None:
                    assert obs.last_hand["hand_number"] < obs.hand_number
            game.step(rng.choice(game.legal_actions()))


def test_descartes_solo_dicen_cuantas_cartas():
    game = MusGame(seed=1)
    for action in [a for a in game.legal_actions() if a.kind == "mus"] * 2:
        game.step(action)
    game.step(game.legal_actions()[-1])
    entry = game.observation(1).history[-1]
    assert entry == {"player": 0, "phase": "descarte", "action": "descarte", "count": 4}


def test_observacion_serializable():
    import json

    game = MusGame(seed=2)
    json.dumps(game.observation(0).to_dict())
