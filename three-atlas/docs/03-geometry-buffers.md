# 03 — Geometry and BufferGeometry

## 1. What geometry is

In Three.js, `BufferGeometry` is a set of GPU buffers plus metadata. It describes vertices and how to connect them into triangles, lines, or points. A `Mesh` combines geometry with a material.

```
BufferGeometry
  ├── attributes
  │   ├── position  (Float32Array, itemSize 3)
  │   ├── normal    (Float32Array, itemSize 3)
  │   ├── uv        (Float32Array, itemSize 2)
  │   ├── tangent   (Float32Array, itemSize 4)
  │   └── color     (Float32Array, itemSize 3 or 4)
  ├── index         (Uint16Array or Uint32Array)
  ├── groups        (material index ranges)
  ├── boundingBox / boundingSphere
  └── drawRange
```

Rendering a mesh is one or more draw calls. Geometry is uploaded to the GPU once and reused.

## 2. Attributes

### 2.1 Creating attributes

```js
const positions = new Float32Array([
  -0.5, -0.5, 0,
   0.5, -0.5, 0,
   0.5,  0.5, 0,
  -0.5,  0.5, 0,
]);

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setIndex([0, 1, 2, 0, 2, 3]);
geometry.computeVertexNormals();
```

Rules:

- `itemSize` is the number of components per vertex: 1 (scalar), 2 (uv), 3 (position/normal), 4 (tangent/color with alpha).
- The typed array length must be `vertexCount * itemSize` (unless interleaved).
- The attribute `count` is `array.length / itemSize`.
- Indices must reference existing vertices. Use `Uint16Array` when vertex count ≤ 65,535; `Uint32Array` otherwise (WebGL2 supports 32-bit indices).

### 2.2 Common attributes

| Name | itemSize | Color space | Purpose |
|---|---|---|---|
| `position` | 3 | linear (positions) | Vertex positions |
| `normal` | 3 | linear | Lighting and reflection |
| `uv` | 2 | linear | Texture coordinates |
| `uv1`, `uv2`, `uv3` | 2 | linear | Extra UV sets (lightmaps, AO, detail) |
| `tangent` | 4 | linear | Normal mapping (xyz + handedness w) |
| `color` | 3 or 4 | linear | Vertex colors (multiplied with material color) |
| `skinIndex` | 4 | integer | Bone indices for skinning |
| `skinWeight` | 4 | linear | Bone weights |
| `morphTarget0..n` | 3 | linear | Morph target positions |

### 2.3 Updating attributes

```js
const attr = geometry.getAttribute('position');
attr.setXYZ(0, x, y, z);
attr.needsUpdate = true; // upload next render

// Partial updates for large buffers
attr.setUsage(THREE.DynamicDrawUsage);
attr.addUpdateRange(offset, count);
attr.needsUpdate = true;
// r159+: multiple ranges; clearUpdateRanges() to reset
```

- Static geometry: default usage (static draw).
- Frequently updated geometry (particles, water, cloth): `DynamicDrawUsage`.
- Updating every vertex every frame is a bandwidth bottleneck; prefer shaders or GPU compute for large dynamic data.

### 2.4 Interleaved buffers

```js
const interleaved = new THREE.InterleavedBuffer(
  new Float32Array(vertexCount * 6),
  6 // stride in floats: position (3) + uv (2) + ...
);
geometry.setAttribute('position', new THREE.InterleavedBufferAttribute(interleaved, 3, 0));
geometry.setAttribute('uv', new THREE.InterleavedBufferAttribute(interleaved, 2, 3));
```

Interleaving can improve cache locality for vertex fetching. It complicates partial updates. Use when profiling shows a benefit.

## 3. Winding, normals, and shading

### 3.1 Winding order

By default, front faces are **counter-clockwise** when viewed from the front. `material.side` controls what is rendered:

| Side | Meaning |
|---|---|
| `THREE.FrontSide` | Default; only front faces |
| `THREE.BackSide` | Only back faces (interior, skyboxes) |
| `THREE.DoubleSide` | Both; costs performance and can cause lighting/transparency issues |

If a model appears inside-out, either the winding or the normals are wrong. Do not fix it with `DoubleSide` unless necessary.

### 3.2 Normals

- Normals must be unit length and point outward.
- `computeVertexNormals()` averages face normals per shared vertex, producing smooth shading.
- Flat shading: `material.flatShading = true` uses face normals without changing geometry (or use non-indexed geometry with per-face vertices).
- Hard edges: split vertices (duplicate positions) so normals are not shared, or use `toNonIndexed()`.

```js
geometry.computeVertexNormals();
geometry.computeBoundingBox();
geometry.computeBoundingSphere();
```

If you modify positions after computing normals, recompute normals and bounding volumes.

### 3.3 Tangents

Normal mapping with anisotropic filtering needs tangents:

```js
geometry.computeTangents(); // requires uv + normal, and indexed geometry
```

If your normal maps look wrong on a model, check UVs and tangents before blaming the texture.

## 4. Built-in geometries

| Geometry | Key parameters | Typical segments |
|---|---|---|
| `BoxGeometry(w,h,d, ws,hs,ds)` | Size, segment counts | 1×1×1 unless deformation |
| `PlaneGeometry(w,h, ws,hs)` | Size, segments | 1×1 or more for displacement |
| `SphereGeometry(r, ws, hs)` | Radius, width/height segments | 32×16 mobile, 64×32 desktop |
| `CylinderGeometry(rt, rb, h, rs, hs, openEnded)` | Radii, height | 16–64 radial |
| `ConeGeometry(r, h, rs, hs, openEnded)` | Radius, height | 16–64 |
| `CircleGeometry(r, segments)` | Radius | 32–64 |
| `RingGeometry(inner, outer, thetaSegments)` | Radii | 32–64 |
| `TorusGeometry(r, tube, rs, ts, arc)` | Radii, arc | 16×48 |
| `TorusKnotGeometry(r, tube, ts, rs, p, q)` | Knot parameters | 64×8–16 |
| `CapsuleGeometry(radius, height, capSegments, radialSegments)` | `height` is the cylinder section (renamed from `length` in r176) | 8–16 |
| `IcosahedronGeometry(r, detail)` | Detail 0–5 | Detail 2–4 |
| `DodecahedronGeometry(r, detail)` | Detail | 0–2 |
| `OctahedronGeometry(r, detail)` | Detail | 0–2 |
| `TetrahedronGeometry(r, detail)` | Detail | 0–2 |
| `LatheGeometry(points, segments, phiStart, phiLength)` | Profile curve | 32–64 |
| `ExtrudeGeometry(shape, options)` | Extrusion depth, bevel | Depends on shape |
| `ShapeGeometry(shape, curveSegments)` | Flat shape | 12–64 curves |
| `TubeGeometry(path, tubularSegments, radius, radialSegments, closed)` | Curve | 64×8–16 |
| `EdgesGeometry(geometry, thresholdAngle)` | Edge extraction | For outlines |
| `WireframeGeometry(geometry)` | Wireframe lines | Debug only |
| `TextGeometry(text, { font, size, depth, curveSegments, bevelEnabled })` | Font JSON | Depends on text |

`TextGeometry` and `FontLoader` live in addons:

```js
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
```

### Segment counts are a performance decision

The default segments are often higher than necessary. A sphere at 20 px on screen does not need 64×32. Count triangles:

```
SphereGeometry(r, w, h): triangles ≈ 2 * w * h
BoxGeometry: 12 triangles (1 segment per face)
TorusGeometry(r, tube, rs, ts): triangles ≈ 2 * rs * ts
```

## 5. Procedural geometry

### 5.1 Custom triangle

```js
function triangleGeometry() {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0, 0,
    1, 0, 0,
    0, 1, 0,
  ], 3));
  g.setIndex([0, 1, 2]);
  g.computeVertexNormals();
  return g;
}
```

### 5.2 Procedural grid with UVs and colors

```js
function gridGeometry(width, depth, segments) {
  const positions = [];
  const uvs = [];
  const indices = [];
  const halfW = width / 2;
  const halfD = depth / 2;

  for (let z = 0; z <= segments; z++) {
    for (let x = 0; x <= segments; x++) {
      const u = x / segments;
      const v = z / segments;
      positions.push(-halfW + u * width, 0, -halfD + v * depth);
      uvs.push(u, v);
    }
  }

  for (let z = 0; z < segments; z++) {
    for (let x = 0; x < segments; x++) {
      const a = z * (segments + 1) + x;
      const b = a + 1;
      const c = a + segments + 1;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}
```

### 5.3 Parametric surfaces

```js
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';

const g = new ParametricGeometry((u, v, target) => {
  const x = (u - 0.5) * 4;
  const z = (v - 0.5) * 4;
  const y = Math.sin(x * 2) * Math.cos(z * 2) * 0.5;
  target.set(x, y, z);
}, 128, 128);
```

### 5.4 Extrusion and shapes

```js
const shape = new THREE.Shape();
shape.moveTo(0, 0);
shape.lineTo(1, 0);
shape.bezierCurveTo(1.2, 0.5, 0.8, 1, 0.5, 1);
shape.lineTo(0, 0);

const extrude = new THREE.ExtrudeGeometry(shape, {
  depth: 0.3,
  bevelEnabled: true,
  bevelThickness: 0.02,
  bevelSize: 0.02,
  bevelSegments: 3,
  curveSegments: 24,
});
```

### 5.5 Rounded boxes and text

```js
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
const box = new RoundedBoxGeometry(1, 1, 1, 4, 0.1); // width, height, depth, segments, radius
```

Text: prefer `troika-three-text` (SDF text, good performance, crisp at any size) over `TextGeometry` for UI and dynamic text. Use `TextGeometry` for extruded 3D lettering.

## 6. Morph targets and skinning

### 6.1 Morph targets

A morph target is an alternate position (and optionally normal) set. The renderer blends between the base and the targets with weights.

```js
const base = new THREE.BufferGeometry();
const smile = new THREE.BufferGeometry();
// ... same vertex count and order

base.morphAttributes.position = [smile.getAttribute('position')];
base.morphTargetsRelative = true;

const mesh = new THREE.Mesh(base, material);
mesh.morphTargetInfluences = [0.5];
```

- All morph targets must have the same vertex count.
- `morphTargetsRelative = true` stores deltas; otherwise absolute positions.
- Many morph targets increase vertex shader cost and memory.
- GLTFLoader imports morph targets automatically.

### 6.2 Skinning

`SkinnedMesh` uses `skinIndex` and `skinWeight` attributes plus a `Skeleton` of `Bone` objects.

```js
const mesh = new THREE.SkinnedMesh(geometry, material);
mesh.add(rootBone);
mesh.bind(new THREE.Skeleton(bones));
```

- Up to 4 bones per vertex in the standard implementation.
- Bone matrices are uploaded as a texture; too many bones can exceed limits.
- `mesh.applyBoneTransform(index, vector)` transforms a vertex by its skinning (r151+).
- Use `SkeletonUtils.clone()` to clone skinned meshes correctly.

## 7. Combining geometry

### 7.1 Merging static geometry

```js
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

const merged = BufferGeometryUtils.mergeGeometries([g1, g2, g3], false);
```

- All geometries must have the same attributes and index presence.
- Merging reduces draw calls but prevents per-object culling and transforms.
- Use `mergeVertices()` to weld duplicates and reduce vertex count.
- `toTrianglesDrawMode()` converts strips/fans to triangles in place (r186: no clone).
- `computeMorphedAttributes`, `deepCloneAttribute`, and `mergeAttributes` are also available.

### 7.2 Instancing vs batching vs merging

| Technique | Best for | Draw calls | Per-object transform |
|---|---|---|---|
| `InstancedMesh` | Many copies of the same geometry/material | 1 | Yes (matrix per instance) |
| `BatchedMesh` | Many different geometries, one material | 1 | Yes (per geometry instance) |
| Merge | Static scenery, no individual movement | 1 | No (baked) |
| Separate meshes | Few objects, different materials, culling | N | Yes |

```js
const mesh = new THREE.InstancedMesh(geometry, material, count);
const matrix = new THREE.Matrix4();
for (let i = 0; i < count; i++) {
  matrix.compose(position, quaternion, scale);
  mesh.setMatrixAt(i, matrix);
  mesh.setColorAt(i, color); // optional per-instance color
}
mesh.instanceMatrix.needsUpdate = true;
mesh.instanceColor.needsUpdate = true;
mesh.computeBoundingSphere(); // required after transforms for culling/raycast
```

BatchedMesh (r165+):

```js
const batched = new THREE.BatchedMesh(maxGeometryCount, maxVertexCount, maxIndexCount, material);
const geometryId = batched.addGeometry(geometry);
const instanceId = batched.addInstance(geometryId);
batched.setMatrixAt(instanceId, matrix);
```

### 7.3 Simplification and CSG

- `SimplifyModifier` (addon) reduces triangles; async since r186 and based on meshoptimizer.
- Offline decimation with `gltf-transform simplify` or `meshoptimizer` is usually better.
- CSG: `three-bvh-csg` or `@react-three/csg` for boolean operations (union, subtract, intersect).
- `ConvexGeometry` builds a convex hull from points.
- `DecalGeometry` projects geometry onto a surface.

## 8. Lines and points

### 8.1 Lines

`LineBasicMaterial.linewidth` is ignored on most platforms (always 1 px). For thick lines:

```js
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

const geometry = new LineGeometry();
geometry.setPositions(flatArray); // [x,y,z, x,y,z, ...]
const material = new LineMaterial({ color: 0xffffff, linewidth: 3 });
material.resolution.set(width, height);
const line = new Line2(geometry, material);
line.computeLineDistances();
```

`Line2` supports thickness in pixels or world units (`worldUnits`). For dashed lines, use `LineDashedMaterial` with `computeLineDistances()`.

### 8.2 Points

```js
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
const material = new THREE.PointsMaterial({
  size: 0.05,
  sizeAttenuation: true,
  transparent: true,
  depthWrite: false,
  map: spriteTexture,
  alphaTest: 0.5,
});
const points = new THREE.Points(geometry, material);
```

For large point clouds, use a custom shader or `PointsNodeMaterial` to control size, color, and shape per point.

## 9. Memory and performance

### 9.1 Estimation

For a non-indexed geometry with `V` vertices:

```
position bytes = V * 3 * 4
normal bytes   = V * 3 * 4
uv bytes       = V * 2 * 4
color bytes    = V * 4 * 4 (if present)
index bytes    = I * 2 or I * 4
```

Indexed geometry saves memory and vertex shader work when vertices are shared.

### 9.2 Disposal

```js
geometry.dispose();
```

- Disposing removes GPU buffers. It does not remove the JS object.
- Shared geometry: dispose only when no mesh uses it.
- Check `renderer.info.memory.geometries`.

### 9.3 Best practices

- Share geometry across instances when possible.
- Remove unnecessary attributes (tangents, uv2, vertex colors) before upload.
- Quantize positions/normals/uvs and compress with Draco or meshopt for transmission.
- Generate LODs for distant objects.
- Avoid per-frame `computeVertexNormals()`.
- Do not rebuild geometry every frame; update attributes or use shaders.
- Keep vertex count under 65k when possible to use 16-bit indices.
- Use `drawRange` to render a subset without rebuilding.

## 10. Debugging geometry

```js
// Wireframe overlay
const wire = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ wireframe: true }));

// Normals
import { VertexNormalsHelper } from 'three/addons/helpers/VertexNormalsHelper.js';
scene.add(new VertexNormalsHelper(mesh, 0.1, 0xff0000));

// Bounding volumes
geometry.computeBoundingBox();
scene.add(new THREE.Box3Helper(geometry.boundingBox, 0xffff00));

// Verify attributes
console.log(geometry.attributes);
console.log(geometry.index?.count, geometry.attributes.position.count);
```

Common bugs:

| Symptom | Cause |
|---|---|
| Invisible geometry | Wrong winding, zero-area triangles, NaN positions, degenerate index |
| Black/white shading | Missing normals, zero normals, wrong normal matrix |
| Stretched texture | Missing/incorrect UVs, wrong `flipY`, texture repeat |
| Holes | Missing indices or incorrect draw range |
| Flicker | Duplicate coplanar faces, bad depth range |
| Raycast misses | Bounding sphere not updated after vertex edits |
