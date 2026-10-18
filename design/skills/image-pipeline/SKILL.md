---
name: image-pipeline
description: Reproducible image processing recipes — ImageMagick compositing/crop/grain/vignette, libvips thumbnails, FFmpeg sequences and animated gradients, Real-ESRGAN upscaling, format optimization and metadata. Use for command-level image work, batches and delivery.
---

# Image pipeline

## Tool selection

| Task | Tool |
|---|---|
| Compositing, text, masks, grain, vignette | ImageMagick |
| Huge images, thumbnails, smartcrop | libvips |
| Sequences, gradients, video, loops | FFmpeg |
| 4x upscale/restore | Real-ESRGAN |
| Palette/smartcrop automation | Python helpers |
| Metadata | ExifTool |

## Core commands

```bash
# cover crop
magick in.jpg -auto-orient -resize 3840x2160^ -gravity center \
  -extent 3840x2160 out.jpg

# blurred field
magick in.jpg -resize 3840x2160^ -gravity center -extent 3840x2160 \
  -blur 0x48 -modulate 92,112,100 bg.png

# subject at 92% height
magick in.jpg -resize x1987 fg.png

# shadow
magick fg.png \( +clone -background black -shadow 55x18+0+18 \) \
  +swap -background none -layers merge +repage fg-shadow.png

# composite
magick bg.png fg-shadow.png -gravity center -compose over -composite out.jpg

# grain
magick out.jpg \( +clone -colorspace Gray -attenuate 0.35 +noise Gaussian \) \
  -compose soft-light -composite out-grain.jpg

# vignette
magick out.jpg \( assets/textures/overlays/vignette.png \
  -resize 3840x2160^ -gravity center -background none -extent 3840x2160 \) \
  -compose over -composite out-vig.jpg

# bottom scrim
magick out.jpg \( -size 3840x1080 gradient:'#00000000-#00000099' \) \
  -gravity south -compose over -composite out-scrim.jpg

# contact sheet
magick montage thumbs/*.jpg -thumbnail 400x400^ -gravity center \
  -extent 400x400 -tile 6x -geometry +8+8 -background '#0b0b0f' sheet.jpg
```

## libvips

```bash
vipsthumbnail photos/*.jpg --size 1200x1200 -o 'thumbs/%s.webp[Q=88]'
vips smartcrop phone.jpg wide.jpg 3840 2160
vips webpsave in.jpg out.webp --Q 88
vipsheader -a in.jpg
```

## FFmpeg

```bash
# animated gradient
ffmpeg -f lavfi -i \
  "gradients=s=2560x1440:c0=#0b1026:c1=#fbbf24:speed=0.01:d=8:r=30" \
  -vf "noise=alls=5:allf=t+u,vignette=PI/5,format=yuv420p" \
  -c:v libvpx-vp9 -b:v 0 -crf 34 loop.webm

# frames -> video
ffmpeg -framerate 30 -i frame-%04d.png -c:v libx264 -pix_fmt yuv420p out.mp4
```

## Optimization

| Content | Format |
|---|---|
| Photo/wallpaper | WebP, AVIF, JPEG |
| Flat graphics/alpha | PNG, WebP |
| Vector | SVG |
| Animation | WebP, VP9, AV1 |
| Master | PNG 16-bit, TIFF |

```bash
magick in.png -sampling-factor 4:2:0 -interlace Plane -quality 90 out.jpg
magick in.png -define webp:method=6 -quality 88 out.webp
magick in.png -quality 82 -define heic:speed=4 out.avif
magick in.png -define png:compression-level=9 out.png
oxipng -o 4 --strip safe out.png
```

Keep sRGB for screens; strip metadata only after color conversion; keep
copyright/license fields when needed.

## Pitfalls

- `-extent` flattens alpha unless `-background none`.
- Grayscale+alpha overlays can turn composites grayscale if alpha is lost.
- Add noise/dither to gradients to prevent banding.
- Do not upscale flat art with AI; rasterize SVG at target size.
- JPEG has no alpha; flatten first.
- Verify with `magick identify -format '%wx%h %[colorspace] %[channels] %b'`.

Reference: `references/recipes.md`.
