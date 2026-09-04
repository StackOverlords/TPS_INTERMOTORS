#!/usr/bin/env bash
#
# Trinquete de errores de tipos.
#
# El repo arrastra deuda de tipos preexistente, asi que exigir cero hoy
# bloquearia todo. Este script hace lo unico que si se puede sostener: que la
# deuda NO CREZCA. Falla si aparecen errores nuevos y avisa cuando bajan.
#
# Cuando el baseline llegue a 0, reemplazar la llamada por `npm run typecheck`
# a secas y borrar este script.
#
set -uo pipefail

BASELINE_FILE="$(dirname "$0")/../.typecheck-baseline"

if [[ ! -f "$BASELINE_FILE" ]]; then
  echo "ERROR: falta $BASELINE_FILE" >&2
  exit 1
fi

baseline="$(tr -d '[:space:]' < "$BASELINE_FILE")"

# `|| true`: tsc sale distinto de 0 cuando hay errores, y aca eso es lo esperado.
output="$(npx tsc --noEmit -p tsconfig.app.json 2>&1 || true)"
current="$(printf '%s\n' "$output" | grep -c 'error TS' || true)"

echo "Errores de tipos: $current (baseline: $baseline)"

if (( current > baseline )); then
  echo
  echo "El cambio AGREGA $(( current - baseline )) error(es) de tipos."
  echo "Los errores nuevos suelen estar en los archivos que tocaste:"
  echo
  printf '%s\n' "$output" | grep 'error TS' | head -20
  echo
  echo "Arreglalos, o si son inevitables subi el numero en .typecheck-baseline"
  echo "explicando por que en el mensaje del commit."
  exit 1
fi

if (( current < baseline )); then
  echo
  echo "Bajaron $(( baseline - current )) errores. Actualiza el baseline:"
  echo "  echo $current > .typecheck-baseline"
fi

exit 0
