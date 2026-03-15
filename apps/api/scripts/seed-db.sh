#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

load_env_file() {
  local env_file="$1"

  if [ -f "${env_file}" ]; then
    set -a
    # shellcheck disable=SC1090
    source "${env_file}"
    set +a
  fi
}

cd "${ROOT_DIR}"

load_env_file "${ROOT_DIR}/packages/db/.env.local"
load_env_file "${ROOT_DIR}/apps/web/.env.local"

npm run drizzle-kit:migrate
npm run seed-users --workspace @workspace/api
npm run seed-incidents --workspace @workspace/api

if [ -n "${GOOGLE_MAPS_API_KEY:-}" ]; then
  npm run enrich-incidents --workspace @workspace/api
else
  echo "GOOGLE_MAPS_API_KEY not set; skipping incident address enrichment"
fi

echo "Database migrated and seeded"
