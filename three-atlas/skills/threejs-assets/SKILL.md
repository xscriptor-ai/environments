---
name: threejs-assets
description: Three.js asset pipeline for glTF/GLB, Blender export, Draco, KTX2/Basis, meshopt, gltf-transform, gltfpack, gltfjsx, LOD, budgets, and loading UX. Use when loading, optimizing, converting, compressing, debugging, or budgeting 3D models and textures.
---

# Three.js Assets

## Read first

- `../../docs/10-assets-gltf-pipeline.md` — full guide.
- `../../docs/03-geometry-buffers.md` — geometry memory.
- `../../docs/04-materials-pbr-color.md` — textures and color spaces.

## Recommended pipeline

1. Model in Blender with meters, applied transforms, clean names.
2. Export GLB (+Y up, Draco optional).
3. Optimize with `gltf-transform` or `gltfpack`.
4. Compress textures to KTX2.
5. Validate in `gltf-transform inspect`.
6. Load with `GLTFLoader` + `DRACOLoader` + `KTX2Loader` + `MeshoptDecoder`.
7. Measure draw calls, triangles, texture memory.
8. Add LODs/impostors if needed.

## Loading

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const draco = new DRACOLoader().setDecoderPath('/draco/');
const ktx2 = new KTX2Loader().setTranscoderPath('/basis/').detectSupport(renderer);

const loader = new GLTFLoader()
  .setDRACOLoader(draco)
  .setKTX2Loader(ktx2)
  .setMeshoptDecoder(MeshoptDecoder);

const gltf = await loader.loadAsync('/model.glb');
scene.add(gltf.scene);
```

## Optimization commands

```bash
gltf-transform inspect input.glb
gltf-transform optimize input.glb output.glb --compress draco --texture-compress webp
gltf-transform simplify input.glb output.glb --ratio 0.5 --error 0.001
gltfpack -i input.glb -o output.glb -cc -tc -kn
```

- Draco: best ratio, slower decode.
- meshopt: fast decode, good ratio.
- KTX2: 4-8x GPU memory reduction.
- Keep node names (`-kn`/extras) for animations.

## Color spaces

- Albedo/emissive: sRGB.
- Normal/roughness/metalness/AO/height: linear (`NoColorSpace`).
- HDR/EXR: linear.

## Budgets

| Metric | Mobile | Desktop |
|---|---|---|
| GLB download | 2-5 MB | 10-20 MB |
| Texture memory | < 100 MB | < 300-500 MB |
| Triangles | 100k-300k | 500k-2M |
| Draw calls | < 100 | < 500 |

## Rules

- Apply transforms and scale in Blender (meters).
- No negative scale.
- Power-of-two textures; compress.
- Remove unused attributes (tangents, uv2).
- Share materials/textures.
- LOD or impostors for distance.
- Show loading progress and handle errors.
- Dispose assets on scene transitions.
- Treat remote glTF as untrusted input; limit size.

## Debugging

| Problem | Check |
|---|---|
| Black model | Lights/env, metalness without IBL, color space |
| Missing textures | Paths, CORS, KTX2 transcoder |
| Draco/KTX2 error | Decoder/transcoder paths, `detectSupport` |
| Animations missing | Export, names, mixer update |
| Huge/tiny | Units, applied scale |
| Holes/inside-out | Compression, winding, negative scale |
| Long load | Uncompressed assets, no CDN |

## Verification

- `gltf-transform inspect` budgets.
- Visual check in the app, not only in Blender.
- Animations and morph targets work.
- Mobile memory and load time measured.
- Fallback on load failure.
