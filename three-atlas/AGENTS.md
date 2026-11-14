# AGENTS.md — How to use this pack

This directory is a knowledge base for building **any** interactive 3D web experience with Three.js. It is optimized so an AI agent can find the right answer quickly and avoid inventing API.

## Lookup order

1. **Before writing Three.js code**, read `cheatsheets/api-cheatsheet.md` and the relevant topic document.
2. **For shaders**, read `docs/08-shaders-glsl-tsl.md` and `cheatsheets/tsl-cheatsheet.md`. Use TSL when the project uses `WebGPURenderer`; use classic GLSL when the project is plain WebGL and does not need node materials.
3. **For React**, read `docs/15-react-three-fiber.md` before proposing hooks or `Canvas`.
4. **For performance**, read `docs/13-performance.md` and `checklists/performance.md`.
5. **When debugging**, follow `docs/20-debugging-antipatterns.md` in order; do not change things at random.
6. **Before delivery**, run through `checklists/launch.md`.

## Invariants you must never break

- Use `three/addons/*` for addons; never `examples/js` (removed in r148).
- Color textures must use `texture.colorSpace = THREE.SRGBColorSpace`; data maps must use `THREE.NoColorSpace`.
- `renderer.outputColorSpace` defaults to sRGB; do not change it unless you know why.
- Units are meters, +Y is up, the camera looks toward −Z.
- `dispose()` is mandatory for geometries, materials, textures, and render targets created by the app.
- No per-frame allocations in the hot path (vectors, arrays, materials, closures).
- In R3F: mutate refs inside `useFrame`; do not call `setState` every frame.
- Pin the `three` version; do not mix r150-era APIs with r187 without checking the Migration Guide.

## Quick decision tree

| Question | Answer |
|---|---|
| WebGL or WebGPU? | WebGL2 for universal compatibility; WebGPU (r187+) if you need compute/storage buffers or the project already assumes it. `WebGPURenderer` can fall back to WebGL via `forceWebGL`. |
| Vanilla or React? | Vanilla for pages with a single scene and full control; R3F if the project already uses React, has complex state, or has a frontend team. |
| How do I load a model? | glTF/GLB + `GLTFLoader` + `DRACOLoader` + `KTX2Loader` + `MeshoptDecoder`. Optimize first with `gltf-transform`/`gltfpack`. |
| How do I add bloom/SSAO? | WebGL: `postprocessing` (pmndrs) or `EffectComposer`. WebGPU: `RenderPipeline` + TSL `bloom()`/`ao()`. |
| How do I speed up raycasting? | `three-mesh-bvh` or bounding volumes; in R3F use `<Bvh>`. |
| How do I add physics? | `@react-three/rapier` (R3F) or `@dimforge/rapier3d-compat` (vanilla). |
| How do I animate? | `AnimationMixer` for glTF clips; procedural animation in the loop/`useFrame`; springs for UI; scroll-driven motion for storytelling. |
| How do I put UI over the canvas? | HTML/CSS overlay or `drei/Html`; never render small text only in 3D. |
| How do I guarantee accessibility? | DOM mirror, keyboard support, `prefers-reduced-motion`, pause control, static fallback. See `docs/17-accessibility.md`. |

## Code conventions for proposals

- Modern JavaScript/TypeScript (ESM). TypeScript recommended: `three` types come from `three-types/three-ts-types` (package `@types/three`).
- Minimal vanilla structure: `main.js` (bootstrap) + `scene/` + `assets/` + `ui/` + `core/renderer.js`.
- Name code in English; documentation and comments in English unless the project asks otherwise.
- Prefer `const` and pure functions for math; reuse temporary `Vector3` instances.
- In R3F, components in PascalCase, hooks as `useX`, `useFrame` only when needed.
- Do not add new dependencies if the official addon is enough (`three/addons`).

## Minimum verification before saying "done"

1. Code imports existing paths (`three`, `three/addons/...`, `three/webgpu`, `three/tsl`).
2. It does not use removed or renamed APIs (see `docs/00-version-map.md`).
3. It handles resize (`setSize`, `setPixelRatio`) and cleanup (`dispose`, `removeEventListener`, `setAnimationLoop(null)`).
4. It has a fallback or message when WebGL/WebGPU is unavailable.
5. It respects `prefers-reduced-motion`.
6. If there are textures, color space is correct.
7. If there are models, loading has progress and error handling.

## Anti-hallucination

- Do not invent constructor parameters. Check `docs/` or the official API when unsure.
- `PCFSoftShadowMap` is deprecated: use `PCFShadowMap` (already soft) on r181+.
- `RGBELoader` is now `HDRLoader` since r180.
- `PostProcessing` is now `RenderPipeline` since r183.
- `Clock` is deprecated since r183: use `Timer`.
- `three.js` ships no physics engine, no scene editor, and no UI system. Do not assume they exist.
- `OrbitControls` does not zoom while rotating since r134; do not claim otherwise.
