# Launch Checklist

## Functionality

- [ ] Core interaction works on desktop and mobile.
- [ ] Camera controls have limits and reset.
- [ ] All states: idle, hover, focus, active, disabled, loading, error, empty.
- [ ] Assets load with progress and error handling.
- [ ] Animations play, pause, and loop correctly.
- [ ] Physics is stable at low and high framerates.
- [ ] Resize works (including mobile address bar and orientation).
- [ ] No console errors or warnings in production.

## Compatibility

- [ ] WebGL2 supported path.
- [ ] WebGPU path tested if used.
- [ ] Fallback for unsupported browsers/devices.
- [ ] Context loss handled.
- [ ] Tested in Chrome, Firefox, Safari, Edge.
- [ ] Tested on iOS and Android real devices.
- [ ] Tested with DPR 1, 2, and 3 devices.

## Performance

- [ ] Budget met on target hardware.
- [ ] DPR capped/adaptive.
- [ ] No memory growth after navigation.
- [ ] Shaders compiled before first interaction.
- [ ] Startup time acceptable.
- [ ] 95th percentile frame time acceptable.
- [ ] Device does not overheat/throttle during a normal session.

## Accessibility

- [ ] DOM equivalent for 3D content and actions.
- [ ] Keyboard navigation and visible focus.
- [ ] Screen reader labels, roles, live regions.
- [ ] `prefers-reduced-motion` respected; pause control.
- [ ] Text contrast meets WCAG AA over changing backgrounds.
- [ ] No flashing or seizure-inducing patterns.
- [ ] Fallback image/video with alt text.
- [ ] Audio off by default, with controls and captions.

## Content and SEO

- [ ] Page has meaningful title, description, headings.
- [ ] Text content exists in DOM, not only in canvas.
- [ ] Poster/fallback image for social previews.
- [ ] Open Graph/Twitter metadata.
- [ ] Canonical URL and sitemap if applicable.
- [ ] i18n handles text outside the canvas.

## Security

- [ ] Assets served from trusted origins.
- [ ] CORS configured correctly.
- [ ] CSP allows required sources.
- [ ] No secrets in client code.
- [ ] Untrusted glTF/textures size-limited and validated.
- [ ] Dependencies patched.

## Operations

- [ ] Error reporting configured.
- [ ] Performance analytics sampled (privacy-respecting).
- [ ] Feature flags/quality tiers configurable.
- [ ] Cache headers correct for hashed assets.
- [ ] CDN and compression (Brotli/gzip) enabled.
- [ ] Rollback plan.

## Delivery

- [ ] Production build tested (not only dev server).
- [ ] Source maps or error tracking configured.
- [ ] Legal/licenses for assets and fonts reviewed.
- [ ] Analytics consent if required.
- [ ] Final visual QA on target devices.
