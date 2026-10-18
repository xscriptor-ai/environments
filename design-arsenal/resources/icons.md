# Icons and symbols

## Upstream sets (not bundled in the reduced edition)

| Set | Count | Style | License | Source |
|---|---:|---|---|---|
| [Lucide](https://lucide.dev/) | 1,891 | outline 24 px, stroke | ISC | https://github.com/lucide-icons/lucide |
| [Tabler](https://tabler.io/icons) | 5,184 | outline + filled, 24 px | MIT | https://github.com/tabler/tabler-icons |
| [Phosphor](https://phosphoricons.com/) | 9,072 | 6 weights | MIT | https://github.com/phosphor-icons/core |
| [Simple Icons](https://simpleicons.org/) | 3,466 | brand marks | CC0 | https://github.com/simple-icons/simple-icons |
| [Bootstrap Icons](https://icons.getbootstrap.com/) | 2,078 | UI, 16/20/24 | MIT | https://github.com/twbs/icons |

The full local design-arsenal bundles the SVGs. Search them with:

```bash
find assets/icons -iname '*arrow*' | head -30
rg -l 'architecture' assets/icons | head
```

### Additional recommended sets

- [Material Symbols](https://fonts.google.com/icons) — 3 variable styles, Google.
- [Heroicons](https://heroicons.com/) — outline/solid, Tailwind.
- [Iconoir](https://iconoir.com/) — clean outline, MIT.
- [Remix Icon](https://remixicon.com/) — 2 styles, broad.
- [Feather](https://feathericons.com/) — minimalist (archived).
- [Font Awesome Free](https://fontawesome.com/search?o=r&m=free) — brands and UI.
- [Octicons](https://primer.style/foundations/icons/) — GitHub.
- [Iconmonstr](https://iconmonstr.com/) — free, attribution optional.
- [SVGRepo](https://www.svgrepo.com/) — aggregator, check license per icon.
- [The Noun Project](https://thenounproject.com/) — paid, large curation.
- [Streamline](https://www.streamlinehq.com/) — freemium.

## Usage rules

- **One set** per interface; mixing styles is noticeable.
- Keep the same stroke width and corner radius.
- Base sizes: 16, 20, 24, 32 px; align to the grid.
- Do not scale 24 px icons to 96 px without redrawing: the stroke gets
  unbalanced.
- Use `currentColor` when possible; it makes theming easier.
- Icons do not replace labels for destructive or ambiguous actions.
- For brands, use Simple Icons and respect trademarks.
- In wallpaper, a very large simple icon can be the visual anchor; a detailed
  icon gets lost with grain and blur.

## Recipes

```bash
# convert an icon to a white 512 px PNG
magick -background none assets/icons/lucide/house.svg -resize 512x512 \
  -fill white -colorize 100 icon-white.png

# tint while preserving transparency
magick -background none icon.svg -fill '#89b4fa' -colorize 100 icon-tint.png

# contact sheet for a folder
magick montage assets/icons/lucide/*.svg -thumbnail 64x64 \
  -tile 16x -geometry +8+8 -background '#0b0b0f' -fill white lucide-sheet.png

# search by name and count
find assets/icons -iname '*star*.svg' | wc -l
```

## Licensing and attribution

- **ISC / MIT**: free use; keep the copyright notice.
- **CC0 (Simple Icons)**: public-domain dedication; brand marks remain the
  property of their owners. No endorsement implied.
- Keep the license file with any subset you vendor.
