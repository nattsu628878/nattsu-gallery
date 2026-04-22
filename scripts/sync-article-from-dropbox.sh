#!/usr/bin/env bash
# Dropbox/_md の中身を src/data/article/markdown にコピーするだけ
# DROPBOX_ARTICLE_MD で元を上書き可

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${DROPBOX_ARTICLE_MD:-$HOME/Library/CloudStorage/Dropbox/_md}"
DEST="$ROOT/src/data/article/markdown"

if [ ! -d "$SRC" ]; then
  echo "not found: $SRC" >&2
  exit 1
fi

mkdir -p "$DEST"
# 直下の .obsidian（Obsidian 設定）はコピーしない
find "$SRC" -mindepth 1 -maxdepth 1 ! -name '.obsidian' -exec cp -R {} "$DEST/" \;
