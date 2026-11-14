# 14 — Application Architecture

## 1. Principles

A 3D web app is still an application. Treat it like one:

1. **Separate rendering from simulation and UI.** The scene is a projection of state, not the state itself.
2. **One owner per resource.** A module creates, owns, and disposes its geometries/materials/textures.
3. **Explicit lifecycle.** Create, load, start, pause, resume, destroy. No hidden globals.
4. **Deterministic time.** One clock, delta in seconds, fixed step for physics.
5. **Feature modules, not god files.** Each experience (hero, product configurator, gallery) is a module.
6. **Progressive enhancement.** Fallback for no WebGL/WebGPU, reduced motion, low-end devices.
7. **Measure in production.** Performance telemetry and error reporting.
8. **Assets are code dependencies.** Version, validate, optimize, and cache them.

## 2. Vanilla project structure

```
src/
  main.js                 // bootstrap, mounts the app
  core/
    renderer.js           // create/configure renderer, resize, dispose
    loop.js               // single animation loop, delta, visibility
    assets.js             // loading manager, cache, progress
    resources.js          // registry + dispose helpers
    quality.js            // device tier, DPR, feature flags
    events.js             // typed event bus
  scene/
    world.js              // scene, camera, lights, environment
    hero.js               // one experience module
    configurator.js
    materials.js
    geometries.js
  ui/
    overlay.js            // DOM UI, buttons, labels
    hud.js
  shaders/
    wave.js
    dissolve.js
  state/
    store.js
  workers/
    geometry.worker.js
  styles/
    main.css
```

Rules:

- `core/loop.js` is the only place that calls `renderer.render` (or `composer.render`).
- Modules expose `init()`, `update(dt, elapsed)`, `resize(w, h, dpr)`, `dispose()`.
- `core/resources.js` tracks disposable objects per module.
- `ui/` owns DOM; scene modules never touch DOM directly (except canvas).

### Module interface

```js
export function createHero({ scene, camera, renderer, resources, events }) {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0x88aaff });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  resources.track(geometry, material);

  return {
    update(dt, elapsed) {
      mesh.rotation.y += dt * 0.5;
    },
    resize(width, height, dpr) {},
    dispose() {
      scene.remove(mesh);
      resources.disposeModule(mesh);
    },
  };
}
```

### Resource registry

```js
export function createResources() {
  const sets = new Map();

  function track(key, ...disposables) {
    if (!sets.has(key)) sets.set(key, new Set());
    for (const item of disposables.flat()) sets.get(key).add(item);
  }

  function disposeModule(key) {
    const set = sets.get(key);
    if (!set) return;
    for (const item of set) item.dispose?.();
    sets.delete(key);
  }

  function disposeAll() {
    for (const key of sets.keys()) disposeModule(key);
  }

  return { track, disposeModule, disposeAll };
}
```

## 3. React Three Fiber structure

```
src/
  App.jsx
  experience/
    Experience.jsx        // <Canvas> contents
    Hero.jsx
    Configurator.jsx
    Lights.jsx
    Environment.jsx
  components/
    Button3D.jsx
    Product.jsx
  hooks/
    useCameraRig.js
    useReducedMotion.js
  store/
    useStore.js           // zustand
  ui/
    Overlay.jsx
    Hud.jsx
  assets/
```

- `<Canvas>` is the boundary between DOM and 3D.
- Each experience is a component tree.
- State via `zustand`/`valtio`/`jotai`; avoid prop drilling and per-frame React updates.
- Drei handles controls, loaders, environment, HTML, performance helpers.
- `useFrame` is the per-frame hook; mutate refs, do not set state.

## 4. Lifecycle

```
bootstrap
  -> detect capabilities (WebGL2/WebGPU, device tier)
  -> create renderer + scene + camera
  -> load critical assets (with progress)
  -> compile shaders
  -> start loop
  -> user interacts
  -> pause (visibility, route change)
  -> resume
  -> destroy (dispose all, remove listeners, cancel loop)
```

- Show a loading UI immediately.
- Do not start the loop until the first meaningful frame is ready.
- Pause on `visibilitychange` and route changes.
- Destroy on unmount; verify `renderer.info.memory` returns to baseline.

## 5. State management

### 5.1 What belongs in app state

- Selected object, configurator options, current section, quality level.
- Not per-frame transforms (those live in objects/refs).
- Not GPU resources (those live in modules).

### 5.2 Zustand (R3F-friendly)

```js
import { create } from 'zustand';

export const useStore = create((set) => ({
  color: '#88aaff',
  quality: 'high',
  setColor: (color) => set({ color }),
  setQuality: (quality) => set({ quality }),
}));
```

- Subscribe with selectors to avoid re-renders.
- Read state inside `useFrame` via `useStore.getState()` when needed.
- Do not store `Object3D` instances in global state unless intentional.

### 5.3 Event bus

For decoupled modules:

```js
export function createEmitter() {
  const listeners = new Map();
  return {
    on(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
      return () => listeners.get(type)?.delete(fn);
    },
    emit(type, payload) {
      listeners.get(type)?.forEach((fn) => fn(payload));
    },
  };
}
```

- Use typed events (`select`, `hover`, `config:change`, `quality:change`).
- Always return an unsubscribe function.
- Do not emit per frame; use direct refs for hot paths.

### 5.4 Commands

For undo/redo and complex interactions, model actions as commands:

```js
const command = {
  do: () => { /* apply */ },
  undo: () => { /* revert */ },
};
```

Useful for configurators, editors, and 3D authoring tools.

## 6. ECS for many entities

Entity-Component-System separates data from behavior and scales to thousands of objects.

| Library | Notes |
|---|---|
| `miniplex` | Minimal, React-friendly |
| `becsy` | Fast, archetype-based |
| `bitecs` | Very fast, typed arrays |
| Custom | Flat arrays for position/velocity |

When to use ECS:

- Particles, crowds, bullets, foliage, simulation-heavy scenes.
- Many objects with shared systems (movement, health, LOD).
- You need data-oriented performance.

When not to use ECS:

- A handful of hand-authored hero objects.
- Simple product viewer.
- The scene is mostly static and UI-driven.

Hybrid pattern: ECS for simulation; normal `Object3D` graph for authored content, syncing transforms each frame.

## 7. Time and determinism

- One loop, one clock.
- Fixed timestep for physics and gameplay.
- Interpolate visuals if the render rate differs.
- Clamp large deltas.
- Pause when hidden.
- Make simulations reproducible for testing (seed random, fixed step).

## 8. Multi-view and canvas composition

| Pattern | Use |
|---|---|
| One canvas, one scene | Default |
| One canvas, scissor views | Split-screen, before/after |
| One canvas, Drei `View` | Multiple independent sections |
| Multiple canvases | Separate widgets; costly (one context each) |
| CSS overlay | UI, labels, captions |
| CSS3D | DOM content in 3D space |
| Render-to-texture portal | Mirrors, portals, thumbnails |

Prefer one renderer/context. Each WebGL context has memory and GPU overhead; browsers limit the number of active contexts.

## 9. SSR, SSG, and static export

- WebGL/WebGPU cannot run on the server.
- Import 3D code dynamically on the client (`next/dynamic` with `ssr: false`, or a client-only boundary).
- Render a poster/fallback on the server.
- Ensure `window`, `document`, `navigator.gpu` are not touched during SSR.
- Static export works if assets are served correctly and paths are relative.
- Hydration mismatches: do not render canvas-dependent markup on the server.

```jsx
const Scene = dynamic(() => import('./Scene'), {
  ssr: false,
  loading: () => <Poster />,
});
```

## 10. Error handling and fallbacks

- Detect WebGL2/WebGPU support; show a message or 2D fallback.
- Catch asset load errors; show retry and fallback content.
- Catch shader compile errors in development (`renderer.debug.checkShaderErrors`).
- Handle context loss and restoration.
- Handle `prefers-reduced-motion`.
- Provide a static image/video alternative for SEO and slow devices.
- Add a global error boundary in React.
- Do not let a failed decoration break the whole page.

## 11. Testing

| Layer | Tool |
|---|---|
| Math/utils | Vitest/Jest, property tests |
| Scene logic | `@react-three/test-renderer` |
| Component behavior | React Testing Library (DOM) |
| Visual regression | Playwright screenshots |
| Performance | Lighthouse, custom frame-time harness |
| E2E | Playwright with WebGL (headless Chromium) |

- Test pure math separately from rendering.
- Snapshot geometry attributes, not pixels, for deterministic tests.
- Visual tests need a fixed camera, fixed time, and deterministic assets.
- Mock WebGL in unit tests; do not assert GPU behavior.

## 12. Security

- Treat glTF/textures as untrusted: limit size, validate extensions, avoid arbitrary URLs.
- Configure CSP: allow `blob:`/`data:` only if needed; WebGPU requires secure contexts.
- CORS for textures and models; use same-origin or trusted CDNs.
- Do not embed secrets in client code.
- Sanitize any user-provided text rendered into textures/HTML overlays.
- Be careful with `postMessage` to iframes hosting the canvas.
- Keep dependencies patched; three.js and loaders parse complex binary input.

## 13. Performance telemetry

- Sample FPS/frame time and send aggregates (respect privacy).
- Track device tier, DPR, quality level, draw calls, texture memory.
- Track load times and asset failures.
- Use feature flags to disable expensive features remotely.
- Do not log per frame; batch and sample.

## 14. Quality tiers and feature flags

```js
const tier = detectTier(); // 'low' | 'mid' | 'high'

const settings = {
  low: { dpr: 1, shadows: false, post: false, env: false },
  mid: { dpr: 1.5, shadows: true, post: 'bloom', env: true },
  high: { dpr: 2, shadows: true, post: 'full', env: true },
}[tier];
```

- Detect via `navigator.hardwareConcurrency`, `deviceMemory` (where available), GPU renderer string (not reliable), and runtime FPS.
- Start conservative, upgrade if performance is good.
- Let users override quality.

## 15. Internationalization and theming

- Keep 3D text minimal; use DOM for localized copy.
- If text must be in 3D (troika/SDF), load fonts per locale and handle metrics.
- Design tokens (color, spacing, motion) shared between DOM and 3D.
- Support light/dark themes by changing environment, tone mapping, and UI colors.
- Avoid baking text into textures unless you can regenerate per locale.

## 16. Anti-patterns

| Anti-pattern | Problem |
|---|---|
| Global scene singleton | Hard to test, leaks between routes |
| Render loop per module | Multiple loops, timing desync |
| UI state in `Object3D.userData` | Hard to reason about, not reactive |
| One giant `Scene.js` | Unmaintainable |
| Creating materials in render loop | Shader churn |
| Assets loaded ad hoc | No progress, no cache, leaks |
| DOM and 3D tightly coupled | Breaks SSR and accessibility |
| No fallback | Blank page on unsupported devices |
| No cleanup | Memory leaks, context loss |
