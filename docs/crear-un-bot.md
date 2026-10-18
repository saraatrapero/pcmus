# Crear un bot, de principio a fin

En este tutorial escribes un bot, lo pruebas y lo envías por pull request.

## 1. Prepara el entorno

```bash
git clone https://github.com/<tu-usuario>/pcmus.git   # tu fork
cd pcmus
pip install -e ".[dev]"
git checkout -b bot/mi-equipo
```

## 2. Escribe el bot

Crea `players/community/mi_equipo.py`:

```python
from pcmus import Action, Player
from pcmus import hands as H


class CortaConJuego(Player):
    name = "corta-con-juego"  # único, sin espacios
    authors = ["Ana Pérez", "Luis Gil"]
    description = "Corta si tiene juego y quiere todo lo que tenga buena pinta."

    def choose_action(self, observation, legal_actions):
        hand = observation.hand
        phase = observation.phase

        if phase == "mus":
            if H.has_juego(hand) or "mus" not in {a.kind for a in legal_actions}:
                return Action.corto()
            return Action.mus()

        if phase == "descarte":
            # tira todo lo que no sea rey
            tirar = [i for i, c in enumerate(hand) if c.rank != 10] or [0]
            return Action.descarte(tirar)

        # En los lances: envida con juego, quiere con pares, pasa lo demás
        bet = observation.bet
        if bet["pending"] is None:
            if phase == "juego" and H.points(hand) == 31:
                return Action.envido(5)
            return Action.paso()
        if phase in ("pares", "juego"):
            return Action.quiero()
        return Action.no_quiero()
```

Lo que recibe el bot:

- `observation`: una [`Observation`](api.md#pcmus.game.Observation) con **tus**
  cartas y la información pública (marcador, fase, apuestas, historial). Nunca
  ve las cartas del rival hasta el recuento.
- `legal_actions`: las jugadas permitidas. Devuelve una de ellas (cualquier
  `Action.envido(n)` con `n` entre 2 y la meta también vale).

Reglas del árbitro: si tu bot lanza una excepción, devuelve una jugada ilegal o
tarda más de **2 segundos** en decidir, **pierde la partida**. Usa `self.rng`
en lugar de `random` para que tus partidas sean reproducibles.

## 3. Admítelo en el manifiesto

Añade al final de `players/community/players.toml`:

```toml
[[player]]
file = "mi_equipo.py"
class = "CortaConJuego"
```

## 4. Pruébalo

```bash
python -m pcmus validate          # carga y juega contra el aleatorio
pytest tests/test_bots.py         # los mismos tests que pasa cualquier bot
python -m pcmus play --bot corta-con-juego
python -m pcmus tournament --games 10 --out /tmp/resultados
```

## 5. Envíalo

```bash
git add players/community
git commit -m "Añade el bot corta-con-juego"
git push origin bot/mi-equipo
```

Abre el pull request contra `main`. GitHub Actions pasará los tests
automáticamente; cuando se fusione, el torneo se vuelve a jugar y tu bot
aparece en la [clasificación](https://saraatrapero.github.io/pcmus/#board).
