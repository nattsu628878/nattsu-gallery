#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

if [ -z "${DROPBOX_ACCESS_TOKEN:-}" ]; then
  echo "ERROR: DROPBOX_ACCESS_TOKEN is not set." >&2
  echo "Usage:" >&2
  echo "  DROPBOX_ACCESS_TOKEN=... ./sync-dropbox-content.sh" >&2
  echo "" >&2
  echo "Optional:" >&2
  echo "  DROPBOX_ARTICLE_PATH=/nattsu-gallery/article" >&2
  echo "  DROPBOX_OPUS_PATH=/nattsu-gallery/opus" >&2
  echo "  DROPBOX_TIMELINE_PATH=/nattsu-gallery/timeline" >&2
  exit 1
fi

echo "[sync] Fetching article/opus/timeline from Dropbox..."
python3 "$ROOT/scripts/fetch-dropbox-content.py"

echo "[sync] Normalizing opus images to webp..."
bash "$ROOT/scripts/normalize-opus-assets.sh"

echo "[sync] Normalizing timeline assets to webp/webm..."
bash "$ROOT/scripts/normalize-timeline-assets.sh"

echo "[sync] Done."
