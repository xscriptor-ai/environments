# 06 — Cameras, Projection, and Camera Control

## 1. Camera fundamentals

A camera is an `Object3D` with a projection matrix. It defines the view volume and transforms world space into clip space:

```
clip = projectionMatrix * viewMatrix * worldPosition
viewMatrix = camera.matrixWorldInverse
```

After perspective divide, you get normalized device coordinates (NDC). The renderer maps NDC to the viewport.

There is always an **active camera** passed to `renderer.render(scene, camera)`. Multiple cameras can exist; only the one passed is used (except for array/XR cameras).

## 2. PerspectiveCamera

```js
const camera = new THREE.PerspectiveCamera(
  45,                 // vertical field of view (degrees)
  width / height,     // aspect ratio
  0.1,                // near plane
  1000                // far plane
);
camera.position.set(0, 1.7, 5);
camera.lookAt(0, 0, 0);
camera.updateProjectionMatrix(); // after changing fov/aspect/near/far/zoom
```

| Property | Meaning | Notes |
|---|---|---|
| `fov` | Vertical field of view in degrees | 35–60 is natural; 15–30 tele; 75–100 wide |
| `aspect` | width / height | Update on resize |
| `near`, `far` | Depth range | Fit to scene; avoid extreme ratios |
| `zoom` | Magnification | `zoom > 1` narrows the view; also update projection |
| `filmGauge` | Film width in mm (default 35) | Used with `filmOffset` |
| `filmOffset` | Horizontal lens shift | Architectural/VR |
| `focus` | Focus distance (for some effects) | Not autofocus |
| `view` | Offset/scale for multi-view | Drei/`View` uses it |

### Focal length

```js
const focalLength = 50; // mm
const sensorHeight = 24; // mm (full frame)
const fov = 2 * Math.atan(sensorHeight / (2 * focalLength)) * (180 / Math.PI);
```

A 50 mm lens on full frame ≈ 27° vertical fov; 24 mm ≈ 53°; 85 mm ≈ 16°.

### Field of view and aspect

`fov` is vertical. Horizontal fov:

```
tan(hfov/2) = aspect * tan(vfov/2)
```

On a wide screen, the same vertical fov shows more horizontally. On portrait mobile, the same vertical fov can crop the subject; adjust fov or camera distance for composition.

## 3. OrthographicCamera

```js
const aspect = width / height;
const frustum = 10;
const camera = new THREE.OrthographicCamera(
  -frustum * aspect, frustum * aspect,
   frustum, -frustum,
   0.1, 100
);
```

- No perspective; parallel lines stay parallel.
- `zoom` scales the view.
- Use for isometric, CAD, UI-like scenes, 2.5D, and shadow cameras.
- The visible size is `(right-left)` by `(top-bottom)`; maintain aspect when resizing.

## 4. Special cameras

| Camera | Purpose |
|---|---|
| `ArrayCamera` | Renders multiple sub-cameras (VR, split-screen) |
| `CubeCamera` | Renders six faces into a cube render target (reflections, probes) |
| `StereoCamera` | Left/right eye for stereo/VR |
| `OrthographicCamera` | Isometric/technical |
| XR camera | Provided by `renderer.xr`; do not create manually for VR |

### CubeCamera for dynamic reflections

```js
const cubeRT = new THREE.WebGLCubeRenderTarget(256, {
  generateMipmaps: true,
  minFilter: THREE.LinearMipmapLinearFilter,
});
const cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRT);
scene.add(cubeCamera);

// Update when needed (not every frame unless necessary)
mesh.visible = false;
cubeCamera.update(renderer, scene);
mesh.visible = true;

material.envMap = cubeRT.texture;
```

Dynamic cube maps are expensive (6 renders). Use for a few hero objects, not the whole scene.

## 5. Camera controls

### 5.1 OrbitControls

```js
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 2;
controls.maxDistance = 20;
controls.maxPolarAngle = Math.PI / 2;
controls.screenSpacePanning = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;

// In the loop, before render
controls.update();
```

| Option | Effect |
|---|---|
| `enableDamping` | Inertia; call `update()` every frame |
| `min/maxDistance` | Zoom limits |
| `min/maxPolarAngle` | Vertical orbit limits (avoid going under the floor) |
| `min/maxAzimuthAngle` | Horizontal limits |
| `enablePan/EnableZoom/EnableRotate` | Toggle interactions |
| `screenSpacePanning` | Pan in screen plane vs ground plane |
| `zoomToCursor` | Zoom toward pointer (recent versions) |
| `target` | Orbit center; animate it for focus transitions |

### 5.2 Other controls

| Control | Behavior |
|---|---|
| `MapControls` | Orbit with map-style panning (right-drag pan, wheel zoom) |
| `ArcballControls` | Arcball rotation; good for inspecting objects |
| `TrackballControls` | Free rotation, no up constraint |
| `FlyControls` | Free 6-DOF flight |
| `FirstPersonControls` | Walk/look (new interaction model r184) |
| `PointerLockControls` | FPS mouse look; pointer lock |
| `DragControls` | Drag objects in a plane |
| `TransformControls` | Translate/rotate/scale gizmo; add `controls.getHelper()` to the scene (r169+) |

### 5.3 Manual orbit (understanding the math)

Spherical coordinates around a target:

```js
const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
const spherical = new THREE.Spherical().setFromVector3(offset);
spherical.theta += deltaX;
spherical.phi = THREE.MathUtils.clamp(spherical.phi, 0.01, Math.PI - 0.01);
offset.setFromSpherical(spherical);
camera.position.copy(controls.target).add(offset);
camera.lookAt(controls.target);
```

`Spherical` uses `(radius, phi, theta)`: `phi` is the polar angle from +Y, `theta` is the azimuth around Y.

## 6. Camera rigs and cinematic movement

### 6.1 First-person rig

```js
const yaw = new THREE.Object3D();
const pitch = new THREE.Object3D();
yaw.add(pitch);
pitch.add(camera);
yaw.position.set(0, 1.7, 0);
scene.add(yaw);

function onPointerMove(dx, dy) {
  yaw.rotation.y -= dx * 0.002;
  pitch.rotation.x = THREE.MathUtils.clamp(pitch.rotation.x - dy * 0.002, -Math.PI / 2, Math.PI / 2);
}
```

Do not accumulate Euler angles on the camera directly; use a rig.

### 6.2 Follow camera with damping

```js
const desired = target.position.clone().add(new THREE.Vector3(0, 2, 5));
camera.position.lerp(desired, 1 - Math.exp(-5 * dt));
camera.lookAt(target.position);
```

### 6.3 Camera path

```js
const path = new THREE.CatmullRomCurve3(points, true, 'centripetal');
const t = (elapsed % duration) / duration;
const position = path.getPointAt(t);
const lookAt = path.getPointAt((t + 0.01) % 1);

camera.position.copy(position);
camera.lookAt(lookAt);
```

For authored camera moves, use `AnimationMixer` with position/quaternion tracks instead of constant-speed paths.

### 6.4 Scroll-driven camera

```js
const progress = scrollY / (document.body.scrollHeight - innerHeight);
const t = THREE.MathUtils.clamp(progress, 0, 1);
const eased = t * t * (3 - 2 * t);
camera.position.copy(path.getPointAt(eased));
camera.lookAt(targetPath.getPointAt(eased));
```

Drive the camera from scroll but keep a `prefers-reduced-motion` path that jumps between sections.

### 6.5 Camera shake

```js
const shake = amplitude * Math.sin(frequency * time) * falloff;
camera.position.x += noise(time) * shake;
```

Apply shake to a child rig or after the base transform; never accumulate it into the base position.

## 7. Depth and precision

| Technique | Use | Cost |
|---|---|---|
| Default depth | Most scenes | — |
| `logarithmicDepthBuffer` | Huge range (planet, city) | Slower, can break effects |
| `reversedDepthBuffer` (r181+) | Large scenes, better precision | Requires float depth; check support |
| Increase `near` | Always | Loses close-up detail |
| Decrease `far` | Always | Clips distant objects |

For shadow cameras, use a tight frustum and reasonable near/far; precision matters more there.

## 8. Layers and multi-view

Layers let a camera render only selected objects:

```js
const LAYER_UI = 1;
camera.layers.enable(LAYER_UI);
mesh.layers.set(LAYER_UI); // only this layer
mesh.layers.enable(0);     // also default layer

// Render with a different camera/layers
camera.layers.set(LAYER_UI);
renderer.render(scene, camera);
```

- `layers.set(n)` sets exactly one layer.
- `layers.enable(n)` adds a layer; `disable(n)` removes it.
- Shadows use layers too (`light.shadow.camera.layers`).

### Scissor and viewport for split views

```js
renderer.setScissorTest(true);

renderer.setViewport(0, 0, width / 2, height);
renderer.setScissor(0, 0, width / 2, height);
renderer.render(scene, cameraLeft);

renderer.setViewport(width / 2, 0, width / 2, height);
renderer.setScissor(width / 2, 0, width / 2, height);
renderer.render(scene, cameraRight);
```

Remember to account for pixel ratio when using render targets; `setViewport`/`setScissor` no longer scale by pixel ratio when a render target is bound (r187).

## 9. XR cameras

Do not create a camera for VR manually. Use `renderer.xr` and the camera provided by WebXR:

```js
renderer.xr.enabled = true;
document.body.appendChild(VRButton.createButton(renderer));

renderer.setAnimationLoop((_, frame) => {
  renderer.render(scene, camera);
});
```

`renderer.xr.getCamera()` is the XR camera; user camera transforms are applied by the XR manager. See `docs/18-advanced-gpgpu-xr-splats.md`.

## 10. Camera performance and quality

- Lower `fov` and higher distance can reduce visible geometry (less in frustum) but flattens the image.
- Tight `near/far` improves depth precision and shadow quality.
- Use `camera.updateProjectionMatrix()` only when parameters change; it is cheap but unnecessary per frame.
- Avoid allocating vectors in the loop; reuse temporaries.
- Camera controls with damping need `update()` per frame.
- Too many cameras/render targets multiply cost; use scissor only when needed.
- For reflections, use a single `CubeCamera` or planar reflector, not one per object.

## 11. Troubleshooting

| Problem | Cause |
|---|---|
| Nothing visible | Camera inside object, looking away, near/far wrong, aspect 0 |
| Stretched image | Aspect not updated with projection matrix |
| Objects clip near camera | `near` too large or camera too close |
| Distant objects flicker | Depth precision; adjust near/far or use reversed/log depth |
| Controls do nothing | `controls.update()` not called with damping, wrong DOM element, pointer events blocked |
| Orbit flips under floor | Limit `maxPolarAngle` |
| Camera shakes/jitters | Competing updates, damping + direct writes, large dt spikes |
| Reflections wrong | Cube camera position/update, envMap mapping, PMREM |
| Mobile composition wrong | Vertical fov + portrait aspect; adjust fov or distance |
