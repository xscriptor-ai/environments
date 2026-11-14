# Performance Checklist

## Budgets

- [ ] Target frame time defined (16.6 ms for 60 fps).
- [ ] Draw calls budget defined (mobile < 100, desktop < 500).
- [ ] Triangle budget defined (mobile 100k-300k, desktop 500k-2M).
- [ ] Texture memory budget defined (mobile < 100 MB, desktop < 300-500 MB).
- [ ] Download budget defined (mobile < 2-5 MB, desktop < 10-20 MB).
- [ ] Quality tiers defined (low/mid/high).

## Rendering

- [ ] Pixel ratio capped at 2 (1.5 mobile).
- [ ] Adaptive DPR with hysteresis, or a manual quality setting.
- [ ] Instancing/batching used for repeated objects.
- [ ] Static geometry merged where appropriate.
- [ ] Materials shared.
- [ ] Frustum culling enabled; bounding volumes valid.
- [ ] LOD or impostors for distant objects.
- [ ] Small/distant objects culled.
- [ ] No `DoubleSide` without reason.
- [ ] Transparency minimized; `alphaTest`/`alphaHash` where possible.

## Textures

- [ ] KTX2/Basis compression.
- [ ] Power-of-two sizes.
- [ ] Mipmaps enabled.
- [ ] Anisotropy 4-8, not 16 everywhere.
- [ ] Textures downscaled to on-screen size.
- [ ] Shared/atlased textures.

## Lighting and shadows

- [ ] Shadow-casting lights limited (mobile 1-2, desktop 2-4).
- [ ] Shadow map sizes reasonable (1024-2048).
- [ ] Shadow camera bounds tight.
- [ ] Static shadows frozen or baked.
- [ ] Environment map used instead of many fill lights.
- [ ] No point light shadows unless necessary.

## Post-processing

- [ ] Effects budgeted (mobile 1-2, desktop 2-4).
- [ ] Resolution scaling for heavy effects.
- [ ] Bloom uses mipmap blur.
- [ ] DOF/SSR disabled on low-end.
- [ ] Tone mapping/color space applied once.

## CPU

- [ ] No per-frame allocations in hot paths.
- [ ] No `setState` per frame in React.
- [ ] Raycasting throttled and/or BVH-accelerated.
- [ ] Resize debounced/ResizeObserver.
- [ ] Physics fixed step and limited bodies.
- [ ] Heavy work in workers where possible.
- [ ] Event listeners cleaned up.

## Startup

- [ ] 3D bundle code-split.
- [ ] Assets compressed and cached.
- [ ] Critical assets preloaded; rest lazy.
- [ ] Loading UI/skeleton shown.
- [ ] `compileAsync` before reveal.
- [ ] Time to first frame measured.

## Memory

- [ ] Geometries disposed.
- [ ] Materials disposed.
- [ ] Textures disposed.
- [ ] Render targets disposed.
- [ ] `renderer.info.memory` stable after teardown.
- [ ] No leaked listeners, timers, workers, or contexts.

## Validation

- [ ] Measured with `renderer.info`.
- [ ] Profiled CPU and GPU separately.
- [ ] 95th percentile frame time measured.
- [ ] Tested on a real mid-range mobile device.
- [ ] Tested after 5-10 minutes for throttling/leaks.
- [ ] Fallback/quality tier verified.
