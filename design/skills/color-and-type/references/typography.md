# Typography notes

## Scale

Use a modular scale; fewer, larger steps for wallpapers. Example 1.25:
12, 14, 16, 20, 25, 31, 39, 49, 61, 76, 95 px. For 4K wallpapers multiply the
display sizes substantially.

## Pairing rules

- One display + one text family; mono for metadata.
- Contrast in weight/structure, not just two similar sans.
- Keep the same family for UI and body when in doubt.
- Avoid more than two type colors.

## Rendering in SVG

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

## Checks

- `fc-match 'Family'` and `fc-list | grep -i family`.
- Render at final size, not only at 50%.
- Check glyph coverage for accents, currency, quotes, dashes.
- Keep text out of icon/dock/notch zones.
- Use a scrim for contrast on photos.
