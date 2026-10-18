"""Bots rotos a propósito para comprobar que el árbitro y el torneo aguantan."""

import time

from pcmus import Action, Player


class Explota(Player):
    name = "explota"
    authors = ["tests"]
    description = "Lanza una excepción."

    def choose_action(self, observation, legal_actions):
        raise RuntimeError("¡pum!")


class Tramposo(Player):
    name = "tramposo"
    authors = ["tests"]
    description = "Siempre quiere, aunque no toque."

    def choose_action(self, observation, legal_actions):
        return Action.quiero()


class Lento(Player):
    name = "lento"
    authors = ["tests"]
    description = "Tarda demasiado."

    def choose_action(self, observation, legal_actions):
        time.sleep(0.3)
        return legal_actions[0]


class Colgado(Player):
    name = "colgado"
    authors = ["tests"]
    description = "Se queda en un bucle infinito."

    def choose_action(self, observation, legal_actions):
        while True:
            pass


class NoEsAccion(Player):
    name = "no-es-accion"
    authors = ["tests"]
    description = "Devuelve un texto en vez de una acción."

    def choose_action(self, observation, legal_actions):
        return "órdago"
