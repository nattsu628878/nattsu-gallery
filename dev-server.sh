#!/bin/bash

# 開発サーバーを起動するスクリプト
# ポート8000でPython HTTPサーバーを起動します

PORT=8000

echo "🚀 開発サーバーを起動しています..."
echo "📡 http://localhost:${PORT} でアクセスできます"
echo ""
echo "停止するには Ctrl+C を押してください"
echo ""

cd "$(dirname "$0")"
python3 -m http.server ${PORT}
