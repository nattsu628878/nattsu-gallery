#!/usr/bin/env bash
# Convert non-webp images in src/data/opus/inbox/ to webp and place in src/data/opus/webp/

set -euo pipefail

INBOX_DIR="$(dirname "$0")/src/data/opus/inbox"
WEBP_DIR="$(dirname "$0")/src/data/opus/webp"

if [ ! -d "$INBOX_DIR" ]; then
  echo "Error: inbox directory not found: $INBOX_DIR" >&2
  exit 1
fi

mkdir -p "$WEBP_DIR"

# Require cwebp for conversion
if ! command -v cwebp &>/dev/null; then
  echo "Error: cwebp not found. Install with: brew install webp" >&2
  exit 1
fi

converted=0
skipped=0

for file in "$INBOX_DIR"/*; do
  [ -f "$file" ] || continue
  ext="${file##*.}"
  ext_lower="$(echo "$ext" | tr '[:upper:]' '[:lower:]')"
  basename="$(basename "$file")"
  stem="${basename%.*}"
  dest="$WEBP_DIR/${stem}.webp"

  if [ "$ext_lower" = "webp" ]; then
    if [ ! -f "$dest" ]; then
      cp "$file" "$dest"
      echo "Copied:    $basename -> webp/${stem}.webp"
      converted=$((converted + 1))
    else
      skipped=$((skipped + 1))
    fi
  else
    case "$ext_lower" in
      png|jpg|jpeg|gif|tiff|tif|bmp|avif)
        if [ ! -f "$dest" ]; then
          cwebp -quiet "$file" -o "$dest"
          echo "Converted: $basename -> webp/${stem}.webp"
          converted=$((converted + 1))
        else
          skipped=$((skipped + 1))
        fi
        ;;
      *)
        echo "Skipped (unsupported format): $basename"
        ;;
    esac
  fi
done

echo ""
echo "Done. Converted/copied: $converted, Already existed: $skipped"
