#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${1:-all}" # all | opus | timeline

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required but not found" >&2
  exit 1
fi

has_cwebp=0
has_ffmpeg=0
if command -v cwebp >/dev/null 2>&1; then has_cwebp=1; fi
if command -v ffmpeg >/dev/null 2>&1; then has_ffmpeg=1; fi

if [ "$has_cwebp" -ne 1 ] && [ "$has_ffmpeg" -ne 1 ]; then
  echo "Neither cwebp nor ffmpeg is available." >&2
  exit 1
fi

ROOT_PATH="$ROOT" TARGET="$TARGET" HAS_CWEBP="$has_cwebp" HAS_FFMPEG="$has_ffmpeg" python3 - <<'PY'
import json
import os
import subprocess
from pathlib import Path

root = Path(os.environ["ROOT_PATH"])
target = os.environ["TARGET"]
has_cwebp = os.environ["HAS_CWEBP"] == "1"
has_ffmpeg = os.environ["HAS_FFMPEG"] == "1"

def convert_images(assets_dir: Path):
    converted = 0
    if not has_cwebp or not assets_dir.is_dir():
        return converted
    for src in assets_dir.iterdir():
        if not src.is_file():
            continue
        ext = src.suffix.lower()
        if ext not in {".jpg", ".jpeg", ".png"}:
            continue
        dst = src.with_suffix(".webp")
        quality = "78" if ext in {".jpg", ".jpeg"} else "82"
        try:
            subprocess.run(["cwebp", "-quiet", "-q", quality, str(src), "-o", str(dst)], check=True)
            converted += 1
        except Exception:
            pass
    return converted

def convert_videos(assets_dir: Path):
    converted = 0
    if not has_ffmpeg or not assets_dir.is_dir():
        return converted
    for src in assets_dir.iterdir():
        if not src.is_file():
            continue
        ext = src.suffix.lower()
        if ext not in {".mp4", ".mov", ".ogg"}:
            continue
        dst = src.with_suffix(".webm")
        try:
            subprocess.run([
                "ffmpeg", "-y", "-i", str(src),
                "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "32",
                "-c:a", "libopus", "-b:a", "96k",
                str(dst)
            ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            converted += 1
        except Exception:
            pass
    return converted

def update_json(path: Path, mapper):
    if not path.is_file():
        return
    data = json.loads(path.read_text(encoding="utf-8"))
    changed = False
    for item in data:
        assets = item.get("assets")
        if not isinstance(assets, dict):
            continue
        for key, fn in mapper.items():
            value = assets.get(key)
            if isinstance(value, str):
                new_value = fn(value)
                if new_value != value:
                    assets[key] = new_value
                    changed = True
    if changed:
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

def to_webp(path_str: str):
    lower = path_str.lower()
    if lower.endswith(".jpg") or lower.endswith(".jpeg") or lower.endswith(".png"):
        return path_str.rsplit(".", 1)[0] + ".webp"
    return path_str

def to_webm(path_str: str):
    lower = path_str.lower()
    if lower.endswith(".mp4") or lower.endswith(".mov") or lower.endswith(".ogg"):
        return path_str.rsplit(".", 1)[0] + ".webm"
    return path_str

if target in {"all", "opus"}:
    opus_dir = root / "public" / "opus"
    opus_items = root / "src" / "data" / "opus" / "items.json"
    converted_img = convert_images(opus_dir)
    update_json(opus_items, {"image": to_webp})
    print(f"[opus] image converted: {converted_img}")

if target in {"all", "timeline"}:
    timeline_dir = root / "public" / "timeline"
    timeline_items = root / "src" / "data" / "timeline" / "items.json"
    converted_img = convert_images(timeline_dir)
    converted_video = convert_videos(timeline_dir)
    update_json(timeline_items, {"image": to_webp, "video": to_webm})
    print(f"[timeline] image converted: {converted_img}")
    print(f"[timeline] video converted: {converted_video}")
PY
