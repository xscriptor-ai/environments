# 01 — Image toolchain

## What you need

| Tool | Version (2026) | Use |
|---|---|---|
| ImageMagick | 7.1.2-34 | compositing, text, effects, batch, conversion |
| FFmpeg | 9.0.2 | sequences, animation, video, frames, codecs |
| libvips | 8.18.7 | huge images, thumbnails, smartcrop, low memory |
| Real-ESRGAN | ncnn Vulkan 2022 | 4x upscale/restore on GPU |
| ExifTool | 13.59 | metadata, copyright, rename |
| Python | 3.11+ | Pillow, colorthief, smartcrop, pyvips |
| rsvg-convert | 2.63.3 | SVG to PNG/WebP |
| oxipng | 10.2.1 | lossless PNG optimization |

The full local design-arsenal installs these under `tools/` and exposes wrappers.
This repository edition uses system tools plus `scripts/setup.sh` for Python
dependencies. The `scripts/wallpaper` CLI prefers `design-arsenal/.venv`, then `$PYTHON`,
then `python3`.

## What each tool is best at

### ImageMagick

- One-shot compositions: resize, crop, extent, composite, masks, text, shadows.
- Filters: blur, noise, grain, vignette, distort, morphology, color grading.
- Batch with `mogrify` or a shell loop.
- Reading and writing almost every format.
- Weakness: memory-heavy on very large images; slower than libvips for
  thumbnails; complex text layout is awkward.

### libvips

- Streaming processing: a 20,000 px image without loading it all into RAM.
- `vips thumbnail`, `vips smartcrop`, `vips dzsave`, `vips webpsave`.
- Great for batch thumbnails and proxy generation.
- Weakness: fewer artistic filters; no text layout; build-dependent format
  support.

### FFmpeg

- Image sequences to video and back, animated gradients, loops, grain, vignette.
- Codec/format conversion and compression.
- Extract frames for reference sheets.
- Weakness: still-image compositing is possible but awkward.

### Python (Pillow + smartcrop + colorthief + pyvips)

- Palette extraction with shares and roles.
- Content-aware crop.
- Custom logic, batch manifests, contact sheets.
- pyvips gives programmatic access to libvips.

### Real-ESRGAN

- 4x upscale when the source is too small for the target canvas.
- Models: `realesrgan-x4plus` (general), `realesrgan-x4plus-anime`,
  `realesr-animevideov3`.
- Use `-t 256` to keep VRAM bounded; it runs on NVIDIA GPUs via Vulkan.
- Upscaling is not a substitute for a good source: artifacts get amplified.

### ExifTool

- Read/write EXIF, IPTC, XMP, GPS, copyright, artist, license.
- Rename/organize by date/camera.
- Strip metadata for privacy or keep it for attribution.

## Decision matrix

| Task | First choice | Why |
|---|---|---|
| Resize/crop a single image | ImageMagick | simple, precise |
| 500 thumbnails | libvips `vipsthumbnail` | fast, low memory |
| Smart crop | `scripts/wallpaper fit --mode smart` | smartcrop heuristic |
| Extend 9:16 to 16:9 | `scripts/wallpaper extend` | composited background + subject |
| Upscale a mobile image | `scripts/wallpaper upscale` | Real-ESRGAN |
| Palette from a photo | `scripts/wallpaper palette` | JSON/CSS/GPL + roles |
| Grain/vignette/scrim | ImageMagick | compositing |
| Animated gradient | `scripts/wallpaper animate` | FFmpeg gradients |
| Metadata/licensing | ExifTool | standard |
| Text-heavy poster | SVG + rsvg | layout control |
| 3D / complex generative | Blender / p5.js | beyond this toolchain |

## Environment

The setup script creates a local Python environment:

```bash
cd design-arsenal
./scripts/setup.sh
./scripts/wallpaper doctor
```

If you use pyvips directly, make sure libvips is visible:

```bash
export LD_LIBRARY_PATH="/usr/lib:$LD_LIBRARY_PATH"
```

## System packages (Arch)

```bash
sudo pacman -S --needed imagemagick ffmpeg librsvg jq \
  libvips perl-image-exiftool oxipng pngquant jpegoptim potrace \
  gimp krita inkscape darktable rawtherapee fontforge scribus blender \
  libheif libavif libjxl libwebp webp-pixbuf-loader nodejs npm python-pipx
```

Real-ESRGAN is not in the official repos; use the upstream release
`realesrgan-ncnn-vulkan-20220424-ubuntu.zip` or Upscayl.

## Rebuilding libvips (full local edition)

The local build used libvips 8.18.7 with a minimal feature set:

```bash
meson setup build vips-8.18.7 --prefix="$PWD/tools/libvips" --libdir=lib \
  --buildtype=release -Ddeprecated=false -Dexamples=false -Dcplusplus=false \
  -Ddocs=false -Dvapi=false -Dintrospection=disabled -Dmodules=disabled \
  -Dmagick=disabled -Dpoppler=disabled -Dpdfium=disabled -Dcfitsio=disabled \
  -Dopenexr=disabled -Dopenjpeg=disabled -Dopenslide=disabled -Dmatio=disabled \
  -Dnifti=disabled -Dheif=disabled -Djpeg-xl=disabled -Duhdr=disabled \
  -Dfftw=disabled -Dorc=disabled -Dpangocairo=disabled -Dfontconfig=disabled \
  -Dimagequant=disabled -Dcgif=disabled -Dhighway=disabled
ninja -C build -j16 && ninja -C build install
```

If `glib-mkenums`/`glib-genmarshal` are missing, take them from the matching
`glib2-devel` package and point pkg-config at them. That was the only tricky
part of the local build.

## Notes

- Keep the original; write a new file; log the command.
- Verify alpha and colorspace after compositing:
  `magick identify -format '%wx%h %[colorspace] %[channels]' file`.
- For batches, prefer libvips for thumbnails and ImageMagick for composition.
