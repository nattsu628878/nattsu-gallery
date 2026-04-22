#!/usr/bin/env bash
# Opus Editor 用: Astro（API）+ tools/opus-editor を同時起動
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

if [ ! -f "$ROOT/package.json" ]; then
  echo "エラー: package.json が見つかりません。" >&2
  exit 1
fi

if [ ! -d "$ROOT/node_modules" ]; then
  echo "依存関係をインストールしています..."
  (cd "$ROOT" && npm install) || exit 1
  echo ""
fi

if [ ! -d "$ROOT/tools/opus-editor/node_modules" ]; then
  echo "Opus Editor の依存関係をインストールしています..."
  (cd "$ROOT/tools/opus-editor" && npm install) || exit 1
  echo ""
fi

echo "Opus Editor: Astro + tools/opus-editor"
echo "  Gallery:     http://127.0.0.1:4321/nattsu-gallery/opus/"
echo "  Opus Editor: http://127.0.0.1:5174/"
echo ""
echo "停止: Ctrl+C"
echo ""

cd "$ROOT"
exec npm run dev:all
