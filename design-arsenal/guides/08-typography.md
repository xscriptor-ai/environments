# 08 — Typography for image work

## 1. The type system

Pick 1-2 families:

- **Display** — the voice: Fraunces, Instrument Serif, Bricolage Grotesque,
  Space Grotesk, Archivo.
- **Text/UI** — the clarity: Inter, Manrope, DM Sans, Libre Franklin, Sora.
- **Mono** — metadata, coordinates, labels: JetBrains Mono.

A single family with weight contrast is often stronger than two families.

## 2. Scale for wallpapers

At 4K, the viewing distance is about 60-100 cm; at TV distance, 2-3 m. Use large
steps:

```text
headline   160-320 px
subhead     56-96 px
body        36-48 px
label       24-32 px
```

At 1440p, halve; at 1080p, halve again. Avoid five sizes that are too close.

## 3. Layout

- Align to a grid/thirds, not to the edge by accident.
- Margins: 6-10% of the shorter side for desktop; 8-12% for mobile.
- One idea per piece; one headline, one supporting line.
- Keep line length 30-60 characters for display text.
- Use uppercase + tracking for labels; sentence case for headlines.
- Avoid centered body text; centered headlines are fine for monumental pieces.
- Leave the icon/dock zones free.

## 4. Contrast and legibility

- Text over a photo needs a scrim, a shadow or a calm area.
- White text on a busy sky is not enough; add a gradient or a solid panel.
- Check contrast at the **composited** background, including grain.
- Thin weights disappear at a distance; use 400+ for small text, 300+ for large.
- Avoid pure white on pure black for long text; use off-white/off-black.

## 5. Rendering text

### ImageMagick

```bash
magick base.jpg -gravity southwest -font 'Inter' -pointsize 56 -fill white \
  -annotate +120+120 'STILL / 01' out.jpg
```

- Font family must be known to fontconfig (`fc-match 'Inter'`).
- For multi-line layout, use SVG.

### SVG + rsvg

```html
<svg xmlns="http://www.w3.org/2000/svg" width="3840" height="2160">
  <rect width="100%" height="100%" fill="#0b1026"/>
  <text x="240" y="1080" font-family="Instrument Serif" font-size="280"
        fill="#f4f4f5">Stillness</text>
  <text x="248" y="1180" font-family="JetBrains Mono" font-size="32"
        fill="#a1a1aa" letter-spacing="4">NORTH / 64</text>
</svg>
```

```bash
rsvg-convert -w 3840 -h 2160 poster.svg -o poster.png
```

- SVG gives precise positioning, letter-spacing, multiple lines and shapes.
- Keep the SVG as the editable source; rasterize at the end.
- Use `text-anchor="middle"` for centered text.
- For text on a path, SVG `textPath` is available.

### Variable fonts

- The fonts listed in `assets/fonts/README.md` are variable. In SVG, use
  `font-weight="300"`, `font-variation-settings`, etc.
- In ImageMagick, variable font support depends on the fontconfig/Pango build;
  test the weight. If it fails, render with SVG or use a static instance.
- For web, `@font-face` with `font-weight: 100 900`.

## 6. Pairing recipes

| Display | Text | Mood |
|---|---|---|
| Instrument Serif | Inter | editorial, elegant |
| Fraunces | Manrope | warm, contemporary |
| Space Grotesk | JetBrains Mono | tech, precise |
| Bricolage Grotesque | DM Sans | playful, poster |
| Archivo (800) | Archivo (400) | brutalist, single-family |
| Outfit (300) | Outfit (600) | minimal, geometric |
| Libre Franklin (700) | Libre Franklin (400) | news, trustworthy |

## 7. Type as image

- A giant single word can be the wallpaper.
- Crop the type intentionally; let it bleed off the canvas.
- Use a condensed/wide variable axis if available.
- Pair a huge word with a tiny mono label for scale contrast.
- Do not use more than two type colors; let the background do the work.
- Convert to outlines only if you need to share the piece without fonts.

## 8. Licensing

- The 12 recommended families are OFL 1.1; commercial use is allowed.
- Keep the license files.
- Do not redistribute the fonts as a standalone product.
- For client work, confirm the client has the right to use the font files.
- If you use a font from elsewhere, check its license before embedding.

## 9. Checks

- `fc-match 'Family'` — is it installed?
- `fc-list | grep -i family` — exact name.
- Render at final size; small text can look fine at 50% and break at 100%.
- Check accents, ñ, ü, €, quotes, em dashes.
- Check line breaks in SVG; they do not reflow automatically.
- Check the type against the busiest part of the image.
