# Accessibility Checklist

## Structure and semantics

- [ ] Canvas has a DOM equivalent for content and actions.
- [ ] Canvas is `aria-hidden="true"` when a DOM mirror exists.
- [ ] Region has a descriptive `aria-label`/`aria-labelledby`.
- [ ] Headings and landmarks structure the page.
- [ ] Scene purpose and instructions are described in text.

## Keyboard

- [ ] All interactions reachable with Tab/arrow keys.
- [ ] Enter/Space activate; Escape closes/clears.
- [ ] Visible focus indicator.
- [ ] Logical focus order.
- [ ] No focus traps (except intentional modals with escape).
- [ ] Skip link for long experiences.
- [ ] Canvas focusable if it handles keys (`tabindex="0"`).

## Screen readers

- [ ] Buttons are `<button>` (or have role + keyboard handling).
- [ ] Toggles use `aria-pressed`; selection uses `aria-selected`.
- [ ] State changes announced with `aria-live="polite"`.
- [ ] Loading, progress, errors, and completion announced.
- [ ] Images/posters have `alt`.
- [ ] Audio/video has captions/transcripts.
- [ ] Tested with VoiceOver/NVDA/Orca.

## Motion

- [ ] `prefers-reduced-motion` respected.
- [ ] Pause/play for autoplaying animation and camera motion.
- [ ] No rapid camera rotation or parallax.
- [ ] No flashing more than 3 times per second.
- [ ] Reduced-motion path shows all content and actions.
- [ ] User can disable ambient motion independently.

## Color and contrast

- [ ] Text overlay meets 4.5:1 (body) / 3:1 (large) against the rendered background.
- [ ] Solid/scrim behind text where the background changes.
- [ ] Information is not conveyed by color alone.
- [ ] High-contrast mode available if needed.
- [ ] Tested in grayscale/color-blind simulation.

## Controls and targets

- [ ] Touch/click targets at least 44x44 CSS px equivalent.
- [ ] No hover-only actions.
- [ ] Instructions available before interaction.
- [ ] Reset/home available.
- [ ] Time limits avoidable or extendable.

## Fallbacks

- [ ] Static image/video fallback for no WebGL/WebGPU.
- [ ] Fallback includes the same information and a link.
- [ ] Content available without JavaScript where feasible.
- [ ] Error recovery UI with retry.

## Testing

- [ ] Keyboard-only walkthrough.
- [ ] Screen reader walkthrough.
- [ ] `prefers-reduced-motion` walkthrough.
- [ ] 200% zoom and small viewport.
- [ ] Automated axe/Lighthouse audit.
- [ ] Mobile screen reader (VoiceOver/TalkBack).
- [ ] Color contrast check on actual rendered frames.
