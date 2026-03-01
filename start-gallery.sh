#!/bin/bash
# ギャラリー用の通常サーバーを起動（Python HTTP サーバー）
# 使い方: ./start-gallery.sh

PORT=8000
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "📷 ギャラリーサーバーを起動しています..."
echo "   http://127.0.0.1:${PORT}/"
echo ""
echo "停止: Ctrl+C"
echo ""

cd "$ROOT"
python3 -m http.server ${PORT}
