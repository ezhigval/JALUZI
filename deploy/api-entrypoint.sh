#!/bin/sh
set -eu

DATA_ROOT="${STORAGE_DIR:-/var/data/jaluzi}"
ROLE="${PROCESS_ROLE:-all}"
mkdir -p "$DATA_ROOT/data" "$DATA_ROOT/uploads/products"

seed_storage() {
  if [ ! -f "$DATA_ROOT/data/db.db" ] && [ ! -f "$DATA_ROOT/data/db.json" ]; then
    if [ -f /app/data/db.seed.json ]; then
      cp /app/data/db.seed.json "$DATA_ROOT/data/db.json"
    fi
  fi

  if [ ! "$(ls -A "$DATA_ROOT/uploads/products" 2>/dev/null || true)" ]; then
    if [ -d /app/src/uploads/products ]; then
      cp -a /app/src/uploads/products/. "$DATA_ROOT/uploads/products/"
    fi
  fi
}

if [ "$ROLE" = "worker" ]; then
  i=0
  while [ ! -f "$DATA_ROOT/data/db.db" ] && [ "$i" -lt 40 ]; do
    i=$((i + 1))
    sleep 1
  done
  if [ ! -f "$DATA_ROOT/data/db.db" ]; then
    seed_storage
  fi
else
  seed_storage
fi

exec node src/index.js
