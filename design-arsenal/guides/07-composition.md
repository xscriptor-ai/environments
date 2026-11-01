# 07 — Composition and layout

Composition is deciding where the eye goes, in what order, and what it feels.
Everything else is execution.

## 1. The canvas is not neutral

- **Desktop** is a stage with furniture: icons left, panel top, dock bottom.
- **Mobile** is a narrow window with a clock, notch and gesture bar.
- **Ultrawide** is a panorama; the center is not always the best focal point.
- The wallpaper is rarely seen alone: windows, icons and text sit on top.
  Design for the **occupied** state, not the empty state.

## 2. Ratios and grids

- 16:9: thirds, 12 columns, 8 px baseline.
- 9:20: vertical thirds, center axis, generous top/bottom margins.
- 21:9/32:9: 3 or 4 horizontal zones; do not center everything.
- 1:1: radial or diagonal composition often works better than thirds.

### Thirds vs center

- **Center**: calm, monumental, symmetrical, iconic.
- **Thirds**: dynamic, editorial, room for type.
- **Golden ratio**: a gentler asymmetry; useful for placing a subject and a
  secondary element.
- **Diagonal**: energy, motion, architecture.
- **Radial**: focus, vortex, ceiling, dome.

## 3. Focal hierarchy

Every piece needs:

1. **Primary focal point** — the subject; highest contrast/detail.
2. **Secondary** — a line, type, gradient or texture that supports it.
3. **Field** — the rest; quiet, low contrast.

If two elements compete, reduce one: size, contrast, saturation or detail.

## 4. Negative space

- Empty space is a material, not a failure.
- It gives the eye rest and gives the desktop room for icons/windows.
- In a portrait-to-landscape conversion, the empty field is the main design
  surface. Treat it as a shape, not "the background".
- Use gradients, texture and grain to make emptiness feel intentional.

## 5. Visual weight

Weight comes from:

- Size (bigger = heavier).
- Contrast (dark on light or vice versa).
- Saturation (vivid = heavier).
- Detail (busy = heavier).
- Position (bottom and right feel heavier; top-left feels lighter).
- Isolation (a lone object carries more weight).

Balance a heavy subject with:

- A large calm field.
- A small but bright accent.
- Type at the opposite corner.
- A gradient that pulls the eye back.

## 6. Lines and direction

- Vertical lines: stability, architecture, columns.
- Horizontal lines: calm, landscape, horizon.
- Diagonals: motion, tension.
- Curves: softness, organic, human.
- Converging lines: depth and a natural focal point.
- Lead the eye **into** the frame, not out of it.

## 7. Depth layers

1. Background: sky, wall, gradient, texture.
2. Midground: blurred architecture, field, atmospheric layer.
3. Foreground: sharp subject.
4. Accents: type, line, small graphic.
5. Grain: unifier.

Atmospheric perspective (lighter, lower contrast in the distance) makes a
composite feel real.

## 8. Desktop safe zones

```text
┌────────────────────────────────────────────┐
│ panel / menu bar (top 4%)                  │
│ ┌──────┐                                   │
│ │icons │        focal area                 │
│ │ 8%   │                                   │
│ └──────┘                                   │
│                                            │
│ dock / taskbar (bottom 6-8%)               │
└────────────────────────────────────────────┘
```

- Keep text and faces out of the icon column (left ~8%).
- Keep critical detail out of the top 4% and bottom 8%.
- On macOS, the right side may be freer; on Windows/Linux, the left is occupied.
- For lockscreen-like pieces, keep the center-top clear for the clock.

## 9. Mobile safe zones

```text
┌──────────────┐
│ status/notch │  top 7-8%
│              │
│   focal      │
│              │
│ gesture bar  │  bottom 5-6%
└──────────────┘
```

- Parallax and lockscreen widgets crop the top/bottom.
- Keep the subject in the middle 60%.
- Leave breathing room on the sides for curved edges.

## 10. Composition patterns for wallpapers

### A. Monument

- Subject centered, symmetrical, large.
- Minimal field, subtle gradient, grain.
- Works for architecture, products, portraits.

### B. Editorial

- Subject on one third; type on the other.
- Strong grid, generous margins, one accent.
- Works for posters, brand pieces.

### C. Ambient

- Blurred/gradient field, no sharp subject or a small silhouette.
- Focus on color and light.
- Works for calm desktops, coding, focus.

### D. Triptych

- Three vertical panels: sharp center, mirrored/blurred sides.
- Works for patterns, silhouettes, architecture.

### E. Cutout

- Subject isolated on a designed field, with shadow.
- Works for objects, people, products.
- Needs clean edges and a deliberate shadow.

### F. Texture

- The whole canvas is a material or pattern, with a small focal interruption.
- Works for minimal, architectural, tactile setups.

## 11. QA

- Squint: does the hierarchy survive?
- Thumbnail: does it read at 300 px?
- Grayscale: does it work without color?
- Mirror: is it balanced or accidentally lopsided?
- Occupied: add icons/windows; is it still readable?
- Distance: step back 2 m from the screen.
- Crop: does it survive a 16:10 or 21:9 crop?
- Consistency: does it belong to the same set?
