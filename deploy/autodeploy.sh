#!/usr/bin/env bash
# Pull-based autodeploy for the Yandex Cloud VM.
# Outbound GitHub works; inbound SSH from Cursor often does not.
# Install: sudo ./deploy/install-autodeploy.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT}"

LOCK_DIR="${ROOT}/.autodeploy.lock"
LOG_DIR="${ROOT}/deploy/logs"
mkdir -p "${LOG_DIR}"
LOG_FILE="${LOG_DIR}/autodeploy.log"

# Shared data volume path (same as STORAGE_DIR/data inside containers)
DATA_DIR_DEFAULT="${ROOT}/.runtime-data"
REQUEST_FILE=""

log() {
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*" | tee -a "${LOG_FILE}"
}

if ! mkdir "${LOCK_DIR}" 2>/dev/null; then
  log "skip: another autodeploy is running"
  exit 0
fi
trap 'rmdir "${LOCK_DIR}" 2>/dev/null || true' EXIT

if [[ ! -f .env ]]; then
  log "error: missing .env"
  exit 1
fi

# shellcheck disable=SC1091
set -a
# shellcheck source=/dev/null
source .env
set +a

REMOTE="${AUTODEPLOY_REMOTE:-origin}"
BRANCH="${AUTODEPLOY_BRANCH:-main}"
export COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-piter-jaluzi}"
STORAGE_DIR="${STORAGE_DIR:-/var/data/jaluzi}"

# Resolve deploy.request via docker volume if present
if docker compose --env-file .env ps -q api >/dev/null 2>&1; then
  API_CID="$(docker compose --env-file .env ps -q api || true)"
  if [[ -n "${API_CID}" ]]; then
    if docker exec "${API_CID}" test -f /var/data/jaluzi/data/ops/deploy.request 2>/dev/null; then
      FORCE=1
      docker exec "${API_CID}" rm -f /var/data/jaluzi/data/ops/deploy.request || true
      log "force: HTTP deploy hook flag"
    fi
  fi
fi

FORCE="${FORCE:-0}"

if [[ ! -d .git ]]; then
  log "error: ${ROOT} is not a git checkout"
  exit 1
fi

git fetch --quiet "${REMOTE}" "${BRANCH}"

LOCAL="$(git rev-parse HEAD)"
REMOTE_REV="$(git rev-parse "${REMOTE}/${BRANCH}")"

if [[ "${LOCAL}" == "${REMOTE_REV}" && "${FORCE}" != "1" ]]; then
  exit 0
fi

if [[ "${LOCAL}" != "${REMOTE_REV}" ]]; then
  log "update ${LOCAL:0:7} → ${REMOTE_REV:0:7} (${REMOTE}/${BRANCH})"
  if git merge-base --is-ancestor HEAD "${REMOTE_REV}" 2>/dev/null; then
    git merge --ff-only "${REMOTE_REV}"
  else
    log "unrelated histories — overlay checkout ${REMOTE}/${BRANCH}"
    git checkout "${REMOTE_REV}" -- .
  fi
else
  log "force redeploy at ${LOCAL:0:7}"
fi

# Never force a Hub pull for web; Caddy image on this VM is already local.
# Rebuild api/worker from mirror.gcr.io; copy sources if that still fails.
if docker compose --env-file .env up -d --build api worker mailpit >>"${LOG_FILE}" 2>&1; then
  log "api/worker/mailpit up OK"
else
  log "compose build failed — syncing source into running containers"
  docker compose --env-file .env up -d mailpit >>"${LOG_FILE}" 2>&1 || true
  docker compose --env-file .env up -d --no-build api worker >>"${LOG_FILE}" 2>&1 || true
  API_CID="$(docker compose --env-file .env ps -q api || true)"
  WORKER_CID="$(docker compose --env-file .env ps -q worker || true)"
  if [[ -n "${API_CID}" ]]; then
    docker cp back/src/. "${API_CID}:/app/src/" || true
  fi
  if [[ -n "${WORKER_CID}" ]]; then
    docker cp back/src/. "${WORKER_CID}:/app/src/" || true
  fi
  docker compose --env-file .env restart api worker >>"${LOG_FILE}" 2>&1 || true
fi

WEB_CID="$(docker compose --env-file .env ps -q web || true)"
if [[ -n "${WEB_CID}" ]]; then
  docker cp deploy/Caddyfile "${WEB_CID}:/etc/caddy/Caddyfile" || true
  docker exec "${WEB_CID}" caddy reload --config /etc/caddy/Caddyfile >>"${LOG_FILE}" 2>&1 \
    || docker compose --env-file .env restart web >>"${LOG_FILE}" 2>&1 || true
fi
docker compose --env-file .env up -d --no-build web >>"${LOG_FILE}" 2>&1 || true

docker compose --env-file .env ps >>"${LOG_FILE}" 2>&1 || true
log "done"
