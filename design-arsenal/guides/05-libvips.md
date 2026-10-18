# 05 — libvips

libvips is a streaming image processor: it reads only what it needs, keeps
memory low, and is much faster than ImageMagick for thumbnails and large images.
It is the right tool for batch proxies, smart crops and huge source files.

## Install

- Arch: `sudo pacman -S libvips`
- The full local design-arsenal also has a minimal 8.18.7 build under `tools/libvips`.
- Wrapper: `vips` / `vipsthumbnail` on `PATH`.
- Python: `pip install pyvips` (plus libvips).

Check:

```bash
vips --version
vips --vips-config
```

## Core operations

```bash
# thumbnail (fast, respects aspect, strips metadata by default)
vipsthumbnail in.jpg --size 800x -o thumb.jpg

# thumbnail to a directory with a template
vipsthumbnail photos/*.jpg --size 1200x1200 -o 'thumbs/%s.jpg'

# smart crop to exact aspect
vips smartcrop in.jpg out.jpg 3840 2160

# resize (width only; height auto)
vips resize in.jpg out.jpg 0.5

# crop x y width height
vips crop in.jpg out.jpg 100 50 1920 1080

# rotate
vips rot in.jpg out.jpg d90

# composite (overlay)
vips composite base.png overlay.png out.png over 0 0

# convert to WebP
vips webpsave in.jpg out.webp --Q 88

# deep zoom pyramid (for huge images / viewers)
vips dzsave in.jpg tiles --tile-size 512 --overlap 0 --suffix .jpg

# header only (no decode)
vipsheader -a in.jpg
```

## Why libvips for batches

- `vipsthumbnail` processes a folder in one command, with low RAM.
- It uses shrink-on-load for JPEG, so a 50 MP file becomes a thumbnail without
  decoding all pixels.
- It can write to a directory with naming templates.
- It handles EXIF orientation automatically in recent versions; test your files.

```bash
# 4K proxies for a folder
mkdir -p proxies
vipsthumbnail photos/*.jpg --size 3840x2160 -o 'proxies/%s.webp[Q=88]'

# 500 px contact-sheet inputs
vipsthumbnail photos/*.jpg --size 500x500 -o 'thumbs/%s.jpg'
```

## Smartcrop

`vips smartcrop` uses libvips' attention heuristic (edge/faces/saturation). It is
fast and good for batches. The portable `scripts/wallpaper fit --mode smart`
uses the Python `smartcrop` package instead, which offers more tuning; use
whichever gives the better crop for the image.

```bash
# 16:9 from a portrait
vips smartcrop phone.jpg wide.jpg 3840 2160

# 9:20 from a landscape
vips smartcrop wide.jpg phone.jpg 1440 3200
```

## pyvips

```python
import pyvips

im = pyvips.Image.new_from_file("in.jpg", access="sequential")
thumb = im.thumbnail_image(1200)
thumb.write_to_file("thumb.webp", Q=88)
print(im.width, im.height, im.bands)
```

Set `LD_LIBRARY_PATH` before importing if libvips is not in the default loader
path.

## libvips vs ImageMagick

| Task | libvips | ImageMagick |
|---|---|---|
| Batches of thumbnails | excellent | okay |
| Huge images | excellent | memory heavy |
| Smart crop | good | gravity only |
| Artistic filters | limited | extensive |
| Text layout | no | basic |
| Compositing | basic | strong |
| Format support | build-dependent | very broad |

Use libvips to **prepare** (resize, crop, proxy), ImageMagick to **compose**
(shadow, text, grain, blend), FFmpeg to **animate**.

## Build notes

The full local build used 8.18.7 with JPEG, PNG, WebP, TIFF, SVG, lcms2 and
libexif; HEIF/AVIF/JXL/PDF were disabled. The only tricky part was
`glib-mkenums`/`glib-genmarshal` missing from the runtime glib package; they were
taken from the matching `glib2-devel` package and exposed through a custom
`pkg-config` path.

To enable HEIF/AVIF/JXL, install the corresponding development packages and
rebuild with `-Dheif=enabled -Djpeg-xl=enabled`.
