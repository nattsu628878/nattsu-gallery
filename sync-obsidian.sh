#!/usr/bin/env bash
# Dropbox/_md → markdown コピー + アセット正規化（webp / webm）をまとめて実行
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

bash "$ROOT/scripts/sync-article-from-dropbox.sh"
bash "$ROOT/scripts/normalize-article-assets.sh"
