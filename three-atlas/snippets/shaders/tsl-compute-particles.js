import * as THREE from 'three/webgpu';
import {
  color,
  compute,
  float,
  If,
  instancedArray,
  instanceIndex,
  mix,
  vec3,
} from 'three/tsl';

/**
 * WebGPU compute-driven particle system.
 * Requires renderer = new THREE.WebGPURenderer(); await renderer.init();
 *
 * The renderer must be the same instance passed to setup().
 */
export function createParticles(renderer, count = 50000) {
  const positions = instancedArray(count, 'vec3');
  const velocities = instancedArray(count, 'vec3');

  const initialize = compute(() => {
    const p = positions.element(instanceIndex);
    const v = velocities.element(instanceIndex);
    const i = float(instanceIndex);

    const x = i.mod(250.0).sub(125.0).mul(0.05);
    const z = i.div(250.0).floor().sub(125.0).mul(0.05);

    p.assign(vec3(x, 0.0, z));
    v.assign(vec3(0.0, 0.5, 0.0));
  });

  const update = compute(() => {
    const p = positions.element(instanceIndex);
    const v = velocities.element(instanceIndex);

    p.addAssign(v);
    v.y.subAssign(0.002);

    // Reset particles that fall below the floor.
    If(p.y.lessThan(-1.0), () => {
      p.y.assign(2.0);
      v.y.assign(0.5);
    });
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(count * 3), 3)
  );

  const material = new THREE.PointsNodeMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  material.positionNode = positions.element(instanceIndex);
  material.colorNode = mix(color(0x00e5ff), color(0xff3366), positions.element(instanceIndex).y);

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;

  renderer.compute(initialize);

  return {
    points,
    update() {
      renderer.compute(update);
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
