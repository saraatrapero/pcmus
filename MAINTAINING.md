# Mantenimiento del repositorio

Pasos que hay que hacer una vez en GitHub (no se pueden configurar desde el código):

1. **Proteger `main`**: *Settings → Branches → Add branch ruleset* para `main`:
   exigir pull request con 1 aprobación, exigir que pasen los checks `test` y
   `docs`, y bloquear los *force push*.
   Como la protección impide que el workflow guarde `results/`, la web se
   publica igualmente con la clasificación recién calculada. Si queréis que
   también quede guardada en el repositorio, añadid `github-actions` a la lista
   de excepciones del ruleset.
2. **GitHub Pages**: *Settings → Pages → Source: GitHub Actions*.
3. **ReadTheDocs**: importar el repositorio en readthedocs.org con el nombre
   `pcmus` (usa `.readthedocs.yaml`).
4. **Revisar bots externos**: comprobar que el pull request solo toca
   `players/community/`, que los tests están en verde, y fusionar.
