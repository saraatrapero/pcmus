"""Línea base: juega al azar."""

from pcmus.bots import RandomBot


class Aleatorio(RandomBot):
    name = "aleatorio"
    authors = ["Equipo PC Mus"]
    description = "Elige cualquier acción legal al azar. Es la referencia más baja."
