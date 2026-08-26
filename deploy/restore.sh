#!/usr/bin/env bash
# Restore SQLite + uploads from deploy/backup.sh archive.
# Usage (STOP api/worker first on prod):
#   docker compose stop api worker
#   ./deploy/restore.sh /opt/backups/piter-jaluzi-YYYYMMDDTHHMMSSZ.tar.gz
#   docker compose up -d api worker
set -euo pipefail

ARCHIVE="${1:-}"
STORAGE_DIR="${STORAGE_DIR:-/var/data/jaluzi}"

if [[ -z "${ARCHIVE}" || ! -f "${ARCHIVE}" ]]; then
  echo "usage: $0 /path/to/piter-jaluzi-*.tar.gz" >&2
  exit 1
fi

DATA_DIR="${STORAGE_DIR}/data"
UPLOADS_DIR="${STORAGE_DIR}/uploads"
TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT

echo "extract: ${ARCHIVE}"
tar -xzf "${ARCHIVE}" -C "${TMP}"

if [[ ! -d "${TMP}/data" ]]; then
  echo "error: archive missing data/" >&2
  exit 1
fi

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
if [[ -d "${DATA_DIR}" ]]; then
  cp -a "${DATA_DIR}" "${DATA_DIR}.pre-restore-${STAMP}" 2>/dev/null || true
fi
if [[ -d "${UPLOADS_DIR}" ]]; then
  cp -a "${UPLOADS_DIR}" "${UPLOADS_DIR}.pre-restore-${STAMP}" 2>/dev/null || true
fi

mkdir -p "${DATA_DIR}" "${UPLOADS_DIR}"
rsync -a "${TMP}/data/" "${DATA_DIR}/"
if [[ -d "${TMP}/uploads" ]]; then
  rsync -a "${TMP}/uploads/" "${UPLOADS_DIR}/"
fi

echo "restore OK → ${STORAGE_DIR}"
echo "pre-restore copies: *.pre-restore-${STAMP}"
