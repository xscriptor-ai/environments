# Versions and inventory

Generated 2026-10-18.

## Tools (October 2026)

| Tool | Version |
|---|---|
| ImageMagick | 7.1.2-34 Q16-HDRI |
| FFmpeg | 9.0.2 |
| libvips | 8.18.7 |
| Real-ESRGAN (ncnn) | Vulkan 20220424 (release v0.2.5.0) |
| ExifTool | 13.59 |
| Python | 3.14.8 |
| Pillow | 13.0.0 |
| pyvips | 3.2.0 |
| colorthief | 0.2.1 |
| smartcrop | 0.5.0 |
| oxipng | 10.2.1 |
| rsvg-convert | 2.63.3 |
| jq | 1.8.2 |

## GUI / RAW (Arch packages)

| Tool | Version |
|---|---|
| GIMP | 3.2.6 |
| Krita | 6.0.4.1 |
| Inkscape | 1.4.4 |
| darktable | 5.6.2 |
| RawTherapee | 5.13 |
| Blender | 5.2.2 |
| Scribus | 1.6.6 |
| FontForge | 20251009 |

## Assets in this reduced pack

| Asset | Count |
|---|---:|
| Palettes (normalized) | 118 |
| Gradient SVG sources | 32 |
| Pattern SVG sources | 13 |
| Safe-zone guides (PNG) | 7 |
| Vignette overlays | 1 |
| Fonts | manifest only (12 upstream) |
| Icons | manifest only (21,691 upstream) |
| Photo/procedural textures | manifest only |
| Wallpapers | 0 (intentionally empty) |
| Agents | 6 |
| Skills | 6 |
| Commands | 4 |
| Full guides | 16 |
| Resource catalogs | 12 |

## Full local edition

The local design-arsenal is about 396 MB and adds bundled TTF fonts, 21,691
SVGs, 7 CC0 photo textures, 7 procedural textures, 10 alpha overlays, 192 WebP
gradient rasters, 118 palette previews and user-level tool binaries.

## Notes

- GUI apps are system packages; they are not bundled.
- The reduced pack is documentation-first and uses system tools.
- The `wallpaper` CLI falls back to Lanczos when Real-ESRGAN is unavailable.
