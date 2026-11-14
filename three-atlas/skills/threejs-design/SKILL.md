---
name: threejs-design
description: Art direction and interaction design for 3D web experiences, including composition, lighting, color, motion, typography, UI overlay, storytelling, responsive composition, and accessibility. Use when designing a 3D landing page, portfolio, product viewer, configurator, or immersive narrative.
---

# 3D Web Design

## Read first

- `../../docs/16-interactive-design.md` — full guide.
- `../../docs/17-accessibility.md` — accessibility.
- `../../docs/05-lights-shadows-environment.md` — lighting.
- `../../docs/04-materials-pbr-color.md` — materials/color.

## Start with purpose

Define in one sentence:

- Who is the user?
- What should they feel, understand, and do?
- What is the core interaction?
- What devices and performance budget?
- What happens without WebGL or with reduced motion?

If 3D does not serve the answer, remove it.

## Composition

- Rule of thirds for hero objects; center for products.
- Reserve negative space for DOM copy and CTAs.
- Use depth cues: occlusion, lighting, shadows, DOF, parallax, fog, scale.
- Camera angle sets emotion: low = powerful, eye = real, high = overview.
- Test desktop and portrait mobile compositions separately.

## Light and color

- Key/fill/rim for form.
- Warm/cool contrast separates subject and background.
- Tone mapping: Neutral/AgX for product, ACES for cinematic, NoToneMapping for flat.
- Bloom subtle unless the style is neon.
- Palette in OKLCH for perception; convert to linear for 3D.
- Do not rely on color alone.

## Motion

- Every motion must explain, guide, convey physics, or create atmosphere.
- 100-200 ms feedback, 200-400 ms UI, 400-800 ms camera/section transitions.
- Ease-out entrances, ease-in-outs for camera moves.
- Slow camera motion; fast rotation causes discomfort.
- Respect `prefers-reduced-motion`; provide pause.
- 60 fps is part of the design.

## Typography and UI

- Body text in DOM, always.
- Labels: DOM projected or troika SDF text.
- Hero display: Text3D/TextGeometry or DOM with 3D effect.
- Canvas and UI as siblings; UI `pointer-events` managed per element.
- Large hit areas; no hover-only critical actions.
- Provide loading, error, and empty states.

## Storytelling

- Sections with beginning/middle/end.
- Scroll as timeline; keep scroll native where possible.
- Pinned moments for key beats.
- Navigation/progress/skip.
- A static or reduced-motion path that shows all content.
- Sound optional, off by default, with controls.

## Accessibility

- DOM mirror of 3D content and actions.
- Keyboard equivalents for every pointer interaction.
- Visible focus, ARIA labels, live regions.
- `prefers-reduced-motion`, pause, no flashing.
- Text contrast against changing backgrounds.
- Fallback image/video for unsupported devices.

## Process

Brief -> references -> wireframe -> gray-box prototype -> art pass -> assets -> integration -> QA -> launch.

## Verification

- Composition works on desktop and portrait mobile.
- Motion has purpose and a reduced-motion path.
- Every 3D action has a DOM/keyboard equivalent.
- Performance budget met on mid-range mobile.
- Loading/error/fallback designed.
- Accessibility checked.
