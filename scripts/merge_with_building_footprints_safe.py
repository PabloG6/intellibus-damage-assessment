#!/usr/bin/env python3
"""Safe merge wrapper for building footprints and damage predictions."""

from __future__ import annotations

import argparse
import os
from typing import Iterable

import fiona
import fiona.transform
import numpy as np
import rasterio
import rasterio.mask
import shapely.geometry
import shapely.ops
from pyproj import CRS, Transformer
from tqdm import tqdm


def set_up_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--footprints_fn", type=str, required=True, help="Path to the footprint file")
    parser.add_argument("--predictions_fn", type=str, required=True, help="Path to the prediction file")
    parser.add_argument("--output_fn", type=str, required=True, help="Path to the output file")
    return parser


def estimate_utm_crs(bounds: rasterio.coords.BoundingBox) -> CRS:
    center_lon = (bounds.left + bounds.right) / 2
    center_lat = (bounds.bottom + bounds.top) / 2
    zone = int((center_lon + 180) // 6) + 1
    epsg = 32600 + zone if center_lat >= 0 else 32700 + zone
    return CRS.from_epsg(epsg)


def count_classes(mask: np.ndarray) -> dict[int, int]:
    vals, counts = np.unique(mask, return_counts=True)
    return {int(v): int(c) for v, c in zip(vals, counts)}


def nonzero_count(val_counts: dict[int, int]) -> int:
    return sum(v for k, v in val_counts.items() if k != 0)


def fractions_from_counts(val_counts: dict[int, int]) -> tuple[float, float, float]:
    total = nonzero_count(val_counts)
    if total == 0:
        return 0.0, 0.0, 0.0

    damaged = min(val_counts.get(3, 0) / total, 1.0)
    built = min(val_counts.get(2, 0) / total, 1.0)
    unknown = min(val_counts.get(4, 0) / total, 1.0)
    return damaged, built, unknown


def transform_geometry(geom: dict, src_crs: str, dst_crs: str) -> dict:
    if src_crs == dst_crs:
        return geom
    return fiona.transform.transform_geom(src_crs, dst_crs, geom)


def buffered_geom_in_raster_crs(
    shape: shapely.geometry.base.BaseGeometry,
    buffer_meters: float,
    raster_crs: CRS,
    metric_crs: CRS,
    to_metric: Transformer | None,
    to_raster: Transformer | None,
) -> shapely.geometry.base.BaseGeometry:
    if buffer_meters == 0:
        return shape

    if raster_crs == metric_crs:
        return shape.buffer(buffer_meters)

    assert to_metric is not None and to_raster is not None
    metric_shape = shapely.ops.transform(to_metric.transform, shape)
    buffered_metric_shape = metric_shape.buffer(buffer_meters)
    return shapely.ops.transform(to_raster.transform, buffered_metric_shape)


def mask_counts(
    dataset: rasterio.io.DatasetReader,
    geom: shapely.geometry.base.BaseGeometry,
) -> dict[int, int]:
    try:
        masked, _ = rasterio.mask.mask(
            dataset,
            [shapely.geometry.mapping(geom)],
            crop=True,
            nodata=0,
            filled=True,
        )
    except ValueError:
        return {}

    return count_classes(masked)


def main(args: argparse.Namespace) -> None:
    with rasterio.open(args.predictions_fn, "r") as predictions_ds:
        predictions_crs = CRS.from_user_input(predictions_ds.crs)
        predictions_crs_str = predictions_crs.to_string()
        prediction_bounds = predictions_ds.bounds

    with fiona.open(args.footprints_fn, "r") as footprints_ds:
        footprints_crs = CRS.from_user_input(footprints_ds.crs)
        footprints_crs_str = footprints_crs.to_string()

    metric_crs = predictions_crs if not predictions_crs.is_geographic else estimate_utm_crs(prediction_bounds)
    to_metric = None
    to_raster = None
    if metric_crs != predictions_crs:
        to_metric = Transformer.from_crs(predictions_crs, metric_crs, always_xy=True)
        to_raster = Transformer.from_crs(metric_crs, predictions_crs, always_xy=True)

    building_geoms: list[dict] = []
    building_ids: list[str] = []
    with fiona.open(args.footprints_fn, "r") as footprints_ds:
        for row in tqdm(footprints_ds, desc="Loading footprints"):
            projected_geom = transform_geometry(
                row["geometry"], footprints_crs_str, predictions_crs_str
            )
            building_geoms.append(projected_geom)
            building_ids.append(row["properties"]["id"])

    schema = {
        "geometry": "MultiPolygon",
        "properties": {
            "id": "str",
            "damage_pct_0m": "float",
            "damage_pct_10m": "float",
            "damage_pct_20m": "float",
            "built_pct_0m": "float",
            "damaged": "int",
            "unknown_pct": "float",
        },
    }

    if os.path.exists(args.output_fn):
        os.remove(args.output_fn)

    rows = []
    print(f"Reading predictions from {args.predictions_fn}")
    with rasterio.open(args.predictions_fn, "r") as predictions_ds:
        for building_id, geom in tqdm(
            zip(building_ids, building_geoms),
            total=len(building_geoms),
            desc="Merging predictions",
        ):
            shape = shapely.geometry.shape(geom)
            damage_vals = []
            built_vals = []
            unknown_pct = 0.0

            for i, buffer_m in enumerate((0, 10, 20)):
                buffered_shape = buffered_geom_in_raster_crs(
                    shape,
                    buffer_meters=buffer_m,
                    raster_crs=predictions_crs,
                    metric_crs=metric_crs,
                    to_metric=to_metric,
                    to_raster=to_raster,
                )
                val_counts = mask_counts(predictions_ds, buffered_shape)
                damaged_pct, built_pct, current_unknown_pct = fractions_from_counts(val_counts)
                damage_vals.append(damaged_pct)
                built_vals.append(built_pct)
                if i == 0:
                    unknown_pct = current_unknown_pct

            output_geom = geom
            if geom["type"] == "Polygon":
                output_geom = shapely.geometry.mapping(
                    shapely.geometry.MultiPolygon([shape])
                )

            rows.append(
                {
                    "type": "Feature",
                    "geometry": output_geom,
                    "properties": {
                        "id": building_id,
                        "damage_pct_0m": damage_vals[0],
                        "damage_pct_10m": damage_vals[1],
                        "damage_pct_20m": damage_vals[2],
                        "built_pct_0m": built_vals[0],
                        "damaged": 1 if damage_vals[0] > 0 else 0,
                        "unknown_pct": unknown_pct,
                    },
                }
            )

    print("Writing output file...")
    with fiona.open(
        args.output_fn, "w", driver="GPKG", crs=predictions_crs_str, schema=schema
    ) as dst:
        dst.writerecords(rows)

    print(f"Output written to {args.output_fn}")


if __name__ == "__main__":
    parser = set_up_parser()
    main(parser.parse_args())
