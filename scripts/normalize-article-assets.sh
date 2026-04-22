#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ASSET_DIR="$ROOT/src/data/article/markdown/data"
MARKDOWN_DIR="$ROOT/src/data/article/markdown"

if [ ! -d "$ASSET_DIR" ]; then
  echo "[normalize-article-assets] skipped: asset directory not found: $ASSET_DIR"
  exit 0
fi

has_cwebp=1
has_ffmpeg=1
if ! command -v cwebp >/dev/null 2>&1; then
  has_cwebp=0
  echo "[normalize-article-assets] warning: cwebp not found (image conversion skipped)."
fi
if ! command -v ffmpeg >/dev/null 2>&1; then
  has_ffmpeg=0
  echo "[normalize-article-assets] warning: ffmpeg not found (video conversion skipped)."
fi

converted_images=0
converted_videos=0

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
        if [ -f "$dst" ]; then
          rm -f "$src"
          converted_images=$((converted_images + 1))
        fi
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
          ffmpeg -y -i "$src" -c:v libvpx-vp9 -crf 34 -b:v 0 -c:a libopus "$dst" >/dev/null 2>&1
        fi
        if [ -f "$dst" ]; then
          rm -f "$src"
          converted_videos=$((converted_videos + 1))
        fi
        ;;
    esac
  done
fi

ROOT_PATH="$ROOT" python3 - <<'PY'
from pathlib import Path
import re
import os

root = Path(os.environ["ROOT_PATH"])
md_dir = root / "src" / "data" / "article" / "markdown"
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

skip_prefixes = ("http://", "https://", "data:", "blob:", "attachment:", "mailto:")

def replace_target(target: str) -> str:
    if not target:
        return target
    lowered = target.lower()
    if lowered.startswith(skip_prefixes):
        return target
    if "?" in target:
        base, suffix = target.split("?", 1)
        suffix = "?" + suffix
    else:
        base, suffix = target, ""
    if "#" in base:
        path, fragment = base.split("#", 1)
        fragment = "#" + fragment
    else:
        path, fragment = base, ""

    normalized = path.replace("\\", "/")
    if "/" in normalized:
        prefix, name = normalized.rsplit("/", 1)
        candidate = replacements.get(name) or replacements.get(name.lower())
        if not candidate:
            return target
        return f"{prefix}/{candidate}{fragment}{suffix}"

    candidate = replacements.get(normalized) or replacements.get(normalized.lower())
    if not candidate:
        return target
    return f"{candidate}{fragment}{suffix}"

def replace_obsidian(match: re.Match[str]) -> str:
    body = match.group(1)
    if "|" in body:
        target, rest = body.split("|", 1)
        updated = replace_target(target.strip())
        return f"[[{updated}|{rest}]]"
    updated = replace_target(body.strip())
    return f"[[{updated}]]"

def replace_markdown_link(match: re.Match[str]) -> str:
    prefix = match.group(1)
    target = match.group(2)
    suffix = match.group(3)
    updated = replace_target(target.strip())
    return f"{prefix}{updated}{suffix}"

for md_path in md_dir.glob("*.md"):
    text = md_path.read_text(encoding="utf-8")
    replaced = text
    replaced = re.sub(r"\[\[([^\]]+)\]\]", replace_obsidian, replaced)
    replaced = re.sub(r"(!?\[[^\]]*\]\()([^)]+)(\))", replace_markdown_link, replaced)
    if replaced != text:
        md_path.write_text(replaced, encoding="utf-8")
PY

echo "[normalize-article-assets] done: images=$converted_images videos=$converted_videos"
