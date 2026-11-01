# CATALOG — Design Arsenal

**118 palettes · 32 gradient families (SVG sources) · 13 SVG patterns · 7
safe-zone guides · 6 agents · 6 skills · 4 commands · 16 full guides · 12
resource catalogs**

- [README](README.md) — what this is and how to install it.
- [Guides](guides/00-index.md) — the full working manual.
- [Resources](resources/README.md) — curated external links.
- [Assets](assets/README.md) — the actual files.
- [Docs](docs/README.md) — condensed quick-reference docs.
- **Wallpapers are intentionally not generated** — see
  `assets/wallpapers/README.md`.

## 1. Start here

| If you need... | Go to |
|---|---|
| Understand the pack | [README.md](README.md) |
| Turn a phone image into desktop | [guides/02-mobile-to-desktop.md](guides/02-mobile-to-desktop.md) |
| A command/recipe fast | [guides/15-cheatsheet.md](guides/15-cheatsheet.md) |
| ImageMagick recipes | [guides/03-imagemagick.md](guides/03-imagemagick.md) |
| Color/palette strategy | [guides/06-color.md](guides/06-color.md) |
| Composition/safe zones | [guides/07-composition.md](guides/07-composition.md) |
| Typography in images | [guides/08-typography.md](guides/08-typography.md) |
| Wallpaper craft/QA | [guides/11-wallpaper-craft.md](guides/11-wallpaper-craft.md) |
| Licensing | [guides/13-licensing.md](guides/13-licensing.md) |
| External links | [resources/](resources/) |

## 2. Assets

### Palettes

- [JSON](assets/palettes/json/) · [CSS](assets/palettes/css/) ·
  [all palettes JSON](assets/palettes/all-palettes.json)
- [All CSS](assets/palettes/css/all-palettes.css) ·
  [role tokens](assets/palettes/css/role-tokens.css)
- Sources: Catppuccin, Rose Pine, Radix, Tailwind, Open Color, Nord, Gruvbox,
  Tokyo Night, Kanagawa, Everforest, Flexoki, Solarized, Dracula, One Dark,
  Material 3 baseline.

### Gradients

- [Gradient index](assets/gradients/README.md)
- 24 linear + 8 mesh families; editable SVG sources in
  [assets/gradients/svg/](assets/gradients/svg/).

### Patterns

- [Pattern index](assets/patterns/README.md)
- 13 transparent SVGs.

### Safe-zone guides

- [Guide index](assets/guides/README.md)
- Transparent PNGs for 7 canvas sizes.

### Fonts, icons, textures

- [Font manifest](assets/fonts/README.md) — 12 OFL families, upstream links.
- [Icon manifest](assets/icons/README.md) — 21,691 icons, upstream links.
- [Texture manifest](assets/textures/README.md) — CC0 sources and recipes.
- [Wallpapers](assets/wallpapers/README.md) — empty by design.

## 3. Tools

The reduced pack uses system tools. See [docs/toolchain-2026.md](docs/toolchain-2026.md).

| Tool | Use |
|---|---|
| ImageMagick | compositing, text, effects, batch, conversion |
| FFmpeg | sequences, loops, video, codecs |
| libvips | large images, thumbnails, smartcrop |
| Real-ESRGAN (optional) | 4x upscale |
| ExifTool (optional) | metadata/licensing |
| Python + Pillow/colorthief/smartcrop | palettes, smart crop, automation |
| rsvg-convert | SVG to raster |

CLI:

```bash
cd design-arsenal
./scripts/setup.sh
./scripts/wallpaper doctor
```

## 4. Pipeline commands

```text
wallpaper inspect     dimensions, format, color, metadata
wallpaper palette     JSON/CSS/GPL/swatches + roles
wallpaper fit         cover/contain/smart crop
wallpaper extend      blur/solid/gradient/mirror/edge
wallpaper upscale     Real-ESRGAN 4x (GPU) or Lanczos fallback
wallpaper optimize    WebP/AVIF/JXL/PNG/JPEG + strip
wallpaper batch       preset-driven batch
wallpaper contact     contact sheet
wallpaper animate     FFmpeg gradient loop
wallpaper ratios      sizes and aspect math
wallpaper doctor      dependency check
```

## 5. External resources

| File | Contents |
|---|---|
| [resources/tools.md](resources/tools.md) | Open-source image/design tools, licenses, alternatives |
| [resources/design-systems.md](resources/design-systems.md) | Material 3, Apple HIG, Carbon, Polaris, Primer, Fluent, GOV.UK, Radix, shadcn, ... |
| [resources/architecture.md](resources/architecture.md) | Built architecture, photography, information architecture |
| [resources/color.md](resources/color.md) | Palettes, generators, OKLCH, contrast, accessibility |
| [resources/typography.md](resources/typography.md) | Type foundries, pairing, scales, learning |
| [resources/icons.md](resources/icons.md) | Icon sets, search, usage, licenses |
| [resources/image-sources.md](resources/image-sources.md) | Stock, museums, NASA/ESA, APIs, licensing |
| [resources/textures.md](resources/textures.md) | CC0 textures, patterns, overlays, recipes |
| [resources/inspiration.md](resources/inspiration.md) | Galleries, moodboards, anti-patterns |
| [resources/learning.md](resources/learning.md) | Design, image craft, UX, accessibility |
| [resources/generative-ai.md](resources/generative-ai.md) | Real-ESRGAN, IOPaint, ComfyUI, generative art |
| [resources/wallpaper-tools.md](resources/wallpaper-tools.md) | hyprpaper, swww, mpvpaper, matugen, wallust |

## 6. Guides

| # | Guide |
|---|---|
| 00 | [Index](guides/00-index.md) |
| 01 | [Image toolchain](guides/01-image-toolchain.md) |
| 02 | [Mobile to desktop](guides/02-mobile-to-desktop.md) |
| 03 | [ImageMagick](guides/03-imagemagick.md) |
| 04 | [FFmpeg](guides/04-ffmpeg.md) |
| 05 | [libvips](guides/05-libvips.md) |
| 06 | [Color workflow](guides/06-color.md) |
| 07 | [Composition](guides/07-composition.md) |
| 08 | [Typography](guides/08-typography.md) |
| 09 | [Design systems](guides/09-design-systems.md) |
| 10 | [Architecture](guides/10-architecture.md) |
| 11 | [Wallpaper craft](guides/11-wallpaper-craft.md) |
| 12 | [Optimization](guides/12-optimization.md) |
| 13 | [Licensing](guides/13-licensing.md) |
| 14 | [Generative](guides/14-generative.md) |
| 15 | [Cheatsheet](guides/15-cheatsheet.md) |

## 7. Metadata and licenses

- [versions.md](meta/versions.md) — tool and asset versions.
- [notes.md](meta/notes.md) — build and install notes.
- [linkcheck-summary.md](meta/linkcheck-summary.md) — last external link check.
- [LICENSE.md](LICENSE.md) — pack and third-party licensing.
- [docs/sources.md](docs/sources.md) — primary sources and verification.
