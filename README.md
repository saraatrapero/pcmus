# PC Mus — mus a dos con bots de IA

[![Tests](https://github.com/saraatrapero/pcmus/actions/workflows/tests.yml/badge.svg)](https://github.com/saraatrapero/pcmus/actions/workflows/tests.yml)
[![Torneo y web](https://github.com/saraatrapero/pcmus/actions/workflows/publish.yml/badge.svg)](https://github.com/saraatrapero/pcmus/actions/workflows/publish.yml)
[![Docs](https://readthedocs.org/projects/pcmus/badge/?version=latest)](https://pcmus.readthedocs.io)

El mus de toda la vida, **uno contra uno**, en Python: un motor de juego
instalable, una web para jugar contra la IA, un API para programar bots y un
torneo que se juega y se publica solo.

- **Jugar:** https://saraatrapero.github.io/pcmus/
- **Documentación:** https://pcmus.readthedocs.io
- **Clasificación:** [results/leaderboard.md](results/leaderboard.md)

## Empezar

```bash
pip install -e ".[dev]"
python -m pcmus play --bot abuela-remedios    # jugar en la terminal
python -m pcmus tournament --games 20         # torneo y clasificación
pytest                                        # tests
```

Partida completa desde código, sin interfaz:

```python
from pcmus.arena import play_game
from pcmus.bots import HeuristicBot, MonteCarloBot

result = play_game((HeuristicBot(seed=1), MonteCarloBot(seed=2)), seed=7)
print(result.winner, result.scores)
```

## Crear tu bot

Hereda de `pcmus.Player`, implementa `choose_action` y añádelo a
`players/community/`. Tutorial paso a paso:
[Crear un bot](https://pcmus.readthedocs.io/es/latest/crear-un-bot/).

## Estructura

```
src/pcmus/          librería: cartas, manos, motor, API de bots, árbitro, torneo
src/pcmus/bots/     estrategias de referencia (aleatoria, reglas, Monte Carlo bayesiano)
players/builtin/    bots de referencia admitidos en el torneo
players/community/  bots enviados por otros equipos (pull request)
tests/              tests del motor, los bots, el árbitro y el torneo
web/                interfaz web (Pyodide: ejecuta esta misma librería en el navegador)
docs/               documentación (MkDocs, publicada en ReadTheDocs)
results/            clasificación generada por el torneo
scripts/            generación de la web estática
src/*.tsx, server/  app React de la taberna a cuatro jugadores (fuera de la práctica)
```

## Licencia

[MIT](LICENSE)

## La taberna a cuatro (React)

La app de la taberna con cuatro jugadores, personajes y salas online sigue en la
raíz (`src/*.tsx`, `server/`). Se arranca con `npm install && npm run dev`. No
forma parte de la práctica de IA, que se evalúa sobre el mus a dos en Python.
