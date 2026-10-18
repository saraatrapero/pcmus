# Contribuir

- Todo cambio entra por **pull request** a `main`. La rama `main` está
  protegida: hacen falta los tests en verde y una revisión.
- Un bot nuevo va en `players/community/` con su entrada en
  `players/community/players.toml`. No hace falta tocar nada más.
- Antes de abrir el pull request:

```bash
ruff check . && ruff format --check .
pytest
python -m pcmus validate
```

Consulta el [tutorial para crear un bot](crear-un-bot.md).
