---
name: wallpaper-craft
description: Mobile-to-desktop wallpaper craft — aspect math, extension methods (blur, solid, gradient, mirror, edge, recomposition), safe zones, series design and QA. Use when creating desktop/ultrawide/mobile wallpapers from phone-first images or reviewing a wallpaper set.
---

# Wallpaper craft (October 2026)

A phone wallpaper is a portrait window; a desktop wallpaper is a wide stage.
Recompose; never stretch.

## Aspect math

```text
9:16 phone      1080x1920  1440x2560
9:20 tall phone 1440x3200
16:9 desktop    1920x1080  2560x1440  3840x2160
16:10 laptop    2560x1600  3840x2400
21:9 ultrawide  3440x1440  5120x2160
32:9 superwide  5120x1440  7680x2160
3:4 tablet      2048x2732
```

At full desktop height H, a 9:16 image is only 0.5625H wide; 68% of a 16:9
canvas is empty field. That field is the design surface.

## Six methods

1. **Ambient blur** — blurred cover field + sharp subject. Safe, cinematic.
   Avoid the generic look with composition and color grading.
2. **Solid/editorial panel** — sampled solid or lightly textured field + sharp
   panel. Add type/rules/captions. Works for architecture and minimal pieces.
3. **Gradient** — sample edge colors, continue the light. Add shadow; add noise
   to avoid banding.
4. **Mirror/triptych** — mirrored or edge-fill sides, sharp center. Hide seams
   with blur/scrim/gutter.
5. **Edge stretch** — stretch 1 px side columns into the field; blur the field.
   Only for clean vertical edges.
6. **Recomposition** — re-crop the original scene for landscape, move the
   subject to a third, design the empty space. Best; slowest.

## Subject scale and upscale

Keep the sharp subject at 70-92% of canvas height. If the source is too small,
upscale first with Real-ESRGAN (photos/illustration), or rasterize SVG at the
target size for flat art. Inspect faces, hands, edges and text at 100%.

## Safe zones

Desktop: left icon column about 8%; top panel about 4%; bottom dock 6-8%.
Mobile: top status/notch 7-8%; bottom gesture 5-6%; sides about 4%.
Ultrawide: keep the icon column clear; place the subject around 60-70% width.

Use `assets/guides/<size>.png` as a transparent overlay:

```bash
magick draft.jpg assets/guides/desktop-4k-16-9.png -compose over -composite draft-guides.jpg
```

## Color and light continuity

Match temperature and light direction. Darken the field 5-15% to push the
subject forward. Add a subtle gradient to avoid flatness. Use the source's
palette, not a random one.

## Texture and unification

Grain 2-6% at 4K; vignette subtle; scrim only where text/icons need contrast.
One global grain layer glues the composition together. Do not pour effects on a
weak structure.

## Typography

One big idea + one metadata line. Keep type out of icon/dock zones. Use a scrim
behind text. At 4K, 160-320 px headline; halve for 1440p/1080p. Align to the
grid/thirds.

## Series design

Share palette, type pairing, grain/vignette values, composition logic and naming.
Vary subject, scale, method, ratio, light and density.

## QA

- Thumbnail at 300 px.
- 100% on the target display.
- Grayscale and squint.
- Occupied desktop (icons/windows/panel).
- Seam at 200%.
- Text contrast on the composited background.
- Banding in gradients.
- File size/format.
- License/attribution.
- Original + recipe archived.

Reference: `references/mobile-to-desktop.md`.
