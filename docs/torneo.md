# Torneo y clasificación

`python -m pcmus tournament` enfrenta a todos los bots admitidos entre sí
(todos contra todos). Cada pareja juega un número par de partidas alternando
asiento y quién es mano, así que nadie tiene ventaja por sortear.

## Un bot roto no rompe el torneo

Cada partida se juega **en un proceso aparte**:

| Fallo del bot | Qué pasa |
|---------------|----------|
| Lanza una excepción | pierde esa partida |
| Devuelve una jugada ilegal o algo que no es una `Action` | pierde esa partida |
| Tarda más de `move_time_limit` en una decisión | pierde esa partida |
| Se cuelga (bucle infinito) | se mata el proceso al pasar `game_timeout` y pierde esa partida |

El resto de partidas sigue igual. Los fallos se cuentan en la columna
«Fallos» de la clasificación.

## Clasificación

Se ordena por porcentaje de victorias y, a igualdad, por Elo (se parte de 1500
y se actualiza con K = 24 tras cada partida). Se escribe en
`results/leaderboard.json` y `results/leaderboard.md`.

## Publicación automática

El workflow `publish.yml` de GitHub Actions:

1. se lanza al hacer push a `main` (por ejemplo, al fusionar un bot nuevo),
   cada lunes y a mano desde la pestaña *Actions*;
2. juega el torneo;
3. genera la web con la clasificación nueva y la publica en GitHub Pages.
