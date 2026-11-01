# Image recipes

## ImageMagick

### Cover crop

```bash
magick in.jpg -auto-orient -resize 3840x2160^ -gravity center \
  -extent 3840x2160 out.jpg
```

### Blur field + sharp subject

```bash
magick in.jpg -auto-orient -resize 3840x2160^ -gravity center \
  -extent 3840x2160 -blur 0x48 -modulate 92,112,100 bg.png
magick in.jpg -auto-orient -resize x1987 fg.png
magick fg.png \( +clone -background black -shadow 55x18+0+18 \) \
  +swap -background none -layers merge +repage fg-shadow.png
magick bg.png fg-shadow.png -gravity center -compose over -composite out.jpg
```

### Gradient field

```bash
magick -size 3840x2160 gradient:'#0b1026-#2dd4bf' bg.png
magick bg.png fg-shadow.png -gravity center -composite out.jpg
```

### Grain

```bash
magick base.jpg \( +clone -colorspace Gray -attenuate 0.35 +noise Gaussian \) \
  -compose soft-light -composite out.jpg
```

### Vignette

```bash
magick base.jpg \( assets/textures/overlays/vignette.png \
  -resize 3840x2160^ -gravity center -background none -extent 3840x2160 \) \
  -compose over -composite out.jpg
```

### Scrim

```bash
magick base.jpg \( -size 3840x1080 gradient:'#00000000-#00000099' \) \
  -gravity south -compose over -composite out.jpg
```

### Sample colors

```bash
magick photo.jpg -crop 20%x20%+0+0 +repage -resize 1x1! \
  -format '%[hex:p{0,0}]\n' info:
magick photo.jpg -resize 200x -colors 10 -unique-colors txt:- | head -20
```

### Contact sheet

```bash
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

# sequence -> video
ffmpeg -framerate 30 -i frame-%04d.png -c:v libx264 -pix_fmt yuv420p out.mp4

# video -> frames
ffmpeg -i in.mp4 frames/%04d.png
```

## Real-ESRGAN

```bash
realesrgan-ncnn-vulkan -i phone.jpg -o phone-4x.png \
  -n realesrgan-x4plus -s 4 -t 256
```

Models: `realesrgan-x4plus`, `realesrgan-x4plus-anime`,
`realesr-animevideov3`. Use the CLI wrapper if installed:

```bash
wallpaper upscale phone.jpg --scale 4 --out phone-4x.png
```

## Optimization

```bash
magick in.png -sampling-factor 4:2:0 -interlace Plane -quality 90 out.jpg
magick in.png -define webp:method=6 -quality 88 out.webp
magick in.png -quality 82 -define heic:speed=4 out.avif
magick in.png -define png:compression-level=9 out.png
oxipng -o 4 --strip safe out.png
```

## Pitfalls

- `-extent` flattens alpha unless `-background none`.
- Keep alpha when compositing grayscale+alpha overlays; verify colorspace.
- Add noise/dither to gradients to prevent banding.
- JPEG has no alpha; flatten first.
- Verify with `magick identify -format '%wx%h %[colorspace] %[channels] %b'`.
