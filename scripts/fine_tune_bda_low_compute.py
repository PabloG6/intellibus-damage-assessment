#!/usr/bin/env python3
"""Low-compute training wrapper around Microsoft's building-damage-assessment repo."""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

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

import lightning.pytorch as pl
import torch
from lightning.pytorch.callbacks import ModelCheckpoint
from lightning.pytorch.loggers import TensorBoardLogger

from bda.config import get_args
from bda.datamodules import SegmentationDataModule
from bda.trainers import CustomSemanticSegmentationTask


def add_parser(parser: argparse.ArgumentParser) -> argparse.ArgumentParser:
    parser.add_argument("--bda-repo-dir", type=str, help="Path to the external BDA checkout")
    parser.add_argument("--experiment_dir", type=str, help="Experiment directory")
    parser.add_argument("--experiment_name", type=str, help="Experiment name")
    parser.add_argument("--training.gpu_id", type=int, help="Preferred CUDA GPU id")
    parser.add_argument("--training.batch_size", type=int, help="Batch size")
    parser.add_argument("--training.learning_rate", type=float, help="Learning rate")
    parser.add_argument("--training.max_epochs", type=int, help="Max epochs")
    parser.add_argument("--training.log_dir", type=str, help="TensorBoard log directory")
    parser.add_argument(
        "--training.checkpoint_subdir",
        type=str,
        help="Checkpoint directory name inside experiment_dir",
    )
    parser.add_argument("--training.num_workers", type=int, help="Data loader worker count")
    parser.add_argument(
        "--training.train_batches_per_epoch",
        type=int,
        help="Number of training batches per epoch",
    )
    parser.add_argument(
        "--training.val_batches_per_epoch",
        type=int,
        help="Number of validation batches per epoch",
    )
    parser.add_argument("--training.patch_size", type=int, help="Training patch size")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite checkpoints")
    return parser


def detect_accelerator(preferred_gpu_id: int) -> tuple[str, int | list[int], str]:
    if torch.cuda.is_available():
        return "gpu", [preferred_gpu_id], f"cuda:{preferred_gpu_id}"

    mps_backend = getattr(torch.backends, "mps", None)
    if mps_backend and torch.backends.mps.is_available():
        return "mps", 1, "mps"

    return "cpu", 1, "cpu"


def main() -> None:
    args = get_args(description=__doc__, add_extra_parser=add_parser)

    experiment_dir = args["experiment_dir"]
    images_dir = os.path.join(experiment_dir, "images")
    masks_dir = os.path.join(experiment_dir, "masks")
    if not os.path.exists(images_dir) or not os.path.exists(masks_dir):
        raise SystemExit(
            f"Expected cropped images and masks under {experiment_dir}. "
            "Run create_masks.py first."
        )

    checkpoint_dir = os.path.join(experiment_dir, args["training"]["checkpoint_subdir"])
    if os.path.exists(checkpoint_dir) and os.listdir(checkpoint_dir) and not args["overwrite"]:
        print(
            "Checkpoint directory already contains files. Use --overwrite to retrain."
        )
        return
    os.makedirs(checkpoint_dir, exist_ok=True)

    accelerator, devices, device_label = detect_accelerator(args["training"]["gpu_id"])
    print(f"Using accelerator: {accelerator} ({device_label})")

    datamodule = SegmentationDataModule(
        images_dir,
        masks_dir,
        batch_size=args["training"].get("batch_size", 2),
        patch_size=args["training"].get("patch_size", 256),
        num_workers=args["training"].get("num_workers", 4),
        train_batches_per_epoch=args["training"].get("train_batches_per_epoch", 64),
        val_batches_per_epoch=args["training"].get("val_batches_per_epoch", 16),
        means=args["imagery"]["normalization_means"],
        stds=args["imagery"]["normalization_stds"],
    )

    num_classes = len(args["labels"]["classes"]) + 1
    task = CustomSemanticSegmentationTask(
        model="unet",
        backbone="efficientnet-b3",
        weights=True,
        in_channels=args["imagery"]["num_channels"],
        num_classes=num_classes,
        loss="ce",
        ignore_index=0,
        lr=args["training"]["learning_rate"],
        patience=10,
        use_constraint_loss=args["training"]["use_constraint_loss"],
    )

    checkpoint_callback = ModelCheckpoint(
        monitor="val_loss",
        dirpath=checkpoint_dir,
        save_top_k=2,
        save_last=True,
    )
    logger = TensorBoardLogger(
        save_dir=args["training"]["log_dir"],
        name=args["experiment_name"],
    )

    trainer = pl.Trainer(
        callbacks=[checkpoint_callback],
        logger=[logger],
        min_epochs=1,
        max_epochs=args["training"].get("max_epochs", 10),
        accelerator=accelerator,
        devices=devices,
    )
    trainer.fit(model=task, datamodule=datamodule)


if __name__ == "__main__":
    main()
