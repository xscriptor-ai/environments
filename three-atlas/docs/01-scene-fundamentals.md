# 01 — Fundamentals: Scene, Camera, Mesh, and the Loop

## 1. The five pieces

Every Three.js app has:

1. **Renderer** — draws into a `<canvas>` (WebGL2 or WebGPU).
2. **Scene** — root of the object graph (`Object3D`).
3. **Camera** — defines what is visible and how it is projected.
4. **Objects** — `Mesh` (geometry + material), `Line`, `Points`, `Sprite`, lights, groups.
5. **Loop** — `requestAnimationFrame` or `renderer.setAnimationLoop`.

```
Scene
 ├─ AmbientLight / DirectionalLight / ...
 ├─ Group (transforms)
 │   ├─ Mesh (geometry + material)
 │   └─ Mesh
 └─ PerspectiveCamera
```

## 2. Minimal WebGL scene (r187, ESM)

```js
import * as THREE from 'three';

const canvas = document.querySelector('#scene');

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace; // default
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0d12);

const camera = new THREE.PerspectiveCamera(
  45,                                      // vertical fov in degrees
  window.innerWidth / window.innerHeight,  // aspect
  0.1,                                     // near
  200                                      // far
);
camera.position.set(0, 1.5, 5);
camera.lookAt(0, 0, 0);

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({
  color: 0x88aaff,
  metalness: 0.2,
  roughness: 0.35,
});
const mesh = new THREE.Mesh(geometry, material);
mesh.castShadow = true;
mesh.receiveShadow = true;
scene.add(mesh);

const hemi = new THREE.HemisphereLight(0xffffff, 0x223344, 1.2);
scene.add(hemi);

const dir = new THREE.DirectionalLight(0xffffff, 3);
dir.position.set(3, 5, 2);
dir.castShadow = true;
dir.shadow.mapSize.set(1024, 1024);
dir.shadow.camera.left = -5;
dir.shadow.camera.right = 5;
dir.shadow.camera.top = 5;
dir.shadow.camera.bottom = -5;
scene.add(dir);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

const timer = new THREE.Timer();

renderer.setAnimationLoop((timestamp) => {
  timer.update(timestamp);
  const dt = timer.getDelta(); // seconds

  mesh.rotation.y += dt * 0.6;
  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});
```

### WebGPU equivalent

```js
import * as THREE from 'three/webgpu';

const renderer = new THREE.WebGPURenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

await renderer.init(); // explicit when rendering on demand
renderer.setAnimationLoop(loop);
```

> `WebGPURenderer` can initialize lazily inside `setAnimationLoop`; if you use on-demand rendering or feature detection, call `await renderer.init()` first.

## 3. Object3D: the graph

Everything inherits from `Object3D`: `Mesh`, `Group`, `Camera`, `Light`, `Bone`, `Sprite`, `Line`, `Points`.

```js
const group = new THREE.Group();
group.position.set(1, 0, 0);
group.rotation.y = Math.PI / 4;
group.scale.setScalar(0.5);
group.add(mesh);

scene.add(group);          // reparenting
group.remove(mesh);        // still exists in memory
scene.attach(mesh);        // reparents while preserving world transform
```

Key properties:

| Property | Effect |
|---|---|
| `position`, `rotation` (Euler), `quaternion`, `scale` | Local transform. `rotation` and `quaternion` stay synchronized. |
| `matrix` | Local matrix (recomposed when `matrixAutoUpdate` is on). |
| `matrixWorld` | World matrix (local × parents). |
| `visible` | Hides the object and its children from rendering (not from raycasting when the root is passed). |
| `frustumCulled` | Culling by bounding volume. |
| `renderOrder` | Draw order within the same queue. |
| `layers` | Layer mask for camera/renderer. |
| `userData` | App data (not serialized in binary, but included in JSON). |
| `castShadow`, `receiveShadow` | Shadows (on Mesh). |

Useful methods:

```js
obj.getWorldPosition(v3);
obj.getWorldQuaternion(q);
obj.getWorldScale(v3);
obj.localToWorld(v3);       // mutates the vector
obj.worldToLocal(v3);
obj.lookAt(worldPoint);     // orients -Z toward the point for cameras (object-dependent)
obj.traverse((child) => { /* ... */ });
obj.updateMatrixWorld(true);
obj.raycast(raycaster, intersects);
```

## 4. Render lifecycle

```
frame:
  update inputs / state
  update animation (dt)
  update physics (fixed step)
  update matrices (automatic on render)
  renderer.render(scene, camera)
```

- `setAnimationLoop(cb)` is preferable to `requestAnimationFrame` because it also works with XR and WebGPU.
- To stop: `renderer.setAnimationLoop(null)`.
- `renderer.render()` updates the scene's `matrixWorld` automatically (`scene.matrixWorldAutoUpdate = true`).
- If you disable `matrixAutoUpdate` for performance, update manually with `updateMatrix()` and set `matrixWorldNeedsUpdate = true` (r185+).

## 5. Units and scale

- 1 unit = **1 meter**.
- Human ≈ 1.7 m; door ≈ 2.1 m; table ≈ 0.75 m.
- `near` must not be too small (0.001 causes poor depth precision); use 0.1 or 0.05 depending on scale.
- Large `far` + tiny `near` = z-fighting. Fit both to the scene size.
- For huge scenes (city, planet): scale the scene down, use `logarithmicDepthBuffer`, or a **reversed depth buffer** (`reversedDepthBuffer: true` in r181+).

## 6. Object types

| Object | Use | Notes |
|---|---|---|
| `Mesh` | Surface with a material | The default |
| `SkinnedMesh` | Mesh with bones | Requires `skeleton` and weights |
| `InstancedMesh` | Many copies of the same geometry | 1 draw call; per-instance matrices |
| `BatchedMesh` | Many different geometries in one draw call | r165+ needs `addInstance`; ideal for varied scenes |
| `Points` | Point cloud | `PointsMaterial`, size in px or world units |
| `Line` / `LineSegments` / `LineLoop` | Lines | `LineBasicMaterial` is 1 px wide; use `Line2` for thickness |
| `Sprite` | Camera-facing quad | Great for particles/icons |
| `Group` | Geometry-free container | Hierarchical transforms |
| `LOD` | Level of detail | Swaps meshes by distance |
| `Bone` | Skeleton bone | Only inside a `Skeleton` |

## 7. Canvas and responsive layout

```js
function resize() {
  const w = container.clientWidth;
  const h = container.clientHeight;
  const dpr = Math.min(window.devicePixelRatio, 2);

  renderer.setPixelRatio(dpr);
  renderer.setSize(w, h, false); // false = do not touch CSS; you control CSS

  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  // post-processing / composer if present
  composer?.setSize(w * dpr, h * dpr);
}

const ro = new ResizeObserver(resize);
ro.observe(container);
resize();
```

- Use `ResizeObserver` on the container, not only `window.resize` (layouts, sidebars, split view).
- `setPixelRatio` above 2 almost never pays off: 4× the pixels for 2× DPR.
- On mobile, cap DPR at 1.5–2 and consider lowering it dynamically when the framerate drops.

## 8. Pause, visibility, and lifecycle

```js
let running = true;

document.addEventListener('visibilitychange', () => {
  running = !document.hidden;
  if (running) {
    timer.reset();          // avoids a huge delta
    renderer.setAnimationLoop(loop);
  } else {
    renderer.setAnimationLoop(null);
  }
});
```

- Never render in a hidden tab.
- On `visibilitychange`, reset the timer to avoid physics/animation jumps.
- `Timer.connect(document)` handles Page Visibility since r174.

## 9. Cleanup (mandatory)

```js
function disposeObject(root) {
  root.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();

    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const mat of mats) {
      if (!mat) continue;
      for (const value of Object.values(mat)) {
        if (value && value.isTexture) value.dispose();
      }
      mat.dispose();
    }
  });
}

// On unmount
renderer.setAnimationLoop(null);
disposeObject(scene);
renderer.dispose();
renderer.forceContextLoss?.();
```

- `renderer.info.memory.geometries` and `.textures` should drop after cleanup.
- `renderer.dispose()` does not destroy textures that are still referenced: release them yourself.
- In R3F, Drei and R3F handle much of this, but manually created resources (`new Texture`, render targets) remain your responsibility.

## 10. Beginner mistakes

| Symptom | Likely cause |
|---|---|
| Black screen | Camera inside geometry, wrong `near/far`, zero light, 0×0 canvas, color space, material missing `needsUpdate`. |
| Everything black with `MeshStandardMaterial` | No light or environment. `MeshBasicMaterial` does not need lights. |
| Model gigantic/tiny | Export scale (cm vs m) or unapplied `scale`. |
| Object not visible | `visible=false`, outside frustum, wrong bounding sphere with `frustumCulled`, layer does not match camera. |
| Visible but not clickable | Canvas without `pointer-events`, raycaster coordinates not normalized, different `layers`. |
| Washed-out colors | Texture missing `colorSpace = SRGBColorSpace` or wrong tone mapping. |
| Flicker/z-fighting | Bad `near`/`far` or coplanar surfaces. |

## 11. Minimal scene checklist

- [ ] Renderer with capped DPR and `ResizeObserver`-based resize.
- [ ] Camera `aspect` updated with `updateProjectionMatrix()`.
- [ ] Lights or environment (there is no default light).
- [ ] `renderer.shadowMap.enabled` only when shadows are used.
- [ ] Correct color management on textures.
- [ ] Loop with delta in seconds and pause on `visibilitychange`.
- [ ] Cleanup of geometries/materials/textures.
- [ ] Fallback when WebGL2/WebGPU is unavailable.
