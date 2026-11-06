import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

/**
 * Configure a production-ready glTF loader.
 * Serve /draco/ and /basis/ from three/examples/jsm/libs.
 */
export function createGLTFLoader(renderer, { onProgress, onError } = {}) {
  const draco = new DRACOLoader().setDecoderPath('/draco/');

  const ktx2 = new KTX2Loader()
    .setTranscoderPath('/basis/')
    .detectSupport(renderer);

  const loader = new GLTFLoader()
    .setDRACOLoader(draco)
    .setKTX2Loader(ktx2)
    .setMeshoptDecoder(MeshoptDecoder);

  async function load(url) {
    try {
      const gltf = await loader.loadAsync(url, onProgress);
      return gltf;
    } catch (error) {
      onError?.(error);
      throw error;
    }
  }

  function dispose() {
    draco.dispose();
    ktx2.dispose();
  }

  return { loader, load, dispose };
}

/**
 * Add a loaded model and track it for disposal.
 */
export function addModel(scene, gltf, { castShadow = true, receiveShadow = true } = {}) {
  const root = gltf.scene;

  root.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = castShadow;
      object.receiveShadow = receiveShadow;
    }
  });

  scene.add(root);
  return root;
}

export function disposeModel(scene, root) {
  scene.remove(root);

  root.traverse((object) => {
    object.geometry?.dispose();

    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!material) continue;
      for (const value of Object.values(material)) {
        if (value?.isTexture) value.dispose();
      }
      material.dispose();
    }
  });
}

/**
 * Compute a model's world-space bounds and center it.
 */
export function centerAndScale(root, targetSize = 2) {
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxAxis = Math.max(size.x, size.y, size.z);

  if (maxAxis > 0) {
    const scale = targetSize / maxAxis;
    root.scale.multiplyScalar(scale);
    root.position.sub(center.multiplyScalar(scale));
    root.position.y += (size.y * scale) / 2;
  }

  return root;
}
