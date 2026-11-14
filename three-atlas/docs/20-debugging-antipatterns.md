# 20 — Debugging and Anti-Patterns

## 1. Debugging method

Do not change code at random. Use this order:

1. **Reproduce** with a deterministic scene, fixed camera, fixed assets.
2. **Read the console**: shader errors, 404s, CORS, WebGPU validation messages.
3. **Check the basics**: canvas size, camera, lights, renderer, animation loop.
4. **Isolate**: disable post-processing, shadows, environment, then re-enable one at a time.
5. **Reduce**: build a minimal reproduction with one mesh and one material.
6. **Measure**: `renderer.info`, frame time, draw calls.
7. **Fix one thing** and re-test.

A minimal reproduction is the fastest path to an answer.

## 2. Black screen checklist

Work through in order:

1. **Is the canvas visible and sized?** `canvas.width/height > 0`; CSS has height; parent is not `display:none`.
2. **Is the renderer created successfully?** Check console for context creation errors.
3. **Is the loop running?** Add `console.log` or a counter in the animation loop.
4. **Is the camera valid?** `aspect` not 0/NaN; `near < far`; camera not inside geometry; looking at the subject.
5. **Is the object in the frustum?** Log `camera.position`, `object.position`, `geometry.boundingSphere`.
6. **Is there light?** `MeshStandardMaterial` needs lights or `scene.environment`. Test with `MeshBasicMaterial`.
7. **Is the material valid?** `color`, `map`, `transparent`, `opacity`, `side`, `needsUpdate`.
8. **Are textures loaded?** 404/CORS; `texture.image` exists; color space.
9. **Is the scene added?** `scene.add(mesh)` and the camera passed to `render()`.
10. **Are layers correct?** Camera and object share a layer.
11. **Is post-processing blank?** Disable the composer and render directly.
12. **WebGPU?** `await renderer.init()`, node material compatibility, adapter available.

### Minimal black-screen test

```js
scene.background = new THREE.Color(0xff0000); // is the canvas showing anything?
const test = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshBasicMaterial({ color: 0x00ff00 })
);
scene.add(test);
camera.position.set(0, 0, 3);
camera.lookAt(0, 0, 0);
renderer.render(scene, camera); // one manual render, outside the loop
```

If this shows a red background and a green cube, the renderer/camera/scene are fine and the bug is in the original content or loop.

## 3. Object invisible but scene renders

| Cause | Fix |
|---|---|
| Outside frustum | Move camera/object; check bounding sphere |
| `visible = false` | Enable |
| Wrong layer | `camera.layers.enable(n)` |
| `frustumCulled` with stale bounds | `computeBoundingSphere()` or disable temporarily |
| Zero scale | Set non-zero scale |
| Material `side` | Use `DoubleSide` to test |
| Material transparent/opacity 0 | Fix opacity/depth |
| Geometry degenerate | Check vertex/index counts |
| NaN in transforms | Inspect position/rotation/scale |
| Parent invisible | Check ancestors |
| Rendered behind camera | Check camera direction |

## 4. Model is black or too dark

1. No lights? Add `AmbientLight`/`DirectionalLight` or `scene.environment`.
2. Metalness = 1 without environment? Metals need IBL.
3. Texture color space wrong? Albedo must be sRGB.
4. Exposure/tone mapping too low/high.
5. Normals inverted or zero.
6. Material is `MeshBasicMaterial` with black color.
7. `envMapIntensity` or `scene.environmentIntensity` zero.
8. Shadow acne covering the surface.
9. Vertex colors multiplied by zero.
10. Custom shader not applying lighting.

## 5. Colors washed out or too saturated

| Symptom | Cause |
|---|---|
| Washed out | sRGB texture treated as linear (too bright) or missing output color space |
| Too dark | Linear texture treated as sRGB (decoded twice), or double tone mapping |
| Shifted hue | Post-processing missing output pass, or LUT |
| Background differs | Clear color handling/color space |
| Highlights clipped | No tone mapping or exposure too high |

Fix: set `texture.colorSpace` per map type; use `renderer.outputColorSpace = SRGBColorSpace`; add `OutputPass`; tone map once.

## 6. Shadows

| Problem | Fix |
|---|---|
| No shadows | `renderer.shadowMap.enabled`, `light.castShadow`, `mesh.castShadow/receiveShadow` |
| Shadow acne | Increase `shadow.normalBias`; tune `bias` |
| Peter-panning | Reduce bias, use normalBias |
| Blocky | Increase `mapSize`; tighten shadow camera |
| Disappear | Shadow camera bounds/far too small |
| Flicker | Snap light to texel grid; use CSM; stabilize camera |
| Point light artifacts | Lower map size, shorter far, check cube seams |
| Transparent shadows | Use `alphaTest` or a custom depth material |

## 7. Transparency and z-fighting

- Transparent surfaces sort per object, not per triangle.
- Set `depthWrite: false` for particles/glass; use `renderOrder`.
- Coplanar surfaces: offset with `polygonOffset` or move slightly.
- `alphaTest` keeps depth writes and avoids sorting.
- `alphaHash` for dense foliage without sorting.
- For glass, consider transmission or a fake environment map.

## 8. Camera and controls

| Problem | Cause |
|---|---|
| Stretched view | Aspect not updated / projection not updated |
| Controls unresponsive | Wrong DOM element, overlay blocking, `update()` not called |
| Orbit flips | `maxPolarAngle` not set |
| Jitter | Damping + direct writes, large dt, competing updates |
| Zoom too fast | `zoomSpeed`, wheel event conflicts |
| Camera inside object | Collision/clipping not handled |
| Mobile scroll instead of drag | `touch-action: none` on canvas |

## 9. Raycasting

- NDC math wrong: use canvas rect, not window size.
- CSS transforms/scroll: `getBoundingClientRect()` accounts for them.
- Object not in `interactive` list or `recursive=false`.
- Layers: raycaster and object must share a layer.
- Bounding sphere stale after geometry edits.
- Morph/skinning not reflected in raycast (use BVH or custom).
- UI overlay intercepting pointer events.
- Huge meshes: use `three-mesh-bvh`.

## 10. Assets and loaders

| Error | Cause |
|---|---|
| 404 | Wrong path/base URL |
| CORS | Server headers, cross-origin textures |
| Draco decoder | Missing `/draco/` files or wrong path |
| KTX2 transcoder | Missing `/basis/` files, `detectSupport` not called |
| Meshopt | Decoder not set |
| Animation missing | Not exported, name mismatch, mixer not updated |
| Huge/tiny model | Units/scale, unapplied transforms |
| Wrong colors | Color space, texture encoding, material conversion |
| Missing textures | Embedded vs external paths, relative URLs |

## 11. WebGPU-specific

| Problem | Fix |
|---|---|
| `navigator.gpu` undefined | Unsupported browser or insecure context |
| Adapter null | No compatible GPU / disabled |
| Black output | Call `await renderer.init()`; check node graph |
| `ShaderMaterial` fails | WebGPU uses TSL/NodeMaterial |
| `WebGLCubeRenderTarget` fails | Use `CubeRenderTarget` |
| `EffectComposer` fails | Use `RenderPipeline`/TSL |
| Compute does nothing | Check dispatch size, storage buffers, bindings |
| Synchronous API before init | Await `renderer.init()` |
| Feature missing on mobile | Fallback to WebGL |

## 12. Performance and memory

### Memory leak signs

- `renderer.info.memory.geometries/textures` grows over time.
- FPS degrades after scene switches.
- Browser tab crashes on mobile.

### Leak sources

- Creating geometries/materials/textures without `dispose()`.
- Adding event listeners without removal.
- Keeping references in arrays/maps after removal.
- Render targets not disposed.
- Animation mixers/actions not stopped.
- Web Workers or timers not cleared.
- R3F: manual resources in components without cleanup.

### Diagnose

```js
console.log(renderer.info.memory);
// Force GC in DevTools, then compare before/after scene teardown
```

Use Chrome DevTools Memory > Heap snapshot, compare retained objects.

## 13. Context loss

- Listen for `webglcontextlost`; prevent default and show a recovery UI.
- Rebuild GPU resources on `webglcontextrestored`.
- Reduce the number of active WebGL contexts.
- Avoid `preserveDrawingBuffer` and huge textures.
- On mobile, memory pressure can kill the context.

## 14. Mobile-specific

| Problem | Fix |
|---|---|
| Crashes on load | Too much texture memory; compress/downscale |
| Hot device / throttling | Lower DPR, shadows, post |
| Touch doesn't rotate | `touch-action: none`; pointer events |
| Blurry canvas | DPR handling; CSS size vs drawing buffer |
| Address bar resize jank | Use `ResizeObserver`/`visualViewport` |
| Audio autoplay blocked | Require user gesture |
| WebGPU unavailable | Fallback to WebGL |

## 15. Anti-patterns

| Anti-pattern | Why it hurts | Better |
|---|---|---|
| One material per object | Shader/state churn | Share materials |
| New vectors per frame | GC stutter | Reuse temporaries |
| `setState` per frame | React re-renders | Mutate refs |
| `needsUpdate` every frame | Recompiles shaders | Update only on real changes |
| Full-res post everywhere | GPU bound | Half-res/effects budget |
| 4K textures on small props | Memory/bandwidth | Downscale |
| Uncompressed GLB | Slow load | Draco/meshopt/KTX2 |
| Many shadow lights | Multiple passes | Bake/reduce |
| Disabling `frustumCulled` globally | Draws everything | Fix bounds instead |
| `DoubleSide` everywhere | Overdraw/lighting | Fix normals/winding |
| Transparent everything | Sorting/overdraw | `alphaTest`/opaque |
| No cleanup | Leaks/context loss | Registry + dispose |
| Ignoring delta | Speed depends on FPS | Use seconds |
| Mixing clocks | Desync | One Timer |
| Optimizing blindly | Wrong bottleneck | Profile first |

## 16. Diagnostic snippets

### Scene report

```js
function report(scene, camera, renderer) {
  let meshes = 0, triangles = 0;
  scene.traverse((o) => {
    if (o.isMesh) {
      meshes++;
      const g = o.geometry;
      const count = g.index ? g.index.count : g.attributes.position?.count ?? 0;
      triangles += count / 3;
    }
  });
  console.log({
    meshes,
    triangles,
    calls: renderer.info.render.calls,
    geometries: renderer.info.memory.geometries,
    textures: renderer.info.memory.textures,
    camera: camera.position.toArray(),
    aspect: camera.aspect,
  });
}
```

### Check object visibility

```js
function whyInvisible(object, camera) {
  const frustum = new THREE.Frustum().setFromProjectionMatrix(
    new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
  );
  object.geometry.computeBoundingSphere();
  const sphere = object.geometry.boundingSphere.clone().applyMatrix4(object.matrixWorld);
  console.log({
    visible: object.visible,
    inFrustum: frustum.intersectsSphere(sphere),
    layers: object.layers.mask,
    cameraLayers: camera.layers.mask,
    position: object.getWorldPosition(new THREE.Vector3()),
    scale: object.getWorldScale(new THREE.Vector3()),
  });
}
```

### Validate material/texture

```js
function auditMaterial(material) {
  console.log({
    type: material.type,
    color: material.color?.getHexString(),
    map: material.map?.image?.src,
    mapColorSpace: material.map?.colorSpace,
    transparent: material.transparent,
    opacity: material.opacity,
    side: material.side,
    needsUpdate: material.needsUpdate,
  });
}
```

## 17. When to ask for help

Provide:

- Minimal reproduction (CodeSandbox/StackBlitz).
- Three.js version and browser/OS/GPU.
- Console errors and warnings.
- What you tried.
- A screenshot/video.
- `renderer.info` output.

The three.js forum and Discord are the best places for engine-specific issues. For R3F, the Poimandres Discord.
