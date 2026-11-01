# 04 — FFmpeg for stills, sequences and motion

FFmpeg is the bridge between a still image and a moving wallpaper, and a
reliable batch tool for formats and metadata.

## Stills and sequences

```bash
# one image -> another format
ffmpeg -i in.png -q:v 2 out.jpg

# image sequence -> video (30 fps)
ffmpeg -framerate 30 -i frame-%04d.png -c:v libx264 -pix_fmt yuv420p out.mp4

# video -> frames
ffmpeg -i clip.mp4 frames/%04d.png

# one frame at 3 s
ffmpeg -ss 3 -i clip.mp4 -frames:v 1 frame.png

# video -> animated WebP (or use ImageMagick for frame animation)
ffmpeg -i loop.mp4 -c:v libwebp -lossless 0 -q:v 80 -loop 0 loop.webp
```

## Animated gradient wallpaper

FFmpeg's `gradients` source is perfect for abstract, seamless-ish backgrounds.

```bash
ffmpeg -y -f lavfi -i \
  "gradients=s=2560x1440:c0=#0b1026:c1=#4338ca:c2=#db2777:c3=#fbbf24:nb_colors=4:speed=0.012:d=8:r=30" \
  -vf "noise=alls=5:allf=t+u,vignette=PI/5,format=yuv420p" \
  -c:v libvpx-vp9 -b:v 0 -crf 34 -row-mt 1 -cpu-used 2 gradient.webm
```

- `speed` very low (0.005-0.02) avoids nausea.
- `d=8` duration; loop in the player.
- `noise` adds grain and hides banding.
- `vignette` adds depth.
- VP9/WebM is compact; H.264/MP4 is more compatible.

MP4 variant:

```bash
ffmpeg -f lavfi -i "gradients=s=3840x2160:c0=#0b1026:c1=#fbbf24:speed=0.008:d=10:r=30" \
  -vf "noise=alls=4:allf=t+u,vignette=PI/5,format=yuv420p" \
  -c:v libx264 -crf 20 -preset medium -movflags +faststart gradient.mp4
```

## Add grain / light leaks to video

```bash
# temporal grain
ffmpeg -i in.mp4 -vf "noise=alls=8:allf=t+u" -c:v libx264 -crf 20 out.mp4

# overlay a light leak (loop it, screen blend)
ffmpeg -i in.mp4 -loop 1 -i light-leak.png -filter_complex \
  "[0:v][1:v]overlay=0:0:shortest=1:format=auto,format=yuv420p" \
  -c:v libx264 -crf 20 out.mp4
```

## Loops

A perfect loop needs matching first/last frame. For gradients, use a low speed
and cut at a point where the pattern is close; or crossfade:

```bash
ffmpeg -i in.mp4 -filter_complex \
  "[0:v]split[a][b];[a]trim=0:8,setpts=PTS-STARTPTS[main];\
   [b]trim=8:9,setpts=PTS-STARTPTS[tail];\
   [main][tail]xfade=transition=fade:duration=1:offset=7" \
  -c:v libx264 -crf 20 loop.mp4
```

For seamless procedural loops, generate frames with a periodic function (p5.js,
shaders) and encode with `-framerate`.

## Video wallpaper (Hyprland)

```bash
# play a loop as wallpaper
mpvpaper -o "loop --no-audio --hwdec=auto" DP-1 gradient.mp4
```

Recommended: 2560x1440 or 3840x2160, 8-15 s loop, 24-30 fps, no audio, moderate
bitrate. Avoid 60 fps 4K for battery/GPU.

## Formats and quality

| Codec | Container | Use |
|---|---|---|
| H.264 | MP4 | compatibility |
| VP9 | WebM | web, open, efficient |
| AV1 | MP4/WebM | best compression, slower encode |
| ProRes | MOV | intermediate/editing |

```bash
# inspect
ffprobe -v error -show_entries stream=width,height,r_frame_rate,codec_name \
  -show_entries format=duration,size -of default=nw=1 input.mp4

# fast seek and thumbnail
ffmpeg -ss 00:00:04 -i input.mp4 -frames:v 1 -vf scale=1280:-1 thumb.jpg

# strip audio
ffmpeg -i input.mp4 -an -c:v copy noaudio.mp4
```

## Still image tricks with FFmpeg

```bash
# burn a subtle vignette into a still
ffmpeg -i in.jpg -vf "vignette=PI/5" out.jpg

# create a 10 s still video from an image (for testing players)
ffmpeg -loop 1 -i wall.jpg -t 10 -vf "format=yuv420p" -c:v libx264 -crf 20 still.mp4
```

## Pitfalls

1. **yuv420p** is required for broad player compatibility; convert explicitly.
2. **Full-range vs limited-range** color can shift; use `-color_range` if needed.
3. **Banding** in gradients: add noise/dither and encode at higher bit depth.
4. **Frame rate**: 24/30 is enough for wallpapers; 60 doubles size.
5. **Loop seams**: inspect the last/first frame; crossfade or design a periodic
   loop.
6. **GPU encoding** (`h264_nvenc`) is fast but quality/control differs; use CPU
   for final masters.
