# Performance Cheat Sheet

## Budgets (starting points)

| Metric | Mobile | Desktop |
|---|---|---|
| Frame time | 16.6 ms (60 fps) | 16.6 ms |
| Draw calls | < 100 | < 500 |
| Triangles | 100k-300k | 500k-2M |
| Texture memory | < 100 MB | < 300-500 MB |
| GLB download | < 2-5 MB | < 10-20 MB |
| Shadow lights | 1-2 | 2-4 |
| Post effects | 1-2 | 2-4 |
| DPR | 1.5-2 | 2 |

## Measure

```js
renderer.info.render.calls;
renderer.info.render.triangles;
renderer.info.memory.geometries;
renderer.info.memory.textures;
```

Tools: Chrome DevTools Performance, Spector.js, WebGPU DevTools, `stats-gl`, RenderDoc, Xcode GPU Capture, Android GPU Inspector.

Measure **95th percentile frame time**, not average FPS.

## Biggest wins, in order

1. Reduce draw calls (instancing, batching, merging, atlases).
2. Cap DPR (2 desktop, 1.5 mobile).
3. Compress textures (KTX2) and downscale.
4. Reduce/optimize shadows (resolution, count, freeze/bake).
5. Simplify geometry / LOD / culling.
6. Reduce post-processing (half-res, fewer effects).
7. Remove per-frame allocations.
8. Pause offscreen work.

## Draw calls

```js
new THREE.InstancedMesh(geometry, material, count);
new THREE.BatchedMesh(maxGeometries, maxVertices, maxIndices, material);
BufferGeometryUtils.mergeGeometries([g1, g2]);

instanced.setMatrixAt(i, matrix);
instanced.instanceMatrix.needsUpdate = true;
instanced.computeBoundingSphere();
```

## Textures

- Albedo: sRGB. Data: linear.
- KTX2/Basis: 4-8x less GPU memory.
- Power-of-two; mipmaps on; anisotropy 4-8.
- Memory (uncompressed RGBA8): `w * h * 4 * 1.333` bytes.

## Shadows

```js
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
light.shadow.mapSize.set(1024, 1024);
light.shadow.normalBias = 0.02;
renderer.shadowMap.autoUpdate = false;
renderer.shadowMap.needsUpdate = true; // bake once
```

## Pixel ratio

```js
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(w, h, false);
```

## Adaptive DPR

```js
let dpr = Math.min(devicePixelRatio, 2);
let frames = 0, elapsed = 0;

function adapt(dt) {
  frames++; elapsed += dt;
  if (elapsed < 1) return;
  const fps = frames / elapsed;
  frames = 0; elapsed = 0;
  if (fps < 50 && dpr > 1) dpr = Math.max(1, dpr - 0.25);
  else if (fps > 58 && dpr < Math.min(devicePixelRatio, 2)) dpr += 0.25;
  renderer.setPixelRatio(dpr);
  renderer.setSize(innerWidth, innerHeight, false);
}
```

## On-demand rendering

```js
let dirty = true;
renderer.setAnimationLoop(() => {
  if (!dirty) return;
  renderer.render(scene, camera);
  dirty = false;
});
```

## Compile ahead

```js
await renderer.compileAsync(scene, camera);
```

## Visibility

```js
document.addEventListener('visibilitychange', () => {
  if (document.hidden) renderer.setAnimationLoop(null);
  else { timer.reset(); renderer.setAnimationLoop(loop); }
});
```

## Leak check

```js
// Before and after teardown; force GC in DevTools
renderer.info.memory;
```

Dispose: geometry, material, textures, render targets, controls, listeners, workers, timers.

## CPU rules

- No `new Vector3()` per frame.
- No `setState` per frame in React.
- Throttle pointermove raycasts; use BVH.
- Debounce resize.
- Pool objects.
- Move heavy work to workers.

## Shader rules

- Fewer texture fetches.
- Avoid dependent reads.
- Avoid dynamic loops.
- Avoid `discard` over large areas.
- Prefer `alphaHash` for foliage.
- Use simpler materials at distance.

## Startup

- Code split the 3D bundle.
- Compress assets; CDN + HTTP/2/3.
- Preload critical, lazy-load the rest.
- Show a 2D shell/skeleton.
- `compileAsync` before reveal.
- Stream by section.

## Quick triage

| Symptom | Bottleneck |
|---|---|
| High CPU | Draw calls, JS allocations, React, physics |
| High GPU | Fragment shaders, overdraw, post, shadows |
| Spikes | GC, shader compile, texture upload, asset load |
| Slow first load | Bundle/assets/network/decode |
| Degrades over time | Leak |
| Mobile hot | Sustained GPU load, DPR, shadows/post |
