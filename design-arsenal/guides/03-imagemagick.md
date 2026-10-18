# 03 — ImageMagick recipe book

ImageMagick 7 uses `magick` for everything. `convert` still works as a symlink,
but prefer `magick`. Parentheses group operations; quote them in Bash.

```bash
magick input.jpg -auto-orient -resize 3840x2160^ -gravity center \
  -extent 3840x2160 output.jpg
```

## Inspect

```bash
magick identify image.jpg
magick identify -format '%w x %h · %[colorspace] · %[type] · %b\n' image.jpg
magick identify -verbose image.jpg | sed -n '1,40p'
magick image.jpg -format '%[pixel:p{100,100}]\n' info:
exiftool image.jpg
```

## Resize / crop / canvas

```bash
# fit inside (preserve aspect, may not fill)
magick in.jpg -resize 3840x2160 out.jpg

# fill + center crop (cover)
magick in.jpg -resize 3840x2160^ -gravity center -extent 3840x2160 out.jpg

# crop to exact size from center
magick in.jpg -gravity center -crop 3840x2160+0+0 +repage out.jpg

# crop to a third (left/top)
magick in.jpg -gravity northwest -crop 1920x1080+0+0 +repage out.jpg

# add a 200 px border
magick in.jpg -bordercolor '#0b0b0f' -border 200 out.jpg

# extend canvas with a color (keeps image at center)
magick in.jpg -background '#0b0b0f' -gravity center -extent 3840x2160 out.jpg

# extend canvas with transparency
magick in.png -background none -gravity center -extent 3840x2160 out.png

# rotate/straighten
magick in.jpg -rotate 90 out.jpg
magick in.jpg -background black -rotate 2.5 out.jpg
```

> **Important**: `-extent` without `-background none` flattens alpha. If you are
> working with transparent overlays, always add `-background none`.

## Blur extension (ambient field)

```bash
# background: cover + heavy blur + slight desaturation/darkening
magick in.jpg -auto-orient -resize 3840x2160^ -gravity center \
  -extent 3840x2160 -blur 0x48 -modulate 92,112,100 bg.png

# foreground: fit to 92% of canvas height
magick in.jpg -auto-orient -resize x1987 fg.png

# optional shadow
magick fg.png \( +clone -background black -shadow 55x18+0+18 \) \
  +swap -background none -layers merge +repage fg-shadow.png

# composite
magick bg.png fg-shadow.png -gravity center -compose over -composite out.jpg
```

Blur radius: about 2% of the smaller canvas dimension (4K: 0x40-0x50). More blur
hides seams but looks generic; use color grading and composition to
differentiate.

## Solid / gradient extension

```bash
# sample a color from a region
magick in.jpg -crop 20%x20%+0+0 +repage -resize 1x1! \
  -format '%[hex:p{0,0}]\n' info:

# solid field
magick -size 3840x2160 xc:'#1e1e2e' bg.png
magick bg.png fg-shadow.png -gravity center -composite out.jpg

# vertical gradient from two colors
magick -size 3840x2160 gradient:'#0b1026-#2dd4bf' bg.png

# angled gradient via SVG (more control)
cat > /tmp/g.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" width="3840" height="2160">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="#0b1026"/>
<stop offset=".55" stop-color="#4338ca"/>
<stop offset="1" stop-color="#fbbf24"/>
</linearGradient></defs>
<rect width="100%" height="100%" fill="url(#g)"/>
</svg>
SVG
rsvg-convert -w 3840 -h 2160 /tmp/g.svg -o bg.png
```

## Shadows and elevation

```bash
# shadow around an image
magick fg.png \( +clone -background black -shadow 60x22+0+24 \) \
  +swap -background none -layers merge +repage fg-shadow.png

# soft drop shadow on a solid background
magick -size 3840x2160 xc:'#111114' \
  \( fg.png -background black -shadow 50x30+0+30 \) \
  -gravity center -compose over -composite out.jpg
```

## Grain, vignette, scrim

The reduced pack bundles only `assets/textures/overlays/vignette.png`. The
grain and light-leak examples below assume the full local overlay set; generate
grain with the soft-light one-liner or fetch CC0 overlays when needed.

```bash
# monochrome grain via soft-light
magick base.jpg \( +clone -colorspace Gray -attenuate 0.4 +noise Gaussian \) \
  -compose soft-light -composite out.jpg

# grain overlay asset
magick base.jpg \( assets/textures/overlays/noise-alpha.png \
  -resize 3840x2160^ -gravity center -background none -extent 3840x2160 \) \
  -compose overlay -composite out.jpg

# vignette asset
magick base.jpg \( assets/textures/overlays/vignette.png \
  -resize 3840x2160^ -gravity center -background none -extent 3840x2160 \) \
  -compose over -composite out.jpg

# bottom scrim (transparent -> black)
magick base.jpg \( -size 3840x1080 gradient:'#00000000-#00000099' \) \
  -gravity south -compose over -composite out.jpg

# film burn / light leak
magick base.jpg \( assets/textures/overlays/light-leak-warm.png \
  -resize 3840x2160^ -gravity center -background none -extent 3840x2160 \) \
  -compose screen -composite out.jpg
```

## Color grading

```bash
# auto levels + contrast
magick in.jpg -auto-level -sigmoidal-contrast 3x50% out.jpg

# brightness/saturation/hue (100 = neutral)
magick in.jpg -modulate 100,120,100 out.jpg
magick in.jpg -modulate 95,110,102 out.jpg

# tint toward a color (preserve luminance)
magick in.jpg -colorspace Gray -fill '#89b4fa' -colorize 35% out.jpg

# duotone
magick in.jpg -colorspace Gray \( -clone 0 -fill '#0b1026' -colorize 100 \) \
  \( -clone 0 -fill '#fbbf24' -colorize 100 \) -delete 0 -compose blend \
  -define compose:args=50 -composite out.jpg

# limited palette (posterized / risograph)
magick in.jpg -colors 8 -dither FloydSteinberg out.png
```

## Text

`-annotate` is fine for one line; for layouts use SVG + `rsvg-convert`.

```bash
# one-line label
magick base.jpg -gravity southwest -font Inter -pointsize 42 \
  -fill white -annotate +80+80 'NORTH / 64' out.jpg

# caption box with background
magick base.jpg -gravity south -background '#000000AA' -fill white \
  -font Inter -pointsize 36 -size 3840x140 caption:'A quiet field' \
  -gravity south -composite out.jpg

# text over a scrim
magick base.jpg \( -size 3840x800 gradient:'#00000000-#000000CC' \) \
  -gravity south -compose over -composite \
  -gravity southwest -font 'Instrument Serif' -pointsize 160 -fill white \
  -annotate +120+120 'Stillness' out.jpg
```

Check available fonts: `magick -list font | less` or `fc-list : family`.
If the bundled fonts are not installed, fetch them from the manifest in
`assets/fonts/README.md`.

## Alpha and masks

```bash
# rounded corners (mask must be white-on-transparent)
magick -size 3840x2160 xc:none -fill white \
  -draw 'roundrectangle 0,0,3839,2159,48,48' /tmp/mask.png
magick in.jpg /tmp/mask.png -alpha off -compose CopyOpacity -composite rounded.png

# circular crop from a square image
magick in.jpg -gravity center -crop 1:1 +repage -resize 2000x2000! \
  \( -size 2000x2000 xc:none -fill white -draw 'circle 1000,1000 1000,0' \) \
  -alpha off -compose CopyOpacity -composite circle.png

# apply a gradient alpha fade (white = opaque, black = transparent)
magick in.jpg \( -size 3840x2160 gradient:white-black \) \
  -alpha off -compose CopyOpacity -composite fade.png
```

## Batch

```bash
# resize all JPEGs in place (danger: overwrites; test first)
mkdir -p out
for f in *.jpg; do
  magick "$f" -auto-orient -resize 2560x1440^ -gravity center \
    -extent 2560x1440 -quality 90 "out/${f%.*}.jpg"
done

# mogrify (in-place, use a copy!)
cp -r photos photos-edit
mogrify -path out -auto-orient -resize 1920x1080^ -gravity center \
  -extent 1920x1080 -quality 88 photos-edit/*.jpg

# parallel
find photos -name '*.jpg' -print0 | \
  xargs -0 -P 8 -I{} sh -c 'magick "$1" -resize 1920x1080^ \
    -gravity center -extent 1920x1080 "out/$(basename "$1")"' _ {}
```

## Contact sheets

```bash
magick montage thumbs/*.jpg -thumbnail 400x400^ -gravity center \
  -extent 400x400 -tile 6x -geometry +8+8 -background '#0b0b0f' \
  -fill '#e4e4e7' -font Inter -pointsize 18 -label '%t' sheet.jpg
```

## Animated WebP / GIF

```bash
# frames -> animated WebP (loop forever)
magick -delay 8 -loop 0 frames/*.png -quality 85 loop.webp

# GIF
magick -delay 8 -loop 0 frames/*.png loop.gif

# optimize animated GIF
magick loop.gif -layers Optimize loop-opt.gif
```

## Metadata

```bash
# read
exiftool image.jpg | head -40

# write copyright/license
exiftool -Artist='Your Name' -Copyright='© 2026 Your Name' \
  -License='CC BY 4.0' image.jpg

# strip all metadata (privacy / size)
magick image.jpg -strip clean.jpg
exiftool -all= clean.jpg
```

## Common pitfalls

1. **`-extent` flattens alpha** unless `-background none`.
2. **Grayscale overlay turns the composite gray** if alpha was flattened.
   Keep alpha and use `-background none`; verify with `identify`.
3. **Parentheses** need escaping in Bash: `\( ... \)` or quote them.
4. **Operator order matters**: `-resize` before `-extent`, `-gravity` before
   `-crop`/`-extent`.
5. **`+noise` vs `-noise`**: `+noise Gaussian` adds noise; `-noise` is a
   different operator.
6. **Q16 HDRI** can produce values outside 0-255; use `-clamp` if needed.
7. **Large images** may hit memory limits; use libvips for thumbnails.
8. **SVG text** depends on installed fonts; use family names available to
   fontconfig.
9. **JPEG has no alpha**; flatten before saving.
10. **Color profiles**: strip only after converting to sRGB if the output is
    for screens.

## Useful one-liners

```bash
# average color of an image
magick in.jpg -resize 1x1! -format '%[hex:p{0,0}]\n' info:

# most common colors
magick in.jpg -resize 200x -colors 12 -unique-colors txt:- | sed -n '2,20p'

# check transparency
magick identify -format '%[opaque] %[channels]\n' img.png

# create a 4K grain tile
magick -size 1024x1024 xc:gray50 -attenuate 0.6 +noise Gaussian \
  -colorspace Gray -auto-level grain.png

# side-by-side comparison
magick before.jpg after.jpg +append compare.jpg

# before/after slider (static)
magick before.jpg after.jpg -gravity center -crop 50%x100% +repage \
  +append compare-50.jpg
```
