# 08 — Shaders: GLSL, ShaderMaterial, onBeforeCompile, and TSL

## 1. The GPU pipeline in one page

```
vertex data (attributes)
  -> vertex shader (per vertex) -> clip space position + varyings
  -> primitive assembly / clipping
  -> rasterization (per fragment)
  -> fragment shader (per fragment) -> color/depth
  -> depth test, blending, framebuffer
```

| Concept | GLSL | Three.js |
|---|---|---|
| Per-vertex input | `attribute` / `in` | `BufferAttribute` |
| Per-draw constant | `uniform` | `material.uniforms` or built-ins |
| Vertex-to-fragment | `varying` / `out`+`in` | `varying` in ShaderMaterial |
| Output | `gl_FragColor` (WebGL1 style) or `out vec4` | ShaderMaterial prefix handles it |
| Built-in matrices | `modelViewMatrix`, `projectionMatrix` | Provided by Three.js |
| Built-in attributes | `position`, `normal`, `uv` | Provided by geometry |

## 2. GLSL basics

### 2.1 Types

```glsl
float f = 1.0;
int i = 1;
bool b = true;
vec2 v2 = vec2(1.0, 2.0);
vec3 v3 = vec3(1.0);
vec4 v4 = vec4(v3, 1.0);
mat3 m3 = mat3(1.0);
mat4 m4 = mat4(1.0);
sampler2D tex;
```

- Always use decimal points for floats (`1.0`, not `1`).
- Constructors fill missing components: `vec3(1.0)` is `(1,1,1)`.
- Swizzles: `v.xyz`, `v.rgb`, `v.zyx`, `v.xx`.
- `mix(a, b, t)`, `clamp`, `smoothstep`, `step`, `fract`, `floor`, `mod`, `dot`, `cross`, `normalize`, `length`, `distance`, `reflect`, `refract`, `pow`, `exp`, `log`, `sin`, `cos`, `atan`.
- Derivatives: `dFdx`, `dFdy`, `fwidth` (fragment only).
- `discard` kills the fragment (no depth write).

### 2.2 Precision

```glsl
precision highp float;
```

- `highp` for positions and world-space math.
- `mediump` can save mobile bandwidth but causes artifacts with large coordinates.
- Three.js sets precision automatically; declare it in `RawShaderMaterial`.

### 2.3 Built-in uniforms and attributes in ShaderMaterial

Three.js injects:

```glsl
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat3 normalMatrix;
uniform vec3 cameraPosition;
uniform bool isOrthographic;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
```

In WebGL2/GLSL3 these become `in`/`out` depending on stage; Three.js handles the prefix for `ShaderMaterial`.

## 3. ShaderMaterial

```js
const material = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uColorA: { value: new THREE.Color(0x00e5ff) },
    uColorB: { value: new THREE.Color(0xff00aa) },
    uMap: { value: texture },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    uniform float uTime;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform sampler2D uMap;
    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
      vec3 base = mix(uColorA, uColorB, vUv.x);
      vec3 tex = texture2D(uMap, vUv).rgb;
      float fresnel = pow(1.0 - abs(vNormal.z), 2.0);
      vec3 color = base * tex + fresnel * 0.5;
      gl_FragColor = vec4(color, 1.0);
    }
  `,
});
```

Update uniforms:

```js
material.uniforms.uTime.value = elapsed;
```

Notes:

- `ShaderMaterial` does **not** receive lights, shadows, fog, or tone mapping automatically unless you include the chunks or implement them.
- `RawShaderMaterial` does not inject any prefix; you declare everything.
- Use `THREE.UniformsUtils.merge` to clone uniform sets.
- Textures must be marked with the correct `colorSpace`; in a custom shader, sRGB decoding is your responsibility if you sample manually and want linear math (Three.js does not auto-decode sampler reads in custom shaders unless you use `sRGBTransferEOTF`/the built-in chunks).

### Tone mapping and color space in custom shaders

If you write a custom fragment shader that outputs to screen and the renderer has tone mapping enabled, the built-in materials apply tone mapping; your `ShaderMaterial` does not unless you add it. Options:

- Set `material.toneMapped = false` and manage output yourself.
- Include the chunks:

```glsl
#include <tonemapping_fragment>
#include <colorspace_fragment>
```

These expect `gl_FragColor` to exist (WebGL2-style output) and use the renderer's settings.

## 4. `onBeforeCompile`

Patch an existing standard material without losing lights/shadows:

```js
const material = new THREE.MeshStandardMaterial({ color: 0xffffff });

material.onBeforeCompile = (shader) => {
  shader.uniforms.uTime = { value: 0 };
  shader.uniforms.uAmplitude = { value: 0.1 };

  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `
      #include <common>
      uniform float uTime;
      uniform float uAmplitude;
    `)
    .replace('#include <begin_vertex>', `
      #include <begin_vertex>
      transformed.y += sin(transformed.x * 4.0 + uTime) * uAmplitude;
    `);

  material.userData.shader = shader;
};

material.customProgramCacheKey = () => 'wave-material-v1';
```

In the loop:

```js
const shader = material.userData.shader;
if (shader) shader.uniforms.uTime.value = elapsed;
```

Caveats:

- Chunk names are internal; they can change.
- `onBeforeCompile` is WebGL-only. For WebGPU/TSL, use NodeMaterial.
- Changing injected code per object requires a unique `customProgramCacheKey`, or all objects share one program.
- Set `material.needsUpdate = true` when the structure changes, not every frame.

### Common chunks

| Chunk | Stage | Use |
|---|---|---|
| `<common>` | both | Helper functions |
| `<begin_vertex>` | vertex | Modify `transformed` |
| `<beginnormal_vertex>` | vertex | Modify `objectNormal` |
| `<project_vertex>` | vertex | Final clip position |
| `<map_fragment>` | fragment | Base map sampling |
| `<roughnessmap_fragment>` | fragment | Roughness |
| `<normal_fragment_maps>` | fragment | Normal maps |
| `<emissivemap_fragment>` | fragment | Emissive |
| `<output_fragment>` / `<opaque_fragment>` | fragment | Final color assembly |
| `<tonemapping_fragment>` | fragment | Tone mapping |
| `<colorspace_fragment>` | fragment | Output color space |

## 5. TSL — Three.js Shading Language

TSL is a JavaScript node graph that compiles to WGSL (WebGPU) or GLSL (WebGL). It is the recommended path for `WebGPURenderer` and NodeMaterial. It is renderer-agnostic where possible.

### 5.1 Mental model

```js
import { Fn, uniform, uv, texture, positionWorld, normalWorld, time, color, vec3, mix } from 'three/tsl';

const material = new THREE.MeshStandardNodeMaterial();

const tint = uniform(new THREE.Color(0x00e5ff));
const mask = texture(map, uv()).r;

material.colorNode = mix(color(0x111111), tint, mask);
```

- Every node returns a value; operations chain.
- The graph is analyzed and optimized; nodes are reused and variables created automatically.
- `Fn()` creates a reusable function/scope with control flow.
- `uniform()` creates a GPU uniform updated from JS.
- Node materials expose slots that preserve the lighting model.

### 5.2 Imports

```js
import * as THREE from 'three/webgpu';
import {
  Fn, uniform, uniformArray, attribute, uv, texture, textureLoad,
  positionLocal, positionWorld, positionGeometry, normalLocal, normalWorld,
  cameraPosition, modelWorldMatrix, screenUV, time, deltaTime,
  color, vec2, vec3, vec4, float, int, mat3, mat4,
  mix, smoothstep, clamp, step, sin, cos, fract, floor, length, dot, cross,
  If, Loop, Break, Continue, Return, select,
  pass, mrt, output, emissive, velocity, bloom, fxaa, ao, ssr, ssgi, dof,
  instancedArray, storage, compute,
} from 'three/tsl';
```

NodeMaterial classes come from `three/webgpu`; TSL functions come from `three/tsl`.

### 5.3 NodeMaterial slots

| Slot | Type | Effect |
|---|---|---|
| `positionNode` | vec3 | Vertex position (`positionLocal` by default) |
| `normalNode` | vec3 | Normal |
| `colorNode` | vec3/vec4 | Base color |
| `emissiveNode` | vec3 | Emissive |
| `roughnessNode` | float | Roughness |
| `metalnessNode` | float | Metalness |
| `aoNode` | float | Ambient occlusion |
| `opacityNode` | float | Alpha |
| `alphaTestNode` | float | Alpha test threshold |
| `normalNode` | vec3 | Normal (view space) |
| `clearcoatNode`, `clearcoatRoughnessNode` | float | Clearcoat |
| `sheenNode`, `sheenRoughnessNode`, `sheenColorNode` | | Sheen |
| `transmissionNode`, `thicknessNode`, `attenuationColorNode`, `attenuationDistanceNode` | | Transmission |
| `iridescenceNode`, `iridescenceIORNode`, `iridescenceThicknessNode` | | Iridescence |
| `anisotropyNode`, `anisotropyRotationNode` | | Anisotropy |
| `dispersionNode` | float | Dispersion |
| `outputNode` | vec4 (NodeMaterial) | Final output override |

Example:

```js
const material = new THREE.MeshPhysicalNodeMaterial();
material.colorNode = color(0x8899ff);
material.roughnessNode = smoothstep(0.2, 0.8, uv().y).mul(0.6).add(0.2);
material.metalnessNode = float(0.0);
material.emissiveNode = color(0x001122);
```

### 5.4 Position and normal spaces

| Node | Space |
|---|---|
| `positionGeometry` | Raw geometry attribute (pre-skinning/morphing) |
| `positionLocal` | Local position after skinning/morphing |
| `positionWorld` | World position |
| `positionView` | View space |
| `normalGeometry` | Raw geometry normal |
| `normalLocal` | Local normal |
| `normalView` | View-space normal |
| `normalWorld` | World-space normal |
| `cameraPosition` | World camera position |

Use `positionGeometry` when you need the pre-transform vertex (r185+ distinction).

### 5.5 Functions and control flow

```js
const wave = Fn(([x, t]) => {
  return sin(x.mul(4.0).add(t)).mul(0.1);
});

material.positionNode = positionLocal.add(vec3(0, wave(positionLocal.x, time), 0));

const limit = Fn(({ y }) => {
  const result = vec3(positionLocal);
  If(result.y.greaterThan(10.0), () => {
    result.y = float(10.0);
  });
  return result;
});
```

TSL control flow requires `Fn()` because it creates a scope. Use `select(condition, a, b)` for ternary-like expressions.

### 5.6 Textures and UVs

```js
const albedo = texture(map, uv());
const detail = texture(detailMap, uv().mul(10.0));
material.colorNode = albedo.rgb.mul(detail.rgb);

// Triplanar mapping
import { triplanarTexture } from 'three/tsl';
material.colorNode = triplanarTexture(map);
```

- `texture()` samples with filtering; `textureLoad()` fetches without interpolation.
- Texture node values are linear if the texture's color space is set correctly.
- `uv(1)`, `uv(2)` select extra UV sets (r151+ naming `uv`, `uv1`, ...).

### 5.7 Fresnel

```js
const fresnel = Fn(({ normal, viewDir, power = 2.0 }) => {
  return pow(oneMinus(abs(dot(normal, viewDir))), power);
});

material.emissiveNode = color(0x00e5ff).mul(
  fresnel({ normal: normalView, viewDir: positionView.negate().normalize(), power: 3.0 })
);
```

### 5.8 Dissolve

```js
const noiseValue = texture(noiseMap, uv()).r;
const threshold = uniform(0.0);
const edge = smoothstep(threshold.sub(0.05), threshold, noiseValue);
material.opacityNode = edge;
material.alphaTestNode = edge.sub(0.01);
// Animate threshold; add emissive rim near the edge
```

### 5.9 Vertex displacement

```js
const displacement = texture(heightMap, uv()).r.mul(0.2);
material.positionNode = positionLocal.add(normalLocal.mul(displacement));
```

Recompute normals if the displacement is large and lighting looks wrong; use a normal map or derivative-based normals.

### 5.10 Instanced variation

```js
const random = hash(instanceIndex);
material.colorNode = mix(color(0xff3366), color(0x33aaff), random);
```

`hash()` produces a stable pseudo-random value per instance; `range(min, max)` creates a per-instance attribute.

### 5.11 Post-processing and render passes

```js
import { pass, bloom, grayscale, renderOutput } from 'three/tsl';

const scenePass = pass(scene, camera);
const pipeline = new THREE.RenderPipeline(renderer);

pipeline.outputNode = grayscale(bloom(scenePass, 0.6, 0.3, 0.8));
pipeline.render();
```

MRT:

```js
scenePass.setMRT(mrt({
  output: output,
  normal: packNormalToRGB(normalView),
  velocity: velocity,
}));
const colorTex = scenePass.getTextureNode('output');
const normalTex = scenePass.getTextureNode('normal');
```

### 5.12 Compute

```js
const count = 100000;
const positions = instancedArray(count, 'vec3');

const update = compute(() => {
  const i = instanceIndex;
  const p = positions.element(i);
  p.assign(p.add(vec3(0, 0.01, 0)));
});

renderer.compute(update);
```

Compute is WebGPU-only; for WebGL GPGPU use `GPUComputationRenderer` with float textures.

### 5.13 GLSL escape hatch

```js
import { glslFn } from 'three/tsl'; // API evolves; check current exports

const custom = glslFn(/* glsl */`
  float myFunc(float x) { return sin(x); }
`);
```

TSL is designed to avoid raw string shaders, but escape hatches exist for porting. Prefer native TSL.

## 6. GLSL to TSL mapping

| GLSL | TSL |
|---|---|
| `texture2D(map, uv)` | `texture(map, uv)` |
| `mix(a, b, t)` | `mix(a, b, t)` |
| `clamp(x, a, b)` | `clamp(x, a, b)` |
| `smoothstep(a, b, x)` | `smoothstep(a, b, x)` |
| `fract(x)` | `fract(x)` |
| `vec3(1.0)` | `vec3(1.0)` |
| `vUv` | `uv()` or `varying(uv())` |
| `modelMatrix * vec4(position,1)` | `modelWorldMatrix.mul(vec4(positionGeometry, 1))` |
| `normalMatrix * normal` | `modelNormalMatrix.mul(normalLocal)` |
| `cameraPosition` | `cameraPosition` |
| `gl_FragColor` | `material.colorNode` / `outputNode` |
| `if (...) { }` | `If(cond, () => {})` inside `Fn` |
| `for (...)` | `Loop(count, ({ i }) => {})` |

## 7. Shader performance

- Minimize texture fetches; each fetch is bandwidth and latency.
- Avoid dependent texture reads (using one texture to compute UVs for another) when possible.
- Prefer `mix`/`step` over branches; GPUs execute both sides of divergent branches.
- Avoid `discard` in large areas (breaks early-z and can disable optimizations).
- Use `mediump` only where safe (mobile).
- Do not compute expensive noise per fragment if it can be precomputed or done per vertex.
- Use derivatives (`dFdx`, `dFdy`) for procedural normals and anti-aliased patterns.
- Keep loops constant or bounded; dynamic loops can be slow.
- Pack data into channels (roughness/metalness/AO in one texture).
- Use `alphaHash` instead of discard for foliage when possible (TAA-friendly).
- In TSL, the graph is optimized automatically; still avoid redundant `texture()` samples.

## 8. Debugging shaders

- Check the browser console for compile errors with line numbers.
- Use `renderer.debug.checkShaderErrors = true` (default in dev).
- Simplify the shader to `gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0)` to confirm it draws.
- Visualize intermediates as colors (`normal * 0.5 + 0.5`, `uv` as red/green).
- Use `ShaderMaterial` with `wireframe` or a debug material to verify geometry.
- For TSL, inspect the generated code with the NodeBuilder/inspector when available.
- Spector.js captures draw calls and shader programs (WebGL).
- Common causes of "shader error": missing precision, wrong varying type/name, using an attribute not present, GLSL version mismatch, sampler used in vertex shader without support.

## 9. WebGL vs WebGPU shader differences

| Topic | WebGL/GLSL | WebGPU/WGSL |
|---|---|---|
| Language | GLSL ES 3.00 | WGSL |
| Shader authoring in three | ShaderMaterial/onBeforeCompile | TSL/NodeMaterial |
| NDC depth | `[-1, 1]` | `[0, 1]` |
| Texture sampling | `texture2D` | `textureSample` |
| Derivatives | `dFdx/dFdy` | `dpdx/dpdy` |
| Storage buffers | No (WebGL2 has SSBO? not exposed portably) | Yes |
| Compute | No | Yes |
| Bind groups | No | Yes |
| Pipeline state | Global GL state | Explicit pipelines |

Three.js abstracts most of this, but custom shader code and depth reconstruction must account for the backend.

## 10. Common pitfalls

| Symptom | Cause |
|---|---|
| Shader compiles but black | Output in wrong color space, normals wrong, uniforms not updated |
| Works in WebGL, not WebGPU | Used `ShaderMaterial`/`onBeforeCompile`; use TSL |
| Lighting is flat | Custom shader lacks lights; use NodeMaterial or onBeforeCompile |
| Texture looks washed out | Missing sRGB decode in custom shader |
| Time-based animation stutters | Using `Date.now()` or accumulated float; use delta |
| Flicker on transparent shader | `depthWrite`/sorting |
| Normals wrong after deformation | Not updating normals; use derivative normals or recompute |
| Shader recompiles constantly | `needsUpdate` every frame or unique material per frame |
| Uniform arrays not updating | Wrong uniform type or not marking needsUpdate |
| `discard` kills performance | Large transparent areas; use alphaHash or geometry cutouts |
