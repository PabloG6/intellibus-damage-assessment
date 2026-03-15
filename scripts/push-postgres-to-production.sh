#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

load_env_file() {
  local env_file="$1"

  if [ -f "${env_file}" ]; then
    set -a
    # shellcheck disable=SC1090
    source "${env_file}"
    set +a
  fi
}

require_command() {
  local command_name="$1"

  if ! command -v "${command_name}" >/dev/null 2>&1; then
    echo "${command_name} is required but was not found on PATH" >&2
    exit 1
  fi
}

load_env_file "${ROOT_DIR}/packages/db/.env.local"

SOURCE_DATABASE_URL="${SOURCE_DATABASE_URL:-${CONTROL_PLANE_DATABASE_URL:-${DATABASE_URL:-}}}"
TARGET_DATABASE_URL="${TARGET_DATABASE_URL:-${PRODUCTION_DATABASE_URL:-}}"

if [ -z "${SOURCE_DATABASE_URL}" ]; then
  echo "Set SOURCE_DATABASE_URL or provide DATABASE_URL/CONTROL_PLANE_DATABASE_URL in packages/db/.env.local" >&2
  exit 1
fi

if [ -z "${TARGET_DATABASE_URL}" ]; then
  echo "Set TARGET_DATABASE_URL (or PRODUCTION_DATABASE_URL) to the production Postgres URL" >&2
  exit 1
fi

if [ "${SOURCE_DATABASE_URL}" = "${TARGET_DATABASE_URL}" ]; then
  echo "Source and target database URLs are identical; aborting" >&2
  exit 1
fi

require_command pg_dump
require_command psql

dump_args=(
  --no-owner
  --no-privileges
  --exclude-schema=drizzle
  --format=plain
)

if [ "${DATA_ONLY:-false}" = "true" ]; then
  dump_args+=(
    --data-only
    --table=public.users
    --table=public.otp_codes
    --table=public.sessions
    --table=public.incidents
  )
else
  dump_args+=(
    --clean
    --if-exists
  )
fi

echo "Copying schema and data into the target database..."
pg_dump \
  "${dump_args[@]}" \
  "${SOURCE_DATABASE_URL}" \
  | psql "${TARGET_DATABASE_URL}"

echo "Production database copy complete"
