# Design Arsenal — guides

This directory is the full working manual. The curated link catalog lives in
`../resources/`, the assets in `../assets/`, and the portable CLI in
`../scripts/`.

## Read in this order

1. **01-image-toolchain.md** — what each tool is for and how to install it.
2. **02-mobile-to-desktop.md** — the core method for turning 9:16 sources into
   desktop wallpapers without destroying the subject.
3. **03-imagemagick.md** — the recipe book: crop, extend, blur, grain, text,
   shadows, palettes, batch.
4. **04-ffmpeg.md** — image sequences, animated gradients, loops, video walls.
5. **05-libvips.md** — large images, thumbnails, smartcrop at speed.
6. **06-color.md** — extraction, roles, OKLCH, contrast, dark mode.
7. **07-composition.md** — ratios, safe zones, focal hierarchy, negative space.
8. **08-typography.md** — type in images, scales, pairing, rendering.
9. **09-design-systems.md** — tokens, architecture, documentation.
10. **10-architecture.md** — built space, information architecture, visual structure.
11. **11-wallpaper-craft.md** — genres, light, grain, multi-monitor, QA.
12. **12-optimization.md** — formats, sizes, metadata, batch QA.
13. **13-licensing.md** — CC, OFL, MIT, GPL, attribution templates.
14. **14-generative.md** — procedural and AI-assisted workflows.
15. **15-cheatsheet.md** — fast commands and ratios.

## Conventions

- Run commands from the pack root (`design-arsenal/`) unless stated otherwise.
- Outputs go to `work/` or a project folder while experimenting; final assets go
  to `assets/` or the project folder.
- Prefer non-destructive pipelines: keep the original, write a new file, record
  the command/recipe.
- The pack is designed so that **no wallpaper is generated until the brief is
  explicit**. `assets/wallpapers/` is intentionally empty.

## Reduced edition

The full local design-arsenal bundles fonts, icons, photo textures, raster
gradients and tool binaries. This repository edition keeps the documentation,
palettes, SVG sources, patterns, guides and portable scripts. See
`../docs/asset-manifest.md` for the exact inventory and how to expand it.
