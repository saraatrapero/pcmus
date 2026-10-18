"""PC Mus: motor de mus a dos, API de bots y torneo automático."""

from .actions import Action, IllegalActionError
from .cards import Card, Deck
from .game import MusGame, Observation
from .player import Player

__all__ = ["Action", "Card", "Deck", "IllegalActionError", "MusGame", "Observation", "Player"]
__version__ = "0.1.0"
