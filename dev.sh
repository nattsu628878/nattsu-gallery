#!/usr/bin/env bash
# 開発用: Astro のみ（predev で Article アセット正規化のあと dev）
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

echo "開発サーバ: Astro（opus-editor は起動しません）"
echo "  http://127.0.0.1:4321/nattsu-gallery/"
echo ""
echo "停止: Ctrl+C"
echo ""

cd "$ROOT"
exec npm run dev -- --host 127.0.0.1
