---
description: Extract a palette from an image and turn it into semantic roles, CSS tokens and contrast checks
agent: color-type-director
---

Given an image, produce a usable palette and role system.

1. Run `scripts/wallpaper palette IMAGE --colors 8 --out DIR`.
2. Read the generated JSON: dominant colors, shares, suggested roles.
3. Correct the roles if the image is monochrome or has a strong cast:
   background, surface, text, muted text, accent, accent-2.
4. Compute WCAG contrast for text/background and accent/background; report ratios
   and whether they meet AA (4.5:1 normal, 3:1 large) and AAA where relevant.
5. Produce:
   - `palette.json` (source, license, colors, roles, contrast);
   - CSS variables;
   - a GIMP palette if requested;
   - a one-line usage recommendation (field/accent/text proportions).
6. If the image is for a wallpaper, suggest how the palette changes after blur,
   darkening and grain.

Do not invent source or license fields. If unknown, say unknown.

$ARGUMENTS
