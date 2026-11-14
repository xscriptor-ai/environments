# 19 — Code Recipes

Copy-paste patterns for common tasks. All code targets r187 unless noted.

## 1. Minimal vanilla WebGL scene

```js
import * as THREE from 'three';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0d12);

const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 1.5, 4);

const mesh = new THREE.Mesh(
  new THREE.BoxGeometry(),
  new THREE.MeshStandardMaterial({ color: 0x88aaff, roughness: 0.4 })
);
scene.add(mesh, new THREE.HemisphereLight(0xffffff, 0x223344, 1.5));

const dir = new THREE.DirectionalLight(0xffffff, 2.5);
dir.position.set(3, 5, 2);
scene.add(dir);

const timer = new THREE.Timer();

renderer.setAnimationLoop((t) => {
  timer.update(t);
  const dt = timer.getDelta();
  mesh.rotation.y += dt * 0.5;
  renderer.render(scene, camera);
});

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
```

## 2. WebGPU scene with WebGL fallback

```js
import * as THREE from 'three/webgpu';

async function createRenderer(canvas) {
  if (navigator.gpu) {
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (adapter) {
        const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
        await renderer.init();
        return renderer;
      }
    } catch (error) {
      console.warn('WebGPU failed', error);
    }
  }
  return new THREE.WebGPURenderer({ canvas, antialias: true, forceWebGL: true });
}
```

## 3. R3F scene

```jsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';

export default function App() {
  return (
    <Canvas shadows camera={{ position: [3, 2, 5], fov: 45 }} dpr={[1, 2]}>
      <color attach="background" args={['#0b0d12']} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 4]} intensity={2} castShadow />
      <mesh castShadow receiveShadow>
        <boxGeometry />
        <meshStandardMaterial color="orange" roughness={0.3} />
      </mesh>
      <Environment preset="studio" />
      <OrbitControls enableDamping />
    </Canvas>
  );
}
```

## 4. Resize with DPR cap and ResizeObserver

```js
function resize() {
  const w = container.clientWidth;
  const h = container.clientHeight;
  const dpr = Math.min(devicePixelRatio, 2);
  renderer.setPixelRatio(dpr);
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  composer?.setSize(w, h);
}

new ResizeObserver(resize).observe(container);
resize();
```

## 5. Load glTF with Draco, KTX2, and meshopt

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

## 6. HDR environment with PMREM

```js
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

const hdr = await new HDRLoader().loadAsync('/env/studio.hdr');
hdr.mapping = THREE.EquirectangularReflectionMapping;

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromEquirectangular(hdr).texture;
scene.environmentIntensity = 1;
pmrem.dispose();
hdr.dispose();
```

## 7. Raycast hover and click

```js
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hovered = null;

function update(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

renderer.domElement.addEventListener('pointermove', (event) => {
  update(event);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(interactive, true)[0]?.object ?? null;
  if (hit !== hovered) {
    if (hovered) hovered.material.emissive.setHex(0x000000);
    hovered = hit;
    if (hovered) hovered.material.emissive.setHex(0x222222);
    renderer.domElement.style.cursor = hovered ? 'pointer' : 'default';
  }
});
```

## 8. InstancedMesh with per-instance color

```js
const count = 10000;
const mesh = new THREE.InstancedMesh(geometry, material, count);
const matrix = new THREE.Matrix4();
const color = new THREE.Color();

for (let i = 0; i < count; i++) {
  const x = (i % 100) - 50;
  const z = Math.floor(i / 100) - 50;
  matrix.makeTranslation(x, 0, z);
  mesh.setMatrixAt(i, matrix);
  mesh.setColorAt(i, color.setHSL((i / count) % 1, 0.6, 0.5));
}

mesh.instanceMatrix.needsUpdate = true;
mesh.instanceColor.needsUpdate = true;
mesh.computeBoundingSphere();
scene.add(mesh);
```

## 9. LOD

```js
const lod = new THREE.LOD();
lod.addLevel(new THREE.Mesh(highGeo, mat), 0);
lod.addLevel(new THREE.Mesh(midGeo, mat), 10);
lod.addLevel(new THREE.Mesh(lowGeo, mat), 30);
scene.add(lod);
```

## 10. GLSL fresnel shader

```js
const material = new THREE.ShaderMaterial({
  uniforms: { uColor: { value: new THREE.Color(0x00e5ff) } },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vView;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vNormal = normalize(normalMatrix * normal);
      vView = normalize(-mv.xyz);
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    varying vec3 vNormal;
    varying vec3 vView;
    void main() {
      float f = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 3.0);
      gl_FragColor = vec4(uColor * f, f);
    }
  `,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});
```

## 11. TSL gradient

```js
import * as THREE from 'three/webgpu';
import { color, mix, uv } from 'three/tsl';

const material = new THREE.MeshStandardNodeMaterial();
material.colorNode = mix(color(0xff3366), color(0x3366ff), uv().x);
```

## 12. TSL dissolve

```js
import { texture, uv, smoothstep, uniform } from 'three/tsl';

const threshold = uniform(0);
const noiseValue = texture(noiseMap, uv()).r;

material.opacityNode = smoothstep(threshold.sub(0.05), threshold, noiseValue);
material.alphaTestNode = material.opacityNode;
// Set threshold.value from 0 to 1
```

## 13. TSL vertex displacement

```js
import { positionLocal, normalLocal, texture, uv } from 'three/tsl';

const height = texture(heightMap, uv()).r.mul(0.2);
material.positionNode = positionLocal.add(normalLocal.mul(height));
```

## 14. WebGL bloom with postprocessing

```js
import { EffectComposer, RenderPass, EffectPass, BloomEffect, SMAAEffect } from 'postprocessing';

const composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType });
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new EffectPass(
  camera,
  new BloomEffect({ intensity: 0.8, luminanceThreshold: 0.85, mipmapBlur: true }),
  new SMAAEffect()
));

function loop(dt) {
  composer.render(dt);
}
```

## 15. WebGPU RenderPipeline with bloom

```js
import * as THREE from 'three/webgpu';
import { pass, bloom, renderOutput } from 'three/tsl';

const pipeline = new THREE.RenderPipeline(renderer);
const scenePass = pass(scene, camera);
pipeline.outputNode = renderOutput(bloom(scenePass, 0.7, 0.3, 0.85));

renderer.setAnimationLoop(() => pipeline.render());
```

## 16. OrbitControls with damping

```js
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 2;
controls.maxDistance = 20;
controls.maxPolarAngle = Math.PI / 2;

function loop(dt) {
  controls.update();
  renderer.render(scene, camera);
}
```

## 17. Scroll-driven camera path

```js
const path = new THREE.CatmullRomCurve3(points, false, 'centripetal');
const lookPath = new THREE.CatmullRomCurve3(lookPoints, false, 'centripetal');

let target = 0;
addEventListener('scroll', () => {
  const max = document.body.scrollHeight - innerHeight;
  target = THREE.MathUtils.clamp(scrollY / max, 0, 1);
});

let current = 0;
function loop(dt) {
  current = THREE.MathUtils.damp(current, target, 6, dt);
  camera.position.copy(path.getPointAt(current));
  camera.lookAt(lookPath.getPointAt(current));
  renderer.render(scene, camera);
}
```

## 18. Product turntable

```js
const pivot = new THREE.Group();
pivot.add(model);
scene.add(pivot);

function loop(dt) {
  if (!dragging) pivot.rotation.y += dt * 0.3;
  renderer.render(scene, camera);
}
```

Add drag-to-rotate by mapping pointer delta to `pivot.rotation.y`, with inertia.

## 19. Contact shadows (Drei)

```jsx
import { ContactShadows } from '@react-three/drei';

<ContactShadows
  position={[0, 0, 0]}
  opacity={0.5}
  scale={10}
  blur={2}
  far={4}
/>
```

## 20. Room environment

```js
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
pmrem.dispose();
```

## 21. Drag an object on a plane

```js
const plane = new THREE.Plane();
const point = new THREE.Vector3();
const offset = new THREE.Vector3();
let dragging = null;

function onDown(event) {
  updatePointer(event);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(draggable, true)[0];
  if (!hit) return;
  dragging = hit.object;
  const normal = camera.getWorldDirection(new THREE.Vector3()).negate();
  plane.setFromNormalAndCoplanarPoint(normal, hit.point);
  offset.copy(dragging.position).sub(hit.point);
  renderer.domElement.setPointerCapture(event.pointerId);
}

function onMove(event) {
  if (!dragging) return;
  updatePointer(event);
  raycaster.setFromCamera(pointer, camera);
  if (raycaster.ray.intersectPlane(plane, point)) {
    dragging.position.copy(point).add(offset);
  }
}

function onUp() { dragging = null; }
```

## 22. Rapier physics ball pit

```js
import RAPIER from '@dimforge/rapier3d-compat';
await RAPIER.init();

const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
world.createCollider(
  RAPIER.ColliderDesc.cuboid(10, 0.1, 10),
  world.createRigidBody(RAPIER.RigidBodyDesc.fixed())
);

const bodies = [];
for (let i = 0; i < 50; i++) {
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic().setTranslation(
      Math.random() * 4 - 2,
      2 + i * 0.5,
      Math.random() * 4 - 2
    )
  );
  world.createCollider(RAPIER.ColliderDesc.ball(0.2).setRestitution(0.5), body);
  const mesh = new THREE.Mesh(sphereGeo, sphereMat);
  scene.add(mesh);
  bodies.push({ body, mesh });
}

const FIXED = 1 / 60;
let acc = 0;
function physics(dt) {
  acc += Math.min(dt, 0.25);
  while (acc >= FIXED) {
    world.step();
    acc -= FIXED;
  }
  for (const { body, mesh } of bodies) {
    const t = body.translation();
    const r = body.rotation();
    mesh.position.set(t.x, t.y, t.z);
    mesh.quaternion.set(r.x, r.y, r.z, r.w);
  }
}
```

## 23. Adaptive DPR

```js
let dpr = Math.min(devicePixelRatio, 2);
let frames = 0, elapsed = 0;

function adapt(dt) {
  frames++; elapsed += dt;
  if (elapsed < 1) return;
  const fps = frames / elapsed;
  frames = 0; elapsed = 0;

  if (fps < 50 && dpr > 1) dpr = Math.max(1, dpr - 0.25);
  else if (fps > 58 && dpr < Math.min(devicePixelRatio, 2)) dpr += 0.25;

  renderer.setPixelRatio(dpr);
  renderer.setSize(innerWidth, innerHeight, false);
}
```

## 24. Cleanup pattern

```js
function disposeScene(root) {
  root.traverse((obj) => {
    obj.geometry?.dispose();
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const mat of mats) {
      if (!mat) continue;
      for (const value of Object.values(mat)) {
        if (value?.isTexture) value.dispose();
      }
      mat.dispose();
    }
  });
}

renderer.setAnimationLoop(null);
disposeScene(scene);
renderer.dispose();
```

## 25. Pause when hidden

```js
const timer = new THREE.Timer();

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    renderer.setAnimationLoop(null);
  } else {
    timer.reset();
    renderer.setAnimationLoop(loop);
  }
});
```

## 26. Project a 3D point to a DOM label

```js
const v = new THREE.Vector3();

function updateLabel(object, element) {
  object.getWorldPosition(v).project(camera);
  const x = (v.x * 0.5 + 0.5) * innerWidth;
  const y = (-v.y * 0.5 + 0.5) * innerHeight;
  const visible = v.z < 1;
  element.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
  element.style.opacity = visible ? '1' : '0';
}
```

## 27. Reduced motion

```js
const reduce = matchMedia('(prefers-reduced-motion: reduce)');

function applyMotionPreference() {
  ambientAnimation.enabled = !reduce.matches;
  cameraPathEnabled = !reduce.matches;
}

reduce.addEventListener('change', applyMotionPreference);
applyMotionPreference();
```

## 28. onBeforeCompile wave

```js
material.onBeforeCompile = (shader) => {
  shader.uniforms.uTime = { value: 0 };
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nuniform float uTime;')
    .replace('#include <begin_vertex>', `
      #include <begin_vertex>
      transformed.y += sin(transformed.x * 4.0 + uTime) * 0.08;
    `);
  material.userData.shader = shader;
};
```

## 29. Troika text

```js
import { Text } from 'troika-three-text';

const text = new Text();
text.text = 'Hello 3D';
text.font = '/fonts/Inter.woff';
text.fontSize = 0.3;
text.color = 0xffffff;
text.anchorX = 'center';
text.sync();
scene.add(text);
```

## 30. HTML label with Drei

```jsx
import { Html } from '@react-three/drei';

<mesh position={[0, 1, 0]}>
  <boxGeometry />
  <meshStandardMaterial />
  <Html center distanceFactor={8}>
    <button onClick={select}>Select</button>
  </Html>
</mesh>
```
