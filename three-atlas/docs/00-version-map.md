# 00 — Ecosystem Map, Versions, and Compatibility

> Verified: **2026-11-06**. `three@0.187.0` (r187). The `dev` branch already prepares r188.

## 1. Ecosystem pieces

| Piece | Package | Current version | Purpose |
|---|---|---|---|
| Engine | `three` | 0.187.0 | Scene, rendering, math, loaders, addons |
| Types | `@types/three` | ^0.187 | TypeScript |
| React renderer | `@react-three/fiber` | 9.8.2 | Declarative Three.js in React 19 |
| R3F helpers | `@react-three/drei` | 10.7.9 | Controls, loaders, staging, shaders, performance |
| R3F post-processing | `@react-three/postprocessing` | 3.2.2 | Wrapper around `postprocessing` |
| Vanilla post-processing | `postprocessing` | 6.39.6 | Modern composer, high-quality effects |
| R3F physics | `@react-three/rapier` | 2.2.0 | Rapier (WASM) |
| Vanilla physics | `@dimforge/rapier3d-compat` | 0.x | Rapier |
| Accelerated raycasting | `three-mesh-bvh` | 0.9.18 | BVH for picking and collisions |
| Addon stdlib | `three-stdlib` | 2.36.1 | Bundled addons (used by Drei) |
| Path tracing | `three-gpu-pathtracer` | 0.0.28 | Progressive photorealistic rendering |
| State | `zustand` / `valtio` / `jotai` | 5.x / 2.x / 2.x | App and scene state |
| Tweens | `@tweenjs/tween.js` / `maath` | 25.x / 0.3.x | Animation and math helpers |
| GUI | `lil-gui` / `leva` | 0.20.x / 0.10.x | Parameter debugging |
| Stats | `stats-gl` / `stats.js` | 3.x / 0.17.x | GPU/CPU monitoring |
| glTF tooling | `@gltf-transform/cli`, `gltfpack`, `@react-three/gltfjsx` | latest | Optimization and code generation |

## 2. Correct imports (r187)

```js
// Core (WebGL by default)
import * as THREE from 'three';

// Official addons (ESM)
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// WebGPU + NodeMaterial
import * as THREE_WEBGPU from 'three/webgpu'; // or { WebGPURenderer, MeshStandardNodeMaterial }
// TSL (Three.js Shading Language)
import { color, uv, texture, positionWorld, normalWorld, time, Fn, uniform, pass, mrt, output } from 'three/tsl';
```

**Never** use `examples/js/*` (removed in r148) or `build/three.js` (removed in r161).

### Import map for CDN without a bundler

```html
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.187.0/examples/jsm/",
    "three/webgpu": "https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.webgpu.js",
    "three/tsl": "https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.tsl.js"
  }
}
</script>
```

## 3. Compatibility

| Requirement | Status in r187 |
|---|---|
| WebGL 1 | Removed (since r163). WebGL2 is mandatory. |
| WebGL2 | Universally supported in modern browsers. |
| WebGPU | Chrome/Edge 113+, Safari 26+, Firefox 141+ (Windows). Requires a secure context (HTTPS/localhost). |
| Node | Modern ESM; the repository uses Node 20+. |
| React (R3F) | R3F v9 maps to React 19; R3F v8 maps to React 18. |
| TypeScript | `@types/three` aligned with the `three` version. |
| Mobile | WebGL2 on iOS 15+ and modern Android; WebGPU still limited on some mobile devices. |

> **Recommended strategy:** `WebGPURenderer` with a WebGL fallback, or `WebGLRenderer` if you do not need compute. In r187 `WebGPURenderer` compiles TSL to WGSL or GLSL depending on the backend, so the same material runs on both.

## 4. Recent breaking changes

Upgrade in **~10-release** steps; deprecations last 10 versions.

| Version | Key change |
|---|---|
| r152 | Color management enabled by default; `outputColorSpace`; textures use `colorSpace`. |
| r155 | Physically correct lights by default (`useLegacyLights=false`). |
| r160 | Removed `build/three.js`. |
| r163 | **WebGL 1 removed**; `stencil` off by default; `Scene.environmentIntensity`. |
| r165 | `BatchedMesh` requires `addInstance()`. |
| r166+ | TSL/WebGPU migration: imports `three/webgpu` and `three/tsl`. |
| r168 | TSL chaining removed for post-processing (`fxaa(pass)` instead of `pass.fxaa()`). |
| r169 | `TransformControls` uses `controls.getHelper()`. |
| r170 | `Material.type` is static; TSL modules moved to addons. |
| r171 | Final WebGPU/TSL import paths. |
| r173 | `Timer` moved to core; `varying()` → `toVarying()`; `vertexStage()` → `toVertexStage()`. |
| r174 | `Timer.connect(document)` for Page Visibility. |
| r175 | `Controls.connect()` requires a DOM element; `CapsuleGeometry.length` → `height`. |
| r177 | `ColorManagement.toWorkingColorSpace` → `colorSpaceToWorking`. |
| r178 | `MultiplyBlending`/`SubtractiveBlending` require `premultipliedAlpha`. |
| r179 | `RGBELoader` → `HDRLoader`; `TRAAPassNode` → `TRAANode`. |
| r180 | `RGBMLoader` removed; `resolution` → `resolutionScale` on nodes. |
| r181 | `PCFSoftShadowMap` deprecated (use `PCFShadowMap`, already soft); `renderAsync` deprecated; `PI2` → `TWO_PI`. |
| r182 | `colorBufferType` → `outputBufferType`. |
| r183 | **`PostProcessing` → `RenderPipeline`**; `Clock` deprecated → `Timer`; improved WebGPU shadows. |
| r184 | Environment/background rotation aligned; `FBXLoader` converts Z-up to Y-up; `FileLoader.load()` has no return value. |
| r185 | Premultiplied alpha in WebGPU; GTAO more physically correct; TSL `positionLocal` vs `positionGeometry`. |
| r186 | `Object3D.dispose()`; `PCFSoftShadowMap` removed in WebGPU; `Source` → `TextureSource`; `SimplifyModifier` is async. |
| r187 | PMREM uses cube render targets (removes `CubeUVReflectionMapping`); custom lights register via `Light.registerNode`; `iridescenceThicknessRange` deprecated; TSL coerces types implicitly. |

### Most commonly missed renames

| Old | New |
|---|---|
| `RGBELoader` | `HDRLoader` |
| `PostProcessing` | `RenderPipeline` |
| `Clock` | `Timer` |
| `PCFSoftShadowMap` | `PCFShadowMap` |
| `Source` | `TextureSource` |
| `varying()` | `toVarying()` |
| `vertexStage()` | `toVertexStage()` |
| `directionToColor()` | `packNormalToRGB()` |
| `colorToDirection()` | `unpackRGBToNormal()` |
| `PI2` | `TWO_PI` |
| `USDZLoader` | `USDLoader` (USDZ deprecated) |
| `Scene.environment` intensity | `Scene.environmentIntensity` |
| `TransformControls` added to scene | `scene.add(controls.getHelper())` |

## 5. Upgrading without pain

1. Pin an exact version (`"three": "0.187.0"`), not `^`.
2. Read the [Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide) for the entire range.
3. Upgrade in steps of 10 (`r177 → r187`, not `r150 → r187`).
4. Fix deprecation warnings first (they last 10 releases).
5. Verify: color (r152+), lights (r155+), shadows (r181+), WebGPU/TSL imports (r171+), post-processing (r183+).
6. Test on a real mobile device, not only in DevTools.

## 6. WebGL vs WebGPU: when to use each

| Need | WebGL2 | WebGPU |
|---|---|---|
| Maximum compatibility | Yes | Partial (improving) |
| Normal scenes, PBR, post-processing | Yes | Yes |
| Compute shaders / GPGPU | Partial (via textures) | Native |
| Storage buffers, massive particle systems | Limited | Yes |
| NodeMaterial/TSL | No (WebGPU only) | Yes |
| Render bundles / pipelines | No | Yes |
| Debugging | Mature (Spector) | Evolving (DevTools) |
| Mobile | Yes | Partial |

**Practical rule:** if you do not need compute or TSL, WebGL2 is the safe bet. If the project is new and the audience uses modern browsers, use WebGPU with a WebGL fallback.

## 7. Version links

- Releases: <https://github.com/mrdoob/three.js/releases>
- Migration Guide: <https://github.com/mrdoob/three.js/wiki/Migration-Guide>
- Docs: <https://threejs.org/docs/>
- Examples: <https://threejs.org/examples/>
- npm: <https://www.npmjs.com/package/three>
