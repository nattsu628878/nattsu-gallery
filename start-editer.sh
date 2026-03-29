#!/bin/bash
# ローカルサーバー起動（ギャラリー + Opus Editer + Article Editer）
# 使い方: ./start-editer.sh

ROOT="$(cd "$(dirname "$0")" && pwd)"
APP="$ROOT/apps/opus-editer"

if [ ! -f "$APP/package.json" ]; then
  echo "エラー: apps/opus-editer/ が見つかりません。"
  exit 1
fi

if [ ! -d "$APP/node_modules" ]; then
  echo "opus-editer の依存関係をインストールしています..."
  (cd "$APP" && npm install) || exit 1
  echo ""
fi

echo "📝 ローカルサーバーを起動しています（ギャラリー + Opus Editer + Article Editer）..."
echo "   （3333 が使用中なら 3334, 3335... で自動的に起動します）"
echo ""
echo "停止: Ctrl+C"
echo ""

cd "$APP"
exec node server.js
