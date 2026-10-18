---
name: color-and-type
description: Color and typography system for design work — palette extraction, semantic roles, OKLCH, contrast, dark mode, font pairing, type scales and text rendering in SVG/ImageMagick. Use when choosing colors/type, building tokens, or fixing legibility.
---

# Color and type

## Palettes

This pack ships 118 palettes with source and license in each JSON. Families:
Catppuccin, Rose Pine, Radix, Tailwind, Open Color, Nord, Gruvbox, Tokyo Night,
Kanagawa, Everforest, Flexoki, Solarized, Dracula, One Dark, Material 3.

Workflow:

```bash
wallpaper palette photo.jpg --colors 8 --out photo-palette
```

The JSON includes colors with shares and suggested roles. Treat roles as
heuristics; correct them for monochrome or strong casts.

## Role model

- `background` — 60-70% of the area.
- `surface` — raised layer, +4-8% luminance in dark mode.
- `text` — high contrast, off-white/off-black.
- `muted` — metadata, secondary.
- `accent` — 5-10%, one primary.
- `accent-2` — optional, use sparingly.

## Contrast

WCAG AA: 4.5:1 normal text, 3:1 large. For wallpaper text, aim higher (7:1)
because of distance, grain and scaling. Measure against the composited
background (image + scrim + grain).

```python
def lum(h):
    c = [int(h[i:i+2], 16) / 255 for i in (1, 3, 5)]
    c = [x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4 for x in c]
    return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]

def ratio(a, b):
    la, lb = lum(a), lum(b)
    return (max(la, lb) + .05) / (min(la, lb) + .05)
```

## Dark mode

Not an inversion. Off-black background, off-white text, slightly more saturated
accents, lighter surfaces for elevation, subtle borders instead of heavy
shadows. Dim images 5-15% so they sit in the field.

## Type

Included upstream (OFL 1.1): Inter, JetBrains Mono, Space Grotesk, Fraunces,
Bricolage Grotesque, Manrope, Outfit, Instrument Serif, Libre Franklin, Sora,
Archivo, DM Sans.

Pairings:

| Display | Text | Mood |
|---|---|---|
| Instrument Serif | Inter | editorial |
| Fraunces | Manrope | warm |
| Space Grotesk | JetBrains Mono | tech |
| Bricolage Grotesque | DM Sans | poster |
| Archivo 800 | Archivo 400 | brutalist |
| Outfit 300 | Outfit 600 | minimal |

At 4K: headline 160-320 px, subhead 56-96, body 36-48, label 24-32. Halve for
1440p/1080p. Large display: tracking -1% to -3%; small uppercase: +2% to +8%.

## Rendering

- SVG + rsvg-convert for layout control; keep the SVG editable.
- ImageMagick `-annotate` for one-liners.
- `font-family` names must exist in fontconfig (`fc-match`).
- Avoid pure white on pure black for long text.
- Add a scrim behind text on photos.
- Check accents, quotes, em dashes and line breaks at 100%.

References: `references/palette-workflow.md`, `references/typography.md`.
