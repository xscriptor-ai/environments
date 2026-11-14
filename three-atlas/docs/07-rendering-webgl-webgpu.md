# 07 — Rendering: WebGL2, WebGPU, Renderer, and Frame Pipeline

## 1. Renderer responsibilities

The renderer:

- Creates and manages the GPU context.
- Compiles shader programs and uploads buffers/textures.
- Sorts renderable objects and issues draw calls.
- Renders shadow maps.
- Applies tone mapping and output color space when rendering to screen.
- Manages render targets, viewports, scissor, and XR.

It does **not** manage scene state, physics, UI, or asset loading.

## 2. WebGLRenderer

```js
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  depth: true,
  stencil: false,            // default false since r163
  powerPreference: 'high-performance',
  preserveDrawingBuffer: false,
  logarithmicDepthBuffer: false,
  reversedDepthBuffer: false, // r181+
  failIfMajorPerformanceCaveat: false,
  precision: 'highp',
});
```

| Option | Meaning | Advice |
|---|---|---|
| `antialias` | MSAA on the default framebuffer | true for crisp edges; combine with post AA |
| `alpha` | Canvas alpha channel | false for opaque fullscreen scenes; true for HTML blending |
| `depth` | Depth buffer | true unless you render only 2D |
| `stencil` | Stencil buffer | false by default; enable for stencil effects |
| `powerPreference` | GPU selection | `high-performance` for 3D |
| `preserveDrawingBuffer` | Keep frame after present | true only for screenshots; costs performance |
| `logarithmicDepthBuffer` | Log depth | Huge scenes; slower |
| `reversedDepthBuffer` | Reversed float depth | Large scenes; better precision |
| `failIfMajorPerformanceCaveat` | Fail on software rendering | true if you require hardware acceleration |
| `precision` | Shader precision | `highp` default; `mediump` on weak mobile |

WebGL2 is mandatory since r163.

### Capabilities

```js
const gl = renderer.getContext();
renderer.capabilities.isWebGL2;           // true
renderer.capabilities.maxTextureSize;
renderer.capabilities.getMaxAnisotropy();
renderer.capabilities.maxVertexUniforms;
renderer.capabilities.maxSamples;
renderer.extensions.has('EXT_color_buffer_float');
```

## 3. WebGPURenderer

```js
import * as THREE from 'three/webgpu';

const renderer = new THREE.WebGPURenderer({
  antialias: true,
  forceWebGL: false, // true to force the WebGL backend
  alpha: false,
  powerPreference: 'high-performance',
});

renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

await renderer.init(); // required before synchronous API when not using setAnimationLoop
renderer.setAnimationLoop(() => renderer.render(scene, camera));
```

Key differences:

- Backend can be WebGPU or WebGL2; TSL compiles to WGSL or GLSL accordingly.
- Initialization is asynchronous. `setAnimationLoop` initializes lazily; explicit `await renderer.init()` is needed for feature detection or on-demand rendering.
- NodeMaterial/TSL works only with `WebGPURenderer`.
- Compute shaders and storage buffers are available.
- `RenderPipeline` (r183+, formerly `PostProcessing`) manages multi-pass rendering.
- `renderAsync` and `waitForGPU` were removed/deprecated (r181); use the synchronous API after `init()`.
- Some WebGL-only addons (e.g., `EffectComposer`) do not apply; use node-based post-processing.

### Feature detection and fallback

```js
async function createRenderer(canvas) {
  if (navigator.gpu) {
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (adapter) {
        const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
        await renderer.init();
        return renderer;
      }
    } catch (error) {
      console.warn('WebGPU init failed, falling back to WebGL', error);
    }
  }
  return new THREE.WebGLRenderer({ canvas, antialias: true });
}
```

A simpler fallback is `new THREE.WebGPURenderer({ forceWebGL: true })`, which uses the same API on a WebGL2 backend. Not every node/compute feature is available there.

## 4. Renderer settings common to both

```js
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(width, height, false);
renderer.setClearColor(0x000000, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.autoClear = true;
```

### Viewport and scissor

```js
renderer.setViewport(x, y, width, height);
renderer.setScissor(x, y, width, height);
renderer.setScissorTest(true);
```

- Viewport: where NDC maps in the canvas.
- Scissor: clips fragments outside the rectangle.
- Units are CSS pixels for the canvas; render targets use their own pixel size. r187 changed pixel-ratio scaling when a render target is bound.

### Clear behavior

```js
renderer.autoClear = false;
renderer.clear();          // color + depth + stencil
renderer.clearDepth();
renderer.clearColor();
```

Disable autoClear when manually managing multiple views or render targets.

## 5. Frame pipeline

Typical WebGL frame:

```
1. update inputs/state
2. update animation (delta)
3. update physics (fixed step)
4. update controls (damping)
5. renderer.render(scene, camera)
   a. update world matrices
   b. project objects, frustum cull
   c. build render lists (opaque, transparent)
   d. render shadow maps
   e. sort opaque front-to-back, transparent back-to-front
   f. draw opaque
   g. draw transparent
   h. tone map + output color space (to screen)
```

With post-processing:

```
scene -> render target(s) -> passes -> tone map + color space -> screen
```

## 6. Render lists, sorting, and culling

- Opaque: sorted front-to-back for early-z rejection.
- Transparent: sorted back-to-front by distance (per object, not per triangle).
- `renderOrder` overrides sorting within a list.
- `frustumCulled = true` uses bounding volumes; recompute them after geometry edits.
- `InstancedMesh`/`BatchedMesh` need updated bounding volumes after transforms.
- `layers` filter what each camera renders.
- `scene.matrixWorldAutoUpdate` and `object.matrixAutoUpdate` control transform updates; disabling them requires manual updates.

## 7. Render targets

```js
const rt = new THREE.WebGLRenderTarget(1024, 1024, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
  type: THREE.HalfFloatType,
  depthBuffer: true,
  stencilBuffer: false,
  samples: 4, // MSAA
});

renderer.setRenderTarget(rt);
renderer.clear();
renderer.render(scene, camera);
renderer.setRenderTarget(null);
```

- Use `HalfFloatType` for HDR intermediates.
- `samples > 0` enables MSAA on the render target (WebGL2).
- Cube render targets for reflections: `WebGLCubeRenderTarget` (WebGL) or `CubeRenderTarget` (WebGPU, r183+).
- Array/3D render targets for volume and layered effects.
- Read pixels with `readRenderTargetPixels`/`readRenderTargetPixelsAsync` (async is better).
- Dispose render targets when done.

### Multiple render targets (MRT)

WebGL: `WebGLRenderTarget` with `count` (r162+); WebGPU/TSL: `mrt({ output, normal, velocity })` inside a `pass`. MRT captures color, normals, depth, velocity in one pass for post-processing and temporal effects.

## 8. Shader compilation

```js
renderer.compile(scene, camera);
await renderer.compileAsync(scene, camera); // better: avoids hitches
```

- Compile before the first interaction to avoid a stutter.
- `compileAsync` is preferred for complex scenes and WebGPU pipelines.
- Show a loading state while compiling.
- Shader programs are cached by material/defines; unique materials increase compile time.

## 9. On-demand rendering

If the scene is static or only changes on interaction, do not render every frame:

```js
let needsRender = true;
function requestRender() { needsRender = true; }

renderer.setAnimationLoop(() => {
  controls.update();
  if (!needsRender) return;
  renderer.render(scene, camera);
  needsRender = false;
});
```

- Save battery and GPU.
- Mark dirty on controls change, animation, resize, or data updates.
- Do not use on-demand rendering for continuous animation or video textures.

## 10. Context loss and restoration

```js
canvas.addEventListener('webglcontextlost', (event) => {
  event.preventDefault();
  running = false;
  showRecoveryUI();
});

canvas.addEventListener('webglcontextrestored', () => {
  rebuildRendererResources();
  running = true;
});
```

- Context loss happens on GPU reset, driver crash, tab suspension, or too many contexts.
- Do not create many renderers; browsers limit active WebGL contexts.
- Recreate GPU resources (textures, buffers, render targets) after restoration. CPU-side data must be retained or reloaded.
- For long-lived apps, listen and recover gracefully.

## 11. WebGPU specifics

### Pipelines and passes

- `WebGPURenderer` compiles TSL node graphs into GPU pipelines.
- `RenderPipeline` (r183+):

```js
import { pass, bloom, renderOutput } from 'three/tsl';

const scenePass = pass(scene, camera);
const pipeline = new THREE.RenderPipeline(renderer);
pipeline.outputNode = bloom(scenePass, 0.5, 0.2, 0.8);
// renderOutput is implicit when rendering to screen; use it for explicit control
```

### Compute and storage

```js
import { instancedArray, compute, uniform } from 'three/tsl';

const positions = instancedArray(count, 'vec3');
const computeNode = compute(() => {
  // read/update storage buffers
});
renderer.compute(computeNode);
```

- Compute shaders are first-class in WebGPU.
- Storage buffers (`StorageBufferAttribute`, `instancedArray`) enable massive particle systems and simulations.
- Readback: `renderer.getArrayBufferAsync`/`readRenderTargetPixelsAsync`.

### Timestamp queries

`WebGPURenderer` supports GPU timestamp queries for profiling (`TimestampQueryPool`). Use sparingly; it is advanced and version-sensitive.

### WebGPU constraints

- Secure context required.
- Some mobile/browser combinations still lack support or have driver bugs.
- WebGL-only addons (`EffectComposer`, many passes, `CSS2DRenderer` combinations) do not automatically work with node materials.
- Custom GLSL `ShaderMaterial` is not the primary path; TSL is.
- `WebGLCubeRenderTarget` cannot be used with `WebGPURenderer` (r183+); use `CubeRenderTarget`.

## 12. Multiple views and HTML integration

- **HTML overlay**: position DOM elements over the canvas with CSS; use `drei/Html` or manual projection for anchors.
- **CSS2DRenderer/CSS3DRenderer**: DOM elements tracked by 3D transforms; good for labels and UI, but no depth occlusion by default (CSS3D can be occluded with tricks).
- **Scissor views**: render multiple cameras into regions of one canvas.
- **Drei `View`**: multiple independent scenes/cameras in one canvas with tracking divs.
- **Portals**: render a scene into a texture and map it onto a mesh.

## 13. Performance checklist

- Cap pixel ratio at 2 (1.5 on mobile).
- Reduce canvas size before lowering quality.
- Disable `antialias` if using post AA (FXAA/SMAA/TAA).
- Use `powerPreference: 'high-performance'`.
- Prefer render targets with `HalfFloatType` only when needed; 8-bit is cheaper.
- Lower shadow map resolution and shadow-casting light count.
- Use `compileAsync` to avoid hitches.
- Batch/instance to reduce draw calls.
- Dispose render targets and textures.
- Avoid `preserveDrawingBuffer`.
- Profile with `renderer.info`, Spector.js, and browser GPU tools.

```js
console.log(renderer.info.render);  // calls, triangles, points, lines, frame
console.log(renderer.info.memory);  // geometries, textures
```

## 14. Troubleshooting

| Problem | Check |
|---|---|
| Black canvas | Context creation failed, camera wrong, no lights, canvas size 0, shader error |
| WebGPU not available | Secure context, browser support, adapter request failure; fallback |
| WebGPU renders black on one backend | Node material compatibility, storage buffer limits, driver bug |
| Flicker after resize | Update camera aspect and renderer size; check DPR |
| Stutter on first interaction | Compile shaders ahead with `compileAsync` |
| Memory grows | Leaked geometries/textures/render targets; check `renderer.info.memory` |
| Context lost | Too many contexts, GPU reset, driver crash; handle events |
| Post-processing washed out | Missing output pass / tone mapping applied twice |
| Multiple canvases slow | Each context costs memory/GPU; use scissor or one renderer |
