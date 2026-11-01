# 02 — Mobile to desktop wallpaper

This is the core craft document for the project. A phone wallpaper is a
**portrait window**; a desktop wallpaper is a **wide stage**. You cannot just
stretch it. You must recompose.

## 1. Know the math

```text
9:16  phone      1080 x 1920   or 1440 x 2560
9:20  tall phone 1440 x 3200
16:9  desktop    1920 x 1080 · 2560 x 1440 · 3840 x 2160
16:10 laptop     2560 x 1600 · 3840 x 2400
21:9  ultrawide  3440 x 1440 · 5120 x 2160
32:9  superwide  5120 x 1440 · 7680 x 2160
```

If a 9:16 source is scaled to the desktop height `H`:

```text
source width on desktop = H x 9/16 = 0.5625 x H
desktop width           = H x 16/9 = 1.7778 x H
empty field             = about 68% of the desktop width
```

For a 4K canvas (`H = 2160`), the phone image is only about 1215 px wide; you
need to fill about 2625 px horizontally. That empty field is the design
opportunity, not a problem.

## 2. Choose a strategy before touching pixels

### A. Ambient blur (safe, cinematic)

- A blurred, slightly scaled and color-graded copy fills the canvas.
- The sharp original sits centered or on a third.
- Add grain, vignette and a subtle scrim.
- **Best for**: almost any photo; quick; preserves the subject.
- **Risk**: generic "blur extension" look. Differentiate with composition and
  color grading, not more blur.

```bash
scripts/wallpaper extend phone.jpg --size 3840x2160 --method blur \
  --scale 0.92 --grain --vignette --out desktop.jpg
```

### B. Sampled solid / editorial panel

- Extract the dominant/darkest color; make a flat or lightly textured field.
- Place the sharp image as a panel (center, left or right).
- Add type, a thin rule, coordinates or a caption.
- **Best for**: architecture, minimal, brand pieces.
- **Risk**: a flat background can look like a mockup. Add paper/concrete
  texture, grain or a soft light gradient.

```bash
scripts/wallpaper extend phone.jpg --size 3840x2160 --method solid \
  --scale 0.85 --grain --out desktop.jpg
```

### C. Gradient extension

- Sample the image's edge colors; build a gradient that continues the light.
- Composite the subject with a soft shadow.
- **Best for**: skies, sunsets, gradients, colorful architecture.
- **Risk**: banding. Add 1-3% noise/dither; use a 16-bit intermediate if needed.

```bash
scripts/wallpaper extend phone.jpg --size 3840x2160 --method gradient \
  --scale 0.9 --grain --vignette --out desktop.jpg
```

### D. Mirror / triptych

- Mirror the image (or edge strips) into the sides; blur/darken the sides.
- Center the sharp subject.
- **Best for**: symmetric architecture, patterns, silhouettes.
- **Risk**: obvious mirror seam. Hide it with blur, a gradient scrim or a
  deliberate vertical rule/gutter.

```bash
scripts/wallpaper extend phone.jpg --size 3840x2160 --method mirror \
  --scale 0.92 --grain --vignette --out desktop.jpg
```

### E. Edge stretch

- Take a 1-pixel column from each side and stretch it into the empty field.
- **Best for**: images with clean vertical edges (walls, sky, water).
- **Risk**: smeared texture. Blur the stretched field and keep the center sharp.

```bash
scripts/wallpaper extend phone.jpg --size 3840x2160 --method edge \
  --scale 0.9 --grain --out desktop.jpg
```

### F. True recomposition (the best, slowest)

Do not preserve the phone crop. Re-crop the original scene for landscape, move
the subject to a third, and design the empty space:

- If the source is a photo of a building, use the sky/negative space on one side.
- If the subject is centered, move it to the right third and put type/space left.
- If the source is a texture, rotate/crop it and build a pattern.
- If the source is a person/object, consider a **cutout** (rembg) on a designed
  field, with a shadow.
- Use outpainting only when you need plausible continuation, not as a crutch.

This is the method that produces a wallpaper rather than an "extended image".

## 3. Upscale before extending if needed

Rule of thumb: the sharp subject should be at least **70-90% of the canvas
height** without upscaling. If not, upscale first.

```bash
scripts/wallpaper upscale phone.jpg --scale 4 --model realesrgan-x4plus \
  --out phone-4x.png
scripts/wallpaper extend phone-4x.png --size 3840x2160 --method blur --out desktop.jpg
```

- Real-ESRGAN works best on photos/illustration, not on text or flat vector art.
- For flat graphics, use SVG or Lanczos + subtle sharpening; AI can add halos.
- Inspect at 100%: hands, faces, edges, text.
- Keep the original; upscaling is generative and lossy in a different way.

## 4. Safe zones (desktop)

- **Left column**: icons (Windows/Linux) — keep the first ~8% width free of
  critical detail/text.
- **Top edge**: menu bar/panel — avoid important content in the top ~4%.
- **Bottom edge**: dock/taskbar — avoid critical content in the bottom ~6-8%.
- **Center**: focal point; works for lockscreen-like compositions.
- **Right side**: often freer on macOS; still, test with windows open.
- **Ultrawide**: icon zone still left; put the subject at 60-70% width.

Use the overlays in `assets/guides/` to check. They are transparent PNGs;
composite over a draft:

```bash
magick draft.jpg assets/guides/desktop-4k-16-9.png \
  -compose over -composite draft-guides.jpg
```

## 5. Mobile safe zones

- Top ~7-8%: status bar/notch.
- Bottom ~5-6%: gesture bar.
- Sides ~4%: curved edges.
- Keep the subject out of the very top/bottom; parallax crops it.
- For a lock screen, leave the center-top clear for the clock.

## 6. Color and light continuity

- The extended field must match the **temperature** and **light direction** of
  the source.
- If the source is warm, do not use a cold gray background.
- Sample at least two colors: background and accent.
- Darken the field 5-15% so the sharp subject reads as foreground.
- Add a subtle gradient (top darker/bottom lighter, or vice versa) to avoid
  flatness.
- Use `scripts/wallpaper palette` and `assets/palettes/css/role-tokens.css`.

## 7. Texture and unification

- Grain: 2-6% opacity at 4K; more for film/analog looks.
- Vignette: subtle; it should guide, not be obvious.
- Scrim: only where text/icons need contrast.
- Paper/concrete: 8-20% overlay, never over faces.
- A single grain layer over the whole composition glues the layers together.

## 8. Typography on desktop wallpapers

- One big idea + one small metadata line is enough.
- Keep type out of icon/dock zones.
- Use a scrim behind text; do not rely on a busy photo.
- At 4K, a 120-200 px headline reads at normal viewing distance.
- Align to the grid/thirds, not to the image edge by accident.
- Use the font manifest in `assets/fonts/` and flatten text only at the end.

## 9. QA checklist

- [ ] Subject is sharp at 100%; no halos or AI artifacts.
- [ ] No visible seam between subject and field.
- [ ] Field color matches source temperature.
- [ ] Icon/dock/menu zones are calm.
- [ ] Text is readable at 100% and in thumbnail.
- [ ] No banding in gradients (add dither/noise).
- [ ] Grain is consistent, not patchy.
- [ ] File size is reasonable (WebP/JPEG/AVIF).
- [ ] License/attribution recorded.
- [ ] Tested at target resolution and in the actual desktop environment.
- [ ] A mobile variant exists if the piece is a set.
- [ ] Original and recipe saved.

## 10. Variants to produce

For each source, consider:

1. **Desktop 16:9** — primary.
2. **Ultrawide 21:9/32:9** — reframe, do not just stretch.
3. **Mobile 9:20** — original or re-crop.
4. **Light/dark** — same composition, different field.
5. **Editorial** — panel + type.
6. **Ambient** — blur/gradient, no type.

A coherent set shares palette, grain and light; it does not repeat the same
layout.
