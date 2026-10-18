# 06 — Color workflow

## 1. Extract from the image

```bash
scripts/wallpaper palette phone.jpg --colors 8 --out phone-palette
```

Output:

- `<slug>.json` — colors with RGB, HEX, share and suggested roles.
- `<slug>.css` — variables.
- `<slug>.gpl` — GIMP palette.
- `<slug>.hex` — plain list.
- `<slug>.png` — swatch preview.

## 2. Read the result like a designer

- **Share** tells you what dominates. A color with 2% share is an accent, not a
  background.
- **Roles** are heuristics:
  - `background`: darkest (dark) or lightest (light).
  - `surface`: second darkest/lightest.
  - `text`: opposite extreme.
  - `accent`: most saturated mid-tone.
- If the image is monochrome, the roles are weak. Choose manually.
- If the image has a strong cast, the palette will inherit it. Correct the image
  first or compensate in the field color.

## 3. Build a working palette

For a wallpaper set, use 5-7 colors:

1. **Field** — 60-70% of the area. Usually a dark/light neutral or a sampled color.
2. **Field variant** — for gradient depth.
3. **Subject/photo** — the image itself.
4. **Accent** — type, rule, small shape. 5-10%.
5. **Accent 2** — optional; use sparingly.
6. **Text** — high contrast.
7. **Muted text** — metadata.

```css
:root {
  --bg: #0b1026;
  --surface: #121a33;
  --text: #f4f4f5;
  --muted: #a1a1aa;
  --accent: #2dd4bf;
  --accent-2: #fbbf24;
}
```

## 4. Contrast

WCAG AA: 4.5:1 for normal text, 3:1 for large text (at least 24 px or 19 px
bold). For wallpaper text viewed at a distance, aim higher (7:1) because of
grain, scaling and ambient light.

```python
def lum(h):
    c = [int(h[i:i+2], 16) / 255 for i in (1, 3, 5)]
    c = [x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4 for x in c]
    return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]

def ratio(a, b):
    la, lb = lum(a), lum(b)
    return (max(la, lb) + .05) / (min(la, lb) + .05)
```

Always measure against the **composited** background: image + scrim + grain.

## 5. Dark mode

- Do not invert. Rebuild.
- Background: near-black but not pure black (`#0b0b0f`-`#18181b`); pure black
  hides shadows and can smear on OLED.
- Surface: +4-8% luminance, not a different hue.
- Text: off-white (`#e4e4e7`), not `#fff`.
- Accents: increase saturation slightly; decrease brightness.
- Elevation: use lighter surfaces + subtle borders, not heavy shadows.
- Images: dim 5-15% and reduce contrast slightly to sit in the dark field.

## 6. Light mode

- Background: warm/cool off-white, not pure white.
- Text: near-black (`#18181b`), not `#000`.
- Accents need more chroma to survive on white.
- Shadows are softer and cooler; borders do more work than shadows.

## 7. Material You / dynamic color

Material 3 derives a tonal palette from a seed color (often from the wallpaper).
Tools:

- [matugen](https://github.com/InioX/matugen) — Material You colors and templates
  from an image.
- [wallust](https://github.com/explosion-mental/wallust) — fast palette/template
  generator.
- [pywal16](https://github.com/eylles/pywal16) — classic pywal fork.
- [Material Theme Builder](https://material-foundation.github.io/material-theme-builder/)
  — visual exploration.

`assets/palettes/json/material-3-baseline.json` gives the baseline roles. Use it
as a reference, not a constraint.

## 8. Color grading a source

```bash
# neutralize a cast with curves (example: reduce blue in shadows)
magick in.jpg -channel B -level 0%,96% +channel out.jpg

# warm the highlights
magick in.jpg -fill '#ffb86c' -colorize 6% out.jpg

# cinematic teal/orange split (approximate)
magick in.jpg \( +clone -fill '#0e7490' -colorize 30% \) \
  \( +clone -fill '#fb923c' -colorize 20% \) -delete 0 \
  -compose blend -define compose:args=50 -composite out.jpg
```

## 9. Common mistakes

- Too many accents.
- Low contrast text over a photo without a scrim.
- Pure black + pure white (harsh, banding).
- Saturated background + saturated subject (vibration).
- Ignoring the color profile (sRGB vs P3 vs Adobe RGB).
- Forgetting that blur changes perceived saturation and lightness.
- Using a palette from a different image "because it looks nice" without
  checking temperature continuity.

## 10. Resources

See `../resources/color.md` for the full link catalog: Coolors, Huemint,
Realtime Colors, OKLCH, Radix, Open Color, Catppuccin, contrast checkers.
