Place the local label file here as:

`data/labels/melissa_sample_001.geojson`

Requirements for the first-pass Melissa pipeline:

- GeoJSON `FeatureCollection`
- Polygon or MultiPolygon features
- Every feature must have a `class` property
- Allowed `class` values:
  - `Background`
  - `Building`
  - `Damaged Building`

The validator script will check schema and class names before mask creation:

```bash
python3 scripts/validate_label_geojson.py --config configs/melissa_sample_001.yml
```
