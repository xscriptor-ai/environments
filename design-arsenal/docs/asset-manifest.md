# Asset manifest (reduced edition)

## Bundled

| Path | Contents | Size |
|---|---|---|
| `assets/palettes/json/` | 118 palettes with source/license/roles | ~476 KB |
| `assets/palettes/css/` | per-palette CSS, `all-palettes.css`, `role-tokens.css` | ~556 KB |
| `assets/gradients/svg/` | 32 editable gradients (24 linear + 8 mesh) | ~128 KB |
| `assets/patterns/` | 13 transparent SVG patterns | ~52 KB |
| `assets/guides/` | 7 safe-zone overlays (PNG) | ~476 KB |
| `assets/textures/overlays/` | vignette overlay | ~184 KB |
| `assets/fonts/README.md` | 12 OFL families + upstream links | tiny |
| `assets/icons/README.md` | 5 sets, 21,691 icons + upstream links | tiny |
| `assets/textures/README.md` | CC0 texture sources + procedural recipes | tiny |
| `assets/wallpapers/README.md` | empty by design | tiny |

## Omitted from the 396 MB local edition

- TTF font binaries (about 4.7 MB).
- SVG icon sets (about 87 MB).
- Poly Haven photo textures (about 12 MB).
- Heavy overlays (grain, bokeh, light leaks, halftone, topographic; about 19 MB).
- Raster gradient WebP sets (about 30 MB) and palette previews (about 8 MB).
- Toolchain binaries and Python venv (about 370 MB).
- Spanish working guides and local-only scratch files.

## Expand on demand

```bash
# fonts: Google Fonts repositories, OFL 1.1
# icons: Lucide, Tabler, Phosphor, Simple Icons, Bootstrap
# textures: Poly Haven / ambientCG (CC0)
# tools: ImageMagick, FFmpeg, libvips, Real-ESRGAN, ExifTool
```

Fonts list and links: `assets/fonts/README.md`.
Icons list and links: `assets/icons/README.md`.
Texture sources: `assets/textures/README.md`.
Toolchain: `docs/toolchain-2026.md`.

## Licensing

- Pack docs/scripts: repository MIT.
- Generated SVG gradients, patterns and guides: CC0.
- Palettes: upstream license per JSON (mostly MIT; Material 3 baseline
  Apache-2.0).
- Fonts/icons/textures: upstream licenses; not redistributed here.
- No wallpapers, no stock photos.

See `LICENSE.md` and `skills/design-licensing/`.
