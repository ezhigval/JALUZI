#!/usr/bin/env bash
set -euo pipefail

# Pull the latest monorepo and rebuild the site on the VM.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT}"

if [[ ! -f .env ]]; then
  echo "Missing ${ROOT}/.env — copy .env.example and fill secrets first."
  exit 1
fi

if [[ -d .git ]]; then
  git pull --ff-only
fi

docker compose --env-file .env up -d --build
docker compose ps
./deploy/smoke.sh
