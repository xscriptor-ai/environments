# Asset map

## Palettes

- 118 entries. Families: Catppuccin (4), Rose Pine (3), Radix (62),
  Tailwind (22), Open Color (14), Nord, Gruvbox, Tokyo Night (3), Kanagawa,
  Everforest, Flexoki, Solarized (2), Dracula, One Dark, Material 3 baseline.
- JSON fields: `name`, `slug`, `source`, `license`, `dark`, `colors[]`,
  `roles` (`background`, `surface`, `text`, `accent`, `accent_2`).
- CSS: `[data-palette="slug"] { --color: #hex; ... }`; `role-tokens.css`
  exposes semantic tokens; `all-palettes.css` concatenates all.

## Gradients

- 24 linear + 8 mesh SVG sources. Rasterize to 4K 3840x2160, mobile 1440x3200,
  ultrawide 5120x1440. Add 1-2% grain after rasterization.

## Patterns

- 13 transparent SVGs: dots, dots-grid, grid, grid-fine, diagonal, crosshatch,
  chevron, waves, hex, triangles, plus, halftone, rings.

## Guides

- Transparent PNGs: desktop 4K/1440p/16:10, ultrawide 32:9, mobile 9:20,
  tablet 3:4, square. Composite over drafts for safe-zone checks.

## Omitted (fetch upstream)

- Fonts: 12 OFL families (Google Fonts).
- Icons: Lucide ISC 1,891; Tabler MIT 5,184; Phosphor MIT 9,072; Simple Icons
  CC0 3,466; Bootstrap MIT 2,078.
- Photo textures: Poly Haven and ambientCG CC0.
- Heavy overlays (grain, light leaks, bokeh, halftone, topographic) and raster
  gradient sets.
- Tool binaries and the 396 MB local full edition.
