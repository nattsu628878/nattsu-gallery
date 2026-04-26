#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
source "$ROOT/scripts/dev-common.sh"

ensure_project_root "$ROOT"
ensure_node_modules "$ROOT" "プロジェクト"
ensure_node_modules "$ROOT/tools/nattsu-editor" "natʇsu editor"

echo "natʇsu editor: Astro + tools/nattsu-editor"
echo "  Editor Home: http://127.0.0.1:5176/"
echo "  Opus Hub:    http://127.0.0.1:5176/opus"
echo "  TimelineHub: http://127.0.0.1:5176/timeline"
echo "  Gallery:     http://127.0.0.1:4321/nattsu-gallery/"
echo ""
echo "停止: Ctrl+C"
echo ""

cd "$ROOT"
exec npm run dev:editor-all
