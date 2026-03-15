#!/usr/bin/env python3
"""Download Overture building footprints for the Melissa sample AOI."""

from __future__ import annotations

import argparse
import os

import fiona
import fiona.transform
import fsspec
import geopandas as gpd
import pyarrow as pa
import pyarrow.compute as pc
import pyarrow.dataset as ds
import pyarrow.fs as fs
import rasterio
import shapely.geometry


DEFAULT_RELEASE = os.environ.get("OVERTURE_RELEASE", "2026-02-18.0")
TYPE_THEME_MAP = {
    "building": "buildings",
}


def set_up_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input_fn", required=True, help="Input AOI file (.tif, .shp, .geojson, .gpkg)")
    parser.add_argument("--output_fn", required=True, help="Output GPKG path")
    parser.add_argument(
        "--release",
        default=DEFAULT_RELEASE,
        help=f"Overture release path to read. Default: {DEFAULT_RELEASE}",
    )
    parser.add_argument("--overwrite", action="store_true", help="Overwrite existing output")
    return parser


def get_coordinates(input_fn: str):
    if input_fn.endswith(".tif"):
        print("Input filename is a GeoTIFF, using the bounds of the file as the AOI")
        with rasterio.open(input_fn) as src:
            shape = shapely.geometry.box(
                src.bounds.left,
                src.bounds.bottom,
                src.bounds.right,
                src.bounds.top,
            )
            crs = src.crs
    else:
        with fiona.open(input_fn) as src:
            crs = src.crs
            geom = next(iter(src))["geometry"]
            shape = shapely.geometry.shape(geom)

    geom = shapely.geometry.mapping(shape)
    warped_geom = fiona.transform.transform_geom(crs, "EPSG:4326", geom)
    return shapely.geometry.shape(warped_geom)


def dataset_path(overture_type: str, release: str) -> str:
    return f"release/{release}/theme={TYPE_THEME_MAP[overture_type]}/type={overture_type}/"


def record_batch_reader(overture_type: str, bbox, release: str) -> pa.RecordBatchReader:
    xmin, ymin, xmax, ymax = bbox
    filter_expression = (
        (pc.field("bbox", "xmin") < xmax)
        & (pc.field("bbox", "xmax") > xmin)
        & (pc.field("bbox", "ymin") < ymax)
        & (pc.field("bbox", "ymax") > ymin)
    )

    path = dataset_path(overture_type, release)
    t_fs = fsspec.filesystem("az", account_name="overturemapswestus2", anon=True)
    pa_fs = fs.PyFileSystem(fs.FSSpecHandler(t_fs))

    try:
        dataset = ds.dataset(path, filesystem=pa_fs)
    except FileNotFoundError as exc:
        raise SystemExit(
            f"Overture release path not found in Azure mirror: {path}\n"
            "Set --release or OVERTURE_RELEASE to a valid release."
        ) from exc

    batches = dataset.to_batches(filter=filter_expression)
    non_empty_batches = (batch for batch in batches if batch.num_rows > 0)

    geometry_field_index = dataset.schema.get_field_index("geometry")
    geometry_field = dataset.schema.field(geometry_field_index)
    schema = dataset.schema.set(
        geometry_field_index,
        geometry_field.with_metadata({b"ARROW:extension:name": b"geoarrow.wkb"}),
    )
    return pa.RecordBatchReader.from_batches(schema, non_empty_batches)


def main(args) -> None:
    if os.path.exists(args.output_fn) and not args.overwrite:
        print(f"Output file exists: {args.output_fn}. Use --overwrite to replace it.")
        return
    if os.path.exists(args.output_fn) and args.overwrite:
        os.remove(args.output_fn)

    shape = get_coordinates(args.input_fn)
    reader = record_batch_reader("building", shape.bounds, args.release)
    footprints = gpd.GeoDataFrame.from_arrow(reader)
    footprints = footprints[["id", "geometry", "subtype", "class"]]
    footprints = footprints[footprints.geometry.geom_type.isin(["Polygon", "MultiPolygon"])]
    footprints.set_crs(epsg=4326, inplace=True)
    os.makedirs(os.path.dirname(args.output_fn), exist_ok=True)
    footprints.to_file(args.output_fn, driver="GPKG")
    print(f"{footprints.shape[0]} building footprints saved to {args.output_fn}")


if __name__ == "__main__":
    parser = set_up_parser()
    main(parser.parse_args())
