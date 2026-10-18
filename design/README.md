# Design Pack — agents, skills, commands and assets (October 2026)

A compact design environment for AI coding assistants: image pipeline, color and
type systems, architecture and design-system references, mobile-to-desktop
wallpaper craft, licensing, and a small set of reusable assets.

This is the reduced edition of the local `design-arsenal` (396 MB). The pack
keeps the knowledge and the text-based assets; binaries, bundled fonts/icons,
photo textures and generated wallpaper rasters are intentionally omitted
(download or regenerate them when needed). Current pack size: about 2 MB.

## Contents

- `agents/` — 6 specialized subagents (opencode frontmatter, allow permissions):
  - `design-arsenal` — router and orchestrator for visual design work.
  - `wallpaper-architect` — mobile→desktop composition, series, safe zones, QA.
  - `image-pipeline-engineer` — ImageMagick, libvips, FFmpeg, Real-ESRGAN, batch.
  - `color-type-director` — palette extraction, semantic roles, contrast, typography.
  - `design-systems-architect` — tokens, systems, documentation, governance.
  - `licensing-provenance` — image/font/model licenses, attribution, provenance.
- `skills/` — 6 deep-reference skills with `references/`:
  - `design-arsenal` — inventory, toolchain, asset map, decision matrix.
  - `wallpaper-craft` — ratios, extension methods, safe zones, QA, series design.
  - `image-pipeline` — recipes and format/quality strategy.
  - `color-and-type` — palettes, roles, OKLCH, contrast, font pairing.
  - `architecture-design` — built architecture, information architecture, design systems.
  - `design-licensing` — CC/OFL/MIT/GPL/Apache, attribution, AI rights.
- `commands/` — `/design-doctor`, `/design-brief`, `/design-palette`, `/wallpaper-convert`.
- `docs/` — toolchain 2026, mobile→desktop method, image recipes, design references,
  asset manifest, QA checklist.
- `assets/` — 118 palettes (JSON + CSS), 32 SVG gradients, 13 SVG patterns,
  7 safe-zone guides, 1 vignette overlay, manifests for fonts/icons/textures.
- `scripts/` — portable `wallpaper` CLI, `wa_palette.py`, `wa_smartcrop.py`,
  `setup.sh`, `requirements.txt`.

## Install

```bash
# Agents (flat copy, as opencode expects)
cp agents/*.md ~/.config/opencode/agents/
# Skills (one folder per skill)
cp -r skills/* ~/.config/opencode/skills/
# Commands
cp commands/*.md ~/.config/opencode/commands/
```

Restart opencode after copying. Agents ship with allow permissions, like the
other packs in this repository.

For the image pipeline:

```bash
cd design
./scripts/setup.sh        # creates .venv, installs Pillow/colorthief/smartcrop
./scripts/wallpaper doctor
```

System tools: ImageMagick 7, FFmpeg, librsvg (`rsvg-convert`), jq. Optional:
libvips, Real-ESRGAN ncnn Vulkan, ExifTool, oxipng. See
`docs/toolchain-2026.md` for Arch commands.

## Quick start

```bash
# extract a palette and semantic roles
./scripts/wallpaper palette photo.jpg --colors 8 --out photo-palette

# content-aware crop
./scripts/wallpaper fit photo.jpg --size 3840x2160 --mode smart --out wide.jpg

# extend a phone source into a desktop field
./scripts/wallpaper extend photo.jpg --size 3840x2160 --method blur \
  --scale 0.92 --grain --vignette --out desktop.jpg

# 4x upscale when the source is too small
./scripts/wallpaper upscale photo.jpg --scale 4 --out photo-4x.png

# batch a folder with a preset
./scripts/wallpaper batch ./photos --preset desktop-4k --out ./desktop
```

No wallpapers are bundled; `assets/wallpapers/` is intentionally empty. The
pipeline exists to produce them once a brief is defined.

## Design baseline (verified October 2026)

- ImageMagick 7.1.2, FFmpeg 9.0, libvips 8.18, Real-ESRGAN ncnn Vulkan 2022,
  ExifTool 13.59, rsvg-convert 2.63, Pillow 13, smartcrop 0.5.
- GIMP 3.2, Krita 6.0, Inkscape 1.4, darktable 5.6, RawTherapee 5.13,
  Blender 5.2, Scribus 1.6, FontForge 2025 are the current Arch packages.
- Palettes: Catppuccin, Rose Pine, Radix, Tailwind, Open Color, Nord, Gruvbox,
  Tokyo Night, Kanagawa, Everforest, Flexoki, Solarized, Dracula, One Dark,
  Material 3 baseline.
- Fonts: 12 OFL families (Inter, JetBrains Mono, Space Grotesk, Fraunces,
  Bricolage Grotesque, Manrope, Outfit, Instrument Serif, Libre Franklin, Sora,
  Archivo, DM Sans).

## Design rules this pack enforces

1. A phone image is recomposed for desktop, never stretched.
2. The subject stays sharp; the field is designed (blur, solid, gradient,
   mirror or edge).
3. Keep icon, panel and dock zones calm.
4. Measure text contrast against the composited background, not the base color.
5. One accent, one display family, few sizes.
6. Unify layers with grain, light and color temperature.
7. Record source, license, recipe and dimensions for every final asset.
8. Procedural and deterministic methods first; AI only for gaps.

## License

Pack documentation and scripts follow the repository's MIT license. Generated
SVG gradients, patterns and guides are CC0. Palette data retains the upstream
license recorded in each JSON. No fonts, icons, photo textures or wallpapers are
redistributed in this reduced edition. See `LICENSES.md`.
