# Toolchain 2026

Verified October 2026.

## Required

| Tool | Version | Use |
|---|---|---|
| ImageMagick | 7.1.2-34 | compositing, text, effects, batch, conversion |
| FFmpeg | 9.0.2 | sequences, loops, video, codecs |
| rsvg-convert | 2.63.3 | SVG to raster |
| jq | 1.8.2 | palette JSON/roles |
| Python | 3.11+ | palette/smartcrop helpers |

```bash
# Arch
sudo pacman -S --needed imagemagick ffmpeg librsvg jq
```

## Python

```bash
cd design
./scripts/setup.sh
```

This creates `.venv` and installs Pillow, colorthief and smartcrop.

## Optional

| Tool | Use |
|---|---|
| libvips 8.18 | huge images, thumbnails, smartcrop |
| Real-ESRGAN ncnn Vulkan | 4x upscale |
| ExifTool 13.59 | metadata/copyright |
| oxipng/pngquant/jpegoptim | delivery optimization |
| GIMP/Krita/Inkscape | manual raster/vector editing |

```bash
sudo pacman -S --needed libvips perl-image-exiftool oxipng pngquant \
  jpegoptim potrace gimp krita inkscape fontforge scribus
```

Real-ESRGAN is not in the official repos; use the upstream release or Upscayl.
The pipeline falls back to Lanczos without it.

## GUI/RAW versions (Arch, October 2026)

GIMP 3.2.6 · Krita 6.0.4.1 · Inkscape 1.4.4 · darktable 5.6.2 ·
RawTherapee 5.13 · Blender 5.2.2 · Scribus 1.6.6 · FontForge 20251009.

## Decision matrix

| Task | First choice |
|---|---|
| Compose, text, grain, vignette | ImageMagick |
| 500 thumbnails | libvips `vipsthumbnail` |
| Smart crop | `wallpaper fit --mode smart` |
| Extend 9:16 to 16:9 | `wallpaper extend` |
| Upscale | Real-ESRGAN |
| Palette | `wallpaper palette` |
| Animated gradient | `wallpaper animate` / FFmpeg |
| Metadata | ExifTool |
| SVG layout | SVG + rsvg-convert |

## Verify

```bash
./scripts/wallpaper doctor
```
