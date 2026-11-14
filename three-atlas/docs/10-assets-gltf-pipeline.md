# 10 — Assets: glTF, Compression, Blender, and Optimization

## 1. glTF 2.0 in one page

glTF is the standard runtime 3D format. Three.js has first-class support.

```
.gltf (JSON) + .bin + textures
.glb  (binary container: JSON + bin + textures)
```

Core structure:

```json
{
  "asset": { "version": "2.0" },
  "scenes": [{ "nodes": [0] }],
  "nodes": [{ "mesh": 0, "children": [1] }],
  "meshes": [{ "primitives": [{ "attributes": { "POSITION": 0, "NORMAL": 1 }, "indices": 2, "material": 0 }] }],
  "materials": [{ "pbrMetallicRoughness": { "baseColorFactor": [1, 1, 1, 1], "metallicFactor": 0, "roughnessFactor": 0.5 } }],
  "accessors": [], "bufferViews": [], "buffers": [],
  "textures": [], "images": [], "samplers": []
}
```

Supported features in Three.js:

- Nodes, meshes, cameras, skins, animations, morph targets.
- PBR metallic-roughness materials.
- Extensions: `KHR_draco_mesh_compression`, `KHR_texture_basisu`, `EXT_meshopt_compression`, `KHR_materials_clearcoat`, `KHR_materials_transmission`, `KHR_materials_ior`, `KHR_materials_sheen`, `KHR_materials_iridescence`, `KHR_materials_anisotropy`, `KHR_lights_punctual`, `KHR_materials_variants`, `KHR_texture_transform`, `EXT_mesh_gpu_instancing`.
- Not everything is supported; check `GLTFLoader` docs and the Khronos extension list.

## 2. Loading glTF correctly

```js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const draco = new DRACOLoader().setDecoderPath('/draco/');
const ktx2 = new KTX2Loader()
  .setTranscoderPath('/basis/')
  .detectSupport(renderer);

const loader = new GLTFLoader()
  .setDRACOLoader(draco)
  .setKTX2Loader(ktx2)
  .setMeshoptDecoder(MeshoptDecoder);

const gltf = await loader.loadAsync('/models/scene.glb', (event) => {
  if (event.lengthComputable) {
    const percent = (event.loaded / event.total) * 100;
    updateProgress(percent);
  }
});

scene.add(gltf.scene);
```

Important:

- Call `ktx2.detectSupport(renderer)` after the renderer exists. In r181+ with WebGPU, call `renderer.init()` first and use `detectSupport()` (not async).
- DRACO decoder files must be served from `/draco/` (copy `three/examples/jsm/libs/draco/`).
- The Basis transcoder must be served from `/basis/` (copy `three/examples/jsm/libs/basis/`).
- Dispose the loaders when done if they hold workers: `draco.dispose(); ktx2.dispose();`.
- Use `LoadingManager` for global progress and error handling.

### LoadingManager

```js
const manager = new THREE.LoadingManager();
manager.onStart = (url, loaded, total) => console.log('start', url, loaded, total);
manager.onProgress = (url, loaded, total) => console.log('progress', loaded, total);
manager.onLoad = () => console.log('all loaded');
manager.onError = (url) => console.error('failed', url);

const loader = new GLTFLoader(manager);
const textureLoader = new THREE.TextureLoader(manager);
```

### Error handling

```js
try {
  const gltf = await loader.loadAsync(url);
  scene.add(gltf.scene);
} catch (error) {
  console.error('Failed to load model', error);
  showFallback();
}
```

Do not assume assets load; production networks fail.

## 3. What glTF gives you

```js
gltf.scene      // Object3D root
gltf.scenes     // array of scenes
gltf.animations // AnimationClip[]
gltf.cameras    // Camera[]
gltf.assets     // metadata
gltf.parser     // access to parser, buffers, dependencies
```

- `gltf.scene` may contain several roots; add it to your scene.
- Animations target nodes by name; keep names stable.
- Cameras/lights may be present if the exporter includes them.
- `gltf.parser.getDependency('texture', index)` for advanced access.
- Materials are `MeshStandardMaterial`/`MeshPhysicalMaterial` with correct color spaces.

### Variants

```js
const variants = gltf.userData?.gltfExtensions?.KHR_materials_variants;
```

Drei's `useGLTF` and `gltfjsx` expose variants; in vanilla, use `parser` APIs or the `GLTFLoader` plugin.

## 4. Blender to glTF pipeline

### 4.1 Export settings

- File > Export > glTF 2.0 (`.glb` preferred).
- **+Y up** (default; Blender Z-up is converted).
- Apply transforms (`Ctrl+A` > All Transforms) before export, especially scale.
- Use meters; scene unit scale 1.0.
- Export selected objects only when appropriate.
- Include animations, shape keys (morph), and skins.
- Compression: use Draco for geometry and KTX2 for textures (choose in exporter or post-process).
- Do not export cameras/lights unless needed.
- Check "Apply Modifiers" for final geometry.

### 4.2 Naming and structure

- Name objects and materials meaningfully; names become node/material names in the runtime.
- Keep a clean hierarchy; empty parents are fine for pivots.
- One material per logical surface; avoid dozens of tiny materials.
- Bake ambient occlusion/lightmaps if the scene is static.
- Origin at the base/center of the object depending on use (floor placement vs rotation).
- Scale applied; no negative scales (they flip normals).

### 4.3 Textures

- Base color in sRGB; normal/roughness/metalness/AO in linear.
- Pack ORM (AO/Roughness/Metalness) into one texture when possible.
- Power-of-two sizes; 1024 or 2048 is usually enough.
- Do not bake lighting into albedo unless intentional.
- Use `gltf-transform` or `gltfpack` to convert to KTX2.

## 5. Optimization pipeline

### 5.1 gltf-transform

Install:

```bash
npm i -g @gltf-transform/cli
```

Inspect:

```bash
gltf-transform inspect input.glb
```

Typical production pipeline:

```bash
# Deduplicate, prune unused data, weld vertices, simplify, resize textures, compress
gltf-transform dedup input.glb step1.glb
gltf-transform prune step1.glb step2.glb
gltf-transform weld step2.glb step3.glb
gltf-transform simplify step3.glb step4.glb --ratio 0.5 --error 0.001
gltf-transform resize step4.glb step5.glb --width 1024 --height 1024
gltf-transform etc1s step5.glb output.glb --quality 128
# or:
gltf-transform uastc step5.glb output.glb --level 4 --rdo 4
```

Other useful commands:

```bash
gltf-transform copy
gltf-transform flatten
gltf-transform join
gltf-transform instance
gltf-transform meshopt
gltf-transform draco
gltf-transform webp
gltf-transform avif
gltf-transform optimize input.glb output.glb --compress draco --texture-compress webp
```

`gltf-transform optimize` runs a sensible combined pipeline; inspect the result to ensure materials and animations survived.

### 5.2 gltfpack (meshoptimizer)

```bash
gltfpack -i input.glb -o output.glb -cc -tc
```

- `-cc` uses meshopt compression (often better decode performance than Draco).
- `-tc` compresses textures (KTX2/Basis).
- `-si 0.5` simplifies to 50%.
- `-kn` keeps node names (needed for animation bindings).
- `-ke` keeps extras.

### 5.3 Draco vs meshopt

| | Draco | meshopt |
|---|---|---|
| Compression ratio | Very high | High |
| Decode speed | Slower (WASM worker) | Fast |
| GPU-friendly | Yes | Yes |
| Three.js support | `DRACOLoader` | `MeshoptDecoder` |
| Use when | Bandwidth critical | Runtime performance critical |

You can combine: meshopt for geometry, KTX2 for textures.

### 5.4 Texture compression

- KTX2 + Basis Universal transcodes to ETC2/ASTC/BC7 per device.
- `toktx` or `gltf-transform`/`gltfpack` create KTX2.
- Color space is stored in the KTX2 metadata; still set `colorSpace` after load when needed.
- WebP/AVIF reduce download size but decode to RGBA in GPU memory; they do not reduce GPU memory. KTX2 does.

### 5.5 Budgets

| Metric | Mobile | Desktop |
|---|---|---|
| Triangles per frame | 100k–300k | 500k–2M |
| Draw calls | < 100 | < 500 |
| Texture memory | < 100 MB | < 300–500 MB |
| GLB download | < 2–5 MB | < 10–20 MB |
| Time to first render | < 3 s | < 3 s |
| Materials | < 30 | < 100 |

These are starting points; measure on target devices.

## 6. LOD, impostors, and instancing

- `THREE.LOD` switches meshes by distance.
- Generate LODs with `gltf-transform simplify` or Blender decimate.
- Impostors (billboards with baked views) for distant trees/crowds.
- `InstancedMesh` for repeated props; `BatchedMesh` for varied props sharing a material.
- Merge static scenery to reduce draw calls.
- Cull small objects aggressively.

## 7. Asset management

### 7.1 Manifest

```js
const manifest = {
  model: { url: '/models/hero.glb', type: 'gltf' },
  env: { url: '/env/studio.hdr', type: 'hdr' },
  textures: ['/textures/wood.ktx2'],
};
```

Preload critical assets, lazy-load the rest. Track progress per group.

### 7.2 Caching

- Serve with long `Cache-Control: immutable` for hashed filenames.
- Use HTTP/2 or HTTP/3 and Brotli/gzip for JSON and text.
- Do not preload everything; it competes with critical resources.
- Use `fetch` with `cache: 'force-cache'` sparingly; the browser handles HTTP cache.

### 7.3 Memory

- Dispose GPU resources after removing a scene.
- Unload assets not needed for the current section.
- Keep a single environment map and reuse it.
- Avoid cloning textures per material; share `Texture` instances.

## 8. HDR and environment assets

```js
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js'; // renamed from RGBELoader in r180
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';

const hdr = await new HDRLoader().loadAsync('/env/studio.hdr');
hdr.mapping = THREE.EquirectangularReflectionMapping;
```

- HDR/EXR are linear; do not set sRGB.
- Prefilter with PMREM at runtime or offline.
- Use 1K–2K HDRs; 4K is overkill for most backgrounds.
- `UltraHDRLoader` for Ultra HDR JPEGs.

## 9. gltfjsx (React)

```bash
npx gltfjsx model.glb --transform --types
```

Generates a typed React component with:

- Named nodes and materials.
- `useGLTF` preload.
- Optional Draco/meshopt transform.
- Better tree-shaking and scene editing.

Use with Drei's `useGLTF` and `Clone` for reuse.

## 10. Security and robustness

- Treat downloaded glTF as untrusted input.
- Limit file size, texture dimensions, and node counts to avoid memory bombs.
- Serve assets from trusted origins; configure CORS correctly.
- Do not eval or execute arbitrary metadata.
- Sanitize URLs; avoid loading from user-provided arbitrary URLs without validation.
- Validate extension support; fail gracefully.
- Texture decompression can be CPU-heavy; do it off the main thread where possible.

## 11. Asset checklist

- [ ] GLB with applied transforms and correct scale (meters).
- [ ] Geometry compressed (Draco/meshopt) or within budget.
- [ ] Textures compressed (KTX2) and power-of-two.
- [ ] Color spaces correct (albedo sRGB, data linear).
- [ ] Animations named and tested.
- [ ] Materials count and shader complexity within budget.
- [ ] LODs or impostors for distant objects.
- [ ] Loading progress, error state, and fallback.
- [ ] Total download and texture memory within mobile budget.
- [ ] Caching headers and CDN configured.
- [ ] Dispose strategy for scene transitions.

## 12. Troubleshooting

| Problem | Cause |
|---|---|
| Model is black | Missing lights/environment, metalness with no IBL, wrong material |
| Model is too dark/bright | Color space, exposure, or baked lighting |
| Textures missing | Relative paths, CORS, KTX2 transcoder path, texture references |
| Draco error | Decoder path wrong or missing WASM |
| KTX2 error | Transcoder path wrong, unsupported format, `detectSupport` not called |
| Animations don't play | Clip names, mixer not updated, animations not exported |
| Model huge/tiny | Unit/scale, applied transforms, exporter scale |
| Mesh inside-out | Negative scale, wrong winding, normals |
| Holes | Draco/meshopt corruption, missing indices, backface culling |
| Long load | Uncompressed textures/geometry, no CDN, too many files |
