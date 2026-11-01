# 13 — Licensing and attribution

> This is practical guidance, not legal advice. For commercial work, verify with
> the rights holder or a lawyer.

## 1. Asset inventory

For every image/font/icon/palette, record:

```text
file:
source URL:
author:
license:
license URL:
downloaded:
changes:
commercial use:
attribution required:
```

Keep this in `ATTRIBUTION.md` + `manifest.json` next to the assets. Palette JSON
already includes source and license; icons/fonts have upstream license files.

## 2. Common licenses

### CC0 / Public Domain

- Use, modify, commercial, no permission.
- Attribution not required, but good practice.
- Beware: a CC0 photo may still contain trademarks, people or copyrighted
  artwork. CC0 covers the photographer's rights, not everything in the frame.

### CC BY

- Use, modify, commercial.
- Must credit: author, source, license, changes.
- The credit must be reasonable to the medium (caption, credits page, metadata).

### CC BY-SA

- Same as CC BY, but derivative works must be shared under the same license.
- A wallpaper that incorporates a CC BY-SA photo may need to be CC BY-SA.
- This can conflict with proprietary client work; check before using.

### CC BY-ND

- Use and commercial, but **no distribution of modified versions**.
- Cropping/resizing may count as a modification; avoid for derivative
  wallpapers.

### CC BY-NC

- Non-commercial only. "Commercial" includes client work and monetized channels.
- Not suitable for a commercial wallpaper pack.

### Unsplash License

- Free to use, modify, commercial.
- Cannot sell unmodified copies; cannot compile photos to replicate Unsplash.
- Attribution appreciated, not required.
- Check the current license; it has changed over time.

### Pexels License

- Free to use, modify, commercial.
- Cannot sell unmodified copies; cannot imply endorsement.
- Attribution not required.

### Pixabay Content License

- Free to use, modify, commercial.
- Cannot sell unmodified copies; cannot redistribute as stock.
- Check current terms.

### OFL 1.1 (fonts)

- Use, modify, embed, commercial.
- Preserve the license; do not sell the font by itself.
- If you modify and redistribute, use a different name (Reserved Font Name).
- Keep `OFL.txt` with the font files.

### MIT / ISC / BSD (code, icons)

- Use, modify, commercial.
- Keep the copyright notice and license text.
- No warranty.

### Apache-2.0

- Use, modify, commercial.
- Keep notices, license and changes; patent grant.
- Include NOTICE if present.

### GPL / AGPL

- Use, modify, commercial.
- If you distribute a derivative, it must be under the same license.
- AGPL extends the obligation to network use.
- Using GPL tools to produce output does not make the output GPL (generally),
  but distributing a modified GPL program does.

## 3. Attribution templates

### Image (CC BY)

```text
"Title" by Author, via Source.
License: CC BY 4.0 - https://creativecommons.org/licenses/by/4.0/
Changes: cropped, extended canvas, color graded, grain added.
```

### Image (CC BY-SA)

```text
"Title" by Author, via Source.
License: CC BY-SA 4.0 - https://creativecommons.org/licenses/by-sa/4.0/
Changes: cropped, extended canvas, color graded. This derivative is shared
under CC BY-SA 4.0.
```

### Unsplash

```text
Photo by Author on Unsplash - https://unsplash.com/ (URL of the photo page)
Used under the Unsplash License.
```

### Font

```text
Typeface: Inter by Rasmus Andersson.
License: SIL Open Font License 1.1.
```

### Icon set

```text
Icons: Lucide (ISC) - https://lucide.dev/
Icons: Tabler Icons (MIT) - https://tabler.io/
```

## 4. AI-generated assets

- Check the model license (SDXL, Flux, SD 1.5, etc.).
- Check the checkpoint/license (some restrict commercial use).
- Check the service terms if you used a hosted tool.
- Do not claim copyright over purely AI-generated output without human
  authorship; laws vary.
- Keep prompts/seeds/model versions for reproducibility.
- Avoid generating recognizable people, brands or copyrighted characters.
- If you use AI to modify a licensed photo, the original license still applies
  to the source and the derivative.

## 5. People, places, brands

- Model release for identifiable people in commercial work.
- Property release for private buildings/interiors.
- Some public landmarks have photography restrictions (for example, the Eiffel
  Tower at night, certain museums).
- Trademarks/logos: editorial/illustrative use may be allowed; commercial
  endorsement is not. Do not imply affiliation.
- Graffiti/street art may be copyrighted independently of the wall.

## 6. Provenance hygiene

1. Download from the original source.
2. Verify the license on the file page.
3. Save the license text/screenshot.
4. Record author and URL.
5. Record changes.
6. Keep the original file.
7. Use `exiftool` to embed credit.
8. Review before shipping; licenses change.

## 7. What this pack includes

- Fonts: 12 recommended OFL 1.1 families; not bundled, see
  `assets/fonts/README.md`.
- Icons: Lucide ISC, Tabler MIT, Phosphor MIT, Simple Icons CC0, Bootstrap
  MIT; not bundled, see `assets/icons/README.md`.
- Palettes: source/license per JSON; mostly MIT, some Apache-2.0.
- Textures: full local edition uses Poly Haven CC0; reduced edition includes
  one generated vignette.
- Gradients/patterns/guides: generated here; CC0.
- Tools: ImageMagick (Apache-like), FFmpeg (LGPL/GPL), libvips (LGPL-2.1),
  Real-ESRGAN (BSD-3), ExifTool (Artistic/GPL), Python libs (MIT/BSD/HPND).
- Stock images: none included; sources are cataloged with license guidance.
