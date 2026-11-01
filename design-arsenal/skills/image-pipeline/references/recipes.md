# Recipes and quality

## Extend to desktop

```bash
# 1. optional upscale
wallpaper upscale phone.jpg --scale 4 --out phone-4x.png

# 2. extend
wallpaper extend phone-4x.png --size 3840x2160 --method blur \
  --scale 0.92 --grain --vignette --out desktop.jpg
```

## Sample colors

```bash
# average of a region
magick photo.jpg -crop 20%x20%+0+0 +repage -resize 1x1! \
  -format '%[hex:p{0,0}]\n' info:

# dominant colors
magick photo.jpg -resize 200x -colors 10 -unique-colors txt:- | head -20
```

## Gradient raster

```bash
rsvg-convert -w 3840 -h 2160 assets/gradients/svg/aurora.svg -o /tmp/aurora.png
magick /tmp/aurora.png \( +clone -colorspace Gray -attenuate 0.3 +noise Gaussian \) \
  -compose soft-light -composite -quality 90 /tmp/aurora.webp
```

## Animated gradient notes

- Speed 0.005-0.02; 8-15 s; 24-30 fps; no audio.
- Add temporal noise to hide banding.
- VP9/WebM for size; H.264/MP4 for compatibility.
- Test loop seam.

## Quality checklist

- Subject sharp at 100%.
- No seam or halo.
- Field temperature matches source.
- Icon/dock/panel zones calm.
- Text contrast measured on composite.
- No banding.
- Grain consistent.
- File size reasonable.
- License recorded.
