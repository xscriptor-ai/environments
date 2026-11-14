---
name: threejs-webgpu
description: Three.js WebGPU implementation with WebGPURenderer, TSL/NodeMaterial, RenderPipeline, compute shaders, storage buffers, and WebGL fallback. Use when building a WebGPU three.js app, migrating from WebGL, using compute/GPGPU, or debugging WebGPU-specific rendering and compatibility issues.
---

# Three.js WebGPU

## Read first

- `../../docs/07-rendering-webgl-webgpu.md` — renderer and pipeline.
- `../../docs/08-shaders-glsl-tsl.md` — TSL/NodeMaterial.
- `../../docs/12-post-processing.md` — RenderPipeline.
- `../../cheatsheets/tsl-cheatsheet.md` — TSL API.

## Setup

```js
import * as THREE from 'three/webgpu';

const renderer = new THREE.WebGPURenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

await renderer.init(); // explicit when not relying on setAnimationLoop
renderer.setAnimationLoop(() => renderer.render(scene, camera));
```

- Requires a secure context (HTTPS/localhost).
- `renderer.init()` is async.
- `WebGPURenderer` can use a WebGL2 backend with `forceWebGL: true`.
- TSL compiles to WGSL or GLSL depending on the backend.
- NodeMaterial and TSL are required for WebGPU (no `onBeforeCompile`).

## Fallback

```js
if (navigator.gpu && await navigator.gpu.requestAdapter()) {
  // WebGPU
} else {
  // WebGLRenderer or WebGPURenderer({ forceWebGL: true })
}
```

Always provide a WebGL path or a static fallback.

## Materials

```js
import { color, uv, mix, texture } from 'three/tsl';

const material = new THREE.MeshStandardNodeMaterial();
material.colorNode = mix(color(0xff3366), color(0x3366ff), uv().x);
material.roughnessNode = texture(roughnessMap, uv()).g;
```

## Post-processing

```js
import { pass, bloom, renderOutput } from 'three/tsl';

const pipeline = new THREE.RenderPipeline(renderer);
const scenePass = pass(scene, camera);
pipeline.outputNode = bloom(scenePass, 0.8, 0.3, 0.85);
pipeline.render();
```

- `RenderPipeline` replaced `PostProcessing` in r183.
- Use MRT (`mrt`) for normals/velocity/depth.
- Use `setResolutionScale` for heavy effects.

## Compute

```js
const positions = instancedArray(count, 'vec3');
const update = compute(() => {
  const p = positions.element(instanceIndex);
  p.addAssign(vec3(0, 0.01, 0));
});
renderer.compute(update);
```

- WebGPU-only; provide a WebGL fallback with `GPUComputationRenderer`.

## Compatibility notes

| Topic | Note |
|---|---|
| WebGL 1 | Not supported anywhere (r163+) |
| NDC depth | WebGPU `[0,1]`, WebGL `[-1,1]` |
| Cube render targets | Use `CubeRenderTarget`, not `WebGLCubeRenderTarget` |
| EffectComposer | WebGL addon; use TSL/RenderPipeline |
| `ShaderMaterial` | Not the WebGPU path; use TSL |
| `PCFSoftShadowMap` | Removed in WebGPU; use `PCFShadowMap` |
| `renderAsync` | Removed/deprecated; init then use sync |
| Mobile | Support varies; test and fallback |

## Debugging

- Check `navigator.gpu` and adapter availability.
- Ensure `await renderer.init()` before synchronous API.
- Validate node graph (colorNode, outputNode).
- Use `renderOutput()` when controlling tone mapping/color space explicitly.
- Test the WebGL backend for comparison.
- Watch for driver-specific issues on mobile.

## Verification

- Works on WebGPU and the WebGL fallback.
- No WebGL-only APIs in the node graph.
- Post pipeline outputs tone-mapped sRGB.
- Compute/storage buffers have fallbacks.
- Performance measured on target hardware.
