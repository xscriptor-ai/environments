# 15 — React Three Fiber (R3F)

## 1. What R3F is

`@react-three/fiber` is a React renderer for Three.js. It maps JSX elements to Three.js objects:

```jsx
<mesh position={[0, 1, 0]}>
  <boxGeometry args={[1, 1, 1]} />
  <meshStandardMaterial color="hotpink" />
</mesh>
```

is equivalent to:

```js
const mesh = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 'hotpink' })
);
mesh.position.set(0, 1, 0);
```

There is no wrapper overhead: components render outside React, and the scene updates declaratively.

## 2. Versions and compatibility

| R3F | React | Notes |
|---|---|---|
| v9 (9.8.2) | React 19 | Current stable |
| v8 | React 18 | Legacy |
| v10 (alpha) | React 19 | WebGPU support, new frame-loop scheduler |

```bash
npm i three @react-three/fiber @react-three/drei
npm i -D @types/three
```

Pin `three` to a compatible version; R3F v9 tracks current Three.js.

## 3. Canvas

```jsx
import { Canvas } from '@react-three/fiber';

export default function App() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 2, 6], fov: 45, near: 0.1, far: 100 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={2} castShadow />
      <mesh castShadow receiveShadow>
        <boxGeometry />
        <meshStandardMaterial color="orange" />
      </mesh>
    </Canvas>
  );
}
```

| Prop | Meaning |
|---|---|
| `shadows` | Enables shadow maps; accepts `true` or a shadow map type |
| `dpr` | Pixel ratio or `[min, max]` |
| `camera` | Camera props or a custom camera |
| `gl` | Renderer props/factory |
| `frameloop` | `'always'`, `'demand'`, `'never'` |
| `flat` | Disables tone mapping |
| `linear` | Disables color management (rarely desired) |
| `events` | Custom event manager |
| `onCreated` | Access to state after creation |
| `onPointerMissed` | Click on empty space |
| `resize` | Resize options |

### Render loop modes

- `always`: renders every frame (animation, physics, video).
- `demand`: renders only when invalidated (static scenes, controls). Call `invalidate()` after changes.
- `never`: manual rendering.

```jsx
<Canvas frameloop="demand">
```

## 4. Hooks

### `useFrame`

```jsx
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';

function Spinner() {
  const ref = useRef();
  useFrame((state, delta) => {
    ref.current.rotation.y += delta;
  });
  return <mesh ref={ref}><boxGeometry /><meshStandardMaterial /></mesh>;
}
```

- Runs after React commits, before render.
- Mutate refs; do not call `setState` every frame.
- `state` includes `clock`, `camera`, `scene`, `gl`, `size`, `viewport`, `pointer`, `invalidate`.
- Priority parameter controls order (lower runs first); useful for physics before rendering.

### `useThree`

```jsx
const camera = useThree((state) => state.camera);
const gl = useThree((state) => state.gl);
const size = useThree((state) => state.size);
const invalidate = useThree((state) => state.invalidate);
const controls = useThree((state) => state.controls);
```

Select narrowly to avoid re-renders.

### `useLoader`

```jsx
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const gltf = useLoader(GLTFLoader, '/model.glb');
```

- Suspense-based; wrap in `<Suspense fallback={...}>`.
- Caches by URL and loader.
- For Draco/KTX2, configure a loader instance or use Drei's `useGLTF`.

### `useGraph`

Returns named nodes from a loaded scene:

```jsx
const { nodes, materials } = useGraph(gltf.scene);
```

### `useAnimations`

```jsx
import { useAnimations } from '@react-three/drei';

const { actions } = useAnimations(gltf.animations, gltf.scene);
useEffect(() => { actions.Idle?.play(); }, [actions]);
```

### `extend`

Register custom Three.js classes as JSX elements:

```jsx
import { extend } from '@react-three/fiber';
import { MyCustomMaterial } from './MyCustomMaterial';

extend({ MyCustomMaterial });

<myCustomMaterial />;
```

In R3F v9, use the `extend` API and TypeScript module augmentation for types.

## 5. Events

R3F provides pointer events on meshes:

```jsx
<mesh
  onClick={(e) => { e.stopPropagation(); select(e.object); }}
  onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
  onPointerOut={() => setHover(false)}
  onPointerDown={...}
  onPointerUp={...}
  onDoubleClick={...}
  onWheel={...}
  onContextMenu={...}
/>
```

- Events are raycast-based; R3F manages pointer normalization.
- `e.stopPropagation()` prevents hits behind.
- `e.object`, `e.point`, `e.face`, `e.uv`, `e.distance`, `e.eventObject`.
- Use `raycast` prop to customize or disable raycasting per object.
- For performance, set `raycast={null}` on non-interactive objects or use layers.

## 6. Loading and Suspense

```jsx
<Suspense fallback={<Loader />}>
  <Model />
  <Environment preset="studio" />
</Suspense>
```

- Drei's `useGLTF`, `useTexture`, `useEnvironment` suspend.
- `useProgress` gives loading progress.
- `Preload all` warms assets.
- Wrap the Canvas in an error boundary for failed loads.

## 7. Drei

`@react-three/drei` is a collection of helpers. Most-used:

| Category | Components/hooks |
|---|---|
| Controls | `OrbitControls`, `MapControls`, `CameraControls`, `PresentationControls`, `ScrollControls`, `KeyboardControls` |
| Staging | `Environment`, `Stage`, `Center`, `Bounds`, `Float`, `ContactShadows`, `AccumulativeShadows`, `RandomizedLight`, `Sky`, `Stars`, `Sparkles`, `Cloud` |
| Loaders | `useGLTF`, `useTexture`, `useEnvironment`, `useKTX2`, `useFBX`, `useAnimations`, `Preload` |
| Shapes | `Box`, `Sphere`, `Plane`, `RoundedBox`, `Text`, `Text3D`, `Line`, `QuadraticBezierLine`, `CatmullRomLine` |
| Abstractions | `Html`, `Billboard`, `Image`, `Svg`, `Decal`, `Trail`, `MeshPortalMaterial`, `MeshTransmissionMaterial`, `MeshReflectorMaterial` |
| Performance | `Instances`, `InstancedAttribute`, `Merged`, `Detailed`, `Bvh`, `AdaptiveDpr`, `AdaptiveEvents`, `PerformanceMonitor`, `BakeShadows` |
| Gizmos | `GizmoHelper`, `TransformControls`, `DragControls`, `PivotControls`, `Grid`, `Helper` |
| Portals | `View`, `Hud`, `RenderTexture`, `Mask`, `Fisheye` |
| Misc | `Stats`, `StatsGl`, `useCursor`, `useAspect`, `useIntersect`, `CycleRaycast`, `Select` |

Drei uses `three-stdlib` rather than `three/examples/jsm`. This is intentional and generally compatible.

## 8. Ecosystem

| Package | Purpose |
|---|---|
| `@react-three/drei` | Helpers and abstractions |
| `@react-three/postprocessing` | Post-processing effects |
| `@react-three/rapier` | Physics |
| `@react-three/xr` | VR/AR |
| `@react-three/a11y` | Accessibility for 3D |
| `@react-three/csg` | Constructive solid geometry |
| `@react-three/flex` | Flexbox layout in 3D |
| `@react-three/test-renderer` | Unit tests |
| `@react-three/gltfjsx` | glTF to JSX |
| `zustand` / `valtio` / `jotai` | State |
| `leva` | GUI controls |
| `maath` | Math helpers |
| `miniplex` | ECS |
| `lamina` | Layer-based shader materials |
| `react-spring` / `framer-motion-3d` | Animation |

## 9. Performance patterns

### 9.1 Mutate refs, not state

```jsx
// Bad: re-renders every frame
const [x, setX] = useState(0);
useFrame((_, dt) => setX((v) => v + dt));

// Good: mutate the object
const ref = useRef();
useFrame((_, dt) => { ref.current.position.x += dt; });
```

### 9.2 Share geometries/materials

```jsx
const geometry = useMemo(() => new THREE.BoxGeometry(), []);
const material = useMemo(() => new THREE.MeshStandardMaterial({ color: 'red' }), []);

<mesh geometry={geometry} material={material} />
```

### 9.3 Instancing

```jsx
import { Instances, Instance } from '@react-three/drei';

<Instances limit={1000}>
  <boxGeometry />
  <meshStandardMaterial />
  {items.map((item) => <Instance key={item.id} position={item.position} />)}
</Instances>
```

Or use `InstancedMesh` directly with `useLayoutEffect` for matrices.

### 9.4 Avoid re-renders

- Select narrow slices of state.
- Keep frequently changing values in refs or Three.js objects.
- `frameloop="demand"` for static content; call `invalidate()`.
- Memoize expensive components.
- Do not create new arrays/objects in JSX props every render (or accept that R3F diffs cheaply).

### 9.5 On-demand rendering

```jsx
<Canvas frameloop="demand">
  <OrbitControls onChange={() => invalidate()} />
</Canvas>
```

`OrbitControls` from Drei invalidates automatically in demand mode.

### 9.6 Performance monitor

```jsx
import { PerformanceMonitor } from '@react-three/drei';

<PerformanceMonitor
  onDecline={() => setDpr(1)}
  onIncline={() => setDpr(2)}
>
  <Scene />
</PerformanceMonitor>
```

### 9.7 Adaptive DPR/events

`<AdaptiveDpr pixelated />`, `<AdaptiveEvents />`, `<Bvh>`, `<Detailed>` (LOD), `<BakeShadows>`.

## 10. R3F + physics

```jsx
import { Physics, RigidBody } from '@react-three/rapier';

<Physics gravity={[0, -9.81, 0]}>
  <RigidBody>
    <mesh><boxGeometry /><meshStandardMaterial /></mesh>
  </RigidBody>
  <RigidBody type="fixed">
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial />
    </mesh>
  </RigidBody>
</Physics>
```

- Physics steps in `useFrame` with a fixed timestep internally.
- Use `<Debug>` to visualize colliders.
- Keep collider shapes simple.

## 11. R3F + post-processing

```jsx
import { EffectComposer, Bloom, SMAA } from '@react-three/postprocessing';

<EffectComposer multisampling={0}>
  <Bloom intensity={1} luminanceThreshold={0.8} mipmapBlur />
  <SMAA />
</EffectComposer>
```

- Effects run inside the Canvas.
- Avoid `<EffectComposer>` and custom composer simultaneously.
- Tone mapping is handled by the renderer; avoid double tone mapping.

## 12. Common pitfalls

| Problem | Cause |
|---|---|
| Scene re-renders constantly | State updates per frame or oversized state subscriptions |
| Objects disappear | Suspense boundary unmounted, asset failed, camera/frustum |
| Events not firing | `raycast` disabled, layers, pointer events blocked by overlay |
| Canvas 0 height | Parent has no height; set explicit size |
| Memory leak | Manual resources not disposed; use `useEffect` cleanup |
| Shader recompiles | New materials per render; memoize |
| Doubled animations | Multiple `useFrame` updating the same property |
| SSG breaks | Accessing `window`/`document` during render |
| Drei import errors | Version mismatch between drei and fiber/three |
| WebGPU confusion | R3F v9 uses WebGLRenderer; WebGPU is R3F v10 alpha |

## 13. Migration v8 to v9

- React 19 required.
- `createRoot` from `react-dom/client`.
- Some deprecated APIs removed; check the R3F v9 migration guide.
- TypeScript types changed; update `@types/three` and R3F.
- Drei version must match (v10 for R3F v9).

## 14. Testing

```jsx
import { create } from '@react-three/test-renderer';

const renderer = await create(<mesh><boxGeometry /><meshStandardMaterial /></mesh>);
const mesh = renderer.scene.findByType('Mesh');
expect(mesh.props.position).toEqual([0, 0, 0]);
```

- Test scene structure and props, not pixels.
- Use Playwright for visual/E2E tests.
- Mock loaders and network.

## 15. When to use R3F vs vanilla

Use R3F when:

- The app is already React.
- You want declarative composition and state integration.
- You need Drei's helpers and ecosystem.
- The team knows React.

Use vanilla when:

- The page has one isolated scene and no React.
- You need maximum control over the loop and memory.
- The bundle must be minimal.
- You are building a game-like engine layer.

Both can coexist: an R3F canvas inside a React app, or a vanilla viewer embedded in any framework.
