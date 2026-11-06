# Math Cheat Sheet

## Coordinate system

- Right-handed, +Y up, camera looks down -Z.
- 1 unit = 1 meter.
- glTF +Y up; Blender +Z up (exporter rotates).

## Vectors

```
|a| = sqrt(ax^2 + ay^2 + az^2)
â  = a / |a|
a · b = ax bx + ay by + az bz = |a||b| cos θ
a × b = (ay bz - az by, az bx - ax bz, ax by - ay bx)
dist(a,b) = |a - b|
proj_b(a) = (a·b / b·b) b
reflect(i,n) = i - 2(i·n)n
```

## Matrices

- `Matrix4.elements` is **column-major**.
- `matrix.set(...)` takes **row-major** arguments.
- Local transform: `M = T * R * S` (scale first, then rotate, then translate).
- World: `M_world = M_parent_world * M_local`.
- Clip: `clip = P * V * M * p`.
- Normal matrix: `(M_3x3)^-T`.
- Invert: `M.copy(m).invert()`.

## Quaternions

```
|q| = 1
v' = q v q*
qA.multiply(qB) applies qB first, then qA
q.slerp(target, t)
q.setFromAxisAngle(axis, angle)
q.setFromEuler(euler)
q.setFromRotationMatrix(m)
```

Euler order default `'XYZ'`; gimbal lock is possible.

## Projection

```
t = 1 / tan(fov / 2)
aspect = width / height

P = [ t/aspect, 0, 0,                        0
      0,        t, 0,                        0
      0,        0, (far+near)/(near-far),    2*far*near/(near-far)
      0,        0, -1,                       0 ]
```

- `fov` is vertical, in radians for math, degrees for Three.js.
- WebGL NDC z: `[-1, 1]`; WebGPU NDC z: `[0, 1]`.
- Focal length: `fov = 2 atan(sensorHeight / (2 focal))`.

## NDC and rays

```
ndc.x = (px / width) * 2 - 1
ndc.y = -(py / height) * 2 + 1

world = new Vector3(ndc.x, ndc.y, 0.5).unproject(camera)
direction = (world - camera.position).normalize()

screen.x = (ndc.x * 0.5 + 0.5) * width
screen.y = (-ndc.y * 0.5 + 0.5) * height
```

## Intersections

Ray: `P(t) = origin + t * direction`.

Plane `n·P + d = 0`:

```
t = -(n·origin + d) / (n·direction)
```

Sphere center `c`, radius `r`:

```
oc = origin - c
b = oc · direction
cc = oc·oc - r*r
disc = b*b - cc
t = -b - sqrt(disc)
```

Triangle (Möller–Trumbore):

```
e1 = b - a; e2 = c - a
p = direction × e2
det = e1 · p
u = (origin - a) · p / det
q = (origin - a) × e1
v = direction · q / det
t = e2 · q / det
```

## Curves

Linear: `B(t) = (1-t)P0 + tP1`.

Quadratic Bezier:

```
B(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2
```

Cubic Bezier:

```
B(t) = (1-t)^3 P0 + 3(1-t)^2 t P1 + 3(1-t)t^2 P2 + t^3 P3
```

Catmull-Rom:

```
0.5 * (2P1 + (-P0+P2)t + (2P0-5P1+4P2-P3)t^2 + (-P0+3P1-3P2+P3)t^3)
```

Use `getPointAt(u)` for arc-length parameterization.

## Interpolation and damping

```
lerp(a,b,t) = a + (b-a)t
smoothstep(t) = t*t*(3-2t)
damp(x, target, lambda, dt): x + (target-x)*(1 - exp(-lambda*dt))
```

Critically damped spring (smooth follow):

```
omega = 2 / smoothTime
x = exp(-omega*dt)
velocity = (velocity - omega*temp) * x
```

## Noise

- Value noise: interpolate random lattice values.
- Simplex: fewer artifacts, O(n).
- fBm: `sum amplitude_i * noise(frequency_i * p)`, gain 0.5, lacunarity 2, 4-8 octaves.
- Curl: cross of derivatives of a vector field; divergence-free.

## Color

sRGB to linear:

```
c <= 0.04045 ? c/12.92 : ((c+0.055)/1.055)^2.4
```

Linear to sRGB:

```
c <= 0.0031308 ? 12.92c : 1.055 c^(1/2.4) - 0.055
```

Luminance (linear): `Y = 0.2126 R + 0.7152 G + 0.0722 B`.

## Three.js helpers

```js
MathUtils.lerp(a, b, t);
MathUtils.smoothstep(x, min, max);
MathUtils.mapLinear(x, inMin, inMax, outMin, outMax);
MathUtils.damp(x, target, lambda, dt);
MathUtils.clamp(x, min, max);
MathUtils.degToRad(deg);
MathUtils.randFloat(min, max);
```

## Performance rules

- Reuse `Vector3`/`Quaternion`/`Matrix4` temporaries.
- Compare squared distances when possible.
- Avoid normalizing zero-length vectors.
- Accumulate rotations in quaternions, not Euler angles.
- Use epsilon `1e-5` at meter scale.
- Prefer flat typed arrays for thousands of transforms.
