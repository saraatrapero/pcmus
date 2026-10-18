"""Nivel medio: reglas fijas de taberna."""

from pcmus.bots import HeuristicBot


class TioPaco(HeuristicBot):
    name = "tio-paco"
    authors = ["Equipo PC Mus"]
    description = (
        "Reglas de taberna: corta con medias, duples o 31, guarda reyes y ases, "
        "y envida cuando su mano pasa de un umbral de fuerza."
    )
