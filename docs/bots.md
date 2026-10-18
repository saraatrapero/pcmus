# Bots de referencia

| Bot | Estrategia | Nivel |
|-----|-----------|-------|
| `aleatorio` | Cualquier jugada legal al azar. | Línea base |
| `tio-paco` | Reglas fijas: corta con medias, duples o 31, se queda con reyes y ases y envida por encima de un umbral de fuerza. | Medio |
| `abuela-remedios` | Razonamiento probabilístico (abajo). | Alto |

## Cómo razona `abuela-remedios`

El mus es un juego de **información oculta**: no ves las cartas del rival. Este
bot mantiene una *creencia* sobre ellas.

1. **Prior.** Saca 160 manos posibles del rival de entre las 36 cartas que no
   ve, y descarta las que contradicen lo que el rival ha declarado (si dijo que
   tiene pares, solo valen manos con pares).
2. **Actualización bayesiana.** Pondera cada mano posible por la verosimilitud
   de lo que ha hecho el rival: `P(acciones | mano)`. Quien envida suele tener
   buena mano en ese lance, quien pasa suele tenerla floja y quien corta el mus
   suele llevar juego o pares.
3. **Modelo del rival que aprende.** Tras cada recuento ve las cartas del rival
   y comprueba si sus envites eran faroles. Lleva la cuenta con una
   distribución Beta y usa la tasa estimada para dar menos crédito a los
   envites de un rival farolero.
4. **Decisión por valor esperado.** Con la probabilidad `p` de ganar el lance:
    - querer un envite de `S` piedras vale `(2p − 1)·S`; no quererlo cuesta lo
      que ya estaba aceptado. Elige lo mejor;
    - ante un órdago compara `p` con la probabilidad de ganar la partida si no
      lo quiere (estimada a partir del marcador);
    - en el descarte prueba las 15 formas de tirar cartas, simula robos y se
      queda con la que da más piedras esperadas.
