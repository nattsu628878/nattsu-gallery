#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ASSET_DIR="$ROOT/src/data/article/markdown/data"
VIDEO_WEBM_MAX_SIDE="${VIDEO_WEBM_MAX_SIDE:-1280}"

# 進捗は stderr のみ（バー + 改行）。数値は整数のみ（bash 3.2 互換）
bar_pct() {
  local pct=$1 width=${2:-28}
  local filled n i
  if [ "$pct" -le 0 ]; then filled=0
  elif [ "$pct" -ge 100 ]; then filled=$width
  else filled=$(( pct * width / 100 ))
  fi
  n=$((width - filled))
  printf '['
  i=0
  while [ "$i" -lt "$filled" ]; do printf '='; i=$((i + 1)); done
  i=0
  while [ "$i" -lt "$n" ]; do printf '-'; i=$((i + 1)); done
  printf ']'
}

bar_frac() {
  local cur=$1 total=$2 width=${3:-28}
  local pct=0
  if [ "$total" -gt 0 ]; then pct=$(( cur * 100 / total )); fi
  bar_pct "$pct" "$width"
}

if [ ! -d "$ASSET_DIR" ]; then
  printf '%s\n' "skipped: asset directory not found: $ASSET_DIR" >&2
  exit 0
fi

has_cwebp=1
has_ffmpeg=1
if ! command -v cwebp >/dev/null 2>&1; then
  has_cwebp=0
  printf '%s\n' "warning: cwebp not found (image conversion skipped)." >&2
fi
if ! command -v ffmpeg >/dev/null 2>&1; then
  has_ffmpeg=0
  printf '%s\n' "warning: ffmpeg not found (video conversion skipped)." >&2
fi

image_total=0
for src in "$ASSET_DIR"/*; do
  [ -f "$src" ] || continue
  n="$(basename "$src")"
  lw="$(printf '%s' "$n" | tr '[:upper:]' '[:lower:]')"
  case "$lw" in
    *.png|*.jpg|*.jpeg) image_total=$((image_total + 1)) ;;
  esac
done

video_total=0
for src in "$ASSET_DIR"/*; do
  [ -f "$src" ] || continue
  n="$(basename "$src")"
  lw="$(printf '%s' "$n" | tr '[:upper:]' '[:lower:]')"
  case "$lw" in
    *.mov|*.mp4) video_total=$((video_total + 1)) ;;
  esac
done

if [ "$has_cwebp" -eq 1 ]; then
  image_i=0
  for src in "$ASSET_DIR"/*; do
    [ -f "$src" ] || continue
    name="$(basename "$src")"
    lower="$(printf '%s' "$name" | tr '[:upper:]' '[:lower:]')"
    case "$lower" in
      *.png|*.jpg|*.jpeg)
        image_i=$((image_i + 1))
        dst="${src%.*}.webp"
        if [ ! -f "$dst" ] || [ "$src" -nt "$dst" ]; then
          cwebp -quiet -q 82 "$src" -o "$dst"
        fi
        if [ -f "$dst" ]; then
          rm -f "$src"
        fi
        printf '\r画像 WebP  %s %d/%d' "$(bar_frac "${image_i}" "${image_total}")" "${image_i}" "${image_total}" >&2
        ;;
    esac
  done
  if [ "${image_total}" -eq 0 ]; then
    printf '\r画像 WebP  %s 0/0\n' "$(bar_pct 0)" >&2
  else
    printf '\n' >&2
  fi
else
  printf '\r画像 WebP  %s （cwebp なし）\n' "$(bar_pct 0)" >&2
fi

if [ "$has_ffmpeg" -eq 1 ]; then
  video_i=0
  for src in "$ASSET_DIR"/*; do
    [ -f "$src" ] || continue
    name="$(basename "$src")"
    lower="$(printf '%s' "$name" | tr '[:upper:]' '[:lower:]')"
    case "$lower" in
      *.mov|*.mp4)
        video_i=$((video_i + 1))
        dst="${src%.*}.webm"
        if [ ! -f "$dst" ] || [ "$src" -nt "$dst" ]; then
          vf="scale=w='min(${VIDEO_WEBM_MAX_SIDE},iw)':h='min(${VIDEO_WEBM_MAX_SIDE},ih)':force_original_aspect_ratio=decrease,fps=30,format=yuv420p"
          export SOURCE_MEDIA="$src" DEST_WEBM="$dst" FILTER_VF="$vf"
          python3 - <<'PY'
import math
import os
import re
import subprocess
import sys
from typing import List, Optional

src = os.environ["SOURCE_MEDIA"]
dst = os.environ["DEST_WEBM"]
vf = os.environ["FILTER_VF"]


def duration_sec(path: str) -> Optional[float]:
    r = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            path,
        ],
        capture_output=True,
        text=True,
    )
    if r.returncode != 0:
        return None
    s = (r.stdout or "").strip()
    if not s or s == "N/A":
        return None
    try:
        return float(s)
    except ValueError:
        return None

def bar(pct: float, w: int = 28) -> str:
    pct = max(0.0, min(100.0, pct))
    n = int(round(w * pct / 100.0))
    return "[" + "=" * n + "-" * (w - n) + "]"

dur = duration_sec(src)
# time=HH:MM:SS.xx または time=MM:SS.xx
time_re = re.compile(r"time=(\d+):(\d+):(\d+[.,]\d+)|time=(\d+):(\d+[.,]\d+)")
frame_re = re.compile(r"frame=\s*(\d+)")

def line_to_sec(m) -> Optional[float]:
    if m.group(1) is not None:
        h, mi, se = int(m.group(1)), int(m.group(2)), float(m.group(3).replace(",", "."))
        return h * 3600 + mi * 60 + se
    if m.group(4) is not None:
        mi, se = int(m.group(4)), float(m.group(5).replace(",", "."))
        return mi * 60 + se
    return None

cmd = [
    "ffmpeg",
    "-hide_banner",
    "-nostdin",
    "-loglevel",
    "info",
    "-stats",
    "-y",
    "-threads",
    "0",
    "-i",
    src,
    "-vf",
    vf,
    "-c:v",
    "libvpx-vp9",
    "-crf",
    "35",
    "-b:v",
    "0",
    "-row-mt",
    "1",
    "-cpu-used",
    "2",
    "-c:a",
    "libopus",
    "-b:a",
    "96k",
    dst,
]

proc = subprocess.Popen(cmd, stderr=subprocess.PIPE, text=True, bufsize=1)
buf: List[str] = []
last_pct = -1.0
last_frame = -1

assert proc.stderr is not None
for line in proc.stderr:
    buf.append(line)
    m = time_re.search(line)
    if m:
        pos = line_to_sec(m)
        if pos is not None and dur and dur > 0:
            pct = 100.0 * pos / dur
            if pct - last_pct >= 0.25 or pct >= 99.5:
                last_pct = pct
                sys.stderr.write(f"\r動画 WebM  {bar(pct)} {pct:.0f}% ")
                sys.stderr.flush()
        elif pos is not None:
            sys.stderr.write(f"\r動画 WebM  {bar(min(92.0, pos / 60.0 * 8.0))} {pos:.0f}s ")
            sys.stderr.flush()
    else:
        mf = frame_re.search(line)
        if mf and (not dur or dur <= 0):
            fr = int(mf.group(1))
            if fr != last_frame and fr % 15 == 0:
                last_frame = fr
                pct = min(95.0, math.log10(fr + 1) * 28.0)
                sys.stderr.write(f"\r動画 WebM  {bar(pct)} fr {fr} ")
                sys.stderr.flush()

rc = proc.wait()
sys.stderr.write(f"\r動画 WebM  {bar(100.0)} 100% \n")
sys.stderr.flush()
if rc != 0:
    sys.stderr.write("".join(buf[-40:]))
    sys.exit(rc)
PY
        else
          printf '\r動画 WebM  %s %d/%d スキップ\n' "$(bar_pct 0)" "${video_i}" "${video_total}" >&2
        fi
        if [ -f "$dst" ]; then
          rm -f "$src"
        fi
        ;;
    esac
  done
  if [ "${video_total}" -eq 0 ]; then
    printf '\r動画 WebM  %s 0/0\n' "$(bar_pct 0)" >&2
  fi
else
  printf '\r動画 WebM  %s （ffmpeg なし）\n' "$(bar_pct 0)" >&2
fi

ROOT_PATH="$ROOT" python3 - <<'PY'
from pathlib import Path
import os
import re
import sys

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


def replace_obsidian(match) -> str:
    body = match.group(1)
    if "|" in body:
        target, rest = body.split("|", 1)
        updated = replace_target(target.strip())
        return f"[[{updated}|{rest}]]"
    updated = replace_target(body.strip())
    return f"[[{updated}]]"


def replace_markdown_link(match) -> str:
    prefix = match.group(1)
    target = match.group(2)
    suffix = match.group(3)
    updated = replace_target(target.strip())
    return f"{prefix}{updated}{suffix}"


def bar_frac(cur: int, total: int, w: int = 28) -> str:
    if total <= 0:
        return "[" + "-" * w + "]"
    pct = min(100, max(0, int(100 * cur / total)))
    n = int(round(w * pct / 100.0))
    return "[" + "=" * n + "-" * (w - n) + "]"


md_paths = sorted(md_dir.glob("*.md"))
md_total = len(md_paths)
changed = 0
for idx, md_path in enumerate(md_paths, start=1):
    text = md_path.read_text(encoding="utf-8")
    replaced = text
    replaced = re.sub(r"\[\[([^\]]+)\]\]", replace_obsidian, replaced)
    replaced = re.sub(r"(!?\[[^\]]*\]\()([^)]+)(\))", replace_markdown_link, replaced)
    if replaced != text:
        md_path.write_text(replaced, encoding="utf-8")
        changed += 1
    sys.stderr.write(f"\rMarkdown    {bar_frac(idx, md_total)} {idx}/{md_total} ")
    sys.stderr.flush()

sys.stderr.write("\n")
PY
