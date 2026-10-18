# Color and palettes

## Palettes included

- **118 palettes** normalized in `assets/palettes/`:
  - JSON (`json/`), CSS (`css/`), previews are not bundled in the reduced
    edition.
  - `all-palettes.json`, per-palette CSS, `all-palettes.css` and
    `role-tokens.css`.
- Family: Catppuccin (4), Rose Pine (3), Radix (62), Tailwind (22), Open Color
  (14), Nord, Gruvbox, Tokyo Night (3), Kanagawa, Everforest, Flexoki,
  Solarized (2), Dracula, One Dark, Material 3 Baseline.
- `role-tokens.css` — semantic tokens (`background`, `surface`, `text`,
  `accent`, `accent-2`) derived by luminance/saturation.

## Extract color from an image

```bash
scripts/wallpaper palette photo.jpg --colors 8 --out photo-palette
```

Produces JSON with percentages, CSS, GPL, HEX list and a swatch PNG. The `roles`
field proposes background/surface/text/accent; adjust it by hand if the image is
too monochromatic.

## Color in three layers

1. **Perceptual / image** — sample a photo, wallpaper, texture.
2. **System** — scales and roles (bg, surface, text, accent, danger...).
3. **Accessibility** — real contrast in the final context.

## Tools

### Explore and generate

- [Coolors](https://coolors.co/) — fast generator, exports PNG/CSS.
- [Color Hunt](https://colorhunt.co/) — community-curated palettes.
- [Adobe Color](https://color.adobe.com/create/color-wheel) — harmony wheel.
- [Huemint](https://huemint.com/) — brand/UI palettes.
- [Realtime Colors](https://www.realtimecolors.com/) — preview palettes in UI.
- [ColorBox](https://www.colorbox.io/) — Lyft color scales.
- [OKLCH Color Picker](https://oklch.com/) — modern perceptual space.
- [Color.js](https://colorjs.io/) — color library and playground.

### Scales and systems

- [Radix Colors](https://www.radix-ui.com/colors) — 12 steps, light/dark, P3.
- [Open Color](https://yeun.github.io/open-color/) — 13 hues x 10 steps.
- [Tailwind Colors](https://tailwindcss.com/docs/colors) — standard UI scale.
- [Material 3 — Color roles](https://m3.material.io/styles/color/roles) — tonal roles.
- [Catppuccin](https://catppuccin.com/) — 4 flavors, 26 roles.
- [Rose Pine](https://rosepinetheme.com/) — soft aesthetic.
- [Nord](https://www.nordtheme.com/) — arctic blue.
- [Gruvbox](https://github.com/morhetz/gruvbox) — warm retro.
- [Tokyo Night](https://github.com/folke/tokyonight.nvim) — nocturnal blue.
- [Kanagawa](https://github.com/rebelot/kanagawa.nvim) — Great Wave.
- [Everforest](https://github.com/sainnhe/everforest) — forest green.
- [Flexoki](https://stephango.com/flexoki) — ink on paper.
- [Solarized](https://ethanschoonover.com/solarized/) — precision and contrast.
- [Dracula](https://draculatheme.com/) — iconic dark theme.

### Contrast and accessibility

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Who Can Use](https://whocanuse.com/)
- [Color Review](https://color.review/)
- [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/)
- [W3C CSS Color 4](https://www.w3.org/TR/css-color-4/) — `oklch()`, `color()`, gamut.
- [W3C CSS Color 5](https://www.w3.org/TR/css-color-5/) — `color-mix()`.

## Practical rules

- One accent works best against a neutral background; two accents compete.
- In dark mode, raise saturation slightly and lower accent luminance; pure white
  is tiring.
- For wallpapers, the dominant color and accent must survive blur: avoid palettes
  where every value sits at the same level.
- Use 5-9 step scales, not 20 indistinguishable grays.
- Measure text contrast against the final composited background (image + scrim +
  grain), not the base color.
- Brand color is not always UI color: separate identity from system.
- Test in P3 and sRGB; not every monitor sees the same thing.
- Save the source and license of each palette (already in the JSON).

## Useful commands

```bash
# dominant palette
magick photo.jpg -resize 200x -colors 10 -unique-colors txt:- | head -20

# average of a region
magick photo.jpg -crop 20%x20%+0+0 +repage -resize 1x1! \
  -format '%[hex:p{0,0}]\n' info:

# two-color gradient
magick -size 3840x2160 gradient:'#0e7490-#fbbf24' bg.webp

# WCAG contrast (example)
python3 - <<'PY'
def lum(h):
    c=[int(h[i:i+2],16)/255 for i in (1,3,5)]
    c=[x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in c]
    return .2126*c[0]+.7152*c[1]+.0722*c[2]
a,b=lum('#f8fafc'),lum('#0f172a')
print((max(a,b)+.05)/(min(a,b)+.05))
PY
```
