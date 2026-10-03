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

# Module Federation emite su bootstrap en la RAIZ de dist/, no en assets/, y el
# index.html lo pide desde la raiz del sitio:
#
#   <script type="module" src="/mf-entry-bootstrap-0-<hash>.js"></script>
#
# Copiar solo assets/ dejaba ese archivo afuera. Como Laravel tiene un fallback
# de SPA, el pedido no daba 404: devolvia el index.html con Content-Type
# text/html, y el navegador rechazaba el modulo con
# "Expected a JavaScript-or-Wasm module script". La app no arrancaba.
#
# Se limpian los anteriores por el mismo motivo que assets/: el nombre lleva
# hash y si no, se acumula un bootstrap por cada deploy.
rm -f "$LARAVEL_PATH"/public/mf-entry-bootstrap-*.js
cp dist/mf-entry-bootstrap-*.js "$LARAVEL_PATH/public/"

# Verificacion: que no quede ningun modulo referenciado por el index.html sin
# su archivo. Es barato y ataja justo el error de MIME de arriba, que en el
# navegador aparece lejos de su causa.
faltantes=0
while read -r ref; do
  if [[ ! -f "$LARAVEL_PATH/public/$ref" ]]; then
    echo "ERROR: index.html referencia /$ref y no se publico" >&2
    faltantes=1
  fi
done < <(grep -oE '(src|href)="/[^"]+\.(js|css)"' "$LARAVEL_PATH/public/index.html" \
         | sed -E 's/.*="\/([^"]+)"/\1/')

if [[ "$faltantes" -ne 0 ]]; then
  exit 1
fi

echo "==> Listo. $(du -sh "$LARAVEL_PATH/public/assets" | cut -f1) en public/assets"
echo
echo "El backend necesita las rutas del SPA en routes/web.php:"
echo "  Route::get('/', \$spa) y Route::fallback(...) excluyendo api/*"
