#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MINIFORGE_DIR="${MINIFORGE_DIR:-/Users/pepperpotpoppins/miniforge3}"
BDA_REPO_DIR="${BDA_REPO_DIR:-/Users/pepperpotpoppins/nodejs/building-damage-assessment}"
BDA_ENV_NAME="${BDA_ENV_NAME:-yardwatch-bda}"
BDA_COMMIT="63cd3c45041368c51b37c43a8fbadbb0370c4e8f"
INSTALLER_URL="https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-MacOSX-arm64.sh"
INSTALLER_PATH="/tmp/Miniforge3-MacOSX-arm64.sh"

if [[ ! -x "${MINIFORGE_DIR}/bin/conda" ]]; then
  echo "Installing Miniforge to ${MINIFORGE_DIR}"
  curl -fsSL "${INSTALLER_URL}" -o "${INSTALLER_PATH}"
  bash "${INSTALLER_PATH}" -b -p "${MINIFORGE_DIR}"
fi

if [[ ! -d "${BDA_REPO_DIR}/.git" ]]; then
  echo "Cloning microsoft/building-damage-assessment into ${BDA_REPO_DIR}"
  git clone https://github.com/microsoft/building-damage-assessment.git "${BDA_REPO_DIR}"
fi

echo "Checking out pinned BDA commit ${BDA_COMMIT}"
git -C "${BDA_REPO_DIR}" fetch --all --tags
git -C "${BDA_REPO_DIR}" checkout "${BDA_COMMIT}"

if ! "${MINIFORGE_DIR}/bin/conda" env list | grep -qE "^${BDA_ENV_NAME}[[:space:]]"; then
  echo "Creating conda environment ${BDA_ENV_NAME}"
  "${MINIFORGE_DIR}/bin/conda" config --set channel_priority flexible >/dev/null 2>&1 || true
  "${MINIFORGE_DIR}/bin/mamba" env create -n "${BDA_ENV_NAME}" -f "${BDA_REPO_DIR}/environment.yml"
else
  echo "Conda environment ${BDA_ENV_NAME} already exists"
fi

ENV_PYTHON="${MINIFORGE_DIR}/envs/${BDA_ENV_NAME}/bin/python"
if [[ ! -x "${ENV_PYTHON}" ]]; then
  echo "Expected python not found at ${ENV_PYTHON}" >&2
  exit 1
fi

echo "Installing repo-local helpers into ${BDA_ENV_NAME}"
"${ENV_PYTHON}" -m pip install --upgrade pip
"${ENV_PYTHON}" -m pip install pyyaml

cat <<EOF
Setup complete.

Miniforge: ${MINIFORGE_DIR}
BDA repo:   ${BDA_REPO_DIR}
Env name:   ${BDA_ENV_NAME}
Python:     ${ENV_PYTHON}

Next steps:
  1. Create labels at data/labels/melissa_sample_001.geojson
  2. Run scripts/run_melissa_pipeline.sh all
EOF
