"""Estrategias de referencia. Los jugadores admitidos en el torneo están en ``players/``."""

from .heuristic import HeuristicBot
from .montecarlo import MonteCarloBot
from .random_bot import RandomBot

__all__ = ["HeuristicBot", "MonteCarloBot", "RandomBot"]
