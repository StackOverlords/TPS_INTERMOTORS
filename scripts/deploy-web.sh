#!/usr/bin/env bash
#
# Compila el target web y lo publica en el public/ del backend Laravel.
#
# El SPA queda servido desde el MISMO origen que la API, asi que VITE_API_URL
# es una ruta relativa y CORS no interviene.
#
# Uso:
#   ./scripts/deploy-web.sh [ruta-al-laravel]
#
set -euo pipefail

LARAVEL_PATH="${1:-../api-commerce}"
API_URL="${VITE_API_URL:-/api/v1}"

if [[ ! -d "$LARAVEL_PATH/public" ]]; then
  echo "ERROR: no existe $LARAVEL_PATH/public" >&2
  echo "Pasa la ruta del backend como argumento." >&2
  exit 1
fi

echo "==> Compilando target web (VITE_API_URL=$API_URL)"
VITE_API_URL="$API_URL" npm run build:web

echo "==> Publicando en $LARAVEL_PATH/public"
# Se borra el assets anterior: los nombres llevan hash, y sin limpiar se
# acumulan los bundles de cada deploy.
rm -rf "$LARAVEL_PATH/public/assets"
cp -r dist/assets "$LARAVEL_PATH/public/assets"
cp dist/index.html dist/window.html "$LARAVEL_PATH/public/"

echo "==> Listo. $(du -sh "$LARAVEL_PATH/public/assets" | cut -f1) en public/assets"
echo
echo "El backend necesita las rutas del SPA en routes/web.php:"
echo "  Route::get('/', \$spa) y Route::fallback(...) excluyendo api/*"
