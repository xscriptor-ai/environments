# 12 — Optimization and delivery

## 1. Choose the format

| Content | Best | Why |
|---|---|---|
| Photo, wallpaper | WebP / AVIF / JPEG | small, universal / modern / compatible |
| Flat graphics, transparency | PNG / WebP | lossless / alpha |
| Vector | SVG | editable, tiny |
| Animation | WebP / VP9 / AV1 | loop / video |
| Print | TIFF / PNG / PDF | quality / layout |
| Archive/master | PNG 16-bit / TIFF | no generation loss |

- **JPEG**: universal; no alpha; q85-92 for photos.
- **WebP**: smaller than JPEG, supports alpha; excellent for delivery.
- **AVIF**: best compression, slower encode/decode; check viewer support.
- **JPEG XL**: excellent, but support varies.
- **PNG**: lossless; optimize with oxipng/pngquant.
- **SVG**: keep text editable; outline only for final delivery if needed.

## 2. Resolution

- 1080p: 1920x1080.
- 1440p: 2560x1440.
- 4K: 3840x2160.
- 5K: 5120x2880.
- Ultrawide: 3440x1440 / 5120x1440.
- Mobile: 1080x2400 / 1440x3200.
- Do not upscale beyond the source unless the upscale is clean and intentional.
- 8K only if the display is 8K and the source supports it.

## 3. Quality settings

```bash
# JPEG
magick in.png -sampling-factor 4:2:0 -interlace Plane -quality 90 out.jpg

# WebP
magick in.png -define webp:method=6 -quality 88 out.webp

# AVIF
magick in.png -quality 82 -define heic:speed=4 out.avif

# PNG
magick in.png -define png:compression-level=9 out.png
oxipng -o 4 --strip safe out.png
```

- q90 is visually lossless for most photos; q80-85 for backgrounds.
- For gradients, lower quality can band; add 1-2% noise.
- Test at 100% on the target display, not just thumbnail.

## 4. Color management

- Work in sRGB for screen delivery.
- Keep an embedded sRGB ICC profile for color-critical work.
- Convert carefully: `magick in.jpg -profile sRGB.icc -strip out.jpg` (if source
  has a profile).
- Strip metadata only after color conversion; stripping an ICC profile can shift
  colors in some viewers.
- For print, keep Adobe RGB/ProPhoto and the destination profile.

## 5. Metadata

Keep:

- Copyright, artist, license.
- Source URL, model release (if applicable).
- Color profile.

Remove:

- GPS (privacy), camera serial, software, thumbnails.
- Personal notes.

```bash
# keep copyright/license, strip the rest
exiftool -all= -Artist='Your Name' -Copyright='© 2026' \
  -License='CC BY 4.0' image.jpg

# remove all metadata
exiftool -all= image.jpg

# copy metadata from source to derivative
exiftool -TagsFromFile source.jpg -all:all derivative.jpg
```

## 6. Batch optimization

```bash
# ImageMagick batch to WebP
mkdir -p out
for f in *.jpg; do
  magick "$f" -auto-orient -resize '3840x2160^' -gravity center \
    -extent 3840x2160 -strip -define webp:method=6 -quality 88 \
    "out/${f%.*}.webp"
done

# libvips batch thumbnails
vipsthumbnail *.jpg --size 3840x2160 -o 'out/%s.webp[Q=88]'

# report sizes
du -h out/* | sort -h
```

## 7. Check the result

```bash
magick identify -format '%f %wx%h %[colorspace] %b\n' out/*
exiftool -ImageSize -FileSize -ColorSpace out/*.webp
```

- Open the file in the actual viewer/desktop.
- Check banding, color shift, transparency, orientation.
- Check text sharpness; compression can destroy small type.
- Check file size vs quality; do not ship 15 MB wallpapers.

## 8. Delivery package

```text
final/
  4k/name-3840x2160.webp
  1440p/name-2560x1440.webp
  mobile/name-1440x3200.webp
  ultrawide/name-5120x1440.webp
  preview/name-thumb.jpg
  ATTRIBUTION.md
  manifest.json
  series.md
```

`manifest.json`:

```json
{
  "series": "north",
  "source": "photo.jpg",
  "license": "CC BY 4.0",
  "author": "Your Name",
  "recipe": "wallpaper extend --method blur --scale 0.92 --grain --vignette",
  "variants": [
    {"file": "4k/north-3840x2160.webp", "size": "3840x2160"},
    {"file": "mobile/north-1440x3200.webp", "size": "1440x3200"}
  ]
}
```

## 9. Common mistakes

- Shipping a 20 MB PNG photo.
- Stripping the ICC profile from a P3 image.
- Using AVIF without testing the viewer.
- Ignoring banding in dark gradients.
- Forgetting EXIF orientation after editing.
- Losing the original after destructive edits.
- No attribution for CC BY / CC BY-SA.
- Inconsistent quality across a series.
