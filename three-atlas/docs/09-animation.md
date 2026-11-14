# 09 — Animation: Clips, Procedural Motion, Physics-Driven Motion

## 1. Time is the root of animation

Everything animated needs a consistent time source in seconds.

```js
const timer = new THREE.Timer();

renderer.setAnimationLoop((timestamp) => {
  timer.update(timestamp);
  const dt = Math.min(timer.getDelta(), 0.1); // clamp huge deltas
  const elapsed = timer.getElapsed();

  update(dt, elapsed);
  renderer.render(scene, camera);
});
```

Rules:

- Use **delta** for movement, not frame counts.
- Clamp `dt` after tab switches or heavy stalls.
- `Clock` is deprecated (r183); use `Timer` and optionally `timer.connect(document)`.
- For deterministic simulations, use a **fixed timestep** accumulator.

### Fixed timestep

```js
const FIXED_DT = 1 / 60;
let accumulator = 0;

function update(dt) {
  accumulator += Math.min(dt, 0.25);
  while (accumulator >= FIXED_DT) {
    stepPhysics(FIXED_DT);
    accumulator -= FIXED_DT;
  }
  const alpha = accumulator / FIXED_DT;
  interpolateVisuals(alpha); // optional render interpolation
}
```

Physics and gameplay logic should be deterministic; visual interpolation smooths the result.

## 2. AnimationMixer and clips

`AnimationMixer` plays `AnimationClip` objects on a root object.

```js
const mixer = new THREE.AnimationMixer(model);

const action = mixer.clipAction(gltf.animations[0]);
action.play();

// In the loop
mixer.update(dt);
```

### Clip tracks

| Track | Animates |
|---|---|
| `VectorKeyframeTrack` | vec3/vec4 (position, scale) |
| `QuaternionKeyframeTrack` | Quaternion (rotation) |
| `NumberKeyframeTrack` | float (morph, opacity via material? use property binding) |
| `ColorKeyframeTrack` | color |
| `BooleanKeyframeTrack` | boolean |
| `StringKeyframeTrack` | string (rare) |

Clip structure:

```js
const clip = new THREE.AnimationClip('Idle', 3.0, tracks);
```

- Duration in seconds.
- Tracks bind to object paths (`mesh.position`, `bone.quaternion`, etc.).
- `AnimationUtils` helps merge/clip/subclip.
- `AnimationObjectGroup` plays one mixer across multiple objects.

### Actions

```js
const idle = mixer.clipAction(idleClip);
const run = mixer.clipAction(runClip);

idle.play();
run.play();

run.setEffectiveWeight(1);
idle.crossFadeTo(run, 0.3, false);
```

| Method | Effect |
|---|---|
| `play()`, `stop()`, `reset()` | Control playback |
| `setLoop(LoopRepeat/LoopOnce/LoopPingPong, repetitions)` | Loop mode |
| `clampWhenFinished = true` | Hold last frame |
| `setEffectiveWeight(w)` | Blend weight |
| `crossFadeTo(action, duration, warp)` | Smooth transition |
| `fadeIn(duration)`, `fadeOut(duration)` | Fade |
| `timeScale` | Speed multiplier |
| `time` | Current time |

### Blend tree pattern

```js
function playState(name, fade = 0.25) {
  const next = actions[name];
  if (current === next) return;
  next.reset().setEffectiveWeight(1).play();
  current?.crossFadeTo(next, fade, false);
  current = next;
}
```

For locomotion, use a 1D blend between idle/walk/run based on speed, or a 2D blend space (direction + speed). Three.js does not ship a blend tree; implement weights manually or use a library.

## 3. glTF animations

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';

const gltf = await new GLTFLoader().loadAsync('/model.glb');
scene.add(gltf.scene);

const mixer = new THREE.AnimationMixer(gltf.scene);
const actions = Object.fromEntries(
  gltf.animations.map((clip) => [clip.name, mixer.clipAction(clip)])
);
actions.Idle.play();

// Cloning a skinned model requires SkeletonUtils
const clone = cloneSkeleton(gltf.scene);
```

- glTF animations target node names; renaming nodes in Blender can break bindings.
- Check `gltf.animations.length`; some models bake animations into morph targets.
- Use `mixer.update(dt)` only when the model is visible (performance).
- `mesh.frustumCulled = false` for skinned meshes whose bounds are wrong, but prefer recomputing bounds.

### Morph targets

```js
const index = mesh.geometry.morphAttributes.position.indexOf(target);
mesh.morphTargetInfluences[index] = value;
```

Animate weights with tweens, mixers (morph tracks), or procedural code.

## 4. Procedural animation

### 4.1 Oscillation

```js
mesh.position.y = baseY + Math.sin(elapsed * 2) * 0.1;
mesh.rotation.z = Math.sin(elapsed * 1.3 + phase) * 0.05;
```

Use different frequencies and phases to avoid synchronized, robotic motion.

### 4.2 Look-at and tracking

```js
const target = new THREE.Vector3();
const desiredQuat = new THREE.Quaternion();

function lookAtSmooth(object, point, dt, lambda = 6) {
  const m = new THREE.Matrix4().lookAt(object.position, point, object.up);
  desiredQuat.setFromRotationMatrix(m);
  object.quaternion.slerp(desiredQuat, 1 - Math.exp(-lambda * dt));
}
```

For cameras, `lookAt` points −Z at the target; for meshes whose forward is +Z, rotate 180°.

### 4.3 Spring motion

```js
class Spring {
  constructor(stiffness = 120, damping = 14) {
    this.value = 0;
    this.velocity = 0;
    this.stiffness = stiffness;
    this.damping = damping;
  }
  update(target, dt) {
    const force = (target - this.value) * this.stiffness;
    const dampingForce = -this.velocity * this.damping;
    this.velocity += (force + dampingForce) * dt;
    this.value += this.velocity * dt;
  }
}
```

Use for UI-like follow, scale pops, and camera lag. For critically damped smoothing, use `MathUtils.damp` or a dedicated spring implementation.

### 4.4 Noise-driven motion

```js
const noise = new SimplexNoise();
const t = elapsed * 0.2;
mesh.position.x = noise.noise(t, 0, 0) * 0.5;
mesh.position.y = noise.noise(0, t, 0) * 0.5;
```

fBm and curl noise for organic fields; see `docs/02-3d-math.md`.

### 4.5 IK (inverse kinematics)

`CCDIKSolver` (addon) solves bone chains:

```js
import { CCDIKSolver } from 'three/addons/animation/CCDIKSolver.js';
const solver = new CCDIKSolver(mesh, ikChains);
solver.update();
```

Use for limbs reaching targets, tentacles, or robot arms. For two-bone IK, an analytic solution is cheaper and more stable.

## 5. Tweens and timeline libraries

### 5.1 Tween.js

```js
import TWEEN from 'three/addons/libs/tween.module.js';

new TWEEN.Tween(mesh.position)
  .to({ x: 2, y: 1 }, 800)
  .easing(TWEEN.Easing.Cubic.Out)
  .start();

function loop(now) {
  TWEEN.update(now);
  renderer.render(scene, camera);
}
```

- Good for one-off transitions.
- Use `TWEEN.removeAll()` on scene teardown.

### 5.2 GSAP

GSAP is the industry standard for complex timelines and scroll integration. It is not bundled with Three.js but integrates cleanly:

```js
import gsap from 'gsap';

gsap.to(camera.position, { x: 2, y: 1, z: 4, duration: 1.2, ease: 'power3.out' });
gsap.to(material.uniforms.uProgress, { value: 1, duration: 0.8 });
```

- Timeline sequencing, labels, callbacks.
- ScrollTrigger for scroll-driven animation.
- Use `gsap.ticker` carefully; do not double-drive the render loop.

### 5.3 React animation

- `react-spring` (`@react-spring/three`) for spring physics on props.
- `framer-motion-3d` for declarative motion.
- In R3F, `useFrame` + refs for procedural motion.

## 6. Scroll-driven animation

```js
const scroll = { progress: 0 };

input.addEventListener('scroll', () => {
  const max = document.body.scrollHeight - innerHeight;
  scroll.progress = MathUtils.clamp(scrollY / max, 0, 1);
});

// In the loop
const eased = smoothstep(0, 1, scroll.progress);
camera.position.copy(path.getPointAt(eased));
```

Options:

- Native scroll + normalized progress (simple, accessible).
- `ScrollTrigger` (GSAP) for pinning, snapping, and timelines.
- Smooth-scroll libraries (Lenis) for inertia; ensure keyboard and reduced-motion still work.
- Virtual scroll for canvas-only experiences; keep a DOM outline for accessibility.

Design rules:

- Camera moves should be slow and intentional; fast scroll-driven 3D causes motion sickness.
- Provide section anchors and a static/reduced-motion version.
- Do not hijack scroll without an escape.

## 7. Animation state machines

For characters and complex objects, separate state from playback:

```js
const states = {
  idle: { clip: 'Idle', loop: true },
  run: { clip: 'Run', loop: true },
  jump: { clip: 'Jump', loop: false, next: 'idle' },
};

let state = 'idle';

function setState(next) {
  if (state === next) return;
  const from = actions[states[state].clip];
  const to = actions[states[next].clip];
  to.reset().play();
  from.crossFadeTo(to, 0.2, false);
  state = next;
}
```

For gameplay, use a small FSM library or an ECS. Keep animation state separate from health/score/etc.

## 8. Particles and trails

- `Points` with a custom shader for size/color/velocity.
- `InstancedMesh` for quads/streaks.
- Trail: sample positions into a `BufferGeometry` ring buffer and update a line/ribbon.
- `drei/Trail` for R3F.
- For massive particle counts, use GPGPU: `GPUComputationRenderer` (WebGL) or TSL compute/storage buffers (WebGPU).

## 9. Animation performance

- Update only visible mixers; pause offscreen models.
- Use `mixer.update(dt)` once per frame, not per action.
- Avoid creating clips/actions per frame.
- Share morph target data; do not clone geometry unnecessarily.
- Limit skinned mesh count and bone count; skinning is vertex-shader heavy.
- Use LOD for animated characters; stop updating distant ones.
- Clamp `dt`; large deltas break springs and physics.
- Use `requestAnimationFrame`/`setAnimationLoop` consistently; do not mix timers.
- For on-demand rendering, mark dirty while animating and stop when idle.

## 10. Accessibility and motion

- Respect `prefers-reduced-motion`:

```js
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const speed = reduceMotion ? 0 : 1;
```

- Provide pause/play for autoplaying 3D animation.
- Avoid flashing, rapid camera moves, and uncontrolled parallax.
- Keep essential information available without motion.
- Scroll-driven experiences must remain navigable with keyboard and screen readers.

## 11. Troubleshooting

| Problem | Cause |
|---|---|
| Animation runs too fast/slow | Using frame count instead of delta, or wrong timeScale |
| Model explodes when animated | Wrong bind pose, missing skeleton clone, bad skin weights |
| Animation not playing | Mixer not updated, clip name mismatch, action not played |
| Jitter | Large/uneven dt, competing updates, physics not interpolated |
| Pop on transition | No crossfade, mismatched clip times |
| Camera motion sickness | Too fast, too much rotation, no damping |
| Scroll animation desync | Progress computed from wrong element, resize not handled |
| Springs unstable | dt too large or stiffness/damping too high; use substeps |
| Skinned mesh culling | Bounding volume not updated; set `frustumCulled=false` as a last resort |
