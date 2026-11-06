# 16 — Interactive Design for the Web

## 1. Design before code

A 3D scene is not a design. A design is a decision about **what the user should feel, understand, and do**, and which 3D techniques serve that.

Start with:

1. **Purpose**: portfolio, product configurator, data story, game, landing page, art piece.
2. **Audience and devices**: mobile-first? low-end hardware? accessibility needs?
3. **Core interaction**: orbit, scroll, click, drag, hover, keyboard.
4. **Narrative**: what changes from beginning to end.
5. **Constraints**: load time, performance budget, brand, SEO.

If the answer is "a spinning cube", the 3D is decoration, not design.

## 2. Art direction

### 2.1 Visual references

Collect references for:

- **Composition**: framing, camera height, negative space.
- **Lighting**: key/fill ratio, color temperature, softness.
- **Materials**: glossy, matte, metallic, translucent, stylized.
- **Motion**: speed, easing, camera choreography.
- **Type and UI**: how 2D overlays interact with 3D.

Build a moodboard and define 5–8 adjectives (e.g., "calm, precise, premium, warm, slow, tactile"). Every decision should serve those adjectives.

### 2.2 Common visual directions

| Direction | Techniques |
|---|---|
| Photoreal product | HDRI studio, Neutral/AgX tone mapping, soft shadows, clearcoat, subtle bloom, restrained motion |
| Cinematic | ACES/AgX, strong key light, fog, DOF, anamorphic bloom, letterbox, slow camera |
| Stylized low-poly | Flat/smooth shading, limited palette, simple materials, geometric composition |
| Toon/anime | Toon material, outlines, flat colors, strong silhouettes |
| Y2K/retro-futurist | Chrome, iridescence, chrome text, grid, bloom, glitch |
| Organic/ambient | Noise displacement, soft light, particles, slow drift, muted palette |
| Data/story | Clear labels, restrained 3D, emphasis on legibility, camera focus transitions |
| Playful | Springs, squash/stretch, bright colors, exaggerated easing |

## 3. Composition and depth

### 3.1 Framing

- Rule of thirds for hero objects; center for symmetry and products.
- Leave negative space for DOM copy and CTAs.
- Keep the subject clear of the edges on mobile crops.
- Use leading lines (roads, grids, architecture) to guide the eye.
- Use scale contrast (tiny vs huge) for drama.

### 3.2 Depth cues

| Cue | Implementation |
|---|---|
| Perspective | Camera fov and distance |
| Occlusion | Objects in front hide objects behind |
| Lighting | Key/fill/rim, ambient occlusion |
| Shadows | Contact shadows ground objects |
| DOF | Blur far/near with post-processing |
| Parallax | Camera/object movement at different rates |
| Atmospheric perspective | Fog/color shift with distance |
| Detail falloff | LOD and texture detail by distance |
| Color temperature | Warm foreground, cool background (or vice versa) |

### 3.3 Camera as a design tool

- Low angle = power, monumentality.
- Eye level = empathy, product realism.
- High angle = overview, smallness.
- Long lens (low fov) = compression, product focus.
- Wide lens (high fov) = immersion, speed, distortion.
- Slow dolly = premium; handheld shake = energy; orbital = showcase.

## 4. Color and light

- Define a palette in a perceptual space (OKLCH) and convert to linear RGB for 3D.
- Use one dominant color, one secondary, one accent.
- Keep contrast intentional: high contrast for drama, low contrast for calm.
- Use warm/cool contrast to separate subject and background.
- Match tone mapping to the mood: Neutral/AgX for product, ACES for cinematic, NoToneMapping for flat stylized.
- Bloom should be subtle unless the style is neon/sci-fi.
- Do not rely on color alone to convey state (accessibility).

```js
// Brand color in CSS, then convert for Three.js
const accent = new THREE.Color('#00e5ff'); // ColorManagement converts sRGB to linear
```

## 5. Motion design

### 5.1 Purpose

Every motion should do at least one of:

- Explain a change (transition, state).
- Guide attention (focus, reveal).
- Convey physics (weight, inertia).
- Create atmosphere (ambient drift).
- Delight (micro-interaction) without blocking.

If it does none, remove it.

### 5.2 Timing

| Duration | Use |
|---|---|
| 100–200 ms | Micro-feedback (hover, press) |
| 200–400 ms | UI transitions, small object moves |
| 400–800 ms | Camera moves, section transitions |
| 1–3 s | Hero reveals, narrative beats |
| 5 s+ | Ambient loops (must be subtle) |

- Entrances ease-out; exits ease-in; camera moves ease-in-out.
- Avoid linear motion except for constant-speed loops.
- Use stagger for groups (20–60 ms offset).
- Respect `prefers-reduced-motion`.

### 5.3 Choreography

- Animate one thing at a time, or a clear hierarchy (camera, then object, then UI).
- Use anticipation and follow-through sparingly.
- Keep camera motion slow; fast rotation causes motion sickness.
- Let the user control or pause long animations.

## 6. Typography in 3D

Options:

| Technique | Pros | Cons |
|---|---|---|
| DOM overlay | Crisp, accessible, easy i18n | Not in 3D space; needs projection |
| `troika-three-text` | SDF, crisp, dynamic, good performance | Another dependency; font loading |
| `TextGeometry` | Real extruded 3D letters | Heavy, static, font JSON |
| `Text3D` (Drei) | Convenient extruded text | Heavy for long text |
| Canvas texture | Full control, cheap | Resolution-dependent, not selectable |

Rules:

- Small body text: DOM, always.
- Labels in 3D: troika or DOM projected.
- Hero display text: `Text3D`/`TextGeometry` or DOM with a 3D effect.
- Maintain contrast and minimum size; test at mobile widths.
- Avoid text that rotates away from the camera unless it is decorative.

## 7. UI overlay and mixed 2D/3D

```
<div class="stage">
  <canvas />
  <div class="ui"> ... DOM buttons, labels, captions ... </div>
</div>
```

- Canvas and UI are siblings; UI has `pointer-events: none` by default, interactive children get `pointer-events: auto`.
- Project 3D anchors to screen space for labels/tooltips (`drei/Html`, manual `project`).
- Use `z-index` and stacking contexts deliberately.
- Keep hit areas large; do not make users click tiny 3D objects.
- Provide a DOM alternative for every 3D-only action.

### Anchored labels

```js
const v = anchor.clone().project(camera);
const x = (v.x * 0.5 + 0.5) * width;
const y = (-v.y * 0.5 + 0.5) * height;
label.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
label.style.opacity = v.z > 1 ? '0' : '1';
```

## 8. Interaction affordances

- Cursor changes on hover (`pointer`, `grab`).
- Hover state is more than color: outline, scale, label, sound (optional).
- Click/tap feedback within 100 ms.
- Drag has a clear grab/grabbing state and a drop target.
- Show loading and error states; never leave a blank canvas.
- Onboarding: a short hint ("drag to rotate") that disappears after use.
- Provide reset/home for camera controls.
- Do not hide critical actions behind hover.

## 9. Storytelling and scroll

- Structure into sections with a clear beginning, middle, end.
- Use scroll as a timeline: camera moves, objects assemble, materials change.
- Pin sections for key moments; keep scroll native where possible.
- Use transitions between scenes (fade, wipe, portal).
- Provide navigation (dots, progress, skip).
- Keep a static/reduced-motion path that shows all content.
- Sound is optional and off by default; provide controls.

## 10. Responsive 3D

- Composition changes with aspect ratio, not just scale.
- On portrait mobile, widen fov or move the camera back; avoid cropping the subject.
- Reduce object count, shadows, and post-processing on low-end devices.
- Keep touch targets ≥ 44 CSS px.
- Provide a mobile-specific camera path if needed.
- Test on real devices with different DPRs.

```js
const isPortrait = height > width;
camera.fov = isPortrait ? 60 : 45;
camera.position.z = isPortrait ? 7 : 5;
camera.updateProjectionMatrix();
```

## 11. Performance as a design constraint

- A 20 fps experience is a failed design, regardless of beauty.
- Budget polygons, draw calls, textures, and effects before production.
- Prefer instancing/batching and baked lighting for rich scenes.
- Design loading as part of the experience: progress, skeleton, poster.
- Use quality tiers: reduce effects on low-end devices without changing the composition.

## 12. Process

1. **Brief**: purpose, audience, constraints, success metric.
2. **References**: moodboard, style frames.
3. **Wireframe**: layout, sections, interaction map.
4. **Prototype**: gray-box 3D, camera, timing.
5. **Art pass**: materials, lighting, post.
6. **Assets**: models, textures, optimization.
7. **Integration**: performance, responsive, accessibility.
8. **QA**: devices, browsers, reduced motion, keyboard.
9. **Launch**: monitoring, fallback, analytics.

## 13. Design checklist

- [ ] Purpose and core interaction are clear in one sentence.
- [ ] Visual direction defined with references and adjectives.
- [ ] Composition works on desktop and portrait mobile.
- [ ] Negative space reserved for copy/CTAs.
- [ ] Lighting and tone mapping match the mood.
- [ ] Motion has purpose, timing, and reduced-motion fallback.
- [ ] Text is legible; body text is DOM.
- [ ] Every 3D action has a DOM/keyboard equivalent.
- [ ] Loading, error, and empty states designed.
- [ ] Performance budget defined and met on mid-range mobile.
- [ ] Accessibility checked (contrast, focus, screen reader, motion).
- [ ] Fallback image/video for unsupported devices and SEO.
