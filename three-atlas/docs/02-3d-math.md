# 02 — 3D Mathematics for Three.js

This document is the mathematical foundation you need to build cameras, controls, shaders, animations, physics, and procedural geometry. Formulas are given in a form that maps directly to Three.js classes.

## 1. Coordinate system and units

- **Right-handed** coordinate system.
- **+X right, +Y up, +Z toward the viewer** when the camera looks down **−Z**.
- 1 unit = 1 meter (pack convention). Keep every system in the same unit.
- Rotations are counter-clockwise when looking from the positive axis toward the origin (right-hand rule).
- glTF is +Y up; Blender is +Z up and the glTF exporter rotates the model.

Consequences:

- A camera at `(0, 0, 5)` looking at the origin faces **−Z**.
- A positive rotation around **Y** turns an object from **+Z toward +X** (right-hand rule), which looks counter-clockwise from above.
- `Object3D.lookAt()` points the object's **−Z** axis at the target for cameras; for other objects it aligns **+Z** with the target (Three.js uses the object type internally).

## 2. Vectors

### 2.1 Core operations

For vectors `a`, `b` and scalar `s`:

```
a + b        = (a.x + b.x, a.y + b.y, a.z + b.z)
a - b        = (a.x - b.x, a.y - b.y, a.z - b.z)
s * a        = (s*a.x, s*a.y, s*a.z)
|a|          = sqrt(a.x^2 + a.y^2 + a.z^2)
â            = a / |a|                     (unit vector)
a · b        = a.x*b.x + a.y*b.y + a.z*b.z (scalar)
a × b        = (a.y*b.z - a.z*b.y,
                a.z*b.x - a.x*b.z,
                a.x*b.y - a.y*b.x)         (vector, right-hand rule)
distance     = |a - b|
```

Geometric meaning:

- `a · b = |a||b| cos θ`. Positive when the angle is acute; zero when perpendicular; negative when obtuse.
- `a × b` is perpendicular to both, with magnitude `|a||b| sin θ`.
- For a unit vector `n` (surface normal), `dot(n, viewDir)` drives Fresnel and backface culling.

Three.js:

```js
const a = new THREE.Vector3(1, 0, 0);
const b = new THREE.Vector3(0, 1, 0);

a.dot(b);            // 0
a.cross(b);          // (0, 0, 1), mutates a
a.clone().cross(b);  // safer
a.length();
a.normalize();       // mutates
a.distanceTo(b);
a.lerp(b, 0.5);      // linear interpolation
a.project(camera);   // world -> NDC
a.unproject(camera); // NDC -> world
```

### 2.2 Projection and reflection

Projection of `a` onto `b`:

```
proj_b(a) = (a · b / b · b) * b
```

Component of `a` perpendicular to unit `n`:

```
a_perp = a - (a · n) n
```

Reflection of incident `i` around unit normal `n`:

```
r = i - 2 (i · n) n
```

This is exactly what `reflect()` does in GLSL/TSL and what drives specular reflection.

### 2.3 Interpolation

Linear interpolation:

```
lerp(a, b, t) = a + (b - a) t,   t ∈ [0, 1]
```

For directions, normalize after lerp or use slerp.

Smoothstep:

```
t' = t*t*(3 - 2t)
```

Inverse lerp / remap:

```
t = (x - inMin) / (inMax - inMin)
y = outMin + t * (outMax - outMin)
```

Three.js: `THREE.MathUtils.lerp`, `smoothstep`, `mapLinear`, `damp`.

## 3. Matrices

### 3.1 What a matrix does

A 4×4 matrix maps a homogeneous point `(x, y, z, 1)` to another point:

```
p' = M p
```

Affine transforms (translation, rotation, scale, shear) are 4×4 matrices whose last row is `(0, 0, 0, 1)`.

### 3.2 Column-major storage in Three.js

`Matrix4.elements` is a **column-major** `Float32Array`:

```
elements = [
  m11, m21, m31, m41,   // column 0
  m12, m22, m32, m42,   // column 1
  m13, m23, m33, m43,   // column 2
  m14, m24, m34, m44    // column 3
]
```

`matrix.set(...)` takes arguments in **row-major** order (n11, n12, n13, n14, n21, ...). This mismatch is a classic source of bugs.

Because WebGL/WebGPU expect column-major data and Three.js already stores it that way, you upload matrices with `transpose = false`.

### 3.3 Composition order

The local matrix is:

```
M_local = T * R * S
```

Meaning: scale first, then rotate, then translate. In Three.js, `position`, `quaternion`, and `scale` are the source of truth; the matrix is composed from them:

```js
const m = new THREE.Matrix4();
m.compose(position, quaternion, scale);

// Inverse operation
const p = new THREE.Vector3();
const q = new THREE.Quaternion();
const s = new THREE.Vector3();
m.decompose(p, q, s);
```

Manually building a transform:

```js
const m = new THREE.Matrix4()
  .makeTranslation(2, 1, 0)
  .multiply(new THREE.Matrix4().makeRotationY(Math.PI / 4))
  .multiply(new THREE.Matrix4().makeScale(2, 2, 2));
```

The rightmost transform is applied first to a vector: `M * v = T * R * S * v`.

### 3.4 World matrix

```
M_world = M_parent_world * M_local
```

Three.js recomputes this during `updateMatrixWorld()` (called by the renderer). To convert between spaces:

```js
// local -> world
v.applyMatrix4(obj.matrixWorld);

// world -> local
v.applyMatrix4(new THREE.Matrix4().copy(obj.matrixWorld).invert());
// or simply:
obj.worldToLocal(v);
```

Do not mutate `matrixWorld` directly unless you know exactly what you are doing.

### 3.5 Normal matrix

Normals are directions, not points. Under non-uniform scale, transforming a normal by the model matrix distorts it. The correct transform is the **inverse transpose of the upper-left 3×3 model matrix**:

```
N = (M_3x3)^-T
```

Three.js provides `Matrix3.getNormalMatrix(modelMatrix)`. In shaders, `normalMatrix` is exactly this for the model-view matrix.

### 3.6 View and projection matrices

```
clip = P * V * M * localPosition
```

- `M` = model matrix (`matrixWorld`).
- `V` = view matrix (`camera.matrixWorldInverse`), the inverse of the camera's world matrix.
- `P` = projection matrix (`camera.projectionMatrix`).
- `clip` is in clip space; after perspective divide by `w`, it becomes NDC.

The combined `P * V` is available as `camera.projectionMatrix * camera.matrixWorldInverse`; Three.js exposes `camera.projectionMatrixInverse` for unprojection.

### 3.7 Determinants, inverses, and degeneracy

- A matrix is invertible when `det(M) ≠ 0`.
- A zero scale on any axis makes the matrix singular: normals and raycasts break.
- `Matrix4.invert()` returns the inverse; check `det` if you allow arbitrary transforms.
- Transpose swaps rows and columns; for rotation matrices, transpose equals inverse.

```js
const inv = new THREE.Matrix4().copy(m).invert();
const det = m.determinant();
```

## 4. Rotations: Euler angles and quaternions

### 4.1 Euler angles

Three.js `Euler` uses `(x, y, z)` angles in radians and an order string, default `'XYZ'`.

```js
const e = new THREE.Euler(Math.PI / 4, 0, 0, 'XYZ');
obj.rotation.copy(e);
```

Order matters: `'XYZ'` means rotations are applied in a defined intrinsic/extrinsic sequence. Different orders produce different orientations for the same angles.

Euler angles suffer from **gimbal lock**: when two axes align, one degree of freedom is lost and interpolation can flip.

### 4.2 Quaternions

A unit quaternion represents a rotation:

```
q = (x, y, z, w),   |q| = 1
```

Rotation of vector `v`:

```
v' = q v q*
```

where `q*` is the conjugate (inverse for unit quaternions).

Three.js:

```js
const q = new THREE.Quaternion();
q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
q.setFromEuler(new THREE.Euler(0, Math.PI / 2, 0));
q.setFromRotationMatrix(m);
q.setFromUnitVectors(fromDir, toDir);

q.multiply(other);       // q = q * other
q.premultiply(other);    // q = other * q
q.invert();              // conjugate for unit quaternions
q.slerp(target, t);      // spherical interpolation
q.identity();
```

Composition order: `qA.multiply(qB)` produces a rotation equivalent to applying `qB` first, then `qA` (because `(qA qB) v = qA (qB v)`).

Quaternions are the right choice for:

- Camera rigs and orbit controls.
- Interpolating orientations (`slerp`).
- Avoiding gimbal lock.
- `lookAt`-style orientation with `setFromRotationMatrix`.

### 4.3 Direction to quaternion

```js
const q = new THREE.Quaternion();
const m = new THREE.Matrix4().lookAt(origin, target, up);
q.setFromRotationMatrix(m);
```

`Matrix4.lookAt(eye, target, up)` builds a rotation matrix whose **−Z** points from `eye` to `target` (camera convention). For a mesh whose forward is **+Z**, use the target/eye order accordingly or rotate 180° around Y.

## 5. Projection

### 5.1 Perspective projection

Given vertical field of view `fov` (radians), aspect `a = width/height`, near `n`, far `f`:

```
t = 1 / tan(fov / 2)

P = [ t/a,  0,   0,                         0
      0,    t,   0,                         0
      0,    0,   (f+n)/(n-f),   2fn/(n-f)
      0,    0,  -1,                         0 ]
```

This is the right-handed OpenGL-style projection (camera looks down −Z, NDC z in `[-1, 1]`).

Properties:

- Objects behind the camera (`z > 0` in view space) get `w < 0` and are clipped.
- Perspective divide by `w = -z_view` produces foreshortening.
- `fov` is **vertical**, not horizontal. Horizontal fov depends on aspect.

Convert focal length to fov (full-frame 36 mm width or 24 mm height):

```
fov_vertical = 2 * atan(sensorHeight / (2 * focalLength))
fov_horizontal = 2 * atan(sensorWidth / (2 * focalLength))
```

### 5.2 Orthographic projection

No perspective divide; parallel lines stay parallel. Defined by `left, right, top, bottom, near, far`:

```js
const cam = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 100);
cam.zoom = 1.5;
cam.updateProjectionMatrix();
```

Use for isometric games, CAD, UI-like scenes, shadow cameras, and 2.5D.

### 5.3 NDC differences: WebGL vs WebGPU

| API | NDC x/y | NDC z |
|---|---|---|
| WebGL | `[-1, 1]` | `[-1, 1]` |
| WebGPU | `[-1, 1]`, y up | `[0, 1]` |

Three.js handles the conversion internally (`WebGPURenderer` adapts projection and depth). When writing custom shaders that output clip coordinates or reconstruct depth, account for the backend.

### 5.4 Depth precision

Depth buffer precision is non-linear in perspective. Most precision is near the camera. A ratio `far/near` of 10,000 or more causes z-fighting far away.

Mitigations:

- Increase `near` as much as the scene allows.
- Decrease `far` to the actual scene bounds.
- Use `logarithmicDepthBuffer: true` for huge ranges (costs performance, can break some effects).
- Use `reversedDepthBuffer: true` (r181+) with a float depth buffer for better precision; ideal for large scenes.
- Avoid coplanar surfaces; offset decals with `polygonOffset`.

### 5.5 Unprojection and camera rays

```js
function pointerToNDC(event, rect) {
  return new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  );
}

function screenToWorld(ndc, camera) {
  const v = new THREE.Vector3(ndc.x, ndc.y, 0.5);
  v.unproject(camera); // NDC -> world at a point on the ray
  return v;
}

function cameraRay(ndc, camera) {
  const origin = camera.position.clone(); // world space
  const target = new THREE.Vector3(ndc.x, ndc.y, 0.5).unproject(camera);
  return new THREE.Ray(origin, target.sub(origin).normalize());
}
```

For orthographic cameras, the ray origin varies across the screen; `Raycaster.setFromCamera` handles both cases correctly.

### 5.6 World to screen

```js
const v = worldPosition.clone().project(camera);
const x = (v.x * 0.5 + 0.5) * width;
const y = (-v.y * 0.5 + 0.5) * height;
const visible = v.z >= -1 && v.z <= 1; // WebGL NDC
```

In React Three Fiber, `useThree((s) => s.size)` and `s.viewport` help; `drei/Html` does this projection internally.

## 6. Rays and intersections

### 6.1 Ray

```
P(t) = origin + t * direction,   t >= 0
```

Three.js: `new THREE.Ray(origin, direction)`.

### 6.2 Ray-plane

Plane: `n · P + d = 0` (Three.js `Plane` uses `n · P + constant = 0`).

```
t = -(n · origin + d) / (n · direction)
```

If denominator is ~0, the ray is parallel to the plane.

```js
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // y = 0
const point = new THREE.Vector3();
ray.intersectPlane(plane, point);
```

### 6.3 Ray-sphere

Sphere center `c`, radius `r`:

```
oc = origin - c
b = oc · direction
cc = oc · oc - r*r
disc = b*b - cc
if disc < 0: no hit
t = -b - sqrt(disc)
```

Three.js: `ray.intersectSphere(sphere, target)`.

### 6.4 Ray-triangle (Möller–Trumbore)

Triangle `(a, b, c)`, edges `e1 = b-a`, `e2 = c-a`:

```
p = direction × e2
det = e1 · p
if |det| < epsilon: parallel
invDet = 1 / det
tv = origin - a
u = (tv · p) * invDet
if u < 0 or u > 1: miss
q = tv × e1
v = (direction · q) * invDet
if v < 0 or u + v > 1: miss
t = (e2 · q) * invDet
```

Three.js: `ray.intersectTriangle(a, b, c, backfaceCulling, target)`.

### 6.5 AABB and OBB

- `Box3` is axis-aligned; intersects with `box.intersectsRay(ray)` or `ray.intersectsBox(box)`.
- `OBB` (addon `three/addons/math/OBB.js`) is oriented; use it for rotated boxes.
- For meshes, `Raycaster` uses the object's geometry and bounding volumes. Accelerate large meshes with `three-mesh-bvh`.

### 6.6 Frustum culling

A frustum is six planes. A bounding sphere is visible if it is on the positive side of at least one plane behind the camera? The practical test: a sphere is culled when its center is farther than `radius` on the negative side of any plane.

```js
const frustum = new THREE.Frustum();
const projScreen = new THREE.Matrix4()
  .multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
frustum.setFromProjectionMatrix(projScreen);

const sphere = new THREE.Sphere();
mesh.geometry.computeBoundingSphere();
sphere.copy(mesh.geometry.boundingSphere).applyMatrix4(mesh.matrixWorld);

frustum.intersectsSphere(sphere); // false => cull
```

Three.js does this per object automatically when `frustumCulled` is `true`.

## 7. Curves

### 7.1 Linear and Bezier

Linear:

```
B(t) = (1-t) P0 + t P1
```

Quadratic Bezier:

```
B(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2
```

Cubic Bezier:

```
B(t) = (1-t)^3 P0
     + 3(1-t)^2 t P1
     + 3(1-t) t^2 P2
     + t^3 P3
```

Three.js: `QuadraticBezierCurve3`, `CubicBezierCurve3`.

### 7.2 Catmull-Rom

Smooth curve through control points:

```
P(t) = 0.5 * [
  2P1 +
  (-P0 + P2) t +
  (2P0 - 5P1 + 4P2 - P3) t^2 +
  (-P0 + 3P1 - 3P2 + P3) t^3
]
```

Three.js: `CatmullRomCurve3(points, closed, curveType, tension)`. `curveType` can be `'centripetal'`, `'chordal'`, or `'catmullrom'`.

### 7.3 Arc-length parameterization

`t` in a Bezier is not proportional to distance. To move at constant speed:

```js
const curve = new THREE.CatmullRomCurve3(points);
curve.arcLengthDivisions = 200; // precision
const point = curve.getPointAt(u);      // u by arc length, 0..1
const tangent = curve.getTangentAt(u);
```

Use `getPointAt`/`getTangentAt` for camera paths, trails, and motion along rails.

### 7.4 Frenet frames

For tubes and ribbons, you need a stable frame along the curve:

```js
const frames = curve.computeFrenetFrames(segments, closed);
// frames.tangents, frames.normals, frames.binormals
```

`TubeGeometry` uses this internally. For twisting ribbons, build a custom frame or use parallel transport to avoid flips.

## 8. Interpolation, damping, and springs

### 8.1 Frame-rate-independent damping

A naive `x = lerp(x, target, 0.1)` moves faster at high framerates. Use exponential smoothing:

```
alpha = 1 - exp(-lambda * dt)
x = x + (target - x) * alpha
```

Three.js: `THREE.MathUtils.damp(x, target, lambda, dt)`.

### 8.2 Critically damped spring

For a natural follow without oscillation:

```
omega = 2 / smoothTime
x = exp(-omega * dt)
y = dt * omega * exp(-omega * dt)
z = dt * dt * omega * omega * exp(-omega * dt) * 0.5
target = ...
change = current - target
temp = (velocity + omega * change) * dt
velocity = (velocity - omega * temp) * x
current = target + (change + temp) * x
```

A simpler approximation is sufficient for cameras and UI:

```js
const lambda = 8;
current = THREE.MathUtils.damp(current, target, lambda, dt);
```

### 8.3 Easing functions

Normalized cubic easings:

```
easeInCubic    t^3
easeOutCubic   1 - (1-t)^3
easeInOutCubic t<0.5 ? 4t^3 : 1 - (-2t+2)^3 / 2
easeOutExpo    t === 1 ? 1 : 1 - 2^(-10t)
easeOutBack    1 + c3*(t-1)^3 + c1*(t-1)^2,  c1 = 1.70158, c3 = c1 + 1
```

For web motion, prefer `easeOutCubic`/`easeOutExpo` for entrances and `easeInOutCubic` for camera moves.

## 9. Noise and procedural fields

### 9.1 Value noise

Interpolate random values on a lattice with a smoothstep between them. Cheap, blocky at low frequencies.

### 9.2 Simplex noise

Fewer directional artifacts than Perlin; O(n) for n dimensions. Three.js addon: `SimplexNoise` (`three/addons/math/SimplexNoise.js`).

```js
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
const noise = new ImprovedNoise();
const n = noise.noise(x, y, z); // [-1, 1]
```

### 9.3 fBm (fractal Brownian motion)

```
fbm(p) = sum_{i=0}^{octaves-1} amplitude_i * noise(frequency_i * p)
amplitude_{i+1} = amplitude_i * gain
frequency_{i+1} = frequency_i * lacunarity
```

Typical: `gain = 0.5`, `lacunarity = 2.0`, 4–8 octaves. Use for terrain, clouds, displacement, and texture generation.

### 9.4 Curl noise

For particles and fluids, take the curl of a vector noise field:

```
curl(F) = (dFz/dy - dFy/dz, dFx/dz - dFz/dx, dFy/dx - dFx/dy)
```

Approximate derivatives with finite differences of `fbm`. Result is divergence-free, which produces swirling, volume-preserving motion.

## 10. Color mathematics

### 10.1 sRGB transfer functions

sRGB to linear:

```
c_lin = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055)^2.4
```

Linear to sRGB:

```
c_srgb = c <= 0.0031308 ? 12.92 c : 1.055 c^(1/2.4) - 0.055
```

Three.js handles this when `ColorManagement.enabled = true` (default). Import color values with `THREE.Color` and set texture color spaces correctly.

### 10.2 Relative luminance

```
Y = 0.2126 R + 0.7152 G + 0.0722 B   (linear RGB)
```

Use for contrast checks, grayscale, and deciding bloom thresholds.

### 10.3 Tone mapping

Tone mapping compresses HDR values into displayable range. Three.js options:

| Mode | Character |
|---|---|
| `NoToneMapping` | Linear clamp; harsh highlights |
| `LinearToneMapping` | Simple scale |
| `ReinhardToneMapping` | Soft, can look flat |
| `CineonToneMapping` | Film-like |
| `ACESFilmicToneMapping` | Filmic, contrasty, popular |
| `AgXToneMapping` | Modern filmic, natural highlights |
| `NeutralToneMapping` | Neutral, good for product/UI |

Apply tone mapping once, at the end of the pipeline (renderer to screen, or `OutputPass`/`renderOutput` in post-processing).

### 10.4 OKLCH (design-side)

For palette generation and perceptual lightness, OKLCH is superior to HSL. Three.js does not include OKLab conversion; do it in CSS/design tooling or in a shader if needed. Keep runtime color math in linear RGB.

## 11. Numerical stability and performance

- Use `Number.EPSILON` or a scene-scale epsilon (`1e-5` for meters) when comparing floats.
- Avoid normalizing zero-length vectors; check `lengthSq() > 0`.
- Reuse vectors/quaternions/matrices in hot loops. Do not allocate `new Vector3()` per frame.
- Use `Vector3.copy()`, `.set()`, `.addScaledVector()` instead of operator-style code.
- Prefer squared distances (`distanceToSquared`) when you only compare.
- Do not accumulate rotations as Euler angles; accumulate quaternions.
- For large numbers of transforms, use flat arrays and typed arrays instead of objects.

```js
const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _m = new THREE.Matrix4();

function update(dt) {
  _v.copy(target).sub(obj.position);
  obj.position.addScaledVector(_v, 1 - Math.exp(-8 * dt));
}
```

## 12. Cheat sheet

| Task | Three.js |
|---|---|
| Vector ops | `Vector2/3/4`, `add`, `sub`, `dot`, `cross`, `normalize`, `lerp` |
| Matrix ops | `Matrix3/4`, `compose`, `decompose`, `invert`, `multiply`, `makeRotation*` |
| Rotation | `Quaternion`, `Euler`, `setFromAxisAngle`, `slerp` |
| Projection | `PerspectiveCamera`, `OrthographicCamera`, `project`, `unproject` |
| Ray | `Ray`, `Raycaster`, `setFromCamera` |
| Bounds | `Box3`, `Sphere`, `Plane`, `Frustum`, `OBB` (addon) |
| Curves | `CatmullRomCurve3`, `CubicBezierCurve3`, `Curve.getPointAt` |
| Noise | `SimplexNoise`, `ImprovedNoise` (addons) |
| Interpolation | `MathUtils.lerp`, `damp`, `smoothstep`, `mapLinear` |
| Color | `Color`, `ColorManagement`, `SRGBColorSpace`, tone mapping |
