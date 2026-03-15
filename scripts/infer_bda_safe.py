#!/usr/bin/env python3
"""Low-compute inference wrapper for Microsoft's building-damage-assessment repo."""

from __future__ import annotations

import argparse
import math
import os
import sys
import time
from pathlib import Path

import numpy as np

os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")
os.environ.setdefault("OMP_NUM_THREADS", "1")


def default_bda_repo_dir() -> str:
    return os.environ.get(
        "BDA_REPO_DIR",
        "/Users/pepperpotpoppins/nodejs/building-damage-assessment",
    )


def inject_bda_repo_into_path() -> None:
    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument("--bda-repo-dir", default=default_bda_repo_dir())
    args, _ = parser.parse_known_args()

    repo_dir = Path(args.bda_repo_dir).expanduser().resolve()
    if not repo_dir.exists():
        raise SystemExit(
            f"BDA repo directory does not exist: {repo_dir}\n"
            "Run scripts/setup_bda_env.sh first or set BDA_REPO_DIR."
        )
    if str(repo_dir) not in sys.path:
        sys.path.insert(0, str(repo_dir))


inject_bda_repo_into_path()

import rasterio
import torch
import tqdm
from rasterio.enums import ColorInterp
from torch.utils.data import DataLoader

from bda.config import get_args
from bda.datasets import TileDataset, stack_samples
from bda.preprocess import Preprocessor
from bda.samplers import GridGeoSampler
from bda.trainers import CustomSemanticSegmentationTask


def add_parser(parser: argparse.ArgumentParser) -> argparse.ArgumentParser:
    parser.add_argument("--bda-repo-dir", type=str, help="Path to the external BDA checkout")
    parser.add_argument(
        "--inference.checkpoint_fn",
        type=str,
        help="Model checkpoint to load, defaults to `last.ckpt` in the training checkpoints directory",
    )
    parser.add_argument(
        "--inference.output_subdir",
        type=str,
        help="Subdirectory to save outputs in, defaults to `outputs/` in the experiment directory",
    )
    parser.add_argument("--inference.gpu_id", type=int, help="Preferred CUDA GPU id")
    parser.add_argument("--inference.patch_size", type=int, help="Inference patch size")
    parser.add_argument("--inference.batch_size", type=int, help="Inference batch size")
    parser.add_argument("--inference.padding", type=int, help="Prediction padding in pixels")
    parser.add_argument(
        "--inference.num_workers",
        type=int,
        help="Data loader worker count",
    )
    parser.add_argument("--overwrite", action="store_true", help="Overwrite outputs")
    return parser


def detect_device(preferred_gpu_id: int) -> torch.device:
    if torch.cuda.is_available():
        return torch.device(f"cuda:{preferred_gpu_id}")

    mps_backend = getattr(torch.backends, "mps", None)
    if mps_backend and torch.backends.mps.is_available():
        return torch.device("mps")

    return torch.device("cpu")


def build_output_profile(src: rasterio.io.DatasetReader, width: int, height: int) -> dict:
    def tile_size(length: int) -> int:
        if length >= 512:
            return 512
        return max(16, (length // 16) * 16)

    return {
        "driver": "GTiff",
        "width": width,
        "height": height,
        "count": 1,
        "dtype": "uint8",
        "crs": src.crs,
        "transform": src.transform,
        "compress": "lzw",
        "predictor": 2,
        "nodata": 0,
        "tiled": True,
        "blockxsize": tile_size(width),
        "blockysize": tile_size(height),
        "BIGTIFF": "IF_SAFER",
    }


def main() -> None:
    args = get_args(description=__doc__, add_extra_parser=add_parser)

    input_model_checkpoint = os.path.join(
        args["experiment_dir"], args["inference"]["checkpoint_fn"]
    )
    input_image_fn = args["imagery"]["raw_fn"]
    patch_size = args["inference"]["patch_size"]
    padding = args["inference"]["padding"]
    output_dir = os.path.join(
        args["experiment_dir"], args["inference"]["output_subdir"]
    )

    assert os.path.exists(input_model_checkpoint), input_model_checkpoint
    assert input_model_checkpoint.endswith(".ckpt")
    assert os.path.exists(input_image_fn), input_image_fn
    assert input_image_fn.endswith(".tif") or input_image_fn.endswith(".vrt")
    assert int(math.log(patch_size, 2)) == math.log(patch_size, 2)

    image_name = os.path.basename(input_image_fn).replace(".tif", "")
    output_fn = os.path.join(output_dir, f"{image_name}_predictions.tif")
    if os.path.exists(output_fn) and not args["overwrite"]:
        print("Prediction output already exists. Use --overwrite to replace it.")
        return
    os.makedirs(output_dir, exist_ok=True)

    if os.path.exists(output_fn) and args["overwrite"]:
        os.remove(output_fn)

    stride = patch_size - padding * 2
    device = detect_device(args["inference"]["gpu_id"])
    num_workers = args["inference"].get("num_workers", 4)

    print(f"Using device: {device}")
    print(f"Loading checkpoint: {input_model_checkpoint}")

    task = CustomSemanticSegmentationTask.load_from_checkpoint(
        input_model_checkpoint, map_location="cpu"
    )
    task.freeze()
    model = task.model.eval().to(device)

    preprocess = Preprocessor(
        training_mode=False,
        means=args["imagery"]["normalization_means"],
        stds=args["imagery"]["normalization_stds"],
    )

    dataset = TileDataset([[input_image_fn]], mask_fns=None, transforms=preprocess)
    sampler = GridGeoSampler(
        [[input_image_fn]], [0], patch_size=patch_size, stride=stride
    )
    dataloader = DataLoader(
        dataset,
        sampler=sampler,
        batch_size=args["inference"]["batch_size"],
        num_workers=num_workers,
        collate_fn=stack_samples,
    )

    with rasterio.open(input_image_fn) as src:
        input_height, input_width = src.shape
        output_profile = build_output_profile(src, input_width, input_height)

    print(f"Input size: {input_height} x {input_width}")
    output = np.zeros((input_height, input_width), dtype=np.uint8)

    tic = time.time()
    for batch in tqdm.tqdm(dataloader):
        images = batch["image"].to(device)
        x_coords = batch["x"]
        y_coords = batch["y"]
        with torch.inference_mode():
            predictions = model(images)
            predictions = predictions.argmax(axis=1).cpu().numpy().astype(np.uint8)

        for i in range(images.shape[0]):
            pred = predictions[i]
            height, width = pred.shape
            y = int(y_coords[i])
            x = int(x_coords[i])
            output[
                y + padding : y + height - padding,
                x + padding : x + width - padding,
            ] = pred[padding:-padding, padding:-padding]

    print(f"Finished running model in {time.time() - tic:0.2f} seconds")

    tic = time.time()
    with rasterio.open(output_fn, "w", **output_profile) as dst:
        dst.write(output, 1)
        dst.write_colormap(
            1,
            {
                1: (0, 0, 0, 0),
                2: (0, 255, 0, 255),
                3: (255, 0, 0, 255),
            },
        )
        dst.colorinterp = [ColorInterp.palette]

    print(f"Finished saving predictions in {time.time() - tic:0.2f} seconds")
    print(f"Wrote predictions to {output_fn}")


if __name__ == "__main__":
    main()
