from pcmus.cli import main


def test_validate(capsys):
    assert main(["validate", "--games", "2"]) == 0
    assert "✓ abuela-remedios" in capsys.readouterr().out


def test_tournament(tmp_path, capsys):
    assert main(["tournament", "--games", "2", "--target", "10", "--out", str(tmp_path)]) == 0
    assert (tmp_path / "leaderboard.json").exists()
    assert (tmp_path / "leaderboard.md").read_text().count("| ") > 5
