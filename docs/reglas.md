# Reglamento del mus a dos

Esta versión es **mus a dos**: un jugador contra otro, sin parejas. Se juega
con la baraja española de 40 cartas y a **8 reyes**: los treses valen como
reyes y los doses como ases.

## Valor de las cartas

| Carta | Para grande y chica | Para juego y punto |
|-------|---------------------|--------------------|
| Rey (12) y tres | la más alta | 10 |
| Caballo (11) | | 10 |
| Sota (10) | | 10 |
| 7, 6, 5, 4 | su número | su número |
| As y dos | la más baja | 1 |

## Una mano

1. Se reparten 4 cartas a cada uno. **La mano** habla primero y gana todos los
   empates. La mano cambia en cada reparto.
2. **Mus.** La mano dice «mus» o «no hay mus». Si los dos piden mus, cada uno
   tira de 1 a 4 cartas y roba otras tantas. Se puede repetir hasta 4 veces
   por mano; después hay que cortar. El rival solo ve *cuántas* cartas tiras.
3. **Lances**, en este orden:
    - **Grande**: gana la mano con las cartas más altas (se compara la mejor
      carta, luego la segunda...).
    - **Chica**: gana la mano con las cartas más bajas.
    - **Pares**: cada uno declara si tiene pares. Solo se envida si los dos
      tienen. Duples (dos parejas o cuatro iguales) > medias (trío) > par.
    - **Juego**: se tiene juego sumando 31 o más. Orden: 31, 32, 40, 37, 36,
      35, 34, 33. Solo se envida si los dos tienen. **Si nadie tiene juego se
      juega al punto**: gana quien más se acerque a 30.

## Envites

En cada lance, empezando por la mano:

| Acción | Cuándo |
|--------|--------|
| Paso | si nadie ha envidado. Si pasan los dos, el lance queda «en paso». |
| Envido N | abre la apuesta con N piedras (N ≥ 2). |
| N más | sube N piedras (N ≥ 2) sobre el envite del rival. |
| Quiero | acepta: lo apostado se cobra en el recuento. |
| No quiero | rechaza: el que envidó cobra **ya** lo aceptado antes (1 piedra si era el primer envite). |
| Órdago | se apuesta la partida entera. Si se quiere, se descubren las cartas y quien gana ese lance gana la partida. |

## Recuento

Al acabar la mano se descubren las cartas y se cuenta en este orden:

| Lance | Cobra el ganador |
|-------|------------------|
| Grande / chica | lo querido, o 1 piedra si fue en paso |
| Pares | 1 por par, 2 por medias o 3 por duples, más lo querido |
| Juego | 3 por la 31 o 2 por otro juego, más lo querido |
| Punto | 1, más lo querido |

Si solo un jugador tiene pares (o juego), no hay envite y cobra sus pares (o su
juego). **En cuanto alguien llega a la meta la partida se acaba** y no se cuenta
nada más de esa mano.

!!! note "Diferencias con el mus a cuatro"
    No hay parejas ni señas. Para que la partida siempre termine, el número de
    descartes por mano está limitado (4 por defecto, `max_mus_rounds`).
