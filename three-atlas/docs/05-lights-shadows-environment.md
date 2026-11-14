# 05 — Lights, Shadows, and Environment Lighting

## 1. Light types

| Light | Shape | Shadows | Cost | Typical use |
|---|---|---|---|---|
| `AmbientLight` | Constant everywhere | No | Lowest | Fill, flat base |
| `HemisphereLight` | Sky/ground gradient | No | Low | Outdoor ambient fill |
| `DirectionalLight` | Parallel rays | Yes | Medium | Sun, key light |
| `PointLight` | Omnidirectional point | Yes (cube) | High | Lamps, bulbs, practicals |
| `SpotLight` | Cone | Yes | High | Stage lights, flashlights |
| `RectAreaLight` | Rectangular area | No (built-in) | Medium | Softboxes, panels |
| `LightProbe` | Spherical harmonics | No | Low | Baked ambient/IBL |
| `IESSpotLight` | IES photometric profile | Yes | High | Architectural lighting |
| `ProjectorLight` | Projected texture | Yes | High | Gobos, projections |
| `SunLight` | Directional with cascades | Yes (CSM) | Medium–high | Outdoor sun with large range |

There is **no default light**. A scene with `MeshStandardMaterial` and no lights/environment renders black.

## 2. Physical units and intensity

Since r155, `WebGLRenderer.useLegacyLights` is `false`; lighting is physically based.

- `PointLight` and `SpotLight` intensity is luminous intensity in **candela (cd)**.
- `DirectionalLight`, `AmbientLight`, and `HemisphereLight` intensity is expressed in **lux-like** units (radiometric/luminance-style scaling).
- `PointLight`/`SpotLight` have `decay = 2` by default (inverse-square falloff).
- `power` (lumens) is an alternative to `intensity` for point/spot: `power = intensity * 4π` for point lights.
- `distance` sets a cutoff distance; `0` means infinite. A finite distance still uses inverse-square up to the cutoff.

Practical starting points (will vary with tone mapping and environment):

| Setup | Directional | Ambient/Hemisphere | Point/Spot |
|---|---|---|---|
| Outdoor sun | 2–5 | 0.3–1.0 hemisphere | — |
| Interior day | 1–3 | 0.2–0.5 | 5–20 cd |
| Product studio | 2–4 key | 0.3 fill | 10–50 cd |
| Night neon | 0.05–0.2 | 0.02 | 20–100 cd + emissive |

Use `renderer.toneMappingExposure` to balance the final image, not to replace light.

## 3. Directional light

```js
const sun = new THREE.DirectionalLight(0xfff2e0, 3);
sun.position.set(5, 10, 7);
sun.target.position.set(0, 0, 0);
scene.add(sun);
scene.add(sun.target);

sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 50;
sun.shadow.camera.left = -10;
sun.shadow.camera.right = 10;
sun.shadow.camera.top = 10;
sun.shadow.camera.bottom = -10;
sun.shadow.bias = -0.0005;
sun.shadow.normalBias = 0.02;
```

Key points:

- Direction is from `position` to `target.position`; the light itself is at infinity.
- Shadow camera bounds must tightly fit the shadow-casting area. A huge frustum wastes resolution.
- Move the light and target with the camera/player for large worlds, or use cascaded shadow maps.

### Cascaded shadow maps

For large outdoor scenes, the addon `CSM` or `SunLight` (r186+) splits the view frustum into cascades with different resolutions.

```js
import { CSM } from 'three/addons/csm/CSM.js';
const csm = new CSM({ maxFar: 200, cascades: 4, mode: 'practical', parent: scene, shadowMapSize: 2048 });
csm.fade = true;
```

`SunLight` is a newer core/addon light with built-in cascades; check the r186+ examples for the current API.

## 4. Point light

```js
const bulb = new THREE.PointLight(0xffd9a0, 30, 0, 2);
bulb.position.set(0, 3, 0);
bulb.castShadow = true;
bulb.shadow.mapSize.set(1024, 1024);
bulb.shadow.camera.near = 0.1;
bulb.shadow.camera.far = 20;
scene.add(bulb);
```

- Point light shadows render the scene six times (cube map). Expensive.
- Use low resolution (512–1024) and a short `far`.
- Disable `castShadow` for small or distant lights.
- For many point lights, use clustered lighting (WebGPU) or baked lighting.

## 5. Spot light

```js
const spot = new THREE.SpotLight(0xffffff, 80, 30, Math.PI / 6, 0.4, 2);
spot.position.set(4, 6, 4);
spot.target.position.set(0, 0, 0);
scene.add(spot, spot.target);

spot.castShadow = true;
spot.shadow.mapSize.set(1024, 1024);
spot.shadow.focus = 1;
spot.shadow.camera.near = 0.5;
spot.shadow.camera.far = 30;
```

- `angle` is the half-angle of the cone in radians.
- `penumbra` (0–1) softens the edge.
- `decay` is 2 by default.
- A `map` can project a texture (cookie/gobo).

## 6. Rect area light

```js
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
RectAreaLightUniformsLib.init();

const panel = new THREE.RectAreaLight(0xffffff, 5, 2, 1);
panel.position.set(0, 2, -2);
panel.lookAt(0, 0, 0);
scene.add(panel);
```

- Soft, rectangular highlights; ideal for studio softboxes and screens.
- No shadows from the built-in implementation.
- Requires the uniforms lib for WebGL.
- Does not work with `MeshLambertMaterial`/`MeshPhongMaterial`; use Standard/Physical.

## 7. IES and projector lights

- `IESSpotLight` uses a photometric `.ies` profile for realistic architectural light distribution.
- `ProjectorLight` projects a texture like a real projector.
- Both are WebGPU/node-oriented; check examples for the current API.

## 8. Shadows

### 8.1 Pipeline

1. Render the scene depth from each shadow-casting light into a shadow map.
2. When shading a fragment, project its world position into the light's shadow map.
3. Compare depth to determine occlusion.
4. Filter the result (PCF/VSM) to soften edges.

### 8.2 Renderer settings

```js
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap; // soft; PCFSoftShadowMap deprecated/removed
// Other: THREE.BasicShadowMap (hard, fastest), THREE.VSMShadowMap (soft, light bleeding)
```

Since r181, `PCFShadowMap` is soft and `PCFSoftShadowMap` is deprecated. In WebGPU (r186+), `PCFSoftShadowMap` is removed.

Per object:

```js
mesh.castShadow = true;
mesh.receiveShadow = true;
```

Lights: `light.castShadow = true` and configure `shadow.mapSize`, `shadow.camera`, `shadow.bias`, `shadow.normalBias`, `shadow.radius`.

### 8.3 Bias and artifacts

| Artifact | Cause | Fix |
|---|---|---|
| Shadow acne (stripes) | Self-shadowing due to depth precision | Increase `bias` (negative) or `normalBias` |
| Peter-panning (shadows detached) | Bias too large | Reduce bias; use normalBias instead |
| Jagged edges | Low resolution or large frustum | Increase map size, tighten frustum, use PCF |
| Shadows disappear | Shadow camera too small / `far` too short | Fit shadow camera to the scene |
| Flickering | Moving shadow map / unstable projection | Snap light to texel grid; use CSM |
| Leaking through walls | Bias / geometry thickness | Adjust normalBias, add thickness |

Start with `normalBias = 0.02` for meter-scale scenes and tune.

### 8.4 Resolution and performance

- Shadow map `1024` or `2048` is typical; `4096` only for hero shots.
- Each shadow-casting light adds a render pass per frame.
- Static shadows: render once and freeze (`renderer.shadowMap.autoUpdate = false`), or bake lightmaps.
- Limit shadow-casting lights to 1–3.
- Point light shadows are 6 passes; avoid many.
- Use `shadow.autoUpdate = false` after a static bake and update manually when needed.

```js
renderer.shadowMap.autoUpdate = false;
renderer.shadowMap.needsUpdate = true; // render once
```

### 8.5 Contact shadows and baked shadows

- **Contact shadows** (Drei `ContactShadows`, or a custom depth-based effect) anchor objects to the ground without a light.
- **Accumulative shadows** (Drei) progressively average many shadow maps for soft area shadows.
- **Baked lightmaps**: store lighting in a texture (UV2/AO/lightmap) for static scenes. Three.js supports `lightMap` and `aoMap`; the addon `LightMapper` bakes.
- **AO** is not a shadow; it darkens cavities and should complement shadows.

## 9. Environment lighting (IBL)

Image-based lighting provides realistic ambient and reflections.

```js
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

const hdr = await new HDRLoader().loadAsync('/env/studio.hdr');
hdr.mapping = THREE.EquirectangularReflectionMapping;

const pmrem = new THREE.PMREMGenerator(renderer);
pmrem.compileEquirectangularShader();
const envMap = pmrem.fromEquirectangular(hdr).texture;

scene.environment = envMap;
scene.environmentIntensity = 1; // r163+
scene.environmentRotation.y = Math.PI; // r184+
pmrem.dispose();
hdr.dispose();
```

- `scene.background` shows the environment; `scene.environment` lights it. They can differ.
- `backgroundBlurriness` (0–1) and `backgroundIntensity` control the visible background.
- `RoomEnvironment` is a procedural studio for neutral product lighting:

```js
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
```

- In r187 PMREM uses cube render targets. `CubeUVReflectionMapping` is gone.
- Prefilter HDRs offline for production when possible; runtime PMREM costs a one-time GPU pass.

## 10. Light probes and baked GI

- `LightProbe` stores spherical harmonics for ambient lighting from a captured environment.
- `LightProbeGrid` (addon) stores probes on a grid for spatial variation; `LightProbeGridWebGL` for WebGL (r186 rename).
- The addon `LightMapper` bakes indirect lighting into lightmaps.
- WebGPU adds experimental VXGI (`VXGINode`, `VXGIVolume`) and clustered lighting; treat these as advanced and version-sensitive.

## 11. Lighting design

### 11.1 Three-point lighting

- **Key**: main directional/area light, 45° to the subject, highest intensity.
- **Fill**: softer, opposite side, 0.3–0.6× key, reduces contrast.
- **Rim/back**: behind and above, separates subject from background.

### 11.2 Color temperature

| Source | Approx. Kelvin |
|---|---|
| Candle | 1900 K |
| Tungsten | 2700–3200 K |
| Neutral white | 5000–5600 K |
| Daylight | 5600–6500 K |
| Overcast | 7000–8000 K |
| Blue sky shadow | 9000–12000 K |

Use warm key + cool fill for a cinematic look; keep contrast intentional.

### 11.3 Ratios and mood

- Low contrast (2:1) = soft, friendly, product.
- Medium (4:1) = natural, editorial.
- High (8:1+) = dramatic, noir.
- Practical lights (visible bulbs, neon signs) sell realism; pair with emissive materials and bloom.
- Fog and volumetric light add atmosphere; use `Fog`/`FogExp2` and additive cones.

## 12. Performance

- Each shadow-casting light is expensive. Budget 1–2 shadow lights on mobile, 2–4 on desktop.
- Use baked lighting for static scenes and dynamic shadows only where needed.
- Lower shadow map sizes for small/soft lights.
- Disable shadows on small props.
- Use `renderer.shadowMap.autoUpdate = false` for static scenes.
- For many lights, prefer emissive materials + baked lightmaps, or WebGPU clustered lighting.
- `AmbientLight` + `HemisphereLight` are cheap; use them for fill.
- Environment maps are cheap at runtime after PMREM generation, but cost texture bandwidth.
- Post-process bloom makes emissive lights read as bright; use it instead of raising intensity without limit.

## 13. Troubleshooting

| Problem | Check |
|---|---|
| Scene is black | No lights, no environment, material is Standard/Physical |
| Everything flat | Only ambient light; add directional/area and environment |
| Shadows missing | `renderer.shadowMap.enabled`, `light.castShadow`, `mesh.castShadow/receiveShadow` |
| Shadows blocky | Increase map size, tighten shadow camera, use PCF |
| Shadow acne | Adjust `bias`/`normalBias` |
| Light does not affect material | Lambert/Phong vs RectArea; material type mismatch |
| Metal is black | No environment map |
| Environment too strong | `scene.environmentIntensity`, `material.envMapIntensity` |
| Point light too dim | Physical decay 2; increase intensity/power or reduce distance |
| Performance collapses with lights | Too many shadow-casting lights; bake or reduce |
