---
description: Check the design pack toolchain, assets and optional dependencies before starting work
agent: design-arsenal
---

Run a design-arsenal health check in the current workspace.

1. Locate the pack root (the directory containing `design-arsenal/README.md`). If the
   user is inside a checkout, use that checkout.
2. Run `scripts/wallpaper doctor`.
3. Check required tools: ImageMagick 7 (`magick`), FFmpeg, `rsvg-convert`, `jq`,
   Python 3 and the Python packages from `scripts/requirements.txt`.
4. Check optional tools: libvips, Real-ESRGAN (`realesrgan-ncnn-vulkan`),
   ExifTool, oxipng, pngquant, jpegoptim.
5. Count bundled assets: palettes, gradient SVGs, patterns, guides.
6. Report a compact table of OK, optional and missing items. For missing
   required items, give the exact install command for the detected distro
   (Arch: `sudo pacman -S --needed imagemagick ffmpeg librsvg jq`; Python:
   `scripts/setup.sh`).
7. Do not modify files.

$ARGUMENTS
