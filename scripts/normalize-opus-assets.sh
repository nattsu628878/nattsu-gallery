#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MD_DIR="$ROOT/src/data/opus/markdown"
ASSET_DIR="$MD_DIR/data"

if [ ! -d "$ASSET_DIR" ]; then
  echo "skipped: asset directory not found: $ASSET_DIR" >&2
  exit 0
fi

if ! command -v cwebp >/dev/null 2>&1; then
  echo "warning: cwebp not found (image conversion skipped)." >&2
  exit 0
fi

for src in "$ASSET_DIR"/*; do
  [ -f "$src" ] || continue
  name="$(basename "$src")"
  lower="$(printf '%s' "$name" | tr '[:upper:]' '[:lower:]')"
  case "$lower" in
    *.png|*.jpg|*.jpeg)
      dst="${src%.*}.webp"
      if [ ! -f "$dst" ] || [ "$src" -nt "$dst" ]; then
        cwebp -quiet -q 82 "$src" -o "$dst"
      fi
      if [ -f "$dst" ]; then
        rm -f "$src"
      fi
      ;;
  esac
done

ROOT_PATH="$ROOT" python3 - <<'PY'
from pathlib import Path
import os
import re

root = Path(os.environ["ROOT_PATH"])
md_dir = root / "src" / "data" / "opus" / "markdown"
asset_dir = md_dir / "data"

replacements: dict[str, str] = {}
for p in asset_dir.glob("*.webp"):
    stem = p.stem
    replacements[f"{stem}.png"] = p.name
    replacements[f"{stem}.jpg"] = p.name
    replacements[f"{stem}.jpeg"] = p.name
    replacements[f"/opus/{stem}.png"] = p.name
    replacements[f"/opus/{stem}.jpg"] = p.name
    replacements[f"/opus/{stem}.jpeg"] = p.name

field_re = re.compile(r"^(image|thumbnail|url):\s*(.+?)\s*$", re.MULTILINE)

for md_path in sorted(md_dir.glob("*.md")):
    text = md_path.read_text(encoding="utf-8")

    def replacer(match: re.Match[str]) -> str:
        key = match.group(1)
        raw_value = match.group(2).strip().strip('"').strip("'")
        lowered = raw_value.lower()
        if lowered.startswith("http://") or lowered.startswith("https://"):
            return match.group(0)
        next_value = replacements.get(raw_value) or replacements.get(lowered)
        if not next_value:
            return match.group(0)
        return f"{key}: {next_value}"

    updated = field_re.sub(replacer, text)
    if updated != text:
        md_path.write_text(updated, encoding="utf-8")
PY
