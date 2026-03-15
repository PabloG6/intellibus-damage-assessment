# Melissa Single-Tile Pipeline

This repo now includes a conservative first-pass workflow for Microsoft's building damage assessment toolkit, using one local Melissa tile:

- Sample tile: `.maps/20251104b_RGB/20251104bC0780815w181845n.tif`
- Config: `configs/melissa_sample_001.yml`
- Labels: `data/labels/melissa_sample_001.geojson`

## What is tracked here

- A pinned external checkout path for Microsoft's repo
- A Miniforge-based Python 3.10 setup script
- A low-compute fine-tuning wrapper with device auto-selection
- A label validator
- A local Overture footprint downloader with a configurable release path
- A single command runner for masks, training, inference, footprints, and merge

## Commands

Set up the external repo and conda environment:

```bash
scripts/setup_bda_env.sh
```

Validate labels:

```bash
scripts/run_melissa_pipeline.sh configs/melissa_sample_001.yml validate-labels
```

Run the full first-pass pipeline:

```bash
scripts/run_melissa_pipeline.sh configs/melissa_sample_001.yml all
```

## Outputs

Expected first-pass outputs under `experiments/melissa_sample_001/outputs/`:

- `*_predictions.tif`
- `overture_building_footprints.gpkg`
- `melissa_sample_001_building_damage.gpkg`

The merged GeoPackage is the file to inspect first when deciding what a future database schema should look like.
