#!/usr/bin/env bash
# Scrape Intersklad catalog with Playwright, then import into the live SQLite DB.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PARSER_DIR="${ROOT}/back/parser"
IMAGE="${PLAYWRIGHT_IMAGE:-mcr.microsoft.com/playwright:v1.59.1-noble}"
export COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-piter-jaluzi}"

cd "${ROOT}"

if [[ ! -f "${PARSER_DIR}/index.js" ]]; then
  echo "Missing ${PARSER_DIR}/index.js"
  exit 1
fi

rm -f "${PARSER_DIR}/database.json"
mkdir -p "${PARSER_DIR}/images"

echo "Pulling Playwright image ${IMAGE}"
if ! docker pull "${IMAGE}"; then
  IMAGE="mcr.microsoft.com/playwright:v1.51.1-noble"
  echo "Fallback image ${IMAGE}"
  docker pull "${IMAGE}"
fi

echo "Running Intersklad parser (this can take several minutes)"
docker run --rm \
  --ipc=host \
  -e PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
  -v "${PARSER_DIR}:/work" \
  -w /work \
  "${IMAGE}" \
  bash -lc 'npm install --omit=dev --no-audit --no-fund cheerio@1.2.0 playwright@1.59.1 && node index.js'

if [[ ! -s "${PARSER_DIR}/database.json" ]]; then
  echo "Parser produced no database.json"
  exit 1
fi

API_CID="$(docker compose --env-file .env ps -q api)"
if [[ -z "${API_CID}" ]]; then
  echo "API container is not running"
  exit 1
fi

docker cp "${ROOT}/back/src/scripts/import-parsed-catalog.js" "${API_CID}:/app/src/scripts/import-parsed-catalog.js"
docker cp "${PARSER_DIR}/database.json" "${API_CID}:/tmp/parsed-catalog.json"
docker exec "${API_CID}" mkdir -p /var/data/jaluzi/uploads/products/parser
docker cp "${PARSER_DIR}/images/." "${API_CID}:/var/data/jaluzi/uploads/products/parser/"

docker compose --env-file .env exec -T api \
  env PARSED_JSON=/tmp/parsed-catalog.json \
      PARSED_IMAGES=/var/data/jaluzi/uploads/products/parser \
      node src/scripts/import-parsed-catalog.js

docker compose --env-file .env restart api worker
echo "Catalog import done"
