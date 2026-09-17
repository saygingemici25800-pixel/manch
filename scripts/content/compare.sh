#!/usr/bin/env bash
# Karşılaştırma matrisi: model × matting × preclean → docs/screens/cutouts-compare/<kombinasyon>/
set -u
cd "$(dirname "$0")/../.."
PY=${PY:-scripts/content/.venv/bin/python}
OUTROOT=docs/screens/cutouts-compare
for model in "$@"; do
  for matting in 0 1; do
    for preclean in 0 1; do
      name="${model}__matting-${matting}__preclean-${preclean}"
      flags=""; [ "$matting" = 1 ] && flags="$flags --matting"; [ "$preclean" = 1 ] && flags="$flags --preclean"
      echo "=== $name ==="
      "$PY" scripts/content/cutouts.py --model "$model" $flags --out "$OUTROOT/$name" 2>&1 | grep -E "ok |error|Error|sheet" || echo "FAILED: $name"
    done
  done
done
