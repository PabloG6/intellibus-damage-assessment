#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

DEFAULT_CONFIG="configs/melissa_sample_001.yml"
if [[ $# -eq 0 ]]; then
  CONFIG_PATH="${DEFAULT_CONFIG}"
  STEP="all"
elif [[ $# -eq 1 ]]; then
  if [[ "$1" == *.yml || "$1" == *.yaml || -f "$1" ]]; then
    CONFIG_PATH="$1"
    STEP="all"
  else
    CONFIG_PATH="${DEFAULT_CONFIG}"
    STEP="$1"
  fi
else
  CONFIG_PATH="$1"
  STEP="$2"
fi
MINIFORGE_DIR="${MINIFORGE_DIR:-/Users/pepperpotpoppins/miniforge3}"
BDA_ENV_NAME="${BDA_ENV_NAME:-yardwatch-bda}"
BDA_REPO_DIR="${BDA_REPO_DIR:-/Users/pepperpotpoppins/nodejs/building-damage-assessment}"
ENV_PYTHON="${MINIFORGE_DIR}/envs/${BDA_ENV_NAME}/bin/python"

if [[ ! -x "${ENV_PYTHON}" ]]; then
  echo "BDA python env not found at ${ENV_PYTHON}" >&2
  echo "Run scripts/setup_bda_env.sh first." >&2
  exit 1
fi

if [[ ! -d "${BDA_REPO_DIR}" ]]; then
  echo "BDA repo not found at ${BDA_REPO_DIR}" >&2
  echo "Run scripts/setup_bda_env.sh first or set BDA_REPO_DIR." >&2
  exit 1
fi

export BDA_REPO_DIR
export PYTHONPATH="${BDA_REPO_DIR}:${PYTHONPATH:-}"
export KMP_DUPLICATE_LIB_OK="${KMP_DUPLICATE_LIB_OK:-TRUE}"
export OMP_NUM_THREADS="${OMP_NUM_THREADS:-1}"

eval "$("${ENV_PYTHON}" - <<'PY' "${CONFIG_PATH}"
import os
import sys
import yaml

config_path = sys.argv[1]
with open(config_path, "r", encoding="utf-8") as handle:
    config = yaml.safe_load(handle)

imagery = config["imagery"]["raw_fn"]
experiment_dir = config["experiment_dir"]
output_dir = os.path.join(experiment_dir, config["inference"]["output_subdir"])
image_name = os.path.basename(imagery).replace(".tif", "")
predictions_fn = os.path.join(output_dir, f"{image_name}_predictions.tif")
footprints_fn = config.get("local", {}).get(
    "footprints_fn",
    os.path.join(output_dir, "overture_building_footprints.gpkg"),
)
merged_output_fn = config.get("local", {}).get(
    "merged_output_fn",
    os.path.join(output_dir, f"{config['experiment_name']}_building_damage.gpkg"),
)
overture_release = config.get("local", {}).get("overture_release", "2026-02-18.0")
labels_fn = config["labels"]["fn"]

for key, value in {
    "RAW_FN": imagery,
    "EXPERIMENT_DIR": experiment_dir,
    "OUTPUT_DIR": output_dir,
    "PREDICTIONS_FN": predictions_fn,
    "FOOTPRINTS_FN": footprints_fn,
    "MERGED_OUTPUT_FN": merged_output_fn,
    "OVERTURE_RELEASE": overture_release,
    "LABELS_FN": labels_fn,
}.items():
    print(f'{key}="{value}"')
PY
)"

mkdir -p "${OUTPUT_DIR}" "$(dirname "${FOOTPRINTS_FN}")"

run_validate() {
  "${ENV_PYTHON}" scripts/validate_label_geojson.py --config "${CONFIG_PATH}"
}

run_create_masks() {
  "${ENV_PYTHON}" "${BDA_REPO_DIR}/create_masks.py" --config "${CONFIG_PATH}" --overwrite
}

run_train() {
  "${ENV_PYTHON}" scripts/fine_tune_bda_low_compute.py --config "${CONFIG_PATH}" --overwrite
}

run_infer() {
  "${ENV_PYTHON}" scripts/infer_bda_safe.py --config "${CONFIG_PATH}" --overwrite
}

run_footprints() {
  "${ENV_PYTHON}" scripts/download_overture_footprints.py \
    --input_fn "${RAW_FN}" \
    --output_fn "${FOOTPRINTS_FN}" \
    --release "${OVERTURE_RELEASE}" \
    --overwrite
}

run_merge() {
  "${ENV_PYTHON}" scripts/merge_with_building_footprints_safe.py \
    --footprints_fn "${FOOTPRINTS_FN}" \
    --predictions_fn "${PREDICTIONS_FN}" \
    --output_fn "${MERGED_OUTPUT_FN}"
}

case "${STEP}" in
  validate-labels)
    run_validate
    ;;
  create-masks)
    run_validate
    run_create_masks
    ;;
  train)
    run_train
    ;;
  infer)
    run_infer
    ;;
  footprints)
    run_footprints
    ;;
  merge)
    run_merge
    ;;
  all)
    run_validate
    run_create_masks
    run_train
    run_infer
    run_footprints
    run_merge
    ;;
  *)
    echo "Unknown step: ${STEP}" >&2
    echo "Valid steps: validate-labels, create-masks, train, infer, footprints, merge, all" >&2
    exit 1
    ;;
esac
