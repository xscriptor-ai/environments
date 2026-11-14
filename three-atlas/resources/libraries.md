# Libraries

Pin versions in production. Verify compatibility with your `three` version.

## Core

| Library | Purpose | Notes |
|---|---|---|
| `three` | Engine | Pin exact version; upgrade in steps of 10 |
| `@types/three` | TypeScript types | Match `three` version |
| `three-stdlib` | Bundled addons | Used by Drei; alternative to `three/addons` |

## React

| Library | Purpose | Notes |
|---|---|---|
| `@react-three/fiber` | React renderer for Three.js | v9 = React 19; v10 alpha = WebGPU |
| `@react-three/drei` | Helpers, controls, loaders, staging | v10 for R3F v9 |
| `@react-three/postprocessing` | Post effects | Wraps `postprocessing` |
| `@react-three/rapier` | Physics | Rapier WASM |
| `@react-three/xr` | VR/AR | WebXR controllers/hands |
| `@react-three/a11y` | Accessibility | Focusable 3D objects, announcer |
| `@react-three/csg` | Boolean geometry | CSG operations |
| `@react-three/flex` | Flexbox layout in 3D | UI-like 3D layouts |
| `@react-three/test-renderer` | Unit tests | Scene structure assertions |
| `@react-three/gltfjsx` | glTF to JSX | Codegen + optimization |

## Post-processing and effects

| Library | Purpose | Notes |
|---|---|---|
| `postprocessing` | WebGL composer and effects | High quality, single-pass effects |
| `three-gpu-pathtracer` | Progressive path tracing | Offline-like previews |
| `lamina` | Layer-based shader materials | R3F-friendly |
| `troika-three-text` | SDF text | Crisp dynamic 3D text |

## Physics and geometry

| Library | Purpose | Notes |
|---|---|---|
| `@dimforge/rapier3d-compat` | Physics (vanilla) | Recommended |
| `@react-three/rapier` | Physics (R3F) | Same engine |
| `cannon-es` | Physics | Simpler, slower |
| `three-mesh-bvh` | BVH for raycast/collision | Essential for dense meshes |
| `three-bvh-csg` | CSG with BVH | Boolean operations |
| `three-mesh-ui` | 3D UI layout | Menus in VR/3D |

## State and animation

| Library | Purpose | Notes |
|---|---|---|
| `zustand` | State | Simple, R3F-friendly |
| `valtio` | Proxy state | Good for mutable graphs |
| `jotai` | Atomic state | Fine-grained updates |
| `miniplex` | ECS | Minimal, React-friendly |
| `becsy` | ECS | Fast, archetype-based |
| `maath` | Math helpers | Random, easing, geometry |
| `@tweenjs/tween.js` | Tweens | Included as addon |
| `gsap` | Timelines/scroll | Industry standard |
| `react-spring` | Spring animation | R3F support |
| `framer-motion-3d` | Declarative motion | R3F support |

## Tools and debugging

| Library | Purpose | Notes |
|---|---|---|
| `lil-gui` | Debug GUI | Replaced dat.gui |
| `leva` | Debug GUI for React | R3F-friendly |
| `stats-gl` | GPU/CPU stats | Replaces removed GPUStatsPanel |
| `stats.js` | FPS meter | Simple |
| `@gltf-transform/cli` | Asset optimization | Inspect, compress, simplify |
| `gltfpack` | Meshopt compression | Fast decode |
| `spectre` | WebGL frame capture | Browser extension |

## Selection guidance

- Do not add a library for something `three/addons` already provides.
- Prefer one state library, not three.
- Use Rapier unless you need a specific engine feature.
- Use BVH when raycasting or collision is a bottleneck.
- Use `postprocessing` for WebGL effects unless the official composer is enough.
- Keep the dependency surface small; every library adds bundle and upgrade cost.
