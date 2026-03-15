#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

cd "${ROOT_DIR}"

npm run drizzle-kit:migrate
npm run seed-users --workspace @workspace/api

echo "Database migrated and seeded"
