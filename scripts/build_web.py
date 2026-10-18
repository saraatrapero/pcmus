"""Genera la web estática en ``_site/`` para GitHub Pages.

Copia la interfaz (``web/``), el código Python que ejecutará Pyodide
(``src/pcmus`` y ``players/``) y la clasificación (``results/``).

Uso::

    python scripts/build_web.py
    python -m http.server -d _site 8000   # y abre http://localhost:8000
"""

from __future__ import annotations

import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "_site"


def main() -> None:
    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(ROOT / "web", OUT)

    files: list[str] = []
    sources = [
        (ROOT / "src", "src", "*.py"),
        (ROOT / "players", "players", "*.py"),
        (ROOT / "players", "players", "*.toml"),
    ]
    for base, prefix, pattern in sources:
        for path in sorted(base.rglob(pattern)):
            if "__pycache__" in path.parts:
                continue
            rel = f"{prefix}/{path.relative_to(base).as_posix()}"
            dest = OUT / "py" / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, dest)
            files.append(rel)
    (OUT / "py" / "manifest.json").write_text(json.dumps({"files": files}, indent=2))

    results = ROOT / "results"
    if results.exists():
        shutil.copytree(results, OUT / "results")
    (OUT / ".nojekyll").write_text("")
    print(f"Web generada en {OUT} ({len(files)} archivos Python)")


if __name__ == "__main__":
    main()
