#!/bin/bash
# Writer サーバーを起動（ギャラリー + Writer アプリ）
# 使い方: ./start-writer.sh

ROOT="$(cd "$(dirname "$0")" && pwd)"
WRITER="$ROOT/apps/writer"

if [ ! -f "$WRITER/package.json" ]; then
  echo "エラー: apps/writer/ が見つかりません。"
  exit 1
fi

if [ ! -d "$WRITER/node_modules" ]; then
  echo "writer の依存関係をインストールしています..."
  (cd "$WRITER" && npm install) || exit 1
  echo ""
fi

echo "✏️  Writer サーバーを起動しています..."
echo "   （3333 が使用中なら 3334, 3335... で自動的に起動します）"
echo ""
echo ""
echo "停止: Ctrl+C"
echo ""

cd "$WRITER"
exec node server.js
