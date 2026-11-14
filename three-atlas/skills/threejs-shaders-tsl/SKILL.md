---
name: threejs-shaders-tsl
description: Shader authoring for Three.js with GLSL, ShaderMaterial, onBeforeCompile, NodeMaterial, and TSL for WebGPU/WebGL, including post-processing and compute. Use when creating custom materials, effects, vertex displacement, dissolve, fresnel, particles, procedural textures, or GPU simulation.
---

# Shaders and TSL

## Read first

- `../../docs/08-shaders-glsl-tsl.md` — full guide.
- `../../cheatsheets/tsl-cheatsheet.md` — TSL API.
- `../../docs/12-post-processing.md` for post effects.

## Choose the path

| Project | Use |
|---|---|
| WebGL, need lights/shadows | `onBeforeCompile` on a standard material |
| WebGL, full custom unlit | `ShaderMaterial` |
| WebGPU/NodeMaterial | TSL |
| Post-processing WebGL | `postprocessing` or `EffectComposer` |
| Post-processing WebGPU | `RenderPipeline` + TSL |
| Compute/GPGPU WebGPU | TSL compute + storage buffers |
| GPGPU WebGL | `GPUComputationRenderer` |

## TSL essentials

```js
import * as THREE from 'three/webgpu';
import { Fn, uniform, uv, texture, color, mix, positionLocal, normalLocal, time, smoothstep } from 'three/tsl';

const material = new THREE.MeshStandardNodeMaterial();
material.colorNode = mix(color(0xff3366), color(0x3366ff), uv().x);
```

Slots: `colorNode`, `roughnessNode`, `metalnessNode`, `emissiveNode`, `opacityNode`, `alphaTestNode`, `positionNode`, `normalNode`.

Control flow requires `Fn`:

```js
const f = Fn(({ x }) => {
  const out = float(0).toVar();
  If(x.greaterThan(0.5), () => out.assign(1.0)).Else(() => out.assign(0.0));
  return out;
});
```

## Rules

- Never use `ShaderMaterial`/`onBeforeCompile` with `WebGPURenderer`.
- Include `<tonemapping_fragment>` and `<colorspace_fragment>` in custom shaders that render to screen, or set `toneMapped = false` and handle output.
- Texture color space must be set before sampling; sRGB decode is not automatic in raw shaders.
- Prefer `alphaHash` over `discard` for foliage.
- `positionLocal` includes skinning/morphing; `positionGeometry` is raw.
- Reuse uniforms; avoid recompiles.
- Test the shader on the target backend (WGSL vs GLSL).
- Keep fragment work small; minimize texture fetches and branches.

## Patterns

### Fresnel

```js
const fresnel = pow(oneMinus(abs(dot(normalView, positionView.negate().normalize()))), 3.0);
material.emissiveNode = color(0x00e5ff).mul(fresnel);
```

### Vertex displacement

```js
const h = texture(heightMap, uv()).r.mul(0.2);
material.positionNode = positionLocal.add(normalLocal.mul(h));
```

### Dissolve

```js
const threshold = uniform(0);
const n = texture(noiseMap, uv()).r;
material.opacityNode = smoothstep(threshold.sub(0.05), threshold, n);
material.alphaTestNode = material.opacityNode;
```

### Bloom (WebGPU)

```js
const scenePass = pass(scene, camera);
pipeline.outputNode = bloom(scenePass, 0.8, 0.3, 0.85);
```

## Debugging

- Test with a flat color first.
- Visualize normals/uv/depth.
- Check console for compile errors.
- Use `renderer.debug.checkShaderErrors = true`.
- In TSL, simplify the node graph; remove nodes one by one.
- Capture WebGL with Spector.js.

## Verification

- Compiles on both backends when they are supported.
- No per-frame recompiles.
- Correct color space and tone mapping.
- Performance measured with effects on.
