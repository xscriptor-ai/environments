# 12 — Post-Processing

## 1. What post-processing is

Post-processing renders the scene into a texture (or several), then applies full-screen effects and composites the result. It is how you get bloom, depth of field, ambient occlusion, color grading, anti-aliasing, and stylized looks.

```
scene -> render target -> effect passes -> tone map + color space -> screen
```

Costs scale with resolution and number of passes. Effects are not free; budget them like geometry.

## 2. WebGL: EffectComposer (official addons)

```js
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const composer = new EffectComposer(renderer);
composer.setPixelRatio(Math.min(devicePixelRatio, 2));
composer.setSize(width, height);

const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloom = new UnrealBloomPass(
  new THREE.Vector2(width, height),
  0.6,   // strength
  0.4,   // radius
  0.85   // threshold
);
composer.addPass(bloom);

const output = new OutputPass(); // tone mapping + color space
composer.addPass(output);

// Loop
composer.render(dt);
```

Rules:

- Always end with `OutputPass` (or a pass that applies tone mapping and output color space) when rendering to screen.
- Do not apply tone mapping twice (once in renderer, once in a pass).
- Use `HalfFloatType` render targets for HDR effects.
- Call `composer.setSize` on resize, with the correct pixel ratio.
- The last pass should have `renderToScreen = true` (EffectComposer handles this).

### Common official passes

| Pass | Effect |
|---|---|
| `RenderPass` | Renders the scene |
| `UnrealBloomPass` | Bloom |
| `BokehPass` | Depth of field |
| `SSAOPass` | Screen-space ambient occlusion |
| `SAOPass` | Scalable AO |
| `GTAOPass` | Ground-truth AO |
| `SSRPass` | Screen-space reflections |
| `OutlinePass` | Selection outline |
| `AfterimagePass` | Motion trails |
| `GlitchPass` | Digital glitch |
| `FilmPass` | Film grain/scanlines |
| `HalftonePass` | Halftone |
| `DotScreenPass` | Dot screen |
| `RGBShiftPass` | Chromatic shift |
| `SMAAPass` / `FXAAPass` | Anti-aliasing |
| `TAARenderPass` / `SSAARenderPass` | Temporal/spatial AA |
| `OutputPass` | Tone mapping + color space |
| `ShaderPass` | Custom shader |
| `SavePass` | Capture a target |

Official passes are convenient but not always the highest quality or fastest. For production, consider the `postprocessing` library.

## 3. `postprocessing` (pmndrs)

A modern, optimized composer with a single full-screen pass per effect and better blending.

```bash
npm i postprocessing
```

```js
import { EffectComposer, RenderPass, EffectPass, BloomEffect, SMAAEffect, ToneMappingEffect } from 'postprocessing';

const composer = new EffectComposer(renderer, {
  frameBufferType: THREE.HalfFloatType,
  multisampling: 4,
});
composer.addPass(new RenderPass(scene, camera));

const bloom = new BloomEffect({
  intensity: 1.2,
  luminanceThreshold: 0.8,
  luminanceSmoothing: 0.2,
  mipmapBlur: true,
});

const smaa = new SMAAEffect();
const toneMapping = new ToneMappingEffect({ mode: THREE.ACESFilmicToneMapping });

composer.addPass(new EffectPass(camera, bloom, smaa, toneMapping));

// Loop
composer.render(dt);
// Resize
composer.setSize(width, height);
```

Advantages:

- Effects compose in one pass, reducing bandwidth.
- High-quality effects: N8AO, God Rays, SSR, Tilt Shift, LUT, Texture, Depth of Field, etc.
- Works well with R3F via `@react-three/postprocessing`.

Common effects:

| Effect | Notes |
|---|---|
| `BloomEffect` | `mipmapBlur` for performance/quality |
| `DepthOfFieldEffect` | Bokeh; expensive at high resolution |
| `N8AO` / `SSAOEffect` | Ambient occlusion |
| `SSREffect` | Screen-space reflections |
| `SMAAEffect` / `FXAAEffect` | Anti-aliasing |
| `ToneMappingEffect` | Final tone mapping |
| `VignetteEffect`, `NoiseEffect`, `ScanlineEffect` | Stylization |
| `ChromaticAberrationEffect` | Lens aberration |
| `GodRaysEffect` | Light shafts |
| `OutlineEffect` | Object outlines |
| `LUTEffect` | Color grading |
| `TextureEffect` | Overlay textures |
| `DepthEffect` | Depth-based visualization |

## 4. WebGPU: RenderPipeline and TSL

Since r183, `PostProcessing` is `RenderPipeline`.

```js
import * as THREE from 'three/webgpu';
import { pass, bloom, fxaa, renderOutput } from 'three/tsl';

const renderer = new THREE.WebGPURenderer({ antialias: true });
await renderer.init();

const pipeline = new THREE.RenderPipeline(renderer);
const scenePass = pass(scene, camera);

pipeline.outputNode = bloom(scenePass, 0.8, 0.3, 0.85);
// For explicit output control:
// pipeline.outputNode = renderOutput(bloom(scenePass), THREE.SRGBColorSpace, THREE.ACESFilmicToneMapping);

renderer.setAnimationLoop(() => {
  pipeline.render();
});
```

### Multiple render targets

```js
import { pass, mrt, output, normalView, velocity, packNormalToRGB } from 'three/tsl';

const scenePass = pass(scene, camera);
scenePass.setMRT(mrt({
  output: output,
  normal: packNormalToRGB(normalView),
  velocity: velocity,
}));

const colorNode = scenePass.getTextureNode('output');
const normalNode = scenePass.getTextureNode('normal');
const depthNode = scenePass.getTextureNode('depth');
```

MRT captures color/normal/velocity/depth in one pass, enabling AO, SSR, TAA, and motion blur without re-rendering the scene.

### TSL effects

| Function | Effect |
|---|---|
| `bloom(node, strength, radius, threshold)` | Bloom |
| `ao(depth, normal, camera)` | GTAO |
| `ssr(color, depth, normal, metalness, roughness, camera)` | Screen-space reflections |
| `ssgi(beauty, depth, normal, camera)` | Screen-space GI |
| `dof(node, viewZ, focusDistance, focalLength, bokehScale)` | Depth of field |
| `motionBlur(input, velocity, samples)` | Motion blur |
| `traa(beauty, depth, velocity, camera)` | Temporal AA |
| `fxaa(node)` / `smaa(node)` | Anti-aliasing |
| `film(node, intensity, uv)` | Film grain |
| `chromaticAberration(node, strength, center, scale)` | Chromatic aberration |
| `rgbShift(node, amount, angle)` | RGB shift |
| `outline(scene, camera, params)` | Outline |
| `godrays(...)` | Light shafts |
| `lut3D(node, lut, size, intensity)` | Color grading |
| `pixelationPass(...)` / `retroPass(...)` | Stylized |
| `gaussianBlur(node, direction, sigma)` | Blur |
| `afterImage(node, damp)` | Trails |
| `transition(a, b, mixTexture, ratio, threshold, useTexture)` | Scene transition |
| `denoise(...)` | Denoising (r188 changes the API) |

### Updating the pipeline at runtime

```js
if (showNormals) {
  pipeline.outputNode = scenePass.getTextureNode('normal');
} else {
  pipeline.outputNode = bloom(scenePass);
}
pipeline.needsUpdate = true;
```

### Resolution scaling

```js
const scenePass = pass(scene, camera);
scenePass.setResolutionScale(0.75); // render at 75% and upscale
```

Use for heavy effects on mobile or high-DPI displays.

## 5. Effect selection and design

| Goal | Effects |
|---|---|
| Realistic light | Bloom (subtle), AO, SSR (if needed), TAA |
| Cinematic | Bloom, DOF, film grain, vignette, LUT, chromatic aberration (subtle) |
| Stylized | Posterize, halftone, pixelation, outline, retro pass |
| Product | Soft bloom, contact shadows, neutral tone mapping, minimal grain |
| UI/readability | Avoid heavy effects; keep text crisp; no DOF over UI |
| Performance | FXAA/SMAA only, minimal bloom, no DOF/SSR |

Rules:

- Bloom threshold should match the tone mapping and exposure; else everything glows.
- DOF needs a focus target; do not blur the whole scene.
- AO adds contact and depth; too much looks dirty.
- SSR is limited by screen space; have a fallback for off-screen reflections.
- Film grain/vignette are subtle; they should not be noticed individually.
- Color grading (LUT) last, after tone mapping decisions.

## 6. Selective effects

### Layers

```js
const BLOOM_LAYER = 1;
bloomMesh.layers.enable(BLOOM_LAYER);
// Use a bloom pass with a layer mask (implementation-dependent)
```

### MRT masks

In TSL, write custom masks in MRT and use them to blend effects. For selective bloom, render emissive objects to a separate pass or use luminance thresholds.

### Drei/postprocessing

`@react-three/postprocessing` supports `EffectComposer`, `Bloom`, `DepthOfField`, `SSAO`, `N8AO`, `SMAA`, `Vignette`, `Noise`, `ChromaticAberration`, `ToneMapping`, etc., plus `<Selection>`/`<Select>` for selective outlines and effects.

## 7. Performance

- Every pass is a full-screen draw plus texture reads/writes. Bandwidth dominates at 4K.
- Render effects at half or 75% resolution where possible.
- Combine effects in one pass (`postprocessing` `EffectPass`).
- Avoid stacking multiple blurs; use mipmap bloom.
- Use `HalfFloatType` only when HDR is needed; 8-bit is cheaper but clips.
- Use MSAA on the composer (`multisampling`) or post AA, not both excessively.
- TAA needs motion vectors; motion blur too.
- Disable effects on mobile or low-end GPUs; use a quality tier.
- Measure with GPU timers, not only FPS.
- Keep `renderer.info.render.calls` in mind: post passes add draw calls.

## 8. Color pipeline correctness

The order must be:

```
render scene in linear HDR
-> effects that operate in linear/HDR
-> tone mapping
-> output color space (sRGB)
-> screen
```

Common mistakes:

- Applying tone mapping per pass, causing double compression.
- Forgetting `OutputPass`/`ToneMappingEffect` and getting a washed-out image.
- Using an 8-bit target for HDR bloom, causing clipping.
- Blurring after tone mapping and losing highlight energy.
- Mixing sRGB textures into linear passes without decoding.

## 9. Recipes

### 9.1 Subtle cinematic bloom (WebGL, postprocessing)

```js
const composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType });
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new EffectPass(
  camera,
  new BloomEffect({ intensity: 0.9, luminanceThreshold: 0.85, mipmapBlur: true }),
  new SMAAEffect(),
  new ToneMappingEffect({ mode: THREE.ACESFilmicToneMapping }),
));
```

### 9.2 Product viewer (soft, clean)

```js
const bloom = new BloomEffect({ intensity: 0.35, luminanceThreshold: 0.9, mipmapBlur: true });
const toneMapping = new ToneMappingEffect({ mode: THREE.NeutralToneMapping });
composer.addPass(new EffectPass(camera, bloom, new SMAAEffect(), toneMapping));
```

### 9.3 WebGPU bloom + TAA

```js
const scenePass = pass(scene, camera);
const color = scenePass.getTextureNode('output');
const depth = scenePass.getTextureNode('depth');
const velocity = scenePass.getTextureNode('velocity');
const aa = traa(color, depth, velocity, camera);
pipeline.outputNode = bloom(aa, 0.6, 0.4, 0.85);
```

## 10. Troubleshooting

| Problem | Cause |
|---|---|
| Everything is white | Bloom threshold too low, exposure too high, double tone mapping |
| Washed-out colors | Missing output pass, wrong color space, 8-bit HDR target |
| Effects are blurry | Resolution scale too low, DOF, TAA ghosting |
| Aliasing persists | No AA pass, MSAA disabled, low DPR |
| Performance collapse | Too many passes, 4K full-res, DOF/SSR on mobile |
| Outline selects everything | Layer mask or selection mask wrong |
| TAA ghosts | No motion vectors, moving UVs, transparent objects |
| Bloom only on some objects | Threshold/luminance mask or selective layer setup |
| WebGPU pipeline output black | Node graph not connected, missing `renderOutput`, renderer not initialized |
