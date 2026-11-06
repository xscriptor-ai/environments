# 17 — Accessibility for 3D Web Experiences

## 1. Why it matters

A `<canvas>` is opaque to assistive technology. Screen readers see an empty element. Keyboard users cannot reach 3D objects. Motion can cause nausea. If you do not design alternatives, the experience is unusable for many people. Accessibility is also a legal requirement in many jurisdictions (WCAG 2.2, ADA, European Accessibility Act).

## 2. WCAG 2.2 principles (POUR)

| Principle | Meaning | 3D implications |
|---|---|---|
| Perceivable | Information must be perceivable | Text alternatives, contrast, captions, no color-only meaning |
| Operable | UI must be operable | Keyboard, focus, no traps, enough time, no seizure-inducing flashing |
| Understandable | Predictable and clear | Instructions, consistent navigation, error messages |
| Robust | Works with AT and browsers | Semantic DOM, ARIA, progressive enhancement |

Target **WCAG 2.2 AA** as the baseline.

## 3. The DOM mirror pattern

Provide a semantic DOM representation of the 3D content:

```html
<div class="stage">
  <canvas aria-hidden="true"></canvas>
  <div class="a11y-panel" role="region" aria-label="Interactive 3D scene">
    <h2>Product configurator</h2>
    <p>Use the controls below to change color and material.</p>
    <fieldset>
      <legend>Color</legend>
      <button aria-pressed="true">Blue</button>
      <button aria-pressed="false">Red</button>
    </fieldset>
    <button id="reset-camera">Reset view</button>
    <p aria-live="polite" id="status"></p>
  </div>
</div>
```

Rules:

- The canvas is decorative to AT (`aria-hidden="true"`) when a DOM equivalent exists.
- The DOM panel contains the same actions and information.
- Do not duplicate focusable elements in both DOM and 3D; choose one interaction model per action.
- Update `aria-live` regions for state changes (selection, loading, errors).

## 4. Keyboard navigation

Every pointer interaction must have a keyboard equivalent:

| Action | Keyboard |
|---|---|
| Focus next/previous object | Tab / Shift+Tab, or arrow keys |
| Select | Enter/Space |
| Rotate camera | Arrow keys |
| Zoom | + / − |
| Reset | Home or R |
| Escape/close | Escape |
| Pause animation | Space or a visible Pause button |

```js
canvas.tabIndex = 0;
canvas.addEventListener('keydown', (event) => {
  switch (event.key) {
    case 'ArrowLeft': rotate(-1); break;
    case 'ArrowRight': rotate(1); break;
    case 'Enter': selectFocused(); break;
    case 'Escape': clearSelection(); break;
  }
});
```

- Provide a visible focus indicator; do not remove outlines without a replacement.
- Do not trap focus inside the canvas.
- Provide skip links for long experiences.
- Make the focus order match the visual order.

## 5. Screen readers

- Use semantic HTML for the DOM mirror (`button`, `fieldset`, `legend`, headings).
- Use `aria-pressed` for toggles, `aria-selected` for selection, `aria-live="polite"` for updates.
- Label the 3D region with `aria-label`/`aria-labelledby`.
- Describe the scene's purpose in text, not just "3D scene".
- Provide a text summary of the visual content and interactions.
- Avoid `aria-hidden` on content that is the only way to access information.
- Test with VoiceOver (macOS/iOS), NVDA (Windows), or Orca (Linux).

## 6. Motion and vestibular safety

- Respect `prefers-reduced-motion`:

```js
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduce) {
  // jump to final state, no camera fly-through, no parallax
}
```

- Provide pause/play for autoplaying animation, video, and camera motion.
- Avoid rapid camera rotations, zoom pulses, and parallax.
- No flashing more than 3 times per second (seizure risk).
- Avoid full-screen movement that triggers vection.
- Let users disable ambient motion independently of system settings.

## 7. Color and contrast

- Text overlay must meet contrast ratios (4.5:1 body, 3:1 large text) against the rendered background. Since the 3D background changes, add a solid/scrim behind text.
- Do not rely on color alone for state; use labels, icons, or patterns.
- Provide a high-contrast mode if the art direction is dark/low-contrast.
- Test with grayscale and color-blind simulations.

## 8. Time and cognitive load

- Do not impose time limits; if unavoidable, allow extension.
- Provide clear instructions and onboarding.
- Keep interactions simple; avoid requiring precise 3D clicks.
- Provide a reset and a way back.
- Provide captions/transcripts for audio and narration.

## 9. Loading, errors, and status

```html
<div role="status" aria-live="polite">Loading 3D scene: 40%</div>
<button id="retry" hidden>Retry</button>
```

- Announce loading progress and completion.
- Announce errors with actionable text.
- Do not move focus unexpectedly when loading finishes.
- Provide a fallback image/video and a link to alternatives.

## 10. Implementation patterns

### 10.1 Vanilla

```html
<div class="stage">
  <canvas id="scene" aria-hidden="true"></canvas>
  <div id="controls" role="region" aria-label="Scene controls">
    <button id="prev">Previous</button>
    <button id="next">Next</button>
    <button id="pause" aria-pressed="false">Pause</button>
    <p id="status" aria-live="polite"></p>
  </div>
</div>
```

```js
function announce(message) {
  document.getElementById('status').textContent = message;
}

function selectObject(index) {
  // update 3D state
  announce(`Selected object ${index + 1} of ${total}`);
}
```

### 10.2 R3F / Drei

- `@react-three/a11y` provides `A11y`, `A11yAnnouncer`, `useA11y`, and focusable 3D objects with DOM semantics.
- `drei/Html` can render accessible DOM anchored to 3D objects; use it for labels and controls.
- Keep the main controls in normal DOM outside the Canvas.

```jsx
import { A11y, A11yAnnouncer } from '@react-three/a11y';

<A11y
  role="button"
  description="Select the blue chair"
  activationHandler={() => select('blue')}
>
  <mesh>...</mesh>
</A11y>
<A11yAnnouncer />
```

### 10.3 Focused 3D navigation

- Maintain a focus index; highlight the focused object with an outline.
- Move focus with arrow keys/Tab.
- Announce the focused object's name and description.
- Enter/Space activates; Escape clears.

## 11. Fallbacks and progressive enhancement

- Detect WebGL2/WebGPU; if unavailable, show a static image/video with the same information and a link.
- Provide a reduced/scene-less mode for low-end devices.
- Provide alt text for the poster image.
- Ensure content is available without JavaScript where possible.

## 12. Testing

### Automated

- axe-core / `@axe-core/react` for DOM accessibility.
- Lighthouse accessibility audit.
- eslint-plugin-jsx-a11y (React).
- Contrast checkers.

### Manual

- Navigate only with the keyboard.
- Use a screen reader.
- Enable `prefers-reduced-motion`.
- Test at 200% zoom and small viewports.
- Test with grayscale/color-blind simulation.
- Test pause, reset, and error states.

### 3D-specific

- Can every action be performed without a pointer?
- Is every object's information available in text?
- Does the scene announce changes?
- Does the experience pause and resume correctly?
- Does it work when the canvas fails to load?

## 13. Checklist

- [ ] Canvas has a DOM equivalent and is `aria-hidden` when appropriate.
- [ ] All interactions have keyboard equivalents.
- [ ] Visible focus indicator; logical tab order.
- [ ] ARIA labels, roles, and live regions for state changes.
- [ ] `prefers-reduced-motion` respected; pause control available.
- [ ] No flashing or seizure-inducing patterns.
- [ ] Text contrast meets WCAG AA against changing backgrounds.
- [ ] Color is not the only indicator.
- [ ] Loading/error states announced.
- [ ] Fallback for unsupported devices.
- [ ] Tested with keyboard, screen reader, and reduced motion.
- [ ] Audio has captions/transcripts and is off by default.
