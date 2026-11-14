# 11 — Interaction, Picking, Controls, and Physics

## 1. Turning pointer events into 3D interaction

The browser gives you 2D pointer coordinates. To interact with 3D:

1. Get the canvas bounding rect.
2. Convert to normalized device coordinates (NDC): x, y in `[-1, 1]`.
3. Cast a ray from the camera through the NDC point.
4. Intersect against objects.
5. React to the hit (hover, click, drag).

```js
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function updatePointer(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

canvas.addEventListener('pointermove', (event) => {
  updatePointer(event);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(interactiveObjects, true);
  updateHover(hits[0] ?? null);
});
```

`raycaster.setFromCamera` handles both perspective and orthographic cameras.

## 2. Raycaster

```js
raycaster.setFromCamera(pointer, camera);
raycaster.near = 0;
raycaster.far = 100;
raycaster.layers.set(0);

const hits = raycaster.intersectObject(mesh, true);
const hits2 = raycaster.intersectObjects([meshA, meshB], true);
```

Each hit:

```js
{
  distance,   // from ray origin
  point,      // world-space Vector3
  face,       // Face (a, b, c, normal, materialIndex)
  faceIndex,  // index
  object,     // Mesh/Line/Points
  uv,         // UV at hit (if geometry has uv)
  uv1,        // second UV set if present
  normal,     // interpolated normal in object space
  instanceId, // for InstancedMesh/BatchedMesh
}
```

Notes:

- `recursive = true` checks children; it is the default for `intersectObjects` since r133.
- Raycasting uses geometry attributes; morph/skinning are approximated unless the object supports it.
- `Line`/`Points` raycasting uses thresholds; set `raycaster.params.Line.threshold` and `Points.threshold`.
- `InstancedMesh` supports raycasting and returns `instanceId`.
- `BatchedMesh` supports raycasting.
- Objects with `visible = false` are still raycast if passed explicitly; filter them.
- `layers` on the raycaster restrict hits.

### Performance

Raycasting a high-poly mesh every `pointermove` is expensive. Options:

1. **Throttle** pointer events to animation frames.
2. **Bounding volumes first**: `raycaster.intersectObjects` already uses bounding spheres/boxes, but complex scenes still cost.
3. **BVH**: `three-mesh-bvh` builds an acceleration structure; raycast cost drops from O(triangles) to O(log n).

```js
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';

THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

mesh.geometry.computeBoundsTree();
// later: mesh.geometry.disposeBoundsTree();
```

In R3F, `<Bvh>` from Drei wraps this.

### GPU picking

For hundreds of thousands of objects, render IDs to a render target and read the pixel under the pointer. More complex, but O(1) per pick. Use for dense point clouds or particles.

## 3. Interaction patterns

### 3.1 Hover

```js
let hovered = null;

function updateHover(hit) {
  const next = hit?.object ?? null;
  if (next === hovered) return;
  if (hovered) hovered.material.emissive.setHex(0x000000);
  hovered = next;
  if (hovered) hovered.material.emissive.setHex(0x222222);
  canvas.style.cursor = hovered ? 'pointer' : 'default';
}
```

Share highlight logic; do not clone materials per hover.

### 3.2 Click/selection

```js
canvas.addEventListener('pointerdown', (event) => {
  updatePointer(event);
  raycaster.setFromCamera(pointer, camera);
  const [hit] = raycaster.intersectObjects(interactive, true);
  if (hit) select(hit.object, hit);
});
```

- Use `pointerdown` or `click` consistently.
- Prevent selection when the pointer moved (drag threshold).
- Track pointer capture for drags.

### 3.3 Drag in a plane

```js
const dragPlane = new THREE.Plane();
const dragOffset = new THREE.Vector3();
const intersection = new THREE.Vector3();

function startDrag(object, hitPoint, camera) {
  const normal = camera.getWorldDirection(new THREE.Vector3()).negate();
  dragPlane.setFromNormalAndCoplanarPoint(normal, hitPoint);
  dragOffset.copy(object.position).sub(hitPoint);
}

function moveDrag(object) {
  raycaster.setFromCamera(pointer, camera);
  if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
    object.position.copy(intersection).add(dragOffset);
  }
}
```

For grid snapping: round the position to the grid size.

### 3.4 Drag and drop files

```js
canvas.addEventListener('dragover', (e) => e.preventDefault());
canvas.addEventListener('drop', async (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const gltf = await loader.loadAsync(url);
  scene.add(gltf.scene);
  URL.revokeObjectURL(url);
});
```

Validate file type and size; revoke object URLs.

### 3.5 Cursor and affordances

- `cursor: pointer` on hoverable objects.
- `cursor: grab`/`grabbing` for drag.
- Change cursor only on state change, not every pointermove.
- Provide hover state beyond color for accessibility (outline, scale, label).

## 4. Built-in controls

See `docs/06-cameras-projection.md` for the full list. Interaction-specific notes:

- `OrbitControls` consumes pointer/wheel events on its DOM element; do not attach conflicting listeners without planning.
- `DragControls` drags objects on a plane; it does not move the camera.
- `TransformControls` is a gizmo; in r169+ add `controls.getHelper()` to the scene, not the controls themselves.
- `PointerLockControls` locks the pointer; provide an escape (Esc) and a visible exit.
- `FirstPersonControls` has a new interaction model in r184; test mobile.
- Controls call `connect(element)` since r175; pass the canvas.

```js
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
// In the loop
controls.update();
```

## 5. Physics

Three.js has no built-in physics engine. Options:

| Engine | Language | Three.js integration | Notes |
|---|---|---|---|
| Rapier | Rust/WASM | `@react-three/rapier`, `@dimforge/rapier3d-compat` | Fast, deterministic, actively maintained |
| Jolt | C++/WASM | `JoltPhysics` addon (r186+) | High quality, heavier |
| cannon-es | JavaScript | `cannon-es` | Simple, slower for large scenes |
| Ammo.js | C++/WASM | `AmmoPhysics` addon | Bullet port, older |
| Havok | WASM | Third-party | Used in some engines |

Recommendation: **Rapier** for most projects.

### 5.1 Rapier (vanilla)

```bash
npm i @dimforge/rapier3d-compat
```

```js
import RAPIER from '@dimforge/rapier3d-compat';

await RAPIER.init();

const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
const eventQueue = new RAPIER.EventQueue(true);

// Ground
const groundBody = world.createRigidBody(
  RAPIER.RigidBodyDesc.fixed().setTranslation(0, 0, 0)
);
world.createCollider(
  RAPIER.ColliderDesc.cuboid(10, 0.1, 10),
  groundBody
);

// Dynamic box
const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
  .setTranslation(0, 5, 0)
  .setLinearDamping(0.1)
  .setAngularDamping(0.1);
const body = world.createRigidBody(bodyDesc);
const collider = world.createCollider(
  RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5).setRestitution(0.2).setFriction(0.8),
  body
);

// Mesh linked to body
const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
scene.add(mesh);

function stepPhysics(dt) {
  world.timestep = 1 / 60;
  world.step(eventQueue);

  const t = body.translation();
  const r = body.rotation();
  mesh.position.set(t.x, t.y, t.z);
  mesh.quaternion.set(r.x, r.y, r.z, r.w);
}
```

- Rapier expects a fixed timestep; accumulator pattern recommended.
- Coordinate system: Y-up, right-handed, same as Three.js.
- Colliders are separate from rigid bodies; attach one or more.
- Collider shapes: cuboid, ball, capsule, cylinder, cone, trimesh, convex hull, heightfield.
- Use `trimesh` for static level geometry; `convexHull` for dynamic meshes.

### 5.2 Character controller

```js
const controller = world.createCharacterController(0.01);
controller.enableAutostep(0.5, 0.2, true);
controller.enableSnapToGround(0.5);
controller.setApplyImpulsesToDynamicBodies(true);

const desiredMovement = { x: 0, y: -0.1, z: 0 };
controller.computeColliderMovement(collider, desiredMovement);
const corrected = controller.computedMovement();
```

Use a kinematic body for the player; apply gravity manually.

### 5.3 Collision events

```js
world.step(eventQueue);

eventQueue.drainCollisionEvents((handle1, handle2, started) => {
  if (started) {
    // collision began
  }
});

eventQueue.drainContactForceEvents((event) => {
  // force magnitude, used for impacts
});
```

Enable events per collider:

```js
collider.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
```

### 5.4 Joints

`RAPIER.JointData` supports fixed, revolute, prismatic, spherical, rope, and spring joints. Use for doors, chains, ragdolls, and vehicles.

### 5.5 R3F Rapier

```jsx
import { Canvas } from '@react-three/fiber';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';

<Canvas>
  <Physics gravity={[0, -9.81, 0]}>
    <RigidBody position={[0, 5, 0]} restitution={0.2}>
      <mesh>
        <boxGeometry />
        <meshStandardMaterial />
      </mesh>
    </RigidBody>
    <RigidBody type="fixed">
      <CuboidCollider args={[10, 0.1, 10]} />
    </RigidBody>
  </Physics>
</Canvas>
```

- `RigidBody` types: `dynamic`, `fixed`, `kinematicPosition`, `kinematicVelocity`.
- Use `<CuboidCollider>`, `<BallCollider>`, `<TrimeshCollider>`, etc.
- `useRapier()` gives access to the world.
- Debug: `<Debug>` from `@react-three/rapier`.

### 5.6 When not to use a physics engine

- Simple collisions (AABB/sphere) can be done in 20 lines.
- Ray-based ground checks and capsule sweeps are cheaper.
- A full physics engine for one draggable object is overkill.
- Use BVH + ray for picking; use physics only for dynamic response.

### 5.7 Physics performance

- Fixed timestep (1/60 or 1/50), max substeps.
- Reduce solver iterations on mobile.
- Use simple colliders (boxes/spheres) instead of trimeshes for dynamics.
- Sleep bodies (`body.sleep()`) when idle; Rapier sleeps automatically.
- Limit active bodies; disable distant ones.
- Avoid creating/destroying bodies per frame; pool them.
- Keep physics and rendering decoupled; interpolate visuals if needed.

## 6. XR input

```js
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

renderer.xr.enabled = true;
document.body.appendChild(VRButton.createButton(renderer));

const controller = renderer.xr.getController(0);
controller.addEventListener('selectstart', () => { /* trigger */ });
scene.add(controller);

const factory = new XRControllerModelFactory();
const grip = renderer.xr.getControllerGrip(0);
grip.add(factory.createControllerModel(grip));
scene.add(grip);
```

- Use `renderer.setAnimationLoop`; it provides the XR frame.
- Controllers are groups; attach rays or hands.
- Ray interactivity in XR uses the controller's world ray, not the mouse.
- Hand tracking requires explicit feature request since r162.
- Performance target: 72–120 fps, stable; avoid heavy post-processing.

## 7. Accessibility of interaction

- Provide keyboard equivalents for every pointer interaction.
- Do not rely on hover alone; focus states must be visible.
- Add DOM buttons/labels for 3D actions.
- Announce selection changes with ARIA live regions.
- Respect reduced motion and allow pausing.
- Ensure hit targets are large enough (at least 44×44 CSS px equivalent in screen space).
- See `docs/17-accessibility.md`.

## 8. Troubleshooting

| Problem | Cause |
|---|---|
| Raycast hits nothing | NDC wrong, canvas rect offset, camera layer, object layer, invisible parent, `recursive=false` |
| Wrong object selected | Transparent/occluder objects, layer mask, sorting, hit order |
| Hover flickers | Pointer over UI overlay, stale bounding rect, hit list order |
| Drag jumps | Offset not stored, plane normal wrong, pointer capture lost |
| Physics explodes | dt too large, collider overlap at spawn, extreme mass ratios, no fixed step |
| Physics runs slow | Trimesh colliders on dynamics, too many bodies, high substeps |
| Objects sink into floor | Collider offset, missing keep-alive, gravity direction |
| Controls conflict | Orbit + drag + scroll listeners fighting; use a mode/state machine |
| Touch not working | Missing `touch-action: none`, pointer events not bound, passive listeners |
| Mobile browser scrolls instead of dragging | CSS `touch-action`, `preventDefault` on the canvas |
