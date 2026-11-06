---
name: threejs-core
description: Core Three.js (r187) implementation guidance for scenes, cameras, meshes, geometry, materials, lights, loaders, animation, raycasting, color management, and disposal. Use when building, modifying, reviewing, or debugging any Three.js app, or when choosing between WebGLRenderer and WebGPURenderer.
---

# Three.js Core

Use this skill for any Three.js implementation work that is not specifically about shaders, R3F, assets, performance, or design.

## Read first

- `../../docs/01-scene-fundamentals.md` — scene, camera, loop, units, cleanup.
- `../../docs/00-version-map.md` — current versions and renamed APIs.
- `../../cheatsheets/api-cheatsheet.md` — API quick reference.
- `../../docs/04-materials-pbr-color.md` for materials/color.
- `../../docs/05-lights-shadows-environment.md` for lighting/shadows.
- `../../docs/20-debugging-antipatterns.md` when something is broken.

## Non-negotiables

- `three/addons/*` for addons; never `examples/js`.
- Units in meters, +Y up, camera looks down -Z.
- Color textures: `SRGBColorSpace`; data maps: `NoColorSpace`.
- `MeshStandardMaterial` needs lights or `scene.environment`.
- Metals need an environment map.
- `PCFShadowMap` (not `PCFSoftShadowMap`).
- `Timer` (not `Clock`).
- `dispose()` geometry, materials, textures, render targets.
- One animation loop, delta in seconds.

## Minimal correct setup

```js
import * as THREE from 'three';

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(width, height, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
camera.position.set(0, 1.5, 5);

const timer = new THREE.Timer();
renderer.setAnimationLoop((t) => {
  timer.update(t);
  const dt = timer.getDelta();
  update(dt);
  renderer.render(scene, camera);
});
```

## Decision guide

| Task | Use |
|---|---|
| Many identical objects | `InstancedMesh` |
| Many different objects, one material | `BatchedMesh` |
| Static scenery | Merge geometry |
| Thick lines | `Line2` |
| Dynamic text | troika-three-text |
| Glass | `MeshPhysicalMaterial` transmission |
| Stylized | `MeshToonMaterial` / matcap / custom shader |
| Picking | `Raycaster` + BVH for dense meshes |
| Physics | Rapier |
| React | R3F (see threejs-r3f) |

## Common pitfalls

- Black scene: no lights/environment; camera inside geometry; wrong near/far; zero-size canvas.
- Washed colors: missing sRGB on color textures.
- Black metal: no environment.
- Invisible object: layer mismatch, stale bounding sphere, `visible=false`, outside frustum.
- Leak: no dispose, listeners not removed.
- Jitter: large delta, competing updates, frame-count movement.
- Shadow acne: tune `shadow.normalBias`.
- Transparency sorting: use `alphaTest`/`alphaHash`/`renderOrder`.
- `onBeforeCompile` is WebGL-only; use TSL for WebGPU.

## Verification

1. Imports resolve to `three` / `three/addons`.
2. No removed APIs (check `docs/00-version-map.md`).
3. Resize updates camera aspect and renderer size.
4. Cleanup disposes resources and stops the loop.
5. Color spaces correct.
6. Works with no WebGL/WebGPU (fallback).
7. Frame time measured, not assumed.
