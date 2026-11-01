# Mobile-to-desktop method

## Ratios

16:9 = 1.7778; 9:16 = 0.5625; 21:9 = 2.3333; 32:9 = 3.5556.

Width of a 9:16 source at height H: H * 9/16. For 4K (H=2160): about 1215 px;
the desktop is 3840 px, so 2625 px of field.

## Decision table

| Source | Field | Method |
|---|---|---|
| Portrait architecture, clean edges | Sky/wall/negative space | Recompose or edge |
| Portrait subject/object | Warm/cool neutral | Solid panel + shadow |
| Sunset/sky gradient | Similar gradient | Gradient |
| Symmetric facade | Mirrored pattern | Mirror |
| Busy detail | Soft ambient | Blur |
| Low resolution | Any | Upscale first |

## Recipe (ambient blur)

```bash
wallpaper extend phone.jpg --size 3840x2160 --method blur \
  --scale 0.92 --grain --vignette --out desktop.jpg
```

Equivalent ImageMagick:

```bash
magick phone.jpg -auto-orient -resize 3840x2160^ -gravity center \
  -extent 3840x2160 -blur 0x48 -modulate 92,112,100 bg.png
magick phone.jpg -auto-orient -resize x1987 fg.png
magick fg.png \( +clone -background black -shadow 55x18+0+18 \) \
  +swap -background none -layers merge +repage fg-shadow.png
magick bg.png fg-shadow.png -gravity center -compose over -composite out.jpg
```

## Variants

- Desktop 16:9 primary.
- Ultrawide: reframe; do not stretch.
- Mobile 9:20: original or re-crop.
- Light/dark: same composition, recalibrated field.
- Editorial: panel + type.
- Ambient: blur/gradient, no type.

## Common failures

- Subject behind the icon column.
- White text over a busy sky.
- Visible blur seam.
- Flat field with no light falloff.
- Banding in a dark gradient.
- Everything centered.
- AI upscale halos on text/edges.
