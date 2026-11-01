# Wallpaper tools, sources and desktop integration

## Set / manage wallpapers (Wayland/Hyprland)

| Tool | What it does | Notes |
|---|---|---|
| [hyprpaper](https://github.com/hyprwm/hyprpaper) | Official Hyprland wallpaper daemon | simple, IPC, multi-monitor |
| [swww](https://github.com/LGFae/swww) | Daemon with transitions | animations, fade |
| [mpvpaper](https://github.com/GhostNaN/mpvpaper) | Video/animation wallpaper | mpv, loops |
| [waypaper](https://github.com/AnufrievRoman/waypaper) | GUI wallpaper picker | supports swww/hyprpaper |
| [wpaperd](https://github.com/danyspin97/wpaperd) | Minimal daemon | multi-output |
| [Dynamic Wallpaper](https://github.com/adi1090x/dynamic-wallpaper) | Time/weather wallpapers | mostly X11 |

## Color schemes from an image

| Tool | Ecosystem | Notes |
|---|---|---|
| [matugen](https://github.com/InioX/matugen) | Material You | palettes and templates |
| [wallust](https://github.com/explosion-mental/wallust) | Rust | fast, templates |
| [pywal16](https://github.com/eylles/pywal16) | Python | maintained pywal fork |
| `scripts/wallpaper palette` | this pack | JSON/CSS/GPL/swatches |

## Wallpaper sources

- [Wallhaven](https://wallhaven.cc/) + [API](https://wallhaven.cc/help/api) — community, filters.
- [Unsplash — Desktop](https://unsplash.com/backgrounds/desktop) — photography.
- [Pexels — Wallpaper](https://www.pexels.com/search/wallpaper/) — photos/video.
- [NASA Images](https://images.nasa.gov/) — space, Earth.
- [ESA/Hubble](https://esahubble.org/images/) — high resolution.
- [Webb Telescope](https://webbtelescope.org/images) — JWST.
- [Wikimedia Commons — Featured pictures](https://commons.wikimedia.org/wiki/Commons:Featured_pictures) — curated.
- [Openverse](https://openverse.org/) — license-aware search.
- [Poly Haven HDRIs](https://polyhaven.com/hdris) — lighting and 360 backgrounds.

## Integration notes (Hyprland)

```bash
# hyprpaper
hyprctl hyprpaper preload ~/Pictures/wallpaper.jpg
hyprctl hyprpaper wallpaper "DP-1,~/Pictures/wallpaper.jpg"

# swww
swww img ~/Pictures/wallpaper.jpg --transition-type grow --transition-duration 1

# mpvpaper (video loop)
mpvpaper -o "loop --no-audio" DP-1 ~/Videos/wallpaper.mp4

# matugen (generate Material You colors from image)
matugen image ~/Pictures/wallpaper.jpg
```

## Multi-monitor

- Design per **output**, not per "desktop": each monitor has resolution, DPI and
  position.
- For two monitors, consider a continuous span or two independent pieces with
  the same palette.
- Leave icon zones and docks free of detail and text.
- On ultrawide, avoid a centered subject if icons go left; move the focus to the
  right third.
- Test with `hyprctl monitors` and `swww query`.

## Formats and performance

- **JPEG/WebP** for photos; **PNG** for flat graphics; **AVIF/JXL** if the viewer
  supports them.
- 4K: 3840x2160; 5K: 5120x2880; ultrawide: 3440x1440 or 5120x1440.
- Do not use a 30 MB file if a 2 MB file looks identical.
- For video wallpaper: H.264/VP9, short loop, no audio, moderate bitrate.
- Test with icons, windows and the panel; not only fullscreen.

## Safety and licenses

- Wallhaven has NSFW content; filter with `categories=111&purity=100` in the API.
- Do not use fan art, movie stills or brand images without permission.
- Keep author/license in an `ATTRIBUTION.md` next to the collection.
