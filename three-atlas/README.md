# three-atlas — Three.js / Interactive Web 3D Knowledge Base

A deep, verified reference pack designed so that an AI agent (opencode, Claude, Cursor, Copilot) or a human can **design, build, optimize, and debug any interactive 3D experience for the web**.

> **Status:** verified on **2026-11-06**.
> **Reference versions:** `three@0.187.0` (r187) · `@react-three/fiber@9.8.2` (React 19) · `@react-three/drei@10.7.9` · `postprocessing@6.39.6` · `@react-three/rapier@2.2.0` · `three-mesh-bvh@0.9.18` · `three-stdlib@2.36.1` · Node 26.
> **Note:** three.js `dev` already contains r188 changes (`DenoiseInstead`, etc.). Anything marked "r187" is stable; anything marked "dev" may change.

---

## 1. What is inside

| Folder | Content |
|---|---|
| `docs/` | 23 technical documents: math, scene, geometry, PBR, lights, cameras, rendering, shaders/TSL, animation, assets, interaction, physics, post-processing, performance, architecture, R3F, design, accessibility, advanced topics, recipes, debugging, glossary, and sources. |
| `skills/` | 8 ready-to-load opencode skills (core, math, shaders/TSL, R3F, performance, assets, design, WebGPU). |
| `agents/` | 6 specialized agents (architect, shader artist, performance engineer, asset engineer, interaction/UX designer, reviewer). |
| `cheatsheets/` | Pocket references: core API, TSL, math, performance. |
| `snippets/` | Runnable templates (Vite vanilla, Vite + R3F) and copyable patterns (loaders, raycast, instancing, adaptive loop, shaders). |
| `checklists/` | Verification lists: performance, launch, accessibility. |
| `resources/` | Curated links, libraries, assets, learning material, and math references. |
| `AGENTS.md` | Navigation instructions for AI agents. |

---

## 2. Recommended reading paths

**Starting from zero:**
`docs/01-scene-fundamentals.md` → `docs/02-3d-math.md` → `docs/03-geometry-buffers.md` → `docs/04-materials-pbr-color.md` → `docs/05-lights-shadows-environment.md` → `docs/06-cameras-projection.md` → `docs/07-rendering-webgl-webgpu.md`.

**Building an Awwwards-style experience:**
`docs/16-interactive-design.md` → `docs/08-shaders-glsl-tsl.md` → `docs/12-post-processing.md` → `docs/13-performance.md` → `docs/15-react-three-fiber.md`.

**Going to production:**
`docs/10-assets-gltf-pipeline.md` → `docs/13-performance.md` → `docs/14-architecture.md` → `docs/17-accessibility.md` → `docs/20-debugging-antipatterns.md` → `checklists/`.

**When something is broken:**
`docs/20-debugging-antipatterns.md` → `docs/07-rendering-webgl-webgpu.md` → `docs/04-materials-pbr-color.md` (color) → `docs/05-lights-shadows-environment.md` (black/dark output).

---

## 3. The mental model in 30 seconds

```
Scene (Object3D graph)
  ├── camera (view matrix + projection)
  ├── lights (analytic + IBL environment)
  └── meshes
        ├── geometry (BufferGeometry: positions/normals/uv/index)
        ├── material (PBR or shader)
        └── textures (color in sRGB, data in linear)

Renderer (WebGL2 or WebGPU)
  → culling → sorting → shadow maps → draw calls → post-processing → tonemap + color space → canvas
```

Everything else (animation, physics, interaction, UI) is built **around** that loop, not inside the renderer.

---

## 4. Pack conventions

- **Units:** 1 unit = 1 meter. Always scale in meters; adjust camera/near/far accordingly.
- **Coordinate system:** right-handed, **+Y up**, camera looks toward **−Z**. glTF is +Y up; Blender is +Z up and the exporter rotates it.
- **Color:** working space is **linear-sRGB**. Color textures → `SRGBColorSpace`; data maps (normal, roughness, metalness, AO) → `NoColorSpace`. The renderer converts to sRGB on presentation.
- **Time:** use delta in seconds and `Timer` (r179+); `Clock` is deprecated since r183.
- **Code:** ESM + `three/addons/*` (never `examples/js`, removed). Vite or a modern bundler.
- **Versioning:** pin an exact `three` version in production; upgrade in ~10-release steps while reading the Migration Guide.

---

## 5. Connecting it to opencode

Add the pack as a reference and load the skills in `~/.config/opencode/opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "references": {
    "three-atlas": {
      "path": "/absolute/path/to/three-atlas",
      "description": "Three.js/WebGPU/R3F knowledge base: math, shaders, performance, assets, design, recipes"
    }
  },
  "skills": {
    "paths": ["/absolute/path/to/three-atlas/skills"]
  }
}
```

Replace `/absolute/path/to/three-atlas` with the path where you cloned the pack (the `three-atlas/` folder in this repository).

Restart opencode after saving. Skills load on demand; the agents in `agents/` can be copied to `~/.config/opencode/agent/` if you want to invoke them as subagents.

---

## 6. Golden rules

1. **Measure before optimizing.** `renderer.info`, Spector.js, and Chrome's profiler are the source of truth.
2. **Draw calls matter more than triangles.** 2M triangles in 20 draw calls is better than 50k in 2,000 draw calls.
3. **One badly configured texture ruins PBR.** Color → sRGB; data → linear.
4. **Transparency is the enemy.** Sort, use `alphaTest`, or `depthWrite:false` intentionally.
5. **Everything you create on the GPU must be destroyed.** Call `dispose()` on geometries, materials, textures, and render targets.
6. **60 fps is part of the design.** A beautiful 20 fps animation is a bug.
7. **Accessibility is not optional.** Provide a 2D fallback, keyboard navigation, `prefers-reduced-motion`, and alternative text.
8. **The scene is not the app state.** Separate simulation, UI state, and rendering.

---

## 7. Documentation index

| # | Document | Topic |
|---|---|---|
| 00 | `docs/00-version-map.md` | Ecosystem, versions, compatibility, upgrade path |
| 01 | `docs/01-scene-fundamentals.md` | Scene, camera, mesh, render loop, units |
| 02 | `docs/02-3d-math.md` | Vectors, matrices, quaternions, projection, rays, curves, easing, noise |
| 03 | `docs/03-geometry-buffers.md` | BufferGeometry, attributes, primitives, procedural, morphing, skinning |
| 04 | `docs/04-materials-pbr-color.md` | Materials, PBR, textures, color management, tone mapping, transparency |
| 05 | `docs/05-lights-shadows-environment.md` | Lights, physical units, shadows, IBL/PMREM, lightmaps |
| 06 | `docs/06-cameras-projection.md` | Perspective/orthographic, matrices, depth, controls, cinematic camera |
| 07 | `docs/07-rendering-webgl-webgpu.md` | WebGL2 vs WebGPU, renderer, queues, culling, layers, async |
| 08 | `docs/08-shaders-glsl-tsl.md` | GLSL, ShaderMaterial, onBeforeCompile, TSL/NodeMaterial, compute |
| 09 | `docs/09-animation.md` | Mixer, clips, morph, procedural, springs, scroll, IK |
| 10 | `docs/10-assets-gltf-pipeline.md` | glTF/GLB, Draco/KTX2/meshopt, Blender, gltf-transform, gltfjsx, budgets |
| 11 | `docs/11-interaction-physics.md` | Raycasting, picking, controls, drag, Rapier/Jolt physics, XR input |
| 12 | `docs/12-post-processing.md` | EffectComposer, passes, TSL RenderPipeline, bloom/DOF/SSAO/SSR/TAA |
| 13 | `docs/13-performance.md` | Budgets, profiling, instancing, batching, LOD, mobile, startup |
| 14 | `docs/14-architecture.md` | Layers, state, lifecycle, ECS, SSR, testing, asset security |
| 15 | `docs/15-react-three-fiber.md` | R3F v9/v10, hooks, Drei, ecosystem, performance patterns |
| 16 | `docs/16-interactive-design.md` | Art direction, composition, motion, storytelling, UI overlay, responsive |
| 17 | `docs/17-accessibility.md` | WCAG 2.2, keyboard, screen readers, reduced motion, fallbacks |
| 18 | `docs/18-advanced-gpgpu-xr-splats.md` | GPGPU, particles, volumetric, path tracing, WebXR, Gaussian splats |
| 19 | `docs/19-code-recipes.md` | 30+ copy-paste recipes |
| 20 | `docs/20-debugging-antipatterns.md` | Black screen, shadows, leaks, WebGPU errors, debugging checklist |
| 21 | `docs/21-glossary.md` | 3D/GPU terminology |
| 22 | `docs/22-sources.md` | Verified official sources |

---

## 8. Templates and snippets

Both starter templates were installed and production-built on 2026-11-06 with Vite 8.3.6 and the versions listed above.

```bash
# Vanilla Three.js + Vite
cd snippets/vanilla-vite
npm install
npm run dev

# React Three Fiber + Drei + Vite
cd snippets/r3f-vite
npm install
npm run dev
```

Reference modules:

- `snippets/patterns/load-gltf.js` — Draco/KTX2/meshopt loader and disposal.
- `snippets/patterns/raycast-interaction.js` — throttled hover/click picking.
- `snippets/patterns/adaptive-loop.js` — delta, visibility pause, adaptive DPR.
- `snippets/shaders/tsl-dissolve.js` — TSL dissolve material.
- `snippets/shaders/tsl-compute-particles.js` — WebGPU compute particles.
- `snippets/shaders/glsl-fresnel.js` — GLSL fresnel material.

---

## 9. Maintenance

- Check versions with: `npm view three version`, `npm view @react-three/fiber version`, `npm view @react-three/drei version`.
- Check breaking changes: `https://github.com/mrdoob/three.js/wiki/Migration-Guide`.
- Update `docs/00-version-map.md` and this README header on every upgrade.
- Live links are kept in `docs/22-sources.md` and `resources/links.md`.
