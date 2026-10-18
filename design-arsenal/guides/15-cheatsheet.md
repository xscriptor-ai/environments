# 15 — Cheatsheet

## The arsenal in one screen

```bash
scripts/wallpaper doctor
scripts/wallpaper inspect img.jpg
scripts/wallpaper palette img.jpg --colors 8 --out img-palette
scripts/wallpaper fit img.jpg --size 3840x2160 --mode smart --out out.jpg
scripts/wallpaper extend img.jpg --size 3840x2160 --method blur \
  --scale 0.92 --grain --vignette --out out.jpg
scripts/wallpaper upscale img.jpg --scale 4 --out out.png
scripts/wallpaper optimize img.jpg --out out.webp --quality 88
scripts/wallpaper batch ./phones --preset desktop-4k --out ./desktop
scripts/wallpaper contact ./thumbs --out sheet.jpg --cols 6
scripts/wallpaper animate --out loop.webm --size 2560x1440 \
  --colors '#0b1026,#4338ca,#db2777,#fbbf24' --duration 8
scripts/wallpaper ratios
```

## Canvas presets

```text
16:9      1920x1080   2560x1440   3840x2160
16:10     2560x1600   3840x2400
21:9      3440x1440   5120x2160
32:9      5120x1440   7680x2160
9:16      1080x1920   1440x2560
9:20      1080x2400   1440x3200
3:4       1536x2048   2048x2732
1:1       2400x2400   3000x3000
```

## ImageMagick

```bash
# cover crop
magick in.jpg -auto-orient -resize 3840x2160^ -gravity center -extent 3840x2160 out.jpg

# blurred field
magick in.jpg -resize 3840x2160^ -gravity center -extent 3840x2160 \
  -blur 0x48 -modulate 92,112,100 bg.png

# subject at 92% height
magick in.jpg -resize x1987 fg.png

# shadow
magick fg.png \( +clone -background black -shadow 55x18+0+18 \) \
  +swap -background none -layers merge +repage fg-shadow.png

# composite
magick bg.png fg-shadow.png -gravity center -composite out.jpg

# grain
magick out.jpg \( +clone -colorspace Gray -attenuate 0.35 +noise Gaussian \) \
  -compose soft-light -composite out-grain.jpg

# scrim
magick out.jpg \( -size 3840x1080 gradient:'#00000000-#00000099' \) \
  -gravity south -compose over -composite out-scrim.jpg

# vignette
magick out.jpg \( assets/textures/overlays/vignette.png \
  -resize 3840x2160^ -gravity center -background none -extent 3840x2160 \) \
  -compose over -composite out-vig.jpg

# palette (sample)
magick in.jpg -resize 200x -colors 10 -unique-colors txt:-
```

## libvips

```bash
vipsthumbnail in.jpg --size 800x -o thumb.jpg
vips smartcrop in.jpg out.jpg 3840 2160
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

# video -> frames
ffmpeg -i in.mp4 frames/%04d.png

# extract a still
ffmpeg -ss 4 -i in.mp4 -frames:v 1 still.png
```

## Color

```bash
# extract palette
scripts/wallpaper palette img.jpg --colors 8

# average color
magick img.jpg -resize 1x1! -format '%[hex:p{0,0}]\n' info:

# gradient
magick -size 3840x2160 gradient:'#0e7490-#fbbf24' grad.webp

# contrast (Python)
python3 - <<'PY'
def lum(h):
    c=[int(h[i:i+2],16)/255 for i in (1,3,5)]
    c=[x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in c]
    return .2126*c[0]+.7152*c[1]+.0722*c[2]
a,b=lum('#f4f4f5'),lum('#0b1026')
print(round((max(a,b)+.05)/(min(a,b)+.05),2))
PY
```

## Typography

```bash
fc-match 'Inter'
magick -list font | grep -i inter
rsvg-convert -w 3840 -h 2160 poster.svg -o poster.png
```

## Metadata

```bash
exiftool img.jpg | head -40
exiftool -Artist='Name' -Copyright='© 2026 Name' -License='CC BY 4.0' img.jpg
magick img.jpg -strip clean.jpg
```

## QA

```bash
magick identify -format '%f %wx%h %[colorspace] %b\n' out/*
magick out.jpg -resize 300x thumb.jpg
du -h out/*
```

## Ratios (mental math)

- 9:16 -> 16:9: the phone image fills about 56% of the desktop width at full
  height.
- 16:9 -> 9:16: you keep about 32% of the width if you crop to the phone ratio.
- 16:9 -> 21:9: add about 31% width, or crop height.
- 16:9 -> 32:9: double the width; treat as two panels.
- 4K = 3840x2160 = 8.3 MP.
- 1440p = 2560x1440 = 3.7 MP.
- 9:20 phone = 1440x3200 = 4.6 MP.
