# 04 — Materials, PBR, Textures, and Color Management

## 1. How materials work

A material is a GPU program plus uniforms and texture bindings. It decides how a surface interacts with light. The mesh supplies geometry; the material supplies appearance.

```js
const material = new THREE.MeshStandardMaterial({
  color: 0x88aaff,
  metalness: 0.0,
  roughness: 0.5,
  map: albedoTexture,
  normalMap: normalTexture,
  normalScale: new THREE.Vector2(1, 1),
  roughnessMap: roughnessTexture,
  metalnessMap: metalnessTexture,
  aoMap: aoTexture,
  aoMapIntensity: 1.0,
});
```

Materials are shared and cached on the GPU. Creating a new material per object multiplies shader programs and draw call setup. Share by default; clone only when a property differs.

```js
const shared = baseMaterial;
const variant = baseMaterial.clone(); // new program state, shares textures
```

## 2. Base material properties

| Property | Meaning | Notes |
|---|---|---|
| `color` | Base color multiplier | In working color space (linear) |
| `map` | Base color texture | Set `colorSpace = SRGBColorSpace` |
| `opacity` | Alpha | Requires `transparent: true` to blend |
| `transparent` | Enable blending | Sorting and depth issues follow |
| `alphaTest` | Discard below threshold | Cheap cutout; keeps depth writes |
| `alphaHash` | Stochastic transparency | Dithered, no sorting; good for foliage |
| `side` | `FrontSide`, `BackSide`, `DoubleSide` | DoubleSide increases cost |
| `depthTest` / `depthWrite` | Depth behavior | Disable writing for transparent FX |
| `blending` | `NormalBlending`, `AdditiveBlending`, ... | Additive for glow/energy |
| `premultipliedAlpha` | Blend assumption | Required by some blend modes since r178 |
| `polygonOffset` + `polygonOffsetFactor/Units` | Depth offset | Decals, coplanar surfaces |
| `flatShading` | Per-face normals | Stylized look |
| `fog` | Apply fog | Materials that support it |
| `toneMapped` | Apply tone mapping | Disable for UI/emissive overlays |
| `vertexColors` | Multiply by vertex colors | `geometry` must have `color` attribute |
| `wireframe` | Draw wireframe | Debug/stylized |
| `visible` | Skip rendering | Material-level toggle |

## 3. Material types

| Material | Lighting | Cost | Use |
|---|---|---|---|
| `MeshBasicMaterial` | None | Lowest | Unlit, UI, wireframes, backgrounds |
| `MeshLambertMaterial` | Diffuse only | Low | Stylized, mobile, soft look |
| `MeshPhongMaterial` | Diffuse + specular | Medium | Legacy shiny surfaces |
| `MeshStandardMaterial` | PBR metalness/roughness | Medium | Default for realistic surfaces |
| `MeshPhysicalMaterial` | Extended PBR | High | Glass, car paint, fabric, iridescence |
| `MeshToonMaterial` | Cel shading | Low–medium | Anime/cartoon |
| `MeshMatcapMaterial` | Matcap texture | Low | Sculpt look, no real lights |
| `MeshNormalMaterial` | Normal colors | Low | Debug |
| `MeshDepthMaterial` | Depth | Low | Custom depth passes |
| `ShadowMaterial` | Shadow only | Low | Shadow catchers |
| `ShaderMaterial` | Custom GLSL | Varies | Full control |
| `RawShaderMaterial` | Custom GLSL, no prefix | Varies | Advanced GLSL |
| `MeshStandardNodeMaterial` etc. | Node/TSL | Varies | WebGPU/NodeMaterial |

Node variants exist for most materials in `three/webgpu` (for example `MeshStandardNodeMaterial`, `MeshPhysicalNodeMaterial`, `LineBasicNodeMaterial`, `SpriteNodeMaterial`).

## 4. PBR: metalness/roughness workflow

Three.js uses a metallic-roughness PBR model.

### 4.1 Inputs

| Map | Channel | Color space | Meaning |
|---|---|---|---|
| Base color / albedo | RGB | sRGB | Diffuse color for dielectrics, reflectance tint for metals |
| Metalness | B (glTF) | Linear | 0 = dielectric, 1 = metal |
| Roughness | G (glTF) | Linear | 0 = mirror, 1 = fully diffuse |
| Normal | RGB | Linear | Tangent-space normal perturbation |
| Ambient occlusion | R (glTF) | Linear | Cavity darkening (multiplied into indirect light) |
| Emissive | RGB | sRGB | Self-illumination |
| Height / displacement | R | Linear | Parallax or vertex displacement |

glTF packs metalness/roughness into one texture: **R = AO, G = roughness, B = metalness** when using the ORM convention. Set `material.roughnessMap` and `material.metalnessMap` to the same texture and let each read its channel; Three.js samples the same channels used by the glTF spec.

### 4.2 Physical meaning

- **Dielectrics** (plastic, wood, skin): base color is diffuse albedo; specular reflection is ~4% at normal incidence (F0 = 0.04). Metalness = 0.
- **Metals** (gold, steel, copper): base color is the specular reflectance; there is no diffuse. Metalness = 1.
- **Roughness** controls microfacet distribution: low = sharp reflections, high = blurry.
- **Normal map** adds surface detail without geometry.
- **AO** darkens creases and cavities; it is not a shadow replacement.

Energy conservation is handled by the BRDF; avoid values that break it (metalness between 0 and 1 is legal for transitions but physically unrealistic for pure materials).

### 4.3 Recommended value ranges

| Surface | Metalness | Roughness |
|---|---|---|
| Plastic | 0.0 | 0.2–0.6 |
| Painted metal | 0.0–0.2 | 0.3–0.5 |
| Brushed steel | 1.0 | 0.25–0.45 |
| Polished chrome | 1.0 | 0.02–0.1 |
| Gold | 1.0 | 0.15–0.35 |
| Rubber | 0.0 | 0.7–0.95 |
| Skin | 0.0 | 0.4–0.6 |
| Glass | 0.0 | 0.0–0.1 + transmission |
| Concrete | 0.0 | 0.8–1.0 |
| Wood (varnished) | 0.0 | 0.2–0.5 |

### 4.4 Metals need an environment

`MeshStandardMaterial` with metalness = 1 and no environment map looks black or nearly black because there is no diffuse and only light sources produce tiny specular highlights. Always provide `scene.environment` (HDR/PMREM) for metals. This is the most common PBR mistake.

## 5. MeshPhysicalMaterial extensions

| Feature | Properties | Use |
|---|---|---|
| Clearcoat | `clearcoat`, `clearcoatRoughness`, `clearcoatMap`, `clearcoatNormalMap` | Car paint, lacquer |
| Sheen | `sheen`, `sheenColor`, `sheenRoughness`, `sheenColorMap` | Fabric, velvet |
| Transmission | `transmission`, `thickness`, `attenuationColor`, `attenuationDistance`, `ior` | Glass, water, gemstones |
| Iridescence | `iridescence`, `iridescenceIOR`, `iridescenceThicknessMinimum/Maximum` (r187) | Soap bubbles, thin films |
| Anisotropy | `anisotropy`, `anisotropyRotation`, `anisotropyMap` | Brushed metal, hair |
| Specular | `specularIntensity`, `specularColor`, `specularIntensityMap` | Custom dielectric reflectance |
| Dispersion | `dispersion` | Chromatic dispersion in transmissive materials |
| Refraction | `ior`, `thickness`, `transmission` | Physical refraction |

Transmission is expensive: it renders the scene behind the object into a render target. Use it for a few hero objects, not an entire glass building. Drei's `MeshTransmissionMaterial` offers a more optimized/art-directable alternative.

```js
const glass = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0,
  roughness: 0.05,
  transmission: 1,
  thickness: 0.5,
  ior: 1.52,
  attenuationColor: new THREE.Color(0xaaddee),
  attenuationDistance: 1.5,
});
```

## 6. Textures

### 6.1 Color space rules

| Texture | `colorSpace` |
|---|---|
| Base color / albedo | `THREE.SRGBColorSpace` |
| Emissive | `THREE.SRGBColorSpace` |
| Environment / HDR | `THREE.LinearSRGBColorSpace` (or `NoColorSpace` for data) |
| Normal | `THREE.NoColorSpace` |
| Roughness / metalness / AO | `THREE.NoColorSpace` |
| Height / displacement | `THREE.NoColorSpace` |
| Data textures (position, noise) | `THREE.NoColorSpace` |

```js
const albedo = textureLoader.load('/textures/wood_albedo.jpg');
albedo.colorSpace = THREE.SRGBColorSpace;
albedo.wrapS = albedo.wrapT = THREE.RepeatWrapping;
albedo.repeat.set(2, 2);
albedo.anisotropy = renderer.capabilities.getMaxAnisotropy();

const normal = textureLoader.load('/textures/wood_normal.jpg');
normal.colorSpace = THREE.NoColorSpace; // default
```

If a color texture is left in `NoColorSpace`, it looks washed out or too bright. If a data texture is set to sRGB, lighting breaks subtly.

### 6.2 Filtering and mipmaps

```js
texture.minFilter = THREE.LinearMipmapLinearFilter; // default, best quality
texture.magFilter = THREE.LinearFilter;
texture.generateMipmaps = true; // default for power-of-two or WebGL2
texture.anisotropy = 8;         // 1..max; improves oblique angles
```

- Mipmaps reduce aliasing and improve cache behavior. Keep them on unless the texture must be pixel-exact.
- Anisotropy costs bandwidth; 4–8 is usually enough, 16 for floors/roads.
- For UI and pixel art, use `NearestFilter` and disable mipmaps.

### 6.3 Wrapping

| Mode | Behavior |
|---|---|
| `RepeatWrapping` | Tiles |
| `ClampToEdgeWrapping` | Extends edge pixels |
| `MirroredRepeatWrapping` | Mirrors each tile |

### 6.4 Texture memory

Approximate GPU memory for an uncompressed RGBA8 texture:

```
bytes = width * height * 4
with mipmaps ≈ width * height * 4 * 1.333
```

Examples:

| Texture | RGBA8 + mips |
|---|---|
| 512×512 | ~1.4 MB |
| 1024×1024 | ~5.6 MB |
| 2048×2048 | ~22 MB |
| 4096×4096 | ~89 MB |

Compressed formats (KTX2/Basis: ETC2, ASTC, BC7) reduce this by 4–8× and avoid decode cost on the GPU. Use `KTX2Loader`.

### 6.5 KTX2 / Basis

```js
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';

const ktx2 = new KTX2Loader()
  .setTranscoderPath('/basis/')
  .detectSupport(renderer);

const texture = await ktx2.loadAsync('/textures/wood.ktx2');
texture.colorSpace = THREE.SRGBColorSpace; // if albedo
```

Transcode targets differ per GPU; KTX2 handles this. Build with `toktx` or `gltf-transform`/`gltfpack`.

### 6.6 Other texture sources

- `CanvasTexture` — dynamic 2D canvas as texture; call `needsUpdate = true` after drawing.
- `VideoTexture` — video element; update per frame.
- `DataTexture` — raw typed array; set `needsUpdate` after writing.
- `CubeTexture` — six faces; use for legacy environment maps.
- `RenderTarget.texture` — render-to-texture for effects, portals, mirrors.
- `HTMLTexture` (r187) — DOM content as texture; useful for UI in 3D.

## 7. Color management

### 7.1 The workflow

Three.js works in **linear-sRGB** internally (since r152 color management is on by default).

```
sRGB texture --(decode)--> linear-sRGB --(lighting/tone map)--> display sRGB
CSS/hex color --(ColorManagement)--> linear-sRGB
```

- `THREE.Color` given a hex or CSS string is converted from sRGB to linear working space automatically when `ColorManagement.enabled = true`.
- `renderer.outputColorSpace = THREE.SRGBColorSpace` (default) encodes the final framebuffer for the display.
- Textures must declare their color space; Three.js does not guess.
- Post-processing must apply tone mapping and output color space at the end (`OutputPass` or `renderOutput()` in TSL), not per pass.

### 7.2 Renderer settings

```js
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
```

### 7.3 Tone mapping options

| Mode | Look | When |
|---|---|---|
| `NoToneMapping` | Linear, clips highlights | UI, stylized flat |
| `LinearToneMapping` | Simple exposure | Quick previews |
| `ReinhardToneMapping` | Soft, low contrast | Backgrounds |
| `CineonToneMapping` | Film-like curve | Stylized film |
| `ACESFilmicToneMapping` | Contrasty, popular | Games, cinematic |
| `AgXToneMapping` | Natural highlights, modern | Photoreal, product |
| `NeutralToneMapping` | Balanced, neutral | Product, UI, e-commerce |

Tone mapping is applied when rendering to screen. In an `EffectComposer`, add `OutputPass` at the end; otherwise the composer output is not tone-mapped or color-corrected.

### 7.4 Exposure and lighting balance

- Keep light intensities physically plausible.
- Adjust `toneMappingExposure` to taste, but do not use it to compensate for missing light.
- For product visualization, NeutralToneMapping with a well-lit studio HDRI is often the best starting point.
- For night neon, ACES or AgX with emissive materials and bloom.

### 7.5 Common color bugs

| Symptom | Cause |
|---|---|
| Albedo too bright/washed | Texture not marked sRGB |
| Albedo too dark | sRGB texture decoded twice, or lighting too low |
| Normal map looks inverted | Green channel convention (OpenGL vs DirectX); flip `normalScale.y` |
| Everything gray | Environment missing and only ambient light |
| Colors shift after post-processing | Missing `OutputPass` / `renderOutput()` |
| Background differs from CSS | Clear color is converted through color management; set it with `THREE.Color` |

## 8. Transparency and blending

Transparency is not a material property alone; it is a rendering-order problem.

### 8.1 Options

| Technique | Depth write | Sorting | Use |
|---|---|---|---|
| `transparent: true` | Usually false | Yes | Glass, smoke, UI quads |
| `alphaTest: 0.5` | Yes | No | Foliage, cutouts, fences |
| `alphaHash: true` | Yes (dithered) | No | Foliage without sorting, TAA-friendly |
| `depthWrite: false`, additive | No | Possible | Glow, sparks, energy |
| `transmission` | Special | Internal | Glass with refraction |

### 8.2 Sorting

- Opaque objects render front-to-back for early-z.
- Transparent objects render back-to-front by distance.
- Per-object sorting cannot resolve intersecting transparent surfaces.
- Use `renderOrder` to force a deterministic order.
- Split complex transparent meshes or use order-independent transparency (OIT) if needed.

```js
material.transparent = true;
material.depthWrite = false;
mesh.renderOrder = 10;
```

### 8.3 Premultiplied alpha

For correct additive/premultiplied blending (and since r178 for `MultiplyBlending`/`SubtractiveBlending`):

```js
material.premultipliedAlpha = true;
```

If compositing over HTML, ensure the canvas alpha mode and CSS background agree.

## 9. Environment maps

An environment map provides image-based lighting (IBL): diffuse irradiance and specular reflections.

```js
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

const hdr = await new HDRLoader().loadAsync('/env/studio.hdr');
hdr.mapping = THREE.EquirectangularReflectionMapping;

const pmrem = new THREE.PMREMGenerator(renderer);
const envRT = pmrem.fromEquirectangular(hdr);
scene.environment = envRT.texture;
scene.environmentIntensity = 1.0; // r163+
scene.background = envRT.texture; // optional
pmrem.dispose();
```

- Use `RoomEnvironment` for a neutral studio without an HDR file.
- `PMREMGenerator` precomputes mipmapped roughness levels. In r187 PMREM uses cube render targets; `CubeUVReflectionMapping` was removed.
- `scene.backgroundBlurriness` and `backgroundIntensity` control the visible background separately from lighting.
- `material.envMap` overrides the scene environment; `envMapIntensity` scales it.
- `scene.environmentRotation` rotates the IBL (aligned with object rotation since r184).

## 10. Customizing materials

### 10.1 `onBeforeCompile` (WebGL)

Patch shader chunks without replacing the material:

```js
material.onBeforeCompile = (shader) => {
  shader.uniforms.uTime = { value: 0 };
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nuniform float uTime;')
    .replace('#include <begin_vertex>', `
      #include <begin_vertex>
      transformed.y += sin(transformed.x * 4.0 + uTime) * 0.1;
    `);
  material.userData.shader = shader;
};

// Update uniform in the loop
if (material.userData.shader) {
  material.userData.shader.uniforms.uTime.value = elapsed;
}
```

Caveats:

- Chunk names are internal API; they can change between releases.
- `onBeforeCompile` does not work with `WebGPURenderer`; use NodeMaterial/TSL instead.
- Set `material.customProgramCacheKey = () => 'my-unique-key'` when the injected code varies.
- Do not create a new shader per object; share programs.

### 10.2 NodeMaterial / TSL (WebGPU)

```js
import { MeshStandardNodeMaterial, color, uv, texture, time, mix } from 'three/webgpu';
// TSL imports come from 'three/tsl'; NodeMaterial classes from 'three/webgpu'

const material = new MeshStandardNodeMaterial();
material.colorNode = mix(color(0xff0000), color(0x0000ff), uv().x);
```

TSL is renderer-agnostic (compiles to WGSL or GLSL). It is the future-facing customization path. See `docs/08-shaders-glsl-tsl.md`.

### 10.3 ShaderMaterial

Full custom GLSL. It does **not** receive scene lights automatically; you must implement lighting or use `onBeforeCompile`/NodeMaterial. See `docs/08-shaders-glsl-tsl.md`.

## 11. Material performance

- Share materials; each unique material can create a shader program.
- Merge textures into atlases to reduce bindings and draw calls.
- Use `MeshStandardMaterial` rather than `MeshPhysicalMaterial` unless the extra features are visible.
- Transmission, clearcoat, iridescence, and anisotropy all cost shader time.
- Avoid `DoubleSide` when possible.
- `alphaTest` is cheaper than `transparent` for cutouts.
- Set `material.toneMapped = false` for UI/emissive overlays that should not be tone-mapped.
- Use `InstancedMesh` with `setColorAt` instead of unique materials per instance.
- Textures: compress, downscale to on-screen size, and reuse across materials.
- `material.needsUpdate = true` forces a shader recompile; do not do it per frame.

## 12. Recipes

### 12.1 Product studio material

```js
const mat = new THREE.MeshPhysicalMaterial({
  color: 0xf2f2f2,
  metalness: 0,
  roughness: 0.35,
  clearcoat: 0.6,
  clearcoatRoughness: 0.2,
  envMapIntensity: 1.0,
});
```

### 12.2 Brushed metal

```js
const mat = new THREE.MeshPhysicalMaterial({
  color: 0xbfc4cc,
  metalness: 1,
  roughness: 0.35,
  anisotropy: 0.8,
  anisotropyRotation: Math.PI / 2,
});
```

### 12.3 Car paint

```js
const mat = new THREE.MeshPhysicalMaterial({
  color: 0x8a0f1a,
  metalness: 0.9,
  roughness: 0.25,
  clearcoat: 1,
  clearcoatRoughness: 0.03,
});
```

### 12.4 Emissive neon

```js
const mat = new THREE.MeshStandardMaterial({
  color: 0x000000,
  emissive: 0x00e5ff,
  emissiveIntensity: 4,
  toneMapped: false,
});
```

Pair with bloom in post-processing. Without bloom, emissive values above 1 are clipped by tone mapping.

### 12.5 Foliage cutout

```js
const mat = new THREE.MeshStandardMaterial({
  map: leafAlbedo,
  alphaTest: 0.5,
  side: THREE.DoubleSide,
  roughness: 0.9,
  metalness: 0,
});
mat.map.colorSpace = THREE.SRGBColorSpace;
```

Prefer `alphaHash` for dense foliage that cannot be sorted.

### 12.6 Glass (hero object only)

```js
const mat = new THREE.MeshPhysicalMaterial({
  transmission: 1,
  thickness: 0.4,
  roughness: 0.05,
  ior: 1.5,
  metalness: 0,
});
```

## 13. Troubleshooting

| Problem | Check |
|---|---|
| Model is too dark | Lights present? Environment present? Metalness not 1 without IBL? Exposure? |
| Model is flat | Normal map missing or wrong color space; roughness too high; AO too strong |
| Metal is black | No environment map |
| Textures look blurry | Mipmaps/filtering, texture resolution, anisotropy |
| Texture repeats wrong | `wrapS/wrapT`, `repeat`, UV set, `flipY` |
| Transparency flickers | Sorting, `depthWrite`, intersecting surfaces |
| Shader recompiles every frame | `needsUpdate`, new materials, changing defines |
| Everything gray after bloom | Composer missing `OutputPass` or tone mapping applied twice |
| Highlights blown out | Exposure too high or tone mapping not applied |
| Colors differ between WebGL and WebGPU | Color space, premultiplied alpha, or tone mapping stage |
