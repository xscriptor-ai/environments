# Typography

## Recommended families (12, OFL 1.1)

Not bundled in the reduced edition; download from Google Fonts. See
`assets/fonts/README.md`.

| Family | Personality | Use |
|---|---|---|
| **Inter** | neutral, UI, excellent legibility | interface, paragraphs, data |
| **JetBrains Mono** | humanist mono | code, coordinates, technical labels |
| **Space Grotesk** | geometric with character | tech headlines, editorial |
| **Fraunces** | soft variable serif | expressive display, quotes |
| **Bricolage Grotesque** | characterful grotesque | posters, brands |
| **Manrope** | modern geometric | product, landing |
| **Outfit** | clean geometric | display, numbers |
| **Instrument Serif** | elegant editorial serif | headlines, fashion, art |
| **Libre Franklin** | American grotesque | long text, news |
| **Sora** | compact futuristic | tech, crypto, data |
| **Archivo** | wide-range grotesque | headlines and text |
| **DM Sans** | friendly geometric | UI, education, lifestyle |

## Where to get more

- [Google Fonts](https://fonts.google.com/) — the largest OFL catalog.
- [Google Fonts Knowledge](https://fonts.google.com/knowledge) — usage guides.
- [Fontsource](https://fontsource.org/) — self-host packages for web.
- [Fontshare](https://www.fontshare.com/) — free Indian Type Foundry fonts.
- [Velvetyne](https://velvetyne.fr/) — experimental libre typography.
- [Collletttivo](https://www.collletttivo.it/) — open-source collective.
- [The League of Moveable Type](https://www.theleagueofmoveabletype.com/) — libre classics.
- [Open Foundry](https://open-foundry.com/) — curated libre fonts.
- [Uncut](https://uncut.wtf/) — contemporary free display.
- [Nerd Fonts](https://www.nerdfonts.com/) — icon-patched terminal fonts.
- [Fonts In Use](https://fontsinuse.com/) — reference by project.
- [Typewolf](https://www.typewolf.com/) — combinations and recommendations.
- [Fontpair](https://fontpair.co/) — Google Fonts pairs.

## Fundamentals

### Scale

A modular scale prevents random decisions. Example 1.25:

```text
12 · 14 · 16 · 20 · 25 · 31 · 39 · 49 · 61 · 76 · 95 px
```

For desktop wallpapers, type is read at a distance: use large jumps (2x or more)
and few levels. For UI, 5-7 levels are enough.

### Measure and leading

- Body text: 45-75 characters per line; 60-70 is the sweet spot.
- `line-height` 1.4-1.6 for text; 1.0-1.2 for display.
- Do not center long paragraphs; align left.
- Avoid justification without hyphenation.

### Tracking and kerning

- Large display: slight negative tracking (-1% to -3%).
- Small uppercase text: positive tracking (+2% to +8%).
- Do not apply negative tracking to body text.
- Check problem pairs: `AV`, `To`, `Yo`, `LT`.

### Hierarchy

1. Size.
2. Weight.
3. Color/contrast.
4. Space.
5. Box/rule/background.
6. Position.

Do not use all six at once. Two or three signals are enough.

## Typography in images and wallpapers

- Render text in SVG and rasterize with `rsvg-convert` (better control than
  `-annotate` for complex compositions).
- Leave generous margins: text needs air, especially at 4K.
- On desktop, avoid text in the icon zone (left) and the bottom edge.
- On mobile, avoid the notch/status bar and the bottom gesture area.
- A huge headline + a small mono label is a robust combination.
- If you use a photo, add a scrim to guarantee contrast.
- Convert text to curves only if you need total font independence; keep the
  editable SVG as the source of truth.

### Pairing examples

- **Instrument Serif** (headline, 200-400) + **Inter** (text, 400-600).
- **Space Grotesk** (display, 600-700) + **JetBrains Mono** (metadata).
- **Fraunces** (display, 300-500) + **Manrope** (UI, 400-600).
- **Bricolage Grotesque** (poster) + **DM Sans** (text).
- **Archivo** (everything) with weight contrast 300/800.

## Reading

- [Practical Typography — Matthew Butterick](https://practicaltypography.com/)
- [Web Typography — Richard Rutter](https://webtypography.net/)
- [Type Scale](https://typescale.com/)
- [Modular Scale](https://www.modularscale.com/)
- [Typography Handbook](https://typographyhandbook.com/)
- [W3C CSS Fonts 4](https://www.w3.org/TR/css-fonts-4/)

## Licensing

The 12 recommended families are SIL Open Font License 1.1: they can be used,
modified and redistributed, including in commercial work. Keep the `OFL.txt`.
Do not sell the fonts by themselves.
