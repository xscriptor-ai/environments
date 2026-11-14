import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const canvas = document.querySelector('#scene');
const container = document.querySelector('#app');

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance',
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(container.clientWidth, container.clientHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0d12);

const camera = new THREE.PerspectiveCamera(
  45,
  container.clientWidth / container.clientHeight,
  0.1,
  100
);
camera.position.set(3, 2.2, 5);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 2;
controls.maxDistance = 12;
controls.maxPolarAngle = Math.PI / 2 - 0.05;
controls.target.set(0, 0.6, 0);

const pmrem = new THREE.PMREMGenerator(renderer);
const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environment = environment;
pmrem.dispose();

const hemi = new THREE.HemisphereLight(0xffffff, 0x223344, 0.6);
scene.add(hemi);

const key = new THREE.DirectionalLight(0xffffff, 2.4);
key.position.set(4, 6, 3);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.camera.left = -6;
key.shadow.camera.right = 6;
key.shadow.camera.top = 6;
key.shadow.camera.bottom = -6;
key.shadow.camera.near = 0.5;
key.shadow.camera.far = 20;
key.shadow.normalBias = 0.02;
scene.add(key);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshStandardMaterial({ color: 0x151a22, roughness: 0.9, metalness: 0 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const objects = new THREE.Group();
scene.add(objects);

const boxMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x88aaff,
  metalness: 0.1,
  roughness: 0.3,
  clearcoat: 0.6,
  clearcoatRoughness: 0.2,
});

const sphereMaterial = new THREE.MeshStandardMaterial({
  color: 0xff6b8a,
  metalness: 0.9,
  roughness: 0.25,
});

const box = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), boxMaterial);
box.position.set(-1.1, 0.5, 0);
box.castShadow = true;
box.receiveShadow = true;
objects.add(box);

const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.55, 48, 24), sphereMaterial);
sphere.position.set(1.1, 0.55, 0);
sphere.castShadow = true;
sphere.receiveShadow = true;
objects.add(sphere);

const timer = new THREE.Timer();
let elapsed = 0;

function loop(timestamp) {
  timer.update(timestamp);
  const dt = Math.min(timer.getDelta(), 0.05);
  elapsed += dt;

  box.rotation.y += dt * 0.5;
  box.rotation.x = Math.sin(elapsed * 0.7) * 0.15;
  sphere.position.y = 0.55 + Math.sin(elapsed * 1.4) * 0.08;

  controls.update();
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(loop);

const resizeObserver = new ResizeObserver(() => {
  const width = container.clientWidth;
  const height = container.clientHeight;
  if (width === 0 || height === 0) return;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height, false);

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});

resizeObserver.observe(container);

document.querySelector('#reset').addEventListener('click', () => {
  camera.position.set(3, 2.2, 5);
  controls.target.set(0, 0.6, 0);
  controls.update();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    renderer.setAnimationLoop(null);
  } else {
    timer.reset();
    renderer.setAnimationLoop(loop);
  }
});

function disposeScene(root) {
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

window.addEventListener('pagehide', () => {
  renderer.setAnimationLoop(null);
  resizeObserver.disconnect();
  controls.dispose();
  disposeScene(scene);
  environment.dispose();
  renderer.dispose();
});
