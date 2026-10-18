---
description: Plan and run a mobile-to-desktop wallpaper conversion with safe zones, variants and QA
agent: wallpaper-architect
---

Convert a phone-first image into desktop/ultrawide/mobile deliverables.

1. Ask for the source image, target sizes and intended use if not provided.
2. Inspect the source (`scripts/wallpaper inspect`). Record dimensions,
   orientation, color profile and license.
3. Choose a method: blur, solid/editorial panel, gradient, mirror, edge or true
   recomposition. Explain why in one sentence.
4. If the subject is below 70-90% of target height, upscale first with
   Real-ESRGAN; otherwise use a high-quality resize.
5. Run the pipeline with explicit values:
   `scripts/wallpaper extend IMAGE --size WxH --method METHOD --scale S
   --grain --vignette --out FILE`.
6. Create variants: 16:9, ultrawide, mobile, light/dark if relevant. Share
   palette/type/grain; vary composition.
7. Composite the matching safe-zone guide from `assets/guides/` and check icon,
   panel, dock and notch zones.
8. QA: thumbnail, 100%, grayscale, occupied desktop, seams, banding, text
   contrast, file size.
9. Write `manifest.json` with source, license, recipe, dimensions and variants.

Never stretch the source. Never ship without a license record.

$ARGUMENTS
