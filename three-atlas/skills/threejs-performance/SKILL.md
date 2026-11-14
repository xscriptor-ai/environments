---
name: threejs-performance
description: Three.js performance engineering for draw calls, GPU/CPU bottlenecks, instancing, batching, textures, shadows, post-processing, adaptive quality, mobile, and startup. Use when a 3D scene is slow, janky, memory-heavy, overheating on mobile, or needs a performance budget and profiling plan.
---

# Three.js Performance

## Read first

- `../../docs/13-performance.md` — full guide.
- `../../cheatsheets/performance-cheatsheet.md` — budgets and snippets.
- `../../checklists/performance.md` — audit checklist.

## Method

1. Define a budget (16.6 ms at 60 fps).
2. Measure: `renderer.info`, frame time, CPU/GPU split.
3. Identify the dominant cost.
4. Fix one thing, re-measure.
5. Test on a real mid-range mobile device.

Never optimize from intuition; profile.

## High-impact order

1. Draw calls (instancing, batching, merging, atlases).
2. Pixel ratio cap and resolution scaling.
3. Texture compression and size (KTX2).
4. Shadows (count, resolution, freeze/bake).
5. Geometry (LOD, simplify, cull, impostors).
6. Post-processing (fewer effects, half-res).
7. CPU allocations and React updates.
8. Startup (code split, compress, preload, compileAsync).

## Metrics

```js
renderer.info.render.calls;
renderer.info.render.triangles;
renderer.info.memory.geometries;
renderer.info.memory.textures;
```

- Draw calls mobile < 100, desktop < 500.
- Triangles mobile 100k-300k, desktop 500k-2M.
- Measure 95th percentile frame time, not average FPS.

## Patterns

### Instancing

```js
const mesh = new THREE.InstancedMesh(geometry, material, count);
mesh.setMatrixAt(i, matrix);
mesh.instanceMatrix.needsUpdate = true;
mesh.computeBoundingSphere();
```

### Adaptive DPR

```js
let dpr = Math.min(devicePixelRatio, 2);
// lower when fps < 50, raise when fps > 58, with hysteresis
renderer.setPixelRatio(dpr);
renderer.setSize(w, h, false);
```

### Freeze static shadows

```js
renderer.shadowMap.autoUpdate = false;
renderer.shadowMap.needsUpdate = true;
```

### Compile ahead

```js
await renderer.compileAsync(scene, camera);
```

### On-demand rendering

```js
<Canvas frameloop="demand">
```

Call `invalidate()` after changes.

## Rules

- No per-frame allocations in hot paths.
- No `setState` per frame in React.
- Share materials, textures, geometries.
- Cap DPR at 2 (1.5 mobile).
- Compress everything you ship.
- Pause rendering when hidden.
- Dispose everything you create.
- Avoid `preserveDrawingBuffer`.
- Limit shadow-casting lights.
- Avoid full-res DOF/SSR on mobile.

## Triage

| Symptom | Bottleneck |
|---|---|
| High CPU | Draw calls, JS allocations, React, physics |
| High GPU | Fragment shaders, overdraw, post, shadows |
| Spikes | GC, shader compile, texture upload, loading |
| Slow start | Bundle/assets/network/decode |
| Degrades | Memory leak |
| Hot mobile | Sustained GPU load, DPR, effects |

## Verification

- Budget met on target device.
- No leak after scene transitions (`renderer.info.memory` stable).
- 95th percentile frame time acceptable.
- First interaction not blocked by shader compilation.
- Quality tier/fallback available.
