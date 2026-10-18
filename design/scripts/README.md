# Scripts

| File | Purpose |
|---|---|
| `wallpaper` | Portable image pipeline: inspect, palette, fit, extend, upscale, optimize, batch, contact, animate, ratios, doctor |
| `wa_palette.py` | Palette extraction (JSON, CSS, GPL, HEX, swatch) |
| `wa_smartcrop.py` | Content-aware crop with smartcrop.py |
| `setup.sh` | Create `design/.venv` and install Python requirements |
| `requirements.txt` | Pillow, colorthief, smartcrop |

## Setup

```bash
cd design
./scripts/setup.sh
./scripts/wallpaper doctor
```

The CLI prefers `design/.venv`, then `$PYTHON`, then `python3`.
It uses system `magick`, `ffmpeg`, `rsvg-convert`, `jq`; optional `vips`,
`realesrgan-ncnn-vulkan`, `exiftool`, `oxipng` are used when present.

## Examples

```bash
./scripts/wallpaper palette photo.jpg --colors 8 --out photo-palette
./scripts/wallpaper fit photo.jpg --size 3840x2160 --mode smart --out wide.jpg
./scripts/wallpaper extend photo.jpg --size 3840x2160 --method blur \
  --scale 0.92 --grain --vignette --out desktop.jpg
./scripts/wallpaper upscale photo.jpg --scale 4 --out photo-4x.png
./scripts/wallpaper batch ./photos --preset desktop-4k --out ./desktop
```

No binaries are bundled. Install the optional tools from `docs/toolchain-2026.md`.
