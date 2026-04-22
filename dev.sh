#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/nattsu/dev/project/nattsu-gallery"
PORT="${1:-4322}"
HOST="0.0.0.0"

cd "$ROOT"

echo "Starting mobile dev server..."
echo "  host: $HOST"
echo "  port: $PORT"
echo
echo "Local URL:"
echo "  http://localhost:${PORT}/nattsu-gallery/"
echo
echo "To open from mobile (same Wi-Fi), use your Mac's LAN IP:"
echo "  http://<YOUR_LAN_IP>:${PORT}/nattsu-gallery/"
echo

npm run dev -- --host "$HOST" --port "$PORT"
