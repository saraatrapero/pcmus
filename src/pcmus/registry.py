"""Carga de los jugadores admitidos.

Los jugadores se admiten con un manifiesto ``players.toml`` en cada carpeta de
``players/``. Cada entrada dice qué archivo y qué clase cargar::

    [[player]]
    file = "mi_bot.py"
    class = "MiBot"

Nada se descubre automáticamente: para añadir un bot hay que tocar el
manifiesto, y eso queda a la vista en la revisión del pull request.
"""

from __future__ import annotations

import importlib.util
import sys
import tomllib
from dataclasses import dataclass
from pathlib import Path

from .player import Player, check_player_class

#: Carpetas con manifiesto, en orden. ``builtin`` son los bots de referencia;
#: ``community`` los que llegan por pull request.
PLAYER_DIRS = ("builtin", "community")


@dataclass(frozen=True)
class PlayerSpec:
    """Dónde está un bot. Es serializable, así que se puede pasar a otro proceso."""

    name: str
    file: str
    class_name: str
    group: str
    authors: tuple[str, ...] = ()
    description: str = ""

    def load(self) -> type[Player]:
        return load_class(Path(self.file), self.class_name)


class RegistryError(ValueError):
    """Un manifiesto o un bot no son válidos."""


def default_players_root() -> Path:
    """Carpeta ``players/`` del repositorio (o la indicada en ``PCMUS_PLAYERS``)."""
    import os

    env = os.environ.get("PCMUS_PLAYERS")
    if env:
        return Path(env)
    repo = Path(__file__).resolve().parents[2] / "players"
    return repo if repo.exists() else Path.cwd() / "players"


def load_class(path: Path, class_name: str) -> type[Player]:
    """Importa ``class_name`` desde el archivo ``path``."""
    module_name = f"pcmus_player_{path.parent.name}_{path.stem}"
    if module_name in sys.modules:
        module = sys.modules[module_name]
    else:
        spec = importlib.util.spec_from_file_location(module_name, path)
        if spec is None or spec.loader is None:
            raise RegistryError(f"No se puede importar {path}")
        module = importlib.util.module_from_spec(spec)
        sys.modules[module_name] = module
        spec.loader.exec_module(module)
    cls = getattr(module, class_name, None)
    if cls is None:
        raise RegistryError(f"{path} no define la clase {class_name}")
    problems = check_player_class(cls)
    if problems:
        raise RegistryError(f"{path}:{class_name}: " + "; ".join(problems))
    return cls


def load_manifest(directory: Path) -> list[PlayerSpec]:
    """Lee el ``players.toml`` de una carpeta (lista vacía si no existe)."""
    manifest = directory / "players.toml"
    if not manifest.exists():
        return []
    data = tomllib.loads(manifest.read_text(encoding="utf-8"))
    specs = []
    for entry in data.get("player", []):
        try:
            file = directory / entry["file"]
            class_name = entry["class"]
        except KeyError as exc:
            raise RegistryError(f"{manifest}: falta el campo {exc}") from exc
        if not file.exists():
            raise RegistryError(f"{manifest}: no existe {file}")
        cls = load_class(file, class_name)
        specs.append(
            PlayerSpec(
                name=cls.name,
                file=str(file),
                class_name=class_name,
                group=directory.name,
                authors=tuple(cls.authors),
                description=cls.description,
            )
        )
    return specs


def discover(root: Path | None = None) -> list[PlayerSpec]:
    """Todos los jugadores admitidos. Falla si hay nombres repetidos."""
    root = root or default_players_root()
    specs: list[PlayerSpec] = []
    for group in PLAYER_DIRS:
        specs.extend(load_manifest(root / group))
    seen: dict[str, str] = {}
    for s in specs:
        if s.name in seen:
            raise RegistryError(f"Nombre de bot repetido: {s.name!r} ({seen[s.name]} y {s.file})")
        seen[s.name] = s.file
    return specs
