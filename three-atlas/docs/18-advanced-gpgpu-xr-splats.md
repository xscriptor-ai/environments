# 18 — Advanced: GPGPU, Volumetrics, Path Tracing, Gaussian Splats, XR

## 1. GPGPU on WebGL: GPUComputationRenderer

`GPUComputationRenderer` (addon) runs simulation in fragment shaders using floating-point textures and ping-pong render targets.

```js
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';

const size = 256; // 256 x 256 particles
const gpuCompute = new GPUComputationRenderer(size, size, renderer);

if (!renderer.capabilities.isWebGL2) {
  // float textures may still be available via extensions; check
}

const dtPosition = gpuCompute.createTexture();
const dtVelocity = gpuCompute.createTexture();
fillTextures(dtPosition, dtVelocity);

const positionVariable = gpuCompute.addVariable(
  'texturePosition',
  positionShader,
  dtPosition
);
const velocityVariable = gpuCompute.addVariable(
  'textureVelocity',
  velocityShader,
  dtVelocity
);

gpuCompute.setVariableDependencies(positionVariable, [positionVariable, velocityVariable]);
gpuCompute.setVariableDependencies(velocityVariable, [positionVariable, velocityVariable]);

positionVariable.material.uniforms.uDelta = { value: 0 };
velocityVariable.material.uniforms.uTime = { value: 0 };

const error = gpuCompute.init();
if (error !== null) console.error(error);

// Loop
gpuCompute.compute();
const positionTexture = gpuCompute.getCurrentRenderTarget(positionVariable).texture;
```

The simulation texture is then sampled in a `Points` shader:

```glsl
uniform sampler2D uPositions;
attribute vec2 aReference;
void main() {
  vec3 pos = texture2D(uPositions, aReference).xyz;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = 2.0 * (300.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}
```

- Ping-pong: the current target becomes the input next frame.
- Use `HalfFloatType` or `FloatType` depending on support.
- WebGL2 is required for reliable float render targets.
- Keep texture size to a power of two; 256² = 65,536 particles.
- Avoid reading back to CPU every frame; keep data on the GPU.

## 2. GPGPU on WebGPU: compute and storage buffers

WebGPU has native compute shaders and storage buffers. In TSL:

```js
import { instancedArray, compute, instanceIndex, vec3, float } from 'three/tsl';

const count = 100000;
const positions = instancedArray(count, 'vec3');
const velocities = instancedArray(count, 'vec3');

const init = compute(() => {
  const p = positions.element(instanceIndex);
  const v = velocities.element(instanceIndex);
  p.assign(vec3(
    float(instanceIndex).mod(100.0).sub(50.0),
    0.0,
    float(instanceIndex).div(100.0).floor().sub(50.0)
  ));
  v.assign(vec3(0.0, 1.0, 0.0));
});

const update = compute(() => {
  const p = positions.element(instanceIndex);
  const v = velocities.element(instanceIndex);
  p.addAssign(v);
  v.y.subAssign(0.01);
});

renderer.compute(init);
renderer.compute(update);
```

- Use `StorageBufferAttribute`/`instancedArray` for large data.
- Compute can run inside render passes (TSL nodes) or via `renderer.compute()`.
- Readback is asynchronous; avoid per-frame readback.
- WebGPU only; for WebGL use `GPUComputationRenderer`.

## 3. Particles

### 3.1 Approaches

| Approach | Count | Notes |
|---|---|---|
| `Points` + custom shader | 10k–1M | One draw call; size/color per point |
| `InstancedMesh` quads | 1k–100k | Billboards with textures/animation |
| Trail geometry | — | Ribbon of sampled positions |
| GPGPU | 100k–millions | Simulation on GPU |

### 3.2 Soft particles

Avoid hard intersection with geometry by fading based on depth difference:

```glsl
float sceneDepth = texture2D(uDepth, screenUV).r;
float particleDepth = gl_FragCoord.z;
float fade = smoothstep(0.0, 0.1, sceneDepth - particleDepth);
gl_FragColor.a *= fade;
```

Requires a depth texture (MRT or depth prepass). Soft particles cost an extra depth sample.

### 3.3 Additive and sorting

- Additive blending (`THREE.AdditiveBlending`) ignores order; good for sparks, glow, magic.
- Normal blending needs sorting; use `depthWrite: false` and sort by distance.
- For overlapping soft particles, use `alphaHash` or OIT.

## 4. Volumetrics and atmosphere

### 4.1 Raymarching

Render a full-screen or box mesh and march through a density field:

```glsl
float density = 0.0;
vec3 p = rayOrigin;
for (int i = 0; i < STEPS; i++) {
  density += sampleNoise(p);
  p += rayDirection * stepSize;
}
color = exp(-density * absorption);
```

- Use low step counts and blue-noise/jitter to hide banding.
- Precompute 3D noise textures; avoid expensive noise per step.
- Render at half resolution and upsample.
- Use for clouds, smoke, nebulas, god rays.

### 4.2 God rays

- Screen-space radial blur from a light position.
- Use a mask of bright pixels, then blur radially.
- TSL `godrays()`, `postprocessing` GodRays, or a custom pass.

### 4.3 Sky and atmosphere

- `Sky` addon: physical sky with sun position.
- `SkyMesh`, `GroundedSkybox` (r161+).
- Custom atmosphere shader (Rayleigh/Mie) for realism.
- Use a large sphere/box with `BackSide` and fog.

### 4.4 Water

- `Water`/`WaterMesh` addons: reflective water with normal maps.
- Planar reflections via a reflector.
- Gerstner waves in a vertex shader.
- Foam via depth/velocity masks.

## 5. Path tracing

`three-gpu-pathtracer` (0.0.28) provides progressive path tracing for photoreal previews.

```js
import { WebGLPathTracer } from 'three-gpu-pathtracer';

const pathTracer = new WebGLPathTracer(renderer);
pathTracer.setScene(scene, camera);
pathTracer.setBVHWorker(new Worker('/bvh.worker.js'));

// Render progressively
function loop() {
  pathTracer.renderSample();
  requestAnimationFrame(loop);
}
```

- Uses `three-mesh-bvh` for acceleration.
- Progressive: accumulates samples until the scene or camera changes.
- Expensive; use for hero shots, product stills, or offline-like previews.
- Not suitable for real-time interaction at high resolution.
- Denoising helps low sample counts.

## 6. Gaussian splats

Gaussian splatting represents a scene as millions of anisotropic 3D Gaussians. It excels at photoreal captures of real places/objects.

### 6.1 Loading

Three.js addons include:

- `SPLATLoader`, `KSPLATLoader`, `GaussianSplatPLYLoader`, `GLTFGaussianSplatLoaderExtension`.
- `GaussianSplat` object.

```js
import { SPLATLoader } from 'three/addons/loaders/SPLATLoader.js';

const splat = await new SPLATLoader().loadAsync('/scene.splat');
scene.add(splat);
```

### 6.2 Characteristics

- Very high visual fidelity for captured scenes.
- Large file sizes (10s–100s of MB) unless compressed (KSPLAT/SPZ).
- Sorting/blending cost; splats are semi-transparent.
- Hard to edit, light, or collide with.
- Performance depends on count, resolution, and overdraw.
- Use for backgrounds, scanned environments, product captures, not for clean stylized assets.

### 6.3 Performance

- Reduce splat count where possible.
- Render at lower resolution and upscale.
- Cull splats outside the frustum.
- Avoid mixing with heavy post-processing/transparency.
- Test on mobile; memory and fill rate are limiting.

## 7. WebXR

### 7.1 Setup

```js
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';

renderer.xr.enabled = true;
document.body.appendChild(VRButton.createButton(renderer));
// or ARButton for augmented reality

renderer.setAnimationLoop((_, frame) => {
  renderer.render(scene, camera);
});
```

- HTTPS required.
- Use `renderer.xr.getCamera()` implicitly via the render call.
- Set `renderer.xr.setReferenceSpaceType('local-floor')` for room-scale VR.
- Use `renderer.setAnimationLoop`; do not use `requestAnimationFrame` for XR.

### 7.2 Controllers and hands

```js
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

const controller = renderer.xr.getController(0);
controller.addEventListener('selectstart', onSelect);
scene.add(controller);

const grip = renderer.xr.getControllerGrip(0);
grip.add(new XRControllerModelFactory().createControllerModel(grip));
scene.add(grip);
```

- Hand tracking requires explicit feature request since r162.
- Use `XRHandModelFactory` for hand meshes.
- Controller rays for interaction; use the controller's world position/orientation.

### 7.3 Performance and comfort

- Target 72–120 fps; frame drops cause discomfort.
- Avoid heavy post-processing, transparent overdraw, and high poly counts.
- Use fixed foveated rendering where supported.
- Provide teleport/locomotion options; avoid forced camera movement.
- Keep UI at a comfortable distance (1.5–3 m) and size.
- Provide a seated/standing option; warn about flashing/motion.
- Test on the target headset, not only in emulators.

## 8. Advanced physics

- **Ragdolls**: compound bodies + joints; blend animation and physics.
- **Vehicles**: raycast suspension + wheel colliders; or a dedicated vehicle controller.
- **Joints**: fixed, revolute, prismatic, spherical, rope, spring.
- **Character**: kinematic controller with slopes, steps, snap-to-ground.
- **Destruction**: pre-fractured meshes + physics bodies; or runtime boolean/CSG + convex decomposition.
- **Determinism**: fixed timestep + fixed iteration counts; useful for replays and netcode.

## 9. Workers and OffscreenCanvas

- Move heavy computation (geometry generation, pathfinding, physics preprocessing, decoding) to Web Workers.
- `OffscreenCanvas` lets a worker render without blocking the main thread:

```js
const offscreen = canvas.transferControlToOffscreen();
worker.postMessage({ canvas: offscreen }, [offscreen]);
```

- Not all APIs are available in workers; check support.
- Transferable objects reduce copying.
- Keep the main thread for input and UI.

## 10. WASM

- Physics (Rapier/Jolt), Draco, Basis, meshoptimizer, and path tracing workers use WASM.
- Load WASM asynchronously; show progress.
- WASM memory can be large; monitor.
- Cross-origin isolation may be required for threads/shared memory.

## 11. Future-facing notes (as of r187)

- WebGPU and TSL are the strategic direction for rendering, compute, and materials.
- Node materials unify WebGL/WebGPU; TSL replaces most `onBeforeCompile` use cases.
- Gaussian splats are maturing but remain heavy.
- WebXR is stable but niche; performance constraints dominate.
- Three.js does not ship a scene editor, physics, or UI; the ecosystem fills gaps.

## 12. Cautions

| Topic | Risk |
|---|---|
| GPGPU | Float texture support, precision, readback stalls |
| Compute | WebGPU-only; fallback needed |
| Volumetrics | Fill rate, banding, mobile cost |
| Path tracing | Not real-time; GPU heavy |
| Splats | Memory, overdraw, sorting, editability |
| XR | Comfort, performance, device fragmentation |
| Workers | API limitations, transfer costs, debugging complexity |
| WASM | Load time, memory, cross-origin isolation |
