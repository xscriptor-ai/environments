---
name: design-arsenal
description: Reduced design-arsenal reference for image processing, design systems, color/type, architecture and wallpaper craft. Use when choosing tools, locating assets, planning a reproducible design/image pipeline, or deciding between ImageMagick, libvips, FFmpeg, SVG and AI tools.
---

# Design Arsenal (October 2026)

A compact design environment: 118 palettes, 32 SVG gradients, 13 SVG patterns,
7 safe-zone guides, a portable image pipeline and deep references for image,
color, type, architecture, design systems and licensing.

## Inventory

- `assets/palettes/` — 118 palettes: `json/` (colors + source + license +
  suggested roles), `css/` (per palette, `all-palettes.css`, `role-tokens.css`).
- `assets/gradients/svg/` — 32 editable gradients (linear + mesh).
- `assets/patterns/` — 13 transparent SVG patterns.
- `assets/guides/` — safe-zone overlays for desktop, ultrawide, mobile, tablet,
  square.
- `assets/textures/overlays/vignette.png` — one alpha overlay.
- `assets/fonts/`, `assets/icons/`, `assets/textures/` — manifests only; fetch
  upstream.
- `scripts/` — `wallpaper` CLI, `wa_palette.py`, `wa_smartcrop.py`, `setup.sh`.
- `docs/` — toolchain, mobile→desktop, recipes, references, asset manifest, QA.

## Tool decision matrix

| Task | First choice |
|---|---|
| Compose/grade/text/grain/vignette | ImageMagick |
| Batch thumbnails or huge images | libvips |
| Sequences, animated gradients, video | FFmpeg |
| Content-aware crop | `wallpaper fit --mode smart` |
| Palette extraction | `wallpaper palette` |
| 4x upscale | Real-ESRGAN; Lanczos otherwise |
| SVG layout/icons/patterns | SVG + rsvg-convert |
| Metadata/licensing | ExifTool |
| PNG optimization | oxipng |
| Vector editing | Inkscape/Penpot |
| Raster editing | GIMP/Krita |

## Standard workflow

1. Brief: format, audience, source, license, targets.
2. Direction: palette + type + composition logic.
3. Prepare: orient, crop, upscale, extend.
4. Compose: subject sharp, field designed, safe zones respected.
5. Unify: grain, vignette, scrim, color temperature.
6. QA: thumbnail, 100%, grayscale, occupied desktop.
7. Manifest: source, license, recipe, dimensions, changes.

## Hard rules

- Recompose phone→desktop; never stretch.
- Keep icon/panel/dock zones calm.
- One accent; one display family; few sizes.
- Measure contrast on the composited background.
- Deterministic methods before AI.
- No asset ships without a license record.
- No wallpapers are bundled; wait for a brief.

## Reduced edition

The full local arsenal is about 396 MB (bundled fonts, 21,691 icons, photo
textures, raster gradients, tool binaries). This pack keeps the text assets and
manifests; see `docs/asset-manifest.md` to expand it.

References: `references/toolchain.md`, `references/assets.md`.
