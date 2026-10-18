#!/usr/bin/env python3
"""Extract a usable palette from an image: JSON + CSS + GIMP + swatch PNG."""
from __future__ import annotations

import argparse
import colorsys
import json
import re
import sys
from pathlib import Path

from colorthief import ColorThief
from PIL import Image, ImageDraw, ImageFont, ImageOps


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-") or "palette"


def luminance(rgb) -> float:
    r, g, b = (c / 255 for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def saturation(rgb) -> float:
    r, g, b = (c / 255 for c in rgb)
    return colorsys.rgb_to_hsv(r, g, b)[1]


def nearest_share(image: Image.Image, colors):
    small = image.convert("RGB").resize((160, 160))
    pixels = list(small.get_flattened_data() if hasattr(small, 'get_flattened_data') else small.getdata())
    counts = [0] * len(colors)
    for pixel in pixels:
        best, best_dist = 0, 10**9
        for i, color in enumerate(colors):
            dist = sum((pixel[j] - color[j]) ** 2 for j in range(3))
            if dist < best_dist:
                best, best_dist = i, dist
        counts[best] += 1
    total = max(1, len(pixels))
    return [c / total for c in counts]


def roles(colors, dark):
    ordered = sorted(colors, key=luminance)
    bg = ordered[0] if dark else ordered[-1]
    fg = ordered[-1] if dark else ordered[0]
    surface = ordered[1] if dark else ordered[-2]
    accents = sorted(colors, key=saturation, reverse=True)
    return {
        "background": "#%02x%02x%02x" % bg,
        "surface": "#%02x%02x%02x" % surface,
        "text": "#%02x%02x%02x" % fg,
        "accent": "#%02x%02x%02x" % accents[0],
        "accent_2": "#%02x%02x%02x" % accents[1],
    }


def make_preview(name, source, colors, shares, out, dark):
    width = 1600
    cols = min(6, len(colors))
    rows = (len(colors) + cols - 1) // cols
    cell_w, cell_h = width // cols, 220
    height = 170 + rows * cell_h + 40
    img = Image.new("RGB", (width, height), "#0b0b0f")
    draw = ImageDraw.Draw(img)
    def load_font(size, mono=False):
        candidates = (
            ["/usr/share/fonts/TTF/DejaVuSansMono.ttf",
             "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"]
            if mono else
            ["/usr/share/fonts/TTF/DejaVuSans.ttf",
             "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
             "/usr/share/fonts/liberation/LiberationSans-Regular.ttf"]
        )
        for path in candidates:
            if Path(path).exists():
                return ImageFont.truetype(path, size)
        return ImageFont.load_default()

    title_font = load_font(44)
    meta_font = load_font(18, mono=True)
    label_font = load_font(19)
    hex_font = load_font(16, mono=True)
    draw.text((44, 38), name, font=title_font, fill="#f4f4f5")
    draw.text((44, 104), f"{source} · {'dark' if dark else 'light'} · {len(colors)} colors", font=meta_font, fill="#a1a1aa")
    for i, (rgb, share) in enumerate(zip(colors, shares)):
        r, c = divmod(i, cols)
        x, y = 44 + c * (width - 88) // cols, 170 + r * cell_h
        w, h = (width - 88) // cols - 12, cell_h - 12
        hexv = "#%02x%02x%02x" % rgb
        draw.rounded_rectangle((x, y, x + w, y + h), radius=14, fill=hexv)
        ink = "#09090b" if luminance(rgb) > 0.55 else "#fafafa"
        draw.text((x + 16, y + h - 66), f"{share * 100:.1f}%", font=label_font, fill=ink)
        draw.text((x + 16, y + h - 38), hexv.upper(), font=hex_font, fill=ink)
    img.save(out)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("image")
    parser.add_argument("--colors", type=int, default=8)
    parser.add_argument("--out-dir")
    parser.add_argument("--name")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    src = Path(args.image).expanduser().resolve()
    if not src.exists():
        sys.exit(f"not found: {src}")
    out_dir = Path(args.out_dir).expanduser().resolve() if args.out_dir else src.parent / f"{src.stem}-palette"
    out_dir.mkdir(parents=True, exist_ok=True)
    name = args.name or src.stem.replace("-", " ").replace("_", " ").title()
    slug = slugify(name)

    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im)
        width, height = im.size
        dark = luminance(im.convert("RGB").resize((1, 1)).getpixel((0, 0))) < 0.5
        count = max(3, min(args.colors, 16))
        thief = ColorThief(str(src))
        raw = thief.get_palette(color_count=count, quality=5)
        colors = [tuple(c) for c in raw]
        # dedupe while preserving order
        seen, unique = set(), []
        for c in colors:
            if c not in seen:
                seen.add(c)
                unique.append(c)
        colors = unique
        shares = nearest_share(im, colors)
        color_hex = ["#%02x%02x%02x" % c for c in colors]

    data = {
        "name": name,
        "slug": slug,
        "source": str(src),
        "width": width,
        "height": height,
        "dark": dark,
        "colors": [
            {"index": i, "hex": color_hex[i], "rgb": list(colors[i]), "share": round(shares[i], 4)}
            for i in range(len(colors))
        ],
        "roles": roles(colors, dark),
    }
    (out_dir / f"{slug}.json").write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")

    css = [f"/* {name} — extracted from {src.name} */", f'[data-palette="{slug}"] {{']
    for i, c in enumerate(colors):
        css.append(f"  --c{i + 1}: {color_hex[i]};")
    for role, value in data["roles"].items():
        css.append(f"  --{role.replace('_', '-')}: {value};")
    css.append("}")
    (out_dir / f"{slug}.css").write_text("\n".join(css) + "\n", encoding="utf-8")

    gpl = ["GIMP Palette", f"Name: {name}", f"Columns: {min(8, len(colors))}", "# extracted by design-arsenal"]
    for i, c in enumerate(colors):
        gpl.append(f"{c[0]:3d} {c[1]:3d} {c[2]:3d}\tc{i + 1} {color_hex[i]}")
    (out_dir / f"{slug}.gpl").write_text("\n".join(gpl) + "\n", encoding="utf-8")

    (out_dir / f"{slug}.hex").write_text("\n".join(color_hex) + "\n", encoding="utf-8")
    make_preview(name, src.name, colors, shares, out_dir / f"{slug}.png", dark)
    if args.json:
        print(json.dumps(data, indent=2))
    else:
        print(str(out_dir))
    return 0


if __name__ == "__main__":
    sys.exit(main())
