import * as THREE from 'three';

/**
 * Additive fresnel rim material (WebGL).
 * This material is unlit; it does not receive scene lights.
 * Set toneMapped = false if you want the color to bypass tone mapping.
 */
export function createFresnelMaterial({
  color = 0x00e5ff,
  power = 3.0,
  intensity = 1.0,
  opacity = 1.0,
} = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uPower: { value: power },
      uIntensity: { value: intensity },
      uOpacity: { value: opacity },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormalView;
      varying vec3 vViewDir;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vNormalView = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uPower;
      uniform float uIntensity;
      uniform float uOpacity;

      varying vec3 vNormalView;
      varying vec3 vViewDir;

      void main() {
        float facing = abs(dot(normalize(vNormalView), normalize(vViewDir)));
        float fresnel = pow(1.0 - facing, uPower) * uIntensity;
        gl_FragColor = vec4(uColor * fresnel, fresnel * uOpacity);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
}
