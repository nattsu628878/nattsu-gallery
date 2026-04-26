#!/usr/bin/env bash
set -euo pipefail

ensure_project_root() {
  local root="$1"
  if [ ! -f "$root/package.json" ]; then
    echo "エラー: package.json が見つかりません。" >&2
    exit 1
  fi
}

ensure_node_modules() {
  local target_dir="$1"
  local label="$2"
  if [ ! -d "$target_dir/node_modules" ]; then
    echo "$label の依存関係をインストールしています..."
    (cd "$target_dir" && npm install) || exit 1
    echo ""
  fi
}
