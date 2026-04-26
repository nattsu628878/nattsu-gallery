#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
source "$ROOT/scripts/dev-common.sh"

ensure_project_root "$ROOT"
ensure_node_modules "$ROOT" "プロジェクト"

echo "開発サーバ: Astro のみ"
echo "  Local:   http://127.0.0.1:4321/nattsu-gallery/"
echo "  Mobile:  http://<YOUR_LOCAL_IP>:4321/nattsu-gallery/"
echo ""
echo "停止: Ctrl+C"
echo ""

cd "$ROOT"
exec npm run dev -- --host 0.0.0.0
