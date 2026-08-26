#!/usr/bin/env bash
# Backup SQLite database and uploads for Piter-Jaluzi.
# Usage on VM:
#   ./deploy/backup.sh
#   STORAGE_DIR=/var/data/jaluzi ./deploy/backup.sh /opt/backups
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${1:-${ROOT}/deploy/backups}"
STORAGE_DIR="${STORAGE_DIR:-/var/data/jaluzi}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
ARCHIVE="${BACKUP_DIR}/piter-jaluzi-${TIMESTAMP}.tar.gz"

mkdir -p "${BACKUP_DIR}"

DATA_DIR="${STORAGE_DIR}/data"
UPLOADS_DIR="${STORAGE_DIR}/uploads"

if [[ ! -d "${DATA_DIR}" ]]; then
  echo "error: data dir not found: ${DATA_DIR}" >&2
  exit 1
fi

TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT

mkdir -p "${TMP}/data" "${TMP}/uploads"
cp -a "${DATA_DIR}/." "${TMP}/data/" 2>/dev/null || true
if [[ -d "${UPLOADS_DIR}" ]]; then
  cp -a "${UPLOADS_DIR}/." "${TMP}/uploads/" 2>/dev/null || true
fi

tar -czf "${ARCHIVE}" -C "${TMP}" data uploads
echo "${TIMESTAMP} archive=${ARCHIVE}" >> "${BACKUP_DIR}/backup.log"
echo "backup: ${ARCHIVE} ($(du -h "${ARCHIVE}" | awk '{print $1}'))"

# Keep last 14 daily-ish backups
ls -1t "${BACKUP_DIR}"/piter-jaluzi-*.tar.gz 2>/dev/null | tail -n +15 | xargs -r rm -f
