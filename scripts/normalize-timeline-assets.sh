#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MD_DIR="$ROOT/src/data/timeline/content"
ASSET_DIR="$MD_DIR/data"

if [ ! -d "$ASSET_DIR" ]; then
  echo "skipped: asset directory not found: $ASSET_DIR" >&2
  exit 0
fi

has_cwebp=1
has_ffmpeg=1
if ! command -v cwebp >/dev/null 2>&1; then has_cwebp=0; fi
if ! command -v ffmpeg >/dev/null 2>&1; then has_ffmpeg=0; fi

if [ "$has_cwebp" -eq 1 ]; then
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
        if [ -f "$dst" ]; then rm -f "$src"; fi
        ;;
    esac
  done
fi

if [ "$has_ffmpeg" -eq 1 ]; then
  for src in "$ASSET_DIR"/*; do
    [ -f "$src" ] || continue
    name="$(basename "$src")"
    lower="$(printf '%s' "$name" | tr '[:upper:]' '[:lower:]')"
    case "$lower" in
      *.mov|*.mp4)
        dst="${src%.*}.webm"
        if [ ! -f "$dst" ] || [ "$src" -nt "$dst" ]; then
          ffmpeg -y -i "$src" -c:v libvpx-vp9 -b:v 0 -crf 32 -c:a libopus -b:a 96k "$dst" >/dev/null 2>&1 || true
        fi
        if [ -f "$dst" ]; then rm -f "$src"; fi
        ;;
    esac
  done
fi

ROOT_PATH="$ROOT" python3 - <<'PY'
from pathlib import Path
import os
import re

root = Path(os.environ["ROOT_PATH"])
md_dir = root / "src" / "data" / "timeline" / "content"
asset_dir = md_dir / "data"

replacements = {}
for p in asset_dir.glob("*.webp"):
    stem = p.stem
    replacements[f"{stem}.png"] = p.name
    replacements[f"{stem}.jpg"] = p.name
    replacements[f"{stem}.jpeg"] = p.name
for p in asset_dir.glob("*.webm"):
    stem = p.stem
    replacements[f"{stem}.mov"] = p.name
    replacements[f"{stem}.mp4"] = p.name

def replace_target(target: str) -> str:
    raw = target.strip()
    if not raw:
        return target
    lowered = raw.lower()
    if lowered.startswith(("http://", "https://", "data:", "blob:")):
        return target
    if "/" in raw:
        prefix, name = raw.rsplit("/", 1)
        next_name = replacements.get(name) or replacements.get(name.lower())
        if next_name:
            return f"{prefix}/{next_name}"
        return target
    next_name = replacements.get(raw) or replacements.get(raw.lower())
    return next_name or target

obsidian_re = re.compile(r"!\[\[([^\]|]+)(\|[^\]]+)?\]\]")
md_img_re = re.compile(r"(!\[[^\]]*\]\()([^)]+)(\))")
field_re = re.compile(r"^(image|video):\s*(.+?)\s*$", re.MULTILINE)

for md_path in sorted(md_dir.glob("*.md")):
    text = md_path.read_text(encoding="utf-8")

    def replace_obsidian(m: re.Match[str]) -> str:
        target = replace_target(m.group(1))
        suffix = m.group(2) or ""
        return f"![[{target}{suffix}]]"

    def replace_md_img(m: re.Match[str]) -> str:
        return f"{m.group(1)}{replace_target(m.group(2))}{m.group(3)}"

    def replace_field(m: re.Match[str]) -> str:
        key = m.group(1)
        value = m.group(2).strip().strip('"').strip("'")
        return f"{key}: {replace_target(value)}"

    updated = text
    updated = obsidian_re.sub(replace_obsidian, updated)
    updated = md_img_re.sub(replace_md_img, updated)
    updated = field_re.sub(replace_field, updated)

    if updated != text:
        md_path.write_text(updated, encoding="utf-8")
PY
