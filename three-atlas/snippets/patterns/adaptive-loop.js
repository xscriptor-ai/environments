import * as THREE from 'three';

/**
 * Render loop with:
 * - delta clamped in seconds
 * - visibility pause/resume
 * - adaptive pixel ratio with hysteresis
 * - optional onQualityChange callback
 */
export function createAdaptiveLoop({
  renderer,
  camera,
  scene,
  container,
  minDpr = 1,
  maxDpr = 2,
  targetFps = 60,
  onUpdate,
  onQualityChange,
}) {
  const timer = new THREE.Timer();
  let dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  let running = true;
  let frames = 0;
  let elapsed = 0;

  applyDpr(dpr);

  function applyDpr(value) {
    dpr = THREE.MathUtils.clamp(value, minDpr, maxDpr);
    renderer.setPixelRatio(dpr);
    renderer.setSize(container.clientWidth, container.clientHeight, false);
    onQualityChange?.({ dpr });
  }

  function adapt(dt) {
    frames++;
    elapsed += dt;
    if (elapsed < 1) return;

    const fps = frames / elapsed;
    frames = 0;
    elapsed = 0;

    if (fps < targetFps - 10 && dpr > minDpr) {
      applyDpr(dpr - 0.25);
    } else if (fps > targetFps - 2 && dpr < maxDpr) {
      applyDpr(dpr + 0.25);
    }
  }

  function loop(timestamp) {
    if (!running) return;

    timer.update(timestamp);
    const dt = Math.min(timer.getDelta(), 0.1);

    onUpdate?.(dt, timer.getElapsed());
    adapt(dt);
    renderer.render(scene, camera);
  }

  function start() {
    running = true;
    timer.reset();
    renderer.setAnimationLoop(loop);
  }

  function stop() {
    running = false;
    renderer.setAnimationLoop(null);
  }

  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width === 0 || height === 0) return;

    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);

  function handleVisibility() {
    if (document.hidden) stop();
    else start();
  }

  document.addEventListener('visibilitychange', handleVisibility);

  return {
    start,
    stop,
    resize,
    get dpr() {
      return dpr;
    },
    dispose() {
      stop();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
    },
  };
}
