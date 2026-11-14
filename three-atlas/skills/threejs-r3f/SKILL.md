---
name: threejs-r3f
description: React Three Fiber (v9, React 19) implementation guidance including Canvas, useFrame, useThree, Suspense, Drei helpers, state, physics, post-processing, and performance patterns. Use when building or reviewing React-based Three.js apps, hooks, components, or R3F scene architecture.
---

# React Three Fiber

## Read first

- `../../docs/15-react-three-fiber.md` — full guide.
- `../../docs/14-architecture.md` — app structure.
- `../../docs/13-performance.md` — performance.

## Versions

- R3F v9 ↔ React 19 (current stable).
- R3F v8 ↔ React 18.
- R3F v10 is alpha (WebGPU, new scheduler).
- Drei v10 matches R3F v9.
- Pin `three` to a compatible version.

## Core

```jsx
<Canvas shadows dpr={[1, 2]} camera={{ position: [0, 2, 6], fov: 45 }}>
  <ambientLight intensity={0.5} />
  <directionalLight position={[5, 8, 4]} intensity={2} castShadow />
  <Suspense fallback={null}>
    <Model />
    <Environment preset="studio" />
  </Suspense>
  <OrbitControls enableDamping />
</Canvas>
```

- JSX maps directly to Three.js objects.
- `useFrame` runs per frame; mutate refs, never `setState`.
- `useThree` selects state; select narrowly.
- `useLoader`/`useGLTF` suspend.
- `frameloop="demand"` renders only when invalidated.
- Drei provides controls, loaders, staging, materials, performance.

## Performance rules

- No state updates per frame.
- Share geometries/materials with `useMemo` or module scope.
- Use `<Instances>`/`InstancedMesh` for repetition.
- Use `frameloop="demand"` + `invalidate()` for static scenes.
- Use `<Bvh>`, `<Detailed>`, `<AdaptiveDpr>`, `<PerformanceMonitor>`.
- Dispose manual resources in `useEffect` cleanup.
- Keep the Canvas sized by its parent; avoid 0 height.

## Ecosystem

- `@react-three/drei` — helpers.
- `@react-three/postprocessing` — effects.
- `@react-three/rapier` — physics.
- `@react-three/xr` — VR/AR.
- `@react-three/a11y` — accessibility.
- `zustand`/`valtio`/`jotai` — state.
- `leva` — debug GUI.
- `gltfjsx` — model codegen.

## Common pitfalls

- `window`/`document` during render breaks SSR; use client-only/dynamic import.
- Multiple `useFrame` updating the same property causes jitter.
- New materials per render cause shader churn.
- Event misses: overlay blocking, layers, `raycast` disabled.
- Memory leaks: manual textures/render targets not disposed.
- Mixing custom `EffectComposer` with `<EffectComposer>`.
- Using v8 patterns with v9 (React 19, `createRoot`).

## Verification

- No per-frame React renders.
- Suspense and error boundaries handle loading/failure.
- Canvas resizes with its container.
- DPR capped.
- Cleanup on unmount.
- Tested keyboard/reduced motion if interactive.
