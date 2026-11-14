# 13 — Performance Engineering

## 1. Start with a budget

At 60 fps, the frame budget is **16.6 ms**. At 30 fps, it is 33.3 ms. Use 80% of the budget as a target to leave headroom.

| Target | Frame time | Typical device |
|---|---|---|
| 120 fps | 8.3 ms | High-end desktop, VR |
| 60 fps | 16.6 ms | Desktop, good mobile |
| 30 fps | 33.3 ms | Low-end mobile |
| 20 fps | 50 ms | Absolute floor for interaction |

Divide the budget:

```
CPU: JS, React, physics, animation, culling, draw call submission
GPU: vertex, fragment, shadows, post-processing, bandwidth
```

If CPU time is high, draw calls/JS are the problem. If GPU time is high, pixels/shaders/geometry are the problem.

## 2. Measure first

### 2.1 Renderer info

```js
renderer.info.render.calls;      // draw calls
renderer.info.render.triangles;  // triangles submitted
renderer.info.render.points;
renderer.info.render.lines;
renderer.info.render.frame;
renderer.info.memory.geometries;
renderer.info.memory.textures;
```

- `calls` is the most actionable metric after visual quality.
- `triangles` counts submitted geometry, including shadow passes in some cases.
- `memory` reveals leaks.

### 2.2 Browser tools

- Chrome DevTools Performance: main-thread JS, layout, paint.
- Chrome DevTools > Rendering: FPS meter, paint flashing, layer borders.
- WebGL: Spector.js captures frames, draw calls, shader programs, textures.
- WebGPU: Chrome WebGPU DevTools, timestamp queries.
- RenderDoc (desktop), Xcode GPU Capture (iOS), Android GPU Inspector.
- `stats-gl` for GPU/CPU timing in-app.

### 2.3 Custom monitor

```js
let frames = 0;
let time = 0;
let fps = 0;

function updateStats(dt) {
  frames++;
  time += dt;
  if (time >= 0.5) {
    fps = frames / time;
    frames = 0;
    time = 0;
    console.log(fps.toFixed(1), renderer.info.render.calls, renderer.info.render.triangles);
  }
}
```

Log the **95th percentile frame time**, not the average; spikes cause stutter.

## 3. Draw calls

A draw call is a CPU command to render a batch. Each one has CPU overhead and state changes.

### 3.1 Reduction techniques

| Technique | Effect |
|---|---|
| `InstancedMesh` | Many copies, one draw call |
| `BatchedMesh` | Many geometries, one draw call |
| Merge static geometry | One geometry, one draw call |
| Texture atlas | Fewer material switches |
| Share materials | Fewer shader/state changes |
| `Points`/`LineSegments` | Batch many primitives |
| Remove invisible/small objects | Fewer draws |

```js
// Instancing
const instanced = new THREE.InstancedMesh(geometry, material, count);
instanced.setMatrixAt(i, matrix);
instanced.instanceMatrix.needsUpdate = true;
instanced.computeBoundingSphere();
```

### 3.2 Targets

- Mobile: < 100 draw calls (stretch: < 50).
- Desktop: < 500 draw calls (stretch: < 200).
- WebGPU can handle more, but the budget still matters.

## 4. Geometry and triangles

- Target 100k–300k triangles on mobile, 500k–2M on desktop (scene-dependent).
- Use LODs for distant objects.
- Simplify with `gltf-transform simplify`, `gltfpack`, or Blender decimate.
- Cull small/distant objects; use `frustumCulled` and occlusion where possible.
- Remove hidden faces and interior geometry.
- Use impostors/billboards for crowds, trees, and particles.
- Avoid high-segment primitives that are small on screen.
- Reuse geometry across meshes.
- Keep 16-bit indices where possible (≤ 65k vertices).

## 5. Textures and bandwidth

- Compress (KTX2/Basis, ASTC/ETC2/BC7) to reduce memory and bandwidth.
- Downscale to on-screen size; a 4K texture on a 200 px object is waste.
- Use mipmaps; they reduce cache misses and aliasing.
- Anisotropy 4–8, not 16 everywhere.
- Share textures; use atlases.
- Avoid alpha-tested foliage overdraw where possible.
- Monitor texture memory: `w * h * 4 * 1.333` bytes uncompressed.
- Use `HalfFloatType` render targets only when needed.
- Stream large textures; load low-res first (mipmap streaming is not built-in; implement manually if needed).

## 6. Shaders and overdraw

- Overdraw (multiple fragments per pixel) is a major mobile cost. Transparent objects, particles, and full-screen effects cause it.
- Keep fragment shaders short; move work to the vertex shader when possible.
- Avoid dependent texture reads and dynamic loops.
- Use `discard` sparingly.
- Prefer `alphaHash` for foliage over `discard`/transparency.
- Reduce lights per fragment; bake static lighting.
- Use simpler materials for distant objects (`MeshLambertMaterial`, unlit, impostors).
- Precision: `mediump` can help on mobile, but test for artifacts.

## 7. Lighting and shadows

- Each shadow-casting light is a render pass per frame (point lights: six).
- Budget 1–2 shadow lights on mobile, 2–4 on desktop.
- Lower shadow map resolution; tighten shadow camera bounds.
- Freeze static shadows (`shadowMap.autoUpdate = false`).
- Bake lightmaps/AO for static scenes.
- Use cheap fill (`AmbientLight`, `HemisphereLight`, environment) instead of many point lights.
- For many lights on WebGPU, clustered lighting; on WebGL, bake or fake.

## 8. Post-processing budget

- Each effect is a full-screen pass; bandwidth-bound at high resolution.
- Render effects at 50–75% resolution when possible.
- Combine effects (`postprocessing` `EffectPass`, TSL node graph).
- Avoid DOF/SSR on mobile; use cheaper AO/bloom.
- Use `HalfFloatType` only for HDR.
- Disable AA if the composer handles it; avoid double AA.
- Measure GPU time with effects on/off.

## 9. Resolution and adaptive quality

```js
let dpr = Math.min(devicePixelRatio, 2);

function setQuality(level) {
  dpr = level === 'high' ? Math.min(devicePixelRatio, 2)
      : level === 'medium' ? 1.25
      : 1.0;
  renderer.setPixelRatio(dpr);
  renderer.setSize(container.clientWidth, container.clientHeight, false);
}
```

Adaptive DPR based on framerate:

```js
let frames = 0;
let elapsed = 0;

function adapt(dt) {
  frames++;
  elapsed += dt;
  if (elapsed < 1) return;

  const fps = frames / elapsed;
  frames = 0;
  elapsed = 0;

  if (fps < 50 && dpr > 1) {
    dpr = Math.max(1, dpr - 0.25);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
  } else if (fps > 58 && dpr < Math.min(devicePixelRatio, 2)) {
    dpr = Math.min(Math.min(devicePixelRatio, 2), dpr + 0.25);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
  }
}
```

Hysteresis prevents oscillation. Also offer a manual quality setting.

## 10. CPU optimization

- Avoid allocations per frame: reuse vectors, quaternions, matrices, arrays.
- Avoid `Array.prototype.map/filter` in the hot loop.
- Object pooling for particles, projectiles, UI nodes.
- Throttle raycasting and expensive event handlers.
- Debounce resize.
- Use `requestAnimationFrame` for visual updates; batch DOM writes.
- Move heavy computation to Web Workers (geometry generation, pathfinding, physics if the engine supports it).
- OffscreenCanvas + worker for rendering when appropriate.
- In React/R3F, avoid `setState` per frame; mutate refs.
- Keep the scene graph shallow; deep hierarchies cost matrix updates.
- Disable `matrixAutoUpdate` for static objects and update manually.
- Use `Object3D.matrixWorldAutoUpdate = false` for static subtrees.

## 11. Startup performance

- Code split by route/section; lazy-load the 3D bundle.
- Preload critical assets; lazy-load the rest.
- Compress assets; use CDN and HTTP/2/3.
- Show a fast 2D shell/skeleton while the 3D loads.
- `compileAsync` before revealing the scene.
- Decode Draco/KTX2 in workers where possible.
- Avoid loading everything up front; stream by section.
- Measure Time to First Frame and Time to Interactive.

## 12. Mobile specifics

- Cap DPR at 1.5–2; many phones report 3 but cannot sustain it.
- Reduce shadow maps and post-processing.
- Watch memory: mobile GPUs have less texture memory and may kill the tab.
- Avoid `preserveDrawingBuffer`, high-res render targets, and many contexts.
- Test on a real device, not just a desktop emulator.
- Monitor heat/throttling; performance degrades after minutes.
- Use simpler materials and fewer lights.
- Consider a reduced "mobile scene" (fewer objects, lower LODs).

## 13. Profiling workflow

1. Reproduce with a fixed camera path and a fixed scene state.
2. Record 10–20 seconds with the browser profiler.
3. Check CPU: scripting, rendering, GC, React commits.
4. Check GPU: draw calls, shader time, bandwidth, overdraw.
5. Disable features one at a time (shadows, post, environment, LOD).
6. Fix the largest cost; re-measure.
7. Test again on target hardware.

### Quick triage

| Symptom | Likely bottleneck |
|---|---|
| High CPU, low GPU | Draw calls, JS allocations, React updates, physics |
| Low CPU, high GPU | Fragment shaders, overdraw, post-processing, shadows |
| Stutter spikes | GC, shader compile, texture upload, asset load |
| Slow first load | Bundle size, asset size, network, decode |
| Degrades over time | Memory leak, growing scene, accumulating listeners |
| Mobile hot/throttled | Sustained GPU load, high DPR, shadows/post |

## 14. Performance checklist

- [ ] DPR capped and adaptive.
- [ ] Draw calls within budget.
- [ ] Triangles within budget; LODs used.
- [ ] Textures compressed and appropriately sized.
- [ ] Shadows limited; static shadows frozen/baked.
- [ ] Post-processing minimal and resolution-scaled.
- [ ] No per-frame allocations in hot paths.
- [ ] Raycasting throttled/BVH-accelerated.
- [ ] Assets compressed and lazy-loaded.
- [ ] `compileAsync` before first interaction.
- [ ] Cleanup and disposal verified.
- [ ] Tested on a real mid-range mobile device.
- [ ] 95th percentile frame time measured, not just average FPS.

## 15. Anti-patterns

| Anti-pattern | Consequence |
|---|---|
| One material per object | Shader compilation and state changes |
| New `Vector3` per frame | GC pressure and stutter |
| `setState` in `useFrame` | React re-render every frame |
| `material.needsUpdate = true` every frame | Shader recompilation |
| 4K textures on small objects | Memory and bandwidth waste |
| Uncompressed GLB with 50 MB textures | Slow load, mobile crashes |
| Many shadow-casting lights | Multiple passes per frame |
| Full-res DOF/SSR on mobile | Unplayable framerate |
| No cleanup on scene change | Memory leak, context loss |
| Measuring only average FPS | Misses stutter spikes |
| Optimizing before profiling | Wasted effort, wrong target |
