"""Puente entre la página web y el motor.

La web ejecuta esta librería en el navegador con Pyodide, así que la lógica que
juega el humano es exactamente la misma que usan los tests y el torneo. Todo lo
que cruza a JavaScript es JSON, y nunca incluye las cartas del bot mientras se
juega la mano.
"""

from __future__ import annotations

import json
from typing import Any

from .actions import Action
from .game import MusGame
from .player import Player
from .registry import discover

HUMAN = 0
BOT = 1

PHASE_LABELS = {
    "mus": "¿Hay mus?",
    "descarte": "Descarte",
    "grande": "A la grande",
    "chica": "A la chica",
    "pares": "A los pares",
    "juego": "Al juego",
    "punto": "Al punto",
    "fin": "Partida terminada",
}


def list_bots() -> str:
    """Bots disponibles, en JSON."""
    return json.dumps(
        [
            {"name": s.name, "description": s.description, "authors": list(s.authors)}
            for s in discover()
        ],
        ensure_ascii=False,
    )


def action_label(action: Action, pending: int | None) -> str:
    if action.kind == "envido":
        return f"Envido {action.amount}" if pending is None else f"{action.amount} más"
    return {
        "mus": "Mus",
        "corto": "No hay mus",
        "paso": "Paso",
        "quiero": "Quiero",
        "no_quiero": "No quiero",
        "ordago": "¡Órdago!",
    }.get(action.kind, str(action))


def history_label(entry: dict[str, Any]) -> str:
    kind = entry["action"]
    if kind == "envido":
        return f"envido {entry['amount']}"
    if kind == "descarte":
        n = entry["count"]
        return f"se descarta de {n} carta{'s' if n > 1 else ''}"
    return {
        "mus": "mus",
        "corto": "no hay mus",
        "paso": "paso",
        "quiero": "quiero",
        "no_quiero": "no quiero",
        "ordago": "¡órdago!",
    }.get(kind, kind)


class WebSession:
    """Una partida humano (jugador 0) contra bot (jugador 1)."""

    def __init__(self, bot_name: str, target: int = 30, seed: int | None = None) -> None:
        specs = {s.name: s for s in discover()}
        if bot_name not in specs:
            raise ValueError(f"Bot desconocido: {bot_name}")
        self.bot: Player = specs[bot_name].load()(seed=seed)
        self.bot_name = bot_name
        self.game = MusGame(target=target, seed=seed)
        self.bot.on_game_start(BOT, target)
        self.events: list[dict[str, Any]] = []
        self.pending_summary: dict[str, Any] | None = None
        self._seen = 0
        self._run_bot()

    # Llamadas desde JavaScript -------------------------------------------
    def state(self) -> str:
        return json.dumps(self._state(), ensure_ascii=False)

    def act(self, action_json: str) -> str:
        """Aplica la acción del humano y deja jugar al bot hasta que vuelva a tocar."""
        if self.pending_summary is not None:
            return self._error("Primero cierra el recuento de la mano.")
        if self.game.turn != HUMAN:
            return self._error("No es tu turno.")
        try:
            action = Action.from_dict(json.loads(action_json))
        except (ValueError, KeyError, TypeError) as exc:
            return self._error(f"Acción no válida: {exc}")
        if not self.game.is_legal(action):
            return self._error("Esa jugada no está permitida ahora.")
        self.events = []
        self._apply(HUMAN, action)
        self._run_bot()
        return self.state()

    def resume(self) -> str:
        """Cierra el recuento mostrado y sigue la partida."""
        self.pending_summary = None
        self.events = []
        self._run_bot()
        return self.state()

    # Interno ---------------------------------------------------------------
    def _apply(self, player: int, action: Action) -> None:
        phase = self.game.phase
        self.game.step(action)
        self.events.append(
            {
                "player": player,
                "phase": phase,
                "text": history_label(self.game_history_entry(player, action)),
            }
        )
        if len(self.game.hand_summaries) > self._seen:
            self._seen = len(self.game.hand_summaries)
            self.pending_summary = self.game.hand_summaries[-1]
            self.bot.on_hand_end(self.pending_summary)

    @staticmethod
    def game_history_entry(player: int, action: Action) -> dict[str, Any]:
        entry: dict[str, Any] = {"player": player, "action": action.kind}
        if action.kind == "envido":
            entry["amount"] = action.amount
        if action.kind == "descarte":
            entry["count"] = len(action.discard)
        return entry

    def _run_bot(self) -> None:
        guard = 0
        while (
            not self.game.is_over
            and self.pending_summary is None
            and self.game.turn == BOT
            and guard < 500
        ):
            guard += 1
            obs = self.game.observation(BOT)
            legal = self.game.legal_actions()
            try:
                action = self.bot.choose_action(obs, legal)
                if not self.game.is_legal(action):
                    action = legal[0]
            except Exception:  # noqa: BLE001 - en la web el bot nunca rompe la partida
                action = legal[0]
            self._apply(BOT, action)

    def _error(self, message: str) -> str:
        data = self._state()
        data["error"] = message
        return json.dumps(data, ensure_ascii=False)

    def _state(self) -> dict[str, Any]:
        g = self.game
        obs = g.observation(HUMAN)
        bet = obs.bet
        pending = bet["pending"] if bet else None
        legal = []
        if g.turn == HUMAN and self.pending_summary is None:
            for a in g.legal_actions():
                if a.kind == "descarte":
                    legal = [{"kind": "descarte", "label": "Descartarme"}]
                    break
                legal.append({**a.to_dict(), "label": action_label(a, pending)})
        return {
            "bot": self.bot_name,
            "phase": obs.phase,
            "phaseLabel": PHASE_LABELS.get(obs.phase, obs.phase),
            "yourTurn": g.turn == HUMAN and self.pending_summary is None,
            "hand": [c.code() for c in obs.hand],
            "youAreMano": obs.is_mano,
            "scores": list(obs.scores),
            "target": obs.target,
            "handNumber": obs.hand_number,
            "musRound": obs.mus_round,
            "bet": bet,
            "declarations": {k: (list(v) if v else None) for k, v in obs.declarations.items()},
            "history": [
                {"player": e["player"], "phase": e["phase"], "text": history_label(e)}
                for e in obs.history
            ],
            "events": self.events,
            "legal": legal,
            "summary": self.pending_summary,
            "winner": g.winner,
        }


_session: WebSession | None = None


def new_game(bot_name: str, target: int = 30, seed: int | None = None) -> str:
    """Empieza una partida nueva y devuelve su estado."""
    global _session
    _session = WebSession(bot_name, target, seed)
    return _session.state()


def act(action_json: str) -> str:
    assert _session is not None, "No hay partida"
    return _session.act(action_json)


def resume() -> str:
    assert _session is not None, "No hay partida"
    return _session.resume()
