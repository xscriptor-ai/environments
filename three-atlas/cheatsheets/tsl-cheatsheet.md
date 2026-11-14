# TSL Cheat Sheet (r187)

## Imports

```js
import * as THREE from 'three/webgpu';
import {
  Fn, uniform, uniformArray, attribute,
  uv, texture, textureLoad, textureStore, textureSize,
  positionGeometry, positionLocal, positionWorld, positionView,
  normalGeometry, normalLocal, normalView, normalWorld,
  tangentLocal, bitangentLocal,
  cameraPosition, cameraProjectionMatrix, modelWorldMatrix, modelNormalMatrix,
  screenUV, screenCoordinate, screenSize, viewportUV, viewportSize,
  time, deltaTime,
  color, vec2, vec3, vec4, float, int, uint, bool, mat3, mat4,
  mix, smoothstep, clamp, step, saturate, sin, cos, tan, atan,
  fract, floor, ceil, round, abs, sign, min, max, pow, sqrt, exp, log,
  length, distance, dot, cross, normalize, reflect, refract,
  If, ElseIf, Else, Loop, Break, Continue, Return, select, Switch,
  instancedArray, storage, compute, instancedBufferAttribute,
  pass, mrt, output, emissive, velocity, renderOutput,
  bloom, ao, ssr, ssgi, dof, fxaa, smaa, traa, film,
  chromaticAberration, rgbShift, outline, godrays, lut3D,
  gaussianBlur, afterImage, transition, denoise,
} from 'three/tsl';
```

## NodeMaterial

```js
const material = new THREE.MeshStandardNodeMaterial();
material.colorNode = color(0xff3366);
material.roughnessNode = float(0.4);
material.metalnessNode = float(0.0);
material.emissiveNode = color(0x001122);
material.opacityNode = float(1.0);
material.normalNode = normalWorld;
material.positionNode = positionLocal;
```

Slots: `positionNode`, `normalNode`, `colorNode`, `emissiveNode`, `roughnessNode`, `metalnessNode`, `aoNode`, `opacityNode`, `alphaTestNode`, and Physical extensions (`clearcoatNode`, `transmissionNode`, `thicknessNode`, `sheenNode`, `iridescenceNode`, `anisotropyNode`, `dispersionNode`).

## Uniforms

```js
const uTime = uniform(0);
const uColor = uniform(new THREE.Color(0x00e5ff));

uTime.value = elapsed;

uTime.onFrameUpdate(({ time }) => time);
uTime.onRenderUpdate(() => value);
uTime.onObjectUpdate(({ object }) => object.position.y);
```

## Varyings

```js
const vNormal = vertexStage(normalWorld);
const vUv = varying(uv());
```

## Math and swizzles

```js
const p = positionWorld;
const x = p.x;
const rgb = color(0xff0000).rgb;
const yzx = p.yzx;

const v = vec3(1, 2, 3).mul(2).add(1).normalize();
const m = mix(vec3(1), vec3(0), 0.5);
const s = smoothstep(0, 1, uv().x);
```

## Conditions and loops

```js
const f = Fn(({ x }) => {
  const out = float(0).toVar();

  If(x.greaterThan(0.5), () => {
    out.assign(1.0);
  }).Else(() => {
    out.assign(0.0);
  });

  Loop(4, ({ i }) => {
    out.addAssign(float(i));
  });

  return out;
});

// Ternary-like
const value = select(uv().x.greaterThan(0.5), 1.0, 0.0);
```

## Functions

```js
const wave = Fn(([x, t = time]) => {
  return sin(x.mul(6.0).add(t)).mul(0.1);
});

material.positionNode = positionLocal.add(vec3(0, wave(positionLocal.x), 0));
```

## Textures

```js
const albedo = texture(map, uv());
const detail = texture(detailMap, uv().mul(8.0));
material.colorNode = albedo.rgb.mul(detail.rgb);

texture(map, uv(), level);
textureLoad(map, ivec2(uv().mul(1024)));
textureSize(map);
triplanarTexture(map);
```

## Fresnel

```js
const fresnel = pow(oneMinus(abs(dot(normalView, positionView.negate().normalize()))), 3.0);
material.emissiveNode = color(0x00e5ff).mul(fresnel);
```

## Dissolve

```js
const threshold = uniform(0.0);
const n = texture(noiseMap, uv()).r;
material.opacityNode = smoothstep(threshold.sub(0.05), threshold, n);
material.alphaTestNode = material.opacityNode;
```

## Instancing

```js
const random = hash(instanceIndex);
material.colorNode = mix(color(0xff3366), color(0x33aaff), random);

const offset = range(new THREE.Color(0x000000), new THREE.Color(0xffffff));
```

## Post-processing

```js
const scenePass = pass(scene, camera);
const pipeline = new THREE.RenderPipeline(renderer);

pipeline.outputNode = bloom(scenePass, 0.8, 0.3, 0.85);
pipeline.render();
```

## MRT

```js
scenePass.setMRT(mrt({
  output: output,
  normal: packNormalToRGB(normalView),
  velocity: velocity,
}));

const colorNode = scenePass.getTextureNode('output');
const normalNode = scenePass.getTextureNode('normal');
const depthNode = scenePass.getTextureNode('depth');
```

## Compute

```js
const positions = instancedArray(count, 'vec3');

const update = compute(() => {
  const p = positions.element(instanceIndex);
  p.addAssign(vec3(0, 0.01, 0));
});

renderer.compute(update);
```

## Rules

- `Fn()` is required for control flow.
- Use `.toVar()` for reusable intermediate values.
- `positionLocal` includes skinning/morphing; `positionGeometry` is raw.
- TSL compiles to WGSL (WebGPU) or GLSL (WebGL).
- Node materials replace most `onBeforeCompile` use cases.
- Do not mix `ShaderMaterial` with WebGPU expecting lights/compute.
