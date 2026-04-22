#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/nattsu/dev/project/nattsu-gallery"
ASSETS_DIR="$ROOT/public/pages/opus/assets"
ITEMS_JSON="$ROOT/src/data/opus/items.json"

if ! command -v cwebp >/dev/null 2>&1; then
  echo "cwebp is required but not found" >&2
  exit 1
fi

before_bytes=$(du -sk "$ASSETS_DIR" | awk '{print $1}')
converted=0

for src in "$ASSETS_DIR"/*; do
  [ -f "$src" ] || continue
  ext="${src##*.}"
  ext_lc=$(printf '%s' "$ext" | tr '[:upper:]' '[:lower:]')
  case "$ext_lc" in
    jpg|jpeg)
      dst="${src%.*}.webp"
      cwebp -quiet -q 78 "$src" -o "$dst"
      converted=$((converted + 1))
      ;;
    png)
      dst="${src%.*}.webp"
      cwebp -quiet -q 82 "$src" -o "$dst"
      converted=$((converted + 1))
      ;;
    *)
      ;;
  esac
done

python3 - <<'PY'
import json
from pathlib import Path

items_path = Path('/Users/nattsu/dev/project/nattsu-gallery/src/data/opus/items.json')
items = json.loads(items_path.read_text(encoding='utf-8'))

for item in items:
    assets = item.get('assets')
    if not isinstance(assets, dict):
        continue
    image = assets.get('image')
    if not isinstance(image, str):
        continue
    lowered = image.lower()
    if lowered.endswith('.jpg') or lowered.endswith('.jpeg') or lowered.endswith('.png'):
        assets['image'] = image.rsplit('.', 1)[0] + '.webp'

items_path.write_text(json.dumps(items, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
PY

after_bytes=$(du -sk "$ASSETS_DIR" | awk '{print $1}')

printf 'Converted files: %s\n' "$converted"
printf 'Assets size before: %s KB\n' "$before_bytes"
printf 'Assets size after : %s KB\n' "$after_bytes"
