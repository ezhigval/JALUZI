#!/usr/bin/env bash
set -euo pipefail

# Pack local SQLite + uploads so they can be copied to the VM once.
# Usage: ./deploy/pack-local-data.sh
# Then: scp -i <ssh-key> /tmp/jaluzi-data.tar.gz jaluzi-admin@<VM_IP>:/tmp/

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-/tmp/jaluzi-data.tar.gz}"

TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT

mkdir -p "${TMP}/data" "${TMP}/uploads"

if [[ -f "${ROOT}/back/data/db.db" ]]; then
  cp "${ROOT}/back/data/db.db" "${TMP}/data/db.db"
fi

if [[ -d "${ROOT}/back/src/uploads" ]]; then
  cp -a "${ROOT}/back/src/uploads/." "${TMP}/uploads/"
fi

tar -czf "${OUT}" -C "${TMP}" data uploads
echo "Archive: ${OUT}"
echo "On the VM, after the first compose up:"
echo "  docker compose -p piter-jaluzi stop api worker"
echo "  docker run --rm -v piter-jaluzi_jaluzi-data:/var/data/jaluzi -v /tmp/jaluzi-data.tar.gz:/tmp/jaluzi-data.tar.gz alpine sh -c 'mkdir -p /var/data/jaluzi && tar -xzf /tmp/jaluzi-data.tar.gz -C /var/data/jaluzi'"
echo "  docker compose -p piter-jaluzi start api worker"
