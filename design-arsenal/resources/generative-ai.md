# Generative, AI and computational image making

This pack prioritizes **deterministic and reproducible** methods (ImageMagick,
libvips, SVG, FFmpeg). AI is an optional layer for specific tasks: outpainting,
inpainting, background removal, upscaling and restoration.

## Open-source models and tools

| Tool | Task | License | Notes |
|---|---|---|---|
| [Real-ESRGAN](https://github.com/xinntao/Real-ESRGAN) | 4x upscale, restoration | BSD-3 | optional |
| [waifu2x-ncnn-vulkan](https://github.com/nihui/waifu2x-ncnn-vulkan) | Upscale/denoise illustration | MIT | Vulkan binary |
| [chaiNNer](https://github.com/chaiNNer-org/chaiNNer) | Model graphs | GPL-3 | GUI |
| [Upscayl](https://upscayl.org/) | Upscale GUI | AGPL-3 | easy |
| [IOPaint](https://github.com/Sanster/IOPaint) | Inpaint/outpaint | Apache-2 | LaMa/SD |
| [LaMa](https://github.com/advimman/lama) | Inpainting | Apache-2 | high resolution |
| [rembg](https://github.com/danielgatis/rembg) | Background removal | MIT | many models |
| [ComfyUI](https://github.com/comfyanonymous/ComfyUI) | Node diffusion | GPL-3 | fine control |
| [InvokeAI](https://github.com/invoke-ai/InvokeAI) | Generative canvas | Apache-2 | unified canvas |
| [AUTOMATIC1111](https://github.com/AUTOMATIC1111/stable-diffusion-webui) | Stable Diffusion WebUI | AGPL-3 | classic |
| [diffusers](https://github.com/huggingface/diffusers) | Python library | Apache-2 | pipelines |
| [ControlNet](https://github.com/lllyasviel/ControlNet) | Conditioning | Apache-2 | depth/canny/pose |
| [GFPGAN](https://github.com/TencentARC/GFPGAN) | Faces | Apache-2 | restoration |
| [CodeFormer](https://github.com/sczhou/CodeFormer) | Faces | NTU S-Lab | alternative |

## Realistic mobile-to-desktop flows

AI should not be the first step. A robust pipeline:

1. **Smart crop** the subject (`scripts/wallpaper fit --mode smart`).
2. **Upscale** if resolution is insufficient (`scripts/wallpaper upscale`).
3. **Extend** the canvas with blur/gradient/solid (`scripts/wallpaper extend`).
4. **Outpaint** only if you need coherent content on the sides.
5. **Unify** with grain, vignette, color grade.
6. **Review** at 100% and in thumbnail.

### Responsible outpainting

- Use a generous mask; leave overlap so the model has context.
- Generate several seeds and choose; do not accept the first.
- Fix seams with local blur, clone/heal or a texture layer.
- Keep the subject intact; AI should only fill the field.
- Document model, version and license.
- For commercial use, check the model and checkpoint licenses.

### Inpainting for cleanup

- Remove objects, cables, logos or unwanted text.
- Do not erase legal information or credits from a CC BY work.
- Keep the original; inpainting is destructive.

## Deterministic generative (no AI)

- **SVG + filters** (`feTurbulence`, `feDisplacementMap`, `feGaussianBlur`).
- **ImageMagick**: `plasma:`, `gradient:`, `-noise`, `-wave`, `-swirl`,
  `-spread`, `-motion-blur`, `-emboss`.
- **FFmpeg**: `gradients`, `noise`, `vignette`, `geq`, `life`, `cellauto`.
- **p5.js / Processing**: parametric composition, high-resolution PNG export.
- **Blender**: geometry, procedural materials, Cycles; 4K render.
- **Shadertoy / glslViewer**: animated backgrounds, loops.
- **Nannou (Rust)** / **openFrameworks**: installations and series.

Advantages: reproducible, versionable, no weight dependencies, clear license,
exact control. For a wallpaper series, this is usually the right path.

## Ethics and licenses

- Do not use images of people without consent for sensitive uses.
- Do not imitate a living artist's style and present it as your own.
- Do not generate brands/logos of third parties.
- "Open source" does not mean "no restrictions": check model, checkpoint and
  data licenses.
- Save prompts, seeds, model and parameters if you want reproducibility.
- AI does not replace art direction: you decide composition, light and color.
