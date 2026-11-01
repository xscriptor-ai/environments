# 14 — Generative and AI-assisted workflows

## 1. When to use generative

Use it when you need:

- More canvas: outpainting a 9:16 source into 16:9.
- Missing content: removing an object, filling a seam, extending a texture.
- Resolution: upscaling a small source.
- Variation: exploring color/composition without re-shooting.

Do **not** use it to:

- Replace art direction.
- Fix a weak composition.
- Generate people/brands without rights.
- Add detail that fights the source.

## 2. Deterministic first

For wallpapers, procedural methods often beat AI:

- **Gradients** — SVG/ImageMagick, exact colors, no artifacts.
- **Noise/grain** — ImageMagick, seamless, controllable.
- **Mesh gradients** — SVG radial gradients.
- **Patterns** — SVG patterns, infinite resolution.
- **Blur fields** — ImageMagick, based on the actual source.
- **Typography** — SVG, exact layout.

These are reproducible and license-clean. Use AI only for content that cannot
be generated procedurally.

## 3. Upscaling workflow

```bash
# 1. crop/straighten the source
scripts/wallpaper fit phone.jpg --size 1440x2560 --mode smart --out phone-clean.png

# 2. upscale 4x
scripts/wallpaper upscale phone-clean.png --scale 4 --out phone-4x.png

# 3. extend to desktop
scripts/wallpaper extend phone-4x.png --size 3840x2160 --method blur \
  --scale 0.9 --grain --vignette --out desktop.jpg
```

Inspect:

- Edges: halos, double lines, melted texture.
- Faces: eyes, teeth, hair.
- Text: warped letters.
- Noise: plastic smoothing.
- If it looks worse, use Lanczos + sharpening or a different model.

## 4. Outpainting workflow (IOPaint/ComfyUI)

1. Extend the canvas to the target ratio with a neutral fill.
2. Create a mask covering the new area + 10-20% overlap.
3. Prompt for the scene, not the subject: "concrete wall, soft daylight,
   architectural, minimal".
4. Generate several seeds.
5. Choose the one with matching light/perspective.
6. Composite the original back on top at 100% to preserve the subject.
7. Blend the seam with a soft gradient mask, grain and color grade.
8. Inspect at 100%; fix artifacts manually.

## 5. Inpainting workflow

- Mask the object + a margin.
- Prompt the surrounding material, not the object.
- Use a small number of steps; over-generation creates texture mismatch.
- Keep the original; compare.
- Do not remove attribution/watermarks from licensed work.

## 6. Background removal

```bash
# rembg (optional install)
pipx install rembg
rembg i input.jpg output.png
```

- Check hair, transparent objects, reflections.
- Add a subtle shadow and grain to integrate the cutout.
- Do not use a cutout on a field with a different light direction.

## 7. Generative art (no AI)

- **p5.js**: sketch, export at 4K with `saveCanvas`.
- **Processing**: same, Java.
- **Shadertoy/glslViewer**: GLSL loops.
- **Blender**: geometry nodes, procedural materials, Cycles.
- **Nannou**: Rust creative coding.
- **SVG filters**: turbulence, displacement, blur.

A simple recipe: gradient + noise + one geometric event + grain. It is enough
for a series if the palette and composition are strong.

## 8. Prompting for image editing

- Describe the **field**, not the subject: materials, light, perspective.
- Match the source: "same camera angle, same overcast light, same concrete".
- Avoid style soup; 2-3 concrete descriptors.
- Negative prompt: text, watermark, people, logo, extra objects.
- Seed control for series consistency.
- Document prompt/model/seed.

## 9. Ethics and rights

- Do not imitate a living artist's style and claim it as your own.
- Do not generate real people without consent.
- Do not use AI to alter licensed images beyond the license terms.
- Do not remove watermarks/credits.
- Check model licenses for commercial use.
- Disclose AI use when the context requires it.

## 10. QA for AI output

- 100% crop: artifacts, texture, edges.
- Seam: does the extension match?
- Perspective: do lines converge consistently?
- Light: direction, color, softness.
- Scale: does the detail match the source?
- Text: is any generated text gibberish? Remove it.
- License: model/checkpoint terms.
- Reproducibility: seed/prompt/model saved.
