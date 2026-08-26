#!/usr/bin/env bash
# Generate WebP variants for static hero/about images in front/public/.
# Requires ffmpeg. Run after updating background.jpg or about.jpeg.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PUBLIC="${ROOT}/front/public"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "error: ffmpeg required" >&2
  exit 1
fi

optimize() {
  local src="$1"
  local max_width="$2"
  local base="${src%.*}"
  local webp="${base}.webp"

  if [[ ! -f "${src}" ]]; then
    echo "skip: ${src} not found"
    return 0
  fi

  ffmpeg -y -i "${src}" -vf "scale='min(${max_width},iw)':-2" -quality 82 "${webp}" >/dev/null 2>&1
  echo "OK  ${webp} ($(du -h "${webp}" | awk '{print $1}'))"
}

optimize "${PUBLIC}/background.jpg" 1920
optimize "${PUBLIC}/about.jpeg" 1200
