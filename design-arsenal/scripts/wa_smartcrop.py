#!/usr/bin/env python3
"""Content-aware crop with smartcrop.py, honoring EXIF orientation."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from PIL import Image, ImageOps
from smartcrop import SmartCrop


def parse_size(value: str):
    try:
        w, h = value.lower().split("x", 1)
        return int(w), int(h)
    except Exception:
        raise argparse.ArgumentTypeError("expected WIDTHxHEIGHT, e.g. 3840x2160")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("image")
    parser.add_argument("--size", type=parse_size, required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--quality", type=int, default=92)
    parser.add_argument("--upscale", action="store_true")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    src = Path(args.image).expanduser().resolve()
    out = Path(args.out).expanduser().resolve()
    if not src.exists():
        sys.exit(f"not found: {src}")

    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im).convert("RGB")
        target_w, target_h = args.size
        result = SmartCrop().crop(im, target_w, target_h)
        top = result["top_crop"]
        box = (top["x"], top["y"], top["x"] + top["width"], top["y"] + top["height"])
        cropped = im.crop(box)
        if cropped.size != (target_w, target_h) or args.upscale:
            cropped = cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)
        out.parent.mkdir(parents=True, exist_ok=True)
        suffix = out.suffix.lower()
        save_args = {"quality": args.quality, "optimize": True}
        if suffix in (".jpg", ".jpeg"):
            cropped.save(out, "JPEG", **save_args)
        elif suffix == ".webp":
            cropped.save(out, "WEBP", **save_args)
        else:
            cropped.save(out, **save_args)
        info = {
            "source": str(src),
            "source_size": im.size,
            "target": [target_w, target_h],
            "crop": {"x": box[0], "y": box[1], "width": box[2] - box[0], "height": box[3] - box[1]},
            "output": str(out),
        }
    if args.json:
        print(json.dumps(info, indent=2))
    else:
        print(str(out))
    return 0


if __name__ == "__main__":
    sys.exit(main())
