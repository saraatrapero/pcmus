# Jugar

## En el navegador

Entra en [saraatrapero.github.io/pcmus](https://saraatrapero.github.io/pcmus/),
elige rival y meta, y juega. No hay que instalar nada: la página carga Python
en el navegador con [Pyodide](https://pyodide.org) y ejecuta **la misma
librería** que usan los tests y el torneo.

Para probar la web en local:

```bash
python scripts/build_web.py
python -m http.server -d _site 8000
```

## En la terminal

```bash
python -m pcmus play --bot abuela-remedios --target 30
```
