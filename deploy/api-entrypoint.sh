#!/bin/sh
set -eu

DATA_ROOT="${STORAGE_DIR:-/var/data/jaluzi}"
mkdir -p "$DATA_ROOT/data" "$DATA_ROOT/uploads/products"

if [ ! -f "$DATA_ROOT/data/db.db" ] && [ ! -f "$DATA_ROOT/data/db.json" ] && [ ! -f "$DATA_ROOT/data/db.json.migrated" ]; then
  if [ -f /app/data/db.seed.json ]; then
    cp /app/data/db.seed.json "$DATA_ROOT/data/db.json"
  fi
fi

if [ ! "$(ls -A "$DATA_ROOT/uploads/products" 2>/dev/null || true)" ]; then
  if [ -d /app/src/uploads/products ]; then
    cp -a /app/src/uploads/products/. "$DATA_ROOT/uploads/products/"
  fi
fi

exec node src/index.js
