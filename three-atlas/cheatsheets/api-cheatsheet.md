# Three.js API Cheat Sheet (r187)

## Imports

```js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three/webgpu';        // WebGPU
import { color, uv, texture } from 'three/tsl'; // TSL
```

## Renderer

```js
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(w, h, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.setAnimationLoop(loop);
renderer.setAnimationLoop(null);
renderer.dispose();
renderer.info.render.calls;
renderer.info.memory.geometries;
```

## Scene and camera

```js
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.environment = envTexture;
scene.environmentIntensity = 1;

const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
camera.position.set(0, 1.5, 5);
camera.lookAt(0, 0, 0);
camera.updateProjectionMatrix();

const ortho = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 100);
```

## Objects

```js
new THREE.Mesh(geometry, material);
new THREE.Group();
new THREE.Line(geometry, material);
new THREE.Points(geometry, material);
new THREE.Sprite(material);
new THREE.InstancedMesh(geometry, material, count);
new THREE.BatchedMesh(maxGeometries, maxVertices, maxIndices, material);
new THREE.LOD();

object.position.set(x, y, z);
object.rotation.set(x, y, z);
object.quaternion.setFromAxisAngle(axis, angle);
object.scale.setScalar(s);
object.visible = false;
object.castShadow = true;
object.receiveShadow = true;
object.renderOrder = 1;
object.layers.enable(1);
object.traverse(fn);
object.lookAt(target);
```

## Geometry

```js
new THREE.BoxGeometry(w, h, d);
new THREE.SphereGeometry(r, 32, 16);
new THREE.PlaneGeometry(w, h, 1, 1);
new THREE.CylinderGeometry(rt, rb, h, 32);
new THREE.ConeGeometry(r, h, 32);
new THREE.TorusGeometry(r, tube, 16, 48);
new THREE.CircleGeometry(r, 32);
new THREE.RingGeometry(inner, outer, 32);
new THREE.CapsuleGeometry(radius, height, 8, 16);
new THREE.IcosahedronGeometry(r, detail);
new THREE.TubeGeometry(path, tubularSegments, radius, radialSegments);
new THREE.ExtrudeGeometry(shape, options);

geometry.setAttribute('position', new THREE.Float32BufferAttribute(array, 3));
geometry.setIndex([0, 1, 2]);
geometry.computeVertexNormals();
geometry.computeBoundingSphere();
geometry.computeBoundingBox();
geometry.dispose();
```

## Materials

```js
new THREE.MeshBasicMaterial({ color });
new THREE.MeshStandardMaterial({ color, metalness, roughness, map, normalMap });
new THREE.MeshPhysicalMaterial({ clearcoat, transmission, thickness, ior, sheen, iridescence, anisotropy });
new THREE.MeshLambertMaterial();
new THREE.MeshPhongMaterial();
new THREE.MeshToonMaterial();
new THREE.MeshMatcapMaterial({ matcap });
new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader });
new THREE.PointsMaterial({ size, sizeAttenuation, map, alphaTest });
new THREE.LineBasicMaterial({ color });

material.transparent = true;
material.opacity = 0.5;
material.alphaTest = 0.5;
material.depthWrite = false;
material.side = THREE.DoubleSide;
material.toneMapped = false;
material.dispose();
```

## Textures

```js
const tex = new THREE.TextureLoader().load('/tex.png');
tex.colorSpace = THREE.SRGBColorSpace; // color maps only
tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
tex.repeat.set(2, 2);
tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
tex.dispose();

new THREE.CanvasTexture(canvas);
new THREE.DataTexture(data, w, h);
new THREE.VideoTexture(video);
```

## Lights

```js
new THREE.AmbientLight(color, intensity);
new THREE.HemisphereLight(skyColor, groundColor, intensity);
new THREE.DirectionalLight(color, intensity);
new THREE.PointLight(color, intensity, distance, decay);
new THREE.SpotLight(color, intensity, distance, angle, penumbra, decay);
new THREE.RectAreaLight(color, intensity, width, height);

light.castShadow = true;
light.shadow.mapSize.set(2048, 2048);
light.shadow.bias = -0.0005;
light.shadow.normalBias = 0.02;
light.shadow.camera.left = -10;
light.shadow.camera.far = 50;
```

## Controls

```js
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 0);
controls.minDistance = 1;
controls.maxDistance = 50;
controls.maxPolarAngle = Math.PI / 2;
controls.update();
```

## Animation

```js
const mixer = new THREE.AnimationMixer(root);
const action = mixer.clipAction(clip);
action.play();
action.setLoop(THREE.LoopRepeat, Infinity);
action.clampWhenFinished = true;
action.crossFadeTo(other, 0.3, false);
mixer.update(dt);
```

## Raycasting

```js
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
pointer.x = (event.clientX / innerWidth) * 2 - 1;
pointer.y = -(event.clientY / innerHeight) * 2 + 1;
raycaster.setFromCamera(pointer, camera);
const hits = raycaster.intersectObjects(objects, true);
```

## Loading

```js
new THREE.TextureLoader().load(url, onLoad, onProgress, onError);
new THREE.FileLoader().load(url, onLoad);
const gltf = await new GLTFLoader().loadAsync(url);
const hdr = await new HDRLoader().loadAsync(url);

loader.setDRACOLoader(draco);
loader.setKTX2Loader(ktx2);
loader.setMeshoptDecoder(MeshoptDecoder);
```

## Math

```js
new THREE.Vector3(x, y, z);
v.add(b); v.sub(b); v.multiplyScalar(s);
v.dot(b); v.cross(b); v.normalize(); v.length();
v.lerp(target, t);
v.project(camera); v.unproject(camera);

new THREE.Quaternion().setFromEuler(euler);
q.slerp(target, t);

new THREE.Matrix4().compose(position, quaternion, scale);
m.multiply(other); m.invert(); m.decompose(p, q, s);

new THREE.Box3().setFromObject(obj);
new THREE.Sphere().setFromPoints(points);
new THREE.Ray(origin, direction);
THREE.MathUtils.damp(x, target, lambda, dt);
```

## Disposal

```js
geometry.dispose();
material.dispose();
texture.dispose();
renderTarget.dispose();
renderer.dispose();
```

## Constants

```js
THREE.FrontSide / BackSide / DoubleSide
THREE.SRGBColorSpace / LinearSRGBColorSpace / NoColorSpace
THREE.RepeatWrapping / ClampToEdgeWrapping / MirroredRepeatWrapping
THREE.NoToneMapping / LinearToneMapping / ACESFilmicToneMapping / AgXToneMapping / NeutralToneMapping
THREE.PCFShadowMap / BasicShadowMap / VSMShadowMap
THREE.AdditiveBlending / NormalBlending / MultiplyBlending
THREE.LoopOnce / LoopRepeat / LoopPingPong
```
