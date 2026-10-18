from pathlib import Path

import pytest

from pcmus.arena import play_game
from pcmus.bots import RandomBot
from pcmus.registry import PlayerSpec, discover
from pcmus.tournament import TournamentConfig, run_isolated_game, run_tournament, to_markdown

HERE = Path(__file__).parent
FAULTY = str(HERE / "faulty_bots.py")


def spec(cls_name: str, name: str) -> PlayerSpec:
    return PlayerSpec(name=name, file=FAULTY, class_name=cls_name, group="tests")


@pytest.mark.parametrize("cls_name", ["Explota", "Tramposo", "NoEsAccion"])
def test_arbitro_da_por_perdida_la_partida(cls_name):
    import importlib.util

    s = importlib.util.spec_from_file_location("faulty", FAULTY)
    mod = importlib.util.module_from_spec(s)
    s.loader.exec_module(mod)
    bad = getattr(mod, cls_name)()
    result = play_game((bad, RandomBot(seed=1)), seed=1)
    assert result.faulty == 0 and result.winner == 1 and result.forfeit


def test_bot_lento_pierde_por_tiempo():
    import importlib.util

    s = importlib.util.spec_from_file_location("faulty", FAULTY)
    mod = importlib.util.module_from_spec(s)
    s.loader.exec_module(mod)
    result = play_game((RandomBot(seed=1), mod.Lento()), seed=1, first_mano=1, move_time_limit=0.1)
    assert result.faulty == 1 and "tiempo" in result.forfeit


def test_bot_colgado_no_bloquea_el_torneo():
    random_spec = next(s for s in discover() if s.name == "aleatorio")
    config = TournamentConfig(game_timeout=3.0, move_time_limit=1.0)
    result = run_isolated_game(spec("Colgado", "colgado"), random_spec, 1, 0, config)
    assert result.faulty == 0 and result.winner == 1


def test_torneo_completo_con_bots_rotos():
    specs = [s for s in discover() if s.name in ("aleatorio", "tio-paco")]
    specs += [spec("Explota", "explota"), spec("Colgado", "colgado")]
    config = TournamentConfig(games_per_pair=2, target=10, game_timeout=3.0, processes=4)
    board = run_tournament(specs, config)
    table = {s["name"]: s for s in board["standings"]}
    assert set(table) == {"aleatorio", "tio-paco", "explota", "colgado"}
    # Los bots rotos pierden todas sus partidas contra los que funcionan...
    for m in board["matches"]:
        broken = {"explota", "colgado"}
        if m["a"] in broken and m["b"] not in broken:
            assert m["wins_a"] == 0
        if m["b"] in broken and m["a"] not in broken:
            assert m["wins_b"] == 0
    assert table["explota"]["forfeits"] >= 4 and table["colgado"]["forfeits"] >= 4
    # ...y el torneo termina con todas las partidas contadas.
    assert sum(s["wins"] for s in board["standings"]) == 12
    assert "| 1 |" in to_markdown(board)
