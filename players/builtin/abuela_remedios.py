"""Nivel alto: razonamiento probabilístico sobre la mano del rival."""

from pcmus.bots import MonteCarloBot


class AbuelaRemedios(MonteCarloBot):
    name = "abuela-remedios"
    authors = ["Equipo PC Mus"]
    description = (
        "Muestrea manos rivales compatibles con lo visto, las pondera con Bayes según "
        "cómo ha apostado el rival, aprende su tasa de farol y juega por valor esperado."
    )
