# Toolchain (verified October 2026)

## Required

- ImageMagick 7.1.2 (`magick`): composition, effects, text, batch.
- FFmpeg 9.0: sequences, animation, codecs.
- rsvg-convert 2.63: SVG rasterization.
- jq 1.8: JSON for palette roles.
- Python 3.11+ with Pillow, colorthief, smartcrop (`scripts/setup.sh`).

## Optional

- libvips 8.18: huge images, thumbnails, smartcrop.
- Real-ESRGAN ncnn Vulkan: 4x upscale on GPU.
- ExifTool 13.59: metadata and copyright.
- oxipng, pngquant, jpegoptim: delivery optimization.
- GIMP/Krita/Inkscape: manual raster/vector editing.

## Arch packages

```bash
sudo pacman -S --needed imagemagick ffmpeg librsvg jq \
  libvips perl-image-exiftool oxipng pngquant jpegoptim potrace \
  gimp krita inkscape fontforge scribus
```

Real-ESRGAN is not in the official repos; use the upstream release
`realesrgan-ncnn-vulkan-20220424-ubuntu.zip` or Upscayl. The pack works without
it (Lanczos fallback).

## Environment

`scripts/setup.sh` creates `design/.venv` and installs the Python requirements.
The `wallpaper` CLI prefers `.venv`, then `$PYTHON`, then `python3`.

## Versions

- GIMP 3.2.6, Krita 6.0.4.1, Inkscape 1.4.4, darktable 5.6.2,
  RawTherapee 5.13, Blender 5.2.2, Scribus 1.6.6, FontForge 20251009.
- Fonts (upstream): Inter, JetBrains Mono, Space Grotesk, Fraunces,
  Bricolage Grotesque, Manrope, Outfit, Instrument Serif, Libre Franklin, Sora,
  Archivo, DM Sans. All OFL 1.1.
