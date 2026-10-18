# PC Mus

**Mus a dos** en Python: el juego, una web para jugar contra la IA, un API para
que cualquiera programe su bot y un torneo que se juega solo.

- **Jugar ahora:** [saraatrapero.github.io/pcmus](https://saraatrapero.github.io/pcmus/)
- **Código:** [github.com/saraatrapero/pcmus](https://github.com/saraatrapero/pcmus)

## Qué hay en el repositorio

| Parte | Dónde |
|-------|-------|
| Motor del juego (librería instalable) | `src/pcmus/` |
| API de bots | `src/pcmus/player.py` |
| Bots de referencia | `src/pcmus/bots/` y `players/builtin/` |
| Bots de otros equipos | `players/community/` |
| Árbitro y torneo | `src/pcmus/arena.py`, `src/pcmus/tournament.py` |
| Web (Pyodide) | `web/` |
| Tests | `tests/` |

## Instalación

```bash
git clone https://github.com/saraatrapero/pcmus.git
cd pcmus
pip install -e ".[dev]"
```

## Una partida desde código, sin interfaz

```python
from pcmus.arena import play_game
from pcmus.bots import HeuristicBot, MonteCarloBot

result = play_game((HeuristicBot(seed=1), MonteCarloBot(seed=2)), target=30, seed=7)
print("Gana el jugador", result.winner, "con", result.scores)
```

O paso a paso, con el motor directamente:

```python
from pcmus import MusGame

game = MusGame(target=30, seed=1)
while not game.is_over:
    obs = game.observation(game.turn)  # lo que sabe quien tiene el turno
    action = game.legal_actions()[0]  # aquí decidiría tu bot
    game.step(action)
print(game.winner, game.scores)
```
