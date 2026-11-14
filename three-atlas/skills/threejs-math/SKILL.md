---
name: threejs-math
description: 3D math for Three.js including vectors, matrices, quaternions, projection, NDC, rays, intersections, curves, interpolation, damping, noise, and color math. Use when writing camera rigs, controls, procedural geometry, shaders, physics helpers, or debugging transforms and projections.
---

# Three.js Math

## Read first

- `../../docs/02-3d-math.md` — full derivations and formulas.
- `../../cheatsheets/math-cheatsheet.md` — quick formulas.

## Core model

- Right-handed, +Y up, camera looks down -Z, 1 unit = 1 meter.
- Local matrix: `M = T * R * S`.
- World: `M_world = M_parent * M_local`.
- Clip: `P * V * M * p`; NDC after divide.
- WebGL NDC z `[-1,1]`; WebGPU `[0,1]`.
- Normals transform by `(M_3x3)^-T`, not by `M`.

## Rules

- Accumulate rotations with quaternions, not Euler angles.
- Use `slerp` for orientation, `lerp` for positions.
- Reuse `Vector3`/`Quaternion`/`Matrix4` temporaries.
- Compare squared distances when possible.
- Use `MathUtils.damp` for frame-rate-independent smoothing.
- Use `getPointAt` for constant-speed curve movement.
- Recompute bounding volumes after geometry changes.

## Essential snippets

### Look-at with smoothing

```js
const m = new THREE.Matrix4().lookAt(object.position, target, object.up);
desiredQuat.setFromRotationMatrix(m);
object.quaternion.slerp(desiredQuat, 1 - Math.exp(-6 * dt));
```

### Pointer to ray

```js
const rect = canvas.getBoundingClientRect();
pointer.set(
  ((event.clientX - rect.left) / rect.width) * 2 - 1,
  -((event.clientY - rect.top) / rect.height) * 2 + 1
);
raycaster.setFromCamera(pointer, camera);
```

### Damping

```js
const alpha = 1 - Math.exp(-lambda * dt);
value += (target - value) * alpha;
```

### Camera path

```js
const curve = new THREE.CatmullRomCurve3(points, true, 'centripetal');
const p = curve.getPointAt(u);
const tangent = curve.getTangentAt(u);
```

### Screen projection

```js
const v = world.clone().project(camera);
const x = (v.x * 0.5 + 0.5) * width;
const y = (-v.y * 0.5 + 0.5) * height;
```

## Pitfalls

- `Matrix4.elements` is column-major; `set()` takes row-major arguments.
- `lookAt` points -Z at the target for cameras; mesh forward may be +Z.
- Non-uniform scale breaks normals unless using the normal matrix.
- Zero scale makes matrices singular.
- Euler order matters; gimbal lock is real.
- `unproject` needs a z inside NDC; use `0.5`.
- Large `far/near` ratios destroy depth precision.

## Verification

- Unit tests for pure math.
- Visual check with a debug helper (`AxesHelper`, `Box3Helper`, `VertexNormalsHelper`).
- Compare world/local transforms numerically.
- Test at extreme scales and angles.
