# Palette workflow

## Extract

```bash
wallpaper palette image.jpg --colors 8 --out image-palette
```

Outputs: JSON, CSS, GPL, HEX, swatch PNG.

## Interpret

- Share: dominant vs accent.
- Luminance: background/text candidates.
- Saturation: accent candidates.
- Temperature: warm/cool continuity with the source.

## Build roles

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

## Dark mode

- Background near-black, not pure black.
- Surface +4-8% luminance.
- Text off-white.
- Accent more saturated, slightly darker.
- Borders and elevation instead of heavy shadows.

## Sources

- Material 3 color roles: https://m3.material.io/styles/color/roles
- Radix Colors: https://www.radix-ui.com/colors
- Open Color: https://yeun.github.io/open-color/
- OKLCH picker: https://oklch.com/
- WebAIM contrast: https://webaim.org/resources/contrastchecker/
- Who Can Use: https://whocanuse.com/
