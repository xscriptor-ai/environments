import * as THREE from 'three/webgpu';
import { color, float, oneMinus, smoothstep, texture, uniform, uv } from 'three/tsl';

/**
 * Dissolve material using TSL (WebGPU or WebGL backend).
 * Requires the renderer to be created with 'three/webgpu'.
 *
 * @param {THREE.Texture} noiseMap - Linear noise texture.
 * @param {object} [options]
 * @param {number} [options.duration=1.2] - Seconds for a full dissolve.
 * @param {number} [options.edgeWidth=0.05] - Emissive edge width.
 * @param {number} [options.edgeColor=0x00e5ff] - Edge glow color.
 */
export function createDissolveMaterial(noiseMap, options = {}) {
  const {
    duration = 1.2,
    edgeWidth = 0.05,
    edgeColor = 0x00e5ff,
  } = options;

  noiseMap.colorSpace = THREE.NoColorSpace;

  const progress = uniform(0);
  const noiseValue = texture(noiseMap, uv()).r;

  const material = new THREE.MeshStandardNodeMaterial({
    transparent: true,
    side: THREE.DoubleSide,
  });

  material.colorNode = color(0x8899ff);
  material.roughnessNode = float(0.4);
  material.metalnessNode = float(0.1);

  const threshold = progress.mul(1.0 + edgeWidth);
  const visible = smoothstep(threshold, threshold.add(edgeWidth), noiseValue);
  const edge = smoothstep(threshold.sub(edgeWidth), threshold, noiseValue)
    .mul(oneMinus(visible));

  material.opacityNode = visible;
  material.alphaTestNode = visible.sub(0.01);
  material.emissiveNode = color(edgeColor).mul(edge);

  let elapsed = 0;

  return {
    material,
    update(dt) {
      elapsed = Math.min(elapsed + dt, duration);
      progress.value = elapsed / duration;
    },
    reset() {
      elapsed = 0;
      progress.value = 0;
    },
    get done() {
      return elapsed >= duration;
    },
  };
}
