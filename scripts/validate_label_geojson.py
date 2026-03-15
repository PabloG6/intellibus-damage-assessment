#!/usr/bin/env python3
"""Validate the local Melissa GeoJSON labels before running create_masks.py."""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path


def load_config_path(config_path: Path) -> tuple[Path, list[str]]:
    try:
        import yaml
    except ImportError:
        return load_config_path_without_yaml(config_path)

    with config_path.open("r", encoding="utf-8") as handle:
        config = yaml.safe_load(handle)

    labels_path = Path(config["labels"]["fn"])
    classes = list(config["labels"]["classes"])
    return labels_path, classes


def load_config_path_without_yaml(config_path: Path) -> tuple[Path, list[str]]:
    labels_path: Path | None = None
    classes: list[str] = []
    in_labels = False
    in_classes = False

    for raw_line in config_path.read_text(encoding="utf-8").splitlines():
        if not raw_line.strip() or raw_line.lstrip().startswith("#"):
            continue

        indent = len(raw_line) - len(raw_line.lstrip(" "))
        stripped = raw_line.strip()

        if indent == 0 and stripped == "labels:":
            in_labels = True
            in_classes = False
            continue

        if indent == 0 and stripped.endswith(":") and stripped != "labels:":
            in_labels = False
            in_classes = False

        if not in_labels:
            continue

        if indent == 2 and stripped.startswith("fn:"):
            value = stripped.split(":", 1)[1].strip().strip('"').strip("'")
            labels_path = Path(value)
            continue

        if indent == 2 and stripped == "classes:":
            in_classes = True
            continue

        if indent <= 2 and stripped != "classes:":
            in_classes = False

        if in_classes and indent >= 4:
            match = re.match(r"-\s+(.*)$", stripped)
            if match:
                classes.append(match.group(1).strip().strip('"').strip("'"))

    if labels_path is None or not classes:
        raise SystemExit(
            "Could not parse labels.fn or labels.classes from config without PyYAML."
        )
    return labels_path, classes


def is_valid_geometry(feature: dict) -> bool:
    geometry = feature.get("geometry")
    if not isinstance(geometry, dict):
        return False
    geometry_type = geometry.get("type")
    coordinates = geometry.get("coordinates")
    return geometry_type in {"Polygon", "MultiPolygon"} and coordinates is not None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", required=True, help="Path to the Melissa config YAML")
    args = parser.parse_args()

    config_path = Path(args.config)
    labels_path, allowed_classes = load_config_path(config_path)

    if not labels_path.exists():
        print(f"Label file not found: {labels_path}", file=sys.stderr)
        print(
            "Create a local GeoJSON file at that path before running create_masks.py.",
            file=sys.stderr,
        )
        return 1

    with labels_path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)

    if payload.get("type") != "FeatureCollection":
        print("GeoJSON root must be a FeatureCollection.", file=sys.stderr)
        return 1

    features = payload.get("features")
    if not isinstance(features, list) or not features:
        print("GeoJSON must contain at least one feature.", file=sys.stderr)
        return 1

    invalid_geometry_indices: list[int] = []
    missing_class_indices: list[int] = []
    invalid_classes: Counter[str] = Counter()
    class_counts: Counter[str] = Counter()

    for idx, feature in enumerate(features):
        if not isinstance(feature, dict) or feature.get("type") != "Feature":
            invalid_geometry_indices.append(idx)
            continue

        if not is_valid_geometry(feature):
            invalid_geometry_indices.append(idx)

        properties = feature.get("properties")
        if not isinstance(properties, dict) or "class" not in properties:
            missing_class_indices.append(idx)
            continue

        class_name = properties["class"]
        if class_name not in allowed_classes:
            invalid_classes[str(class_name)] += 1
        else:
            class_counts[class_name] += 1

    if invalid_geometry_indices:
        print(
            f"Invalid or missing polygon geometry for feature indices: {invalid_geometry_indices[:10]}",
            file=sys.stderr,
        )
        return 1

    if missing_class_indices:
        print(
            f"Missing `class` property for feature indices: {missing_class_indices[:10]}",
            file=sys.stderr,
        )
        return 1

    if invalid_classes:
        print(
            f"Unexpected class values found: {dict(invalid_classes)}. Allowed values: {allowed_classes}",
            file=sys.stderr,
        )
        return 1

    print(f"Validated {len(features)} features in {labels_path}")
    for class_name in allowed_classes:
        print(f"  {class_name}: {class_counts.get(class_name, 0)}")

    if len(features) < 20:
        print("Warning: fewer than 20 labeled polygons. The first pass may be very weak.", file=sys.stderr)
    if len(features) > 40:
        print("Warning: more than 40 polygons. This exceeds the original low-compute v1 target.", file=sys.stderr)

    missing_classes = [class_name for class_name in allowed_classes if class_counts.get(class_name, 0) == 0]
    if missing_classes:
        print(f"Warning: missing classes in labels: {missing_classes}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
