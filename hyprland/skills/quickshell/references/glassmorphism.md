# Real glassmorphism on Hyprland 0.57 + Quickshell 0.3.x

Verified **2026-11-01** against Hyprland **v0.57.0** (`decoration:blur:*` values and
`src/render/gl/blur/*`), Quickshell **v0.3.2** (`BackgroundEffect`, `Region`,
`PanelWindow`), Qt **6.12** (`RectangularShadow` is in `QtQuick.Effects`), Apple
HIG / WWDC25 Liquid Glass material, and the `xglassmorphism` design reference.

This is the practical answer to “can we make Apple-style glass on Hyprland?”:
you can reproduce the *structure* of the material (blur, tint, edge, depth,
grain and an approximated edge lens), but not Apple’s per-pixel adaptive
lensing, content-aware tint, or motion-reactive specular highlights. The honest
target is a convincing frosted/acrylic pane, not a claim of Liquid Glass parity.

## 1. What Apple glass actually does

Apple’s Liquid Glass (WWDC25, iOS 26 / macOS 26) is a layered optical material:

| Physical effect | Apple / Liquid Glass | What we can do here |
|---|---|---|
| Diffusion | blurs the backdrop | compositor blur (`decoration.blur`) |
| Absorption / tint | adapts the tint to content | translucent palette tint (static) |
| Chroma | saturates and lifts the backdrop | `saturation`/`brightness` in Quickshell or compositor blur |
| Refraction / lensing | bends light at the curved edge | `acrylic` / `glass` shader (approximation) |
| Specular rim | highlights follow the light/view | 1 px edge + top inner sheen in QML |
| Internal reflection | edge glow / caustics | layered gradient / second translucent rim |
| Grain | micro-texture breaks banding | low-opacity noise overlay |
| Depth | cast shadow lifts the pane | `RectangularShadow` (QtQuick.Effects) |
| Adaptive tint | changes with the content behind it | **not available**; use palette roles and contrast checks |

The five-layer model from the `xglassmorphism` skill applies directly:
**backdrop, tint, edge, depth, texture**. A surface missing tint or edge reads
as gray plastic; a surface missing depth floats without weight.

## 2. Hyprland 0.57 primitives

### 2.1 Blur variants

`decoration.blur.variant` accepts a name or its index:

`kawase` 0 (default) · `frost` 1 · `ripple` 2 · `drops` 3 · `water` 4 ·
`fluid_jar` 5 · `prism` 6 · `heat_shimmer` 7 · `acrylic` 8 · `aurora` 9 ·
`haze` 10.

There is **no `glass` variant**. `glass` is an option group shared by the
glass-based materials (`frost`, `drops`, `heat_shimmer`, `aurora`). The closest
single variant to Apple’s material is **`acrylic`** (“similar to liquid glass”
in the Hyprland wiki); `haze` adds a pearlescent sheen and `prism` adds
iridescence. Animated variants (`drops`, `water`, `fluid_jar`, `ripple`,
`heat_shimmer`, `aurora`, `haze`) re-run their shader every frame and are the
expensive ones.

### 2.2 Material options (v0.57.0 defaults / limits)

| Group | Options |
|---|---|
| `acrylic` | `refraction` 24 (0-48) · `bulb` 48 (4-256) · `clarity` 0.82 (0-1) · `aberration` 0.025 (0-0.25) · `tint` `0x14EEF5FF` (alpha = absorption) |
| `glass` (shared) | `refraction` 20 (0-20) · `size` 40 (4-512) · `roughness` 1 (0-1) |
| shared blur | `size` 8 (0-100) · `passes` 1 (0-10) · `noise` 0.0117 (0-1) · `contrast` 0.8916 (0-2) · `brightness` 1 (0-2) · `vibrancy` 0.1696 (0-1) · `vibrancy_darkness` 0 (0-1) · `proportional` false · `xray` false · `ignore_opacity` true |

`proportional = true` scales blur strength with pixel opacity; it is useful for
panes over mixed content, but it changes the look and should be tuned on the
target. `xray = false` keeps floating windows from ignoring tiled windows in
their blur.

### 2.3 Comfortable compositor preset

Use `acrylic` with modest values first; raise refraction/clarity only after
checking GPU cost:

```lua
hl.config({
  decoration = {
    blur = {
      enabled = true,
      size = 8,
      passes = 3,
      ignore_opacity = true,
      xray = false,
      proportional = false,
      variant = "acrylic",
      acrylic = {
        refraction = 18,
        bulb = 44,
        clarity = 0.82,
        aberration = 0.012,
        tint = "0x14EEF5FF",
      },
    },
  },
})
```

For a low-end iGPU or a VM, use `variant = "kawase"` (or `frost` with low
`glass.refraction`) and skip the acrylic shader. Keep **one** large glass
surface per view.

### 2.4 Layer rules vs BackgroundEffect

There are two ways to blur behind a Quickshell surface. Pick one per surface;
stacking both double-blurs and doubles the cost.

- **Layer rule (compositor-wide, simple)** — apply the configured blur to a
  layer namespace:
  ```lua
  hl.layer_rule({
    match = { namespace = "^(quickshell:glass)$" },
    blur = true,
    ignore_alpha = 0.15,
    blur_popups = true,
  })
  ```
  `ignore_alpha` prevents fully transparent padding (rounded corners, shadow
  margins, masks) from producing blurred rectangles. `blur_popups` covers
  menus/popups in the same namespace.
- **`BackgroundEffect` (region-shaped, protocol)** — Quickshell asks the
  compositor to blur only a `Region`; Hyprland **0.57 advertises
  `ext_background_effect_manager_v1` v1** (`wayland-info | grep
  ext_background_effect`). This is the better fit for a rounded panel inside a
  larger transparent surface because the blur follows the region instead of the
  whole window.

## 3. Quickshell surface model

A glass panel is still a normal layer surface:

```qml
import QtQuick
import Quickshell
import Quickshell.Wayland

PanelWindow {
    id: root
    color: "transparent"
    surfaceFormat.opaque: false           // set before the surface is exposed
    WlrLayershell.namespace: "quickshell:glass"
    anchors { top: true; left: true; right: true }
    implicitHeight: 44

    BackgroundEffect.blurRegion: Region {
        item: surface
        radius: surface.radius
    }

    GlassSurface { id: surface; anchors.fill: parent }
}
```

- `surfaceFormat.opaque: false` is mandatory; a surface created opaque stays
  opaque and translucent colors will not show the backdrop.
- `WlrLayershell.namespace` must match the layer rule if you use the layer-rule
  path. Use one stable namespace per surface group.
- `BackgroundEffect.blurRegion` is an attached object on `PanelWindow`,
  `PopupWindow` and `FloatingWindow` (not a standalone item). `Region` accepts
  `item`, `radius`, and per-corner radii (`topLeftRadius`, ...).
- If the compositor does not advertise `ext_background_effect_manager_v1`,
  remove `BackgroundEffect` and fall back to the layer-rule blur or a flat
  translucent fill.

## 4. The QML glass surface

`glass-surface.qml` in this folder is a minimal, theme-free primitive: tint,
hairline edge, top-down sheen, optional grain, and a `RectangularShadow`
shadow. Key points:

- `RectangularShadow` is **`QtQuick.Effects`** (Qt 6.9+), imported as
  `import QtQuick.Effects`; it is not a `Quickshell.Widgets` type. It draws the
  depth layer behind a rounded rectangle.
- The fill must carry enough alpha to guarantee contrast; the blur is
  decoration, not a contrast device. Evaluate text against the lightest,
  darkest and busiest backdrop.
- The sheen is a top highlight that fades by ~35% and a faint bottom darkening;
  keep it subtle. A strong white sheen reads as plastic.
- Grain is optional and must be `pointer-events: none`; keep opacity around
  0.02-0.05. It breaks 8-bit blur banding.
- Do not nest glass inside glass. Use a solid translucent surface for stacked
  menus/cards.

Example composition:

```qml
PanelWindow {
    // ...anchors, namespace, BackgroundEffect...
    GlassSurface {
        anchors.fill: parent
        tint: Qt.rgba(0.10, 0.11, 0.15, 0.62)
        edge: Qt.rgba(1, 1, 1, 0.24)
        cornerRadius: 16
    }
}
```

For the equisdots palette system, pass `Theme.glassFill` / `Theme.hairline`
(or the `surfaceContainer*` roles) instead of hard-coded colors.

## 5. Glass levels

| Level | Backdrop | Tint alpha | Use |
|---|---|---|---|
| thin | `size 6-8`, `passes 2` | 0.10-0.18 | full-width bar, large panels |
| regular | `size 8-12`, `passes 3` | 0.20-0.35 | cards, popups, menus |
| thick | `size 12-16`, `passes 4` | 0.35-0.55 | modals, focused reading surfaces |

Larger surfaces get thinner glass; smaller surfaces can afford thicker tint.
The tint does the legibility work, not the blur.

## 6. Performance and version gating

- Every blurred surface is a separate backdrop pass. Budget **one or two**
  simultaneous glass surfaces in a viewport; never put glass on every card.
- `acrylic` and the animated variants cost more than `kawase`. Start from
  `kawase`/`frost`, then try `acrylic`; keep `passes` low.
- Do not animate blur radius or the variant on a timer. Animate opacity and
  transform of a pre-composed surface instead.
- On llvmpipe (WSL/VM) and weak iGPUs, ship a flat translucent fallback (or
  `kawase` with low passes). Expose a user toggle for glass.
- Version gate: `decoration.blur.variant`, `acrylic` and `glass` groups exist
  from **0.57**. On 0.55/0.56 only the shared blur options exist; use `kawase`
  and do not write the 0.57 keys. `BackgroundEffect` requires the
  `ext-background-effect` protocol; Hyprland 0.57+ advertises v1.

## 7. Accessibility

- Verify WCAG contrast at the worst-case backdrop, both light and dark
  palettes, 200% zoom. Blur alone never guarantees text legibility.
- Prefer a tinted scrim behind text; use a slightly stronger tint for small
  labels and thin text.
- Honor a reduce-transparency / high-contrast preference by switching to an
  opaque surface; do not remove focus outlines or keyboard focus visibility.
- Keep hitboxes separate from visual padding; a transparent `mask` or the
  `BackgroundEffect` region should match the visible glass, not the whole
  window.

## 8. Pitfalls

1. `variant = "glass"` — no such variant. Use `acrylic`, or `frost`/`drops`/
   `heat_shimmer`/`aurora` with the shared `glass` options.
2. `RectangularShadow` from `Quickshell.Widgets` — wrong; it is
   `QtQuick.Effects` (Qt 6.9+).
3. Layer-rule blur + `BackgroundEffect` on the same surface — double blur and
   double cost. Choose one.
4. Blur over transparent padding — set `ignore_alpha` or use a `Region`; otherwise
   the shadow/padding area gets a blurred rectangle.
5. Creating the window opaque — set `surfaceFormat.opaque: false` before the
   surface is exposed; changing it later does not remove the opaque buffer.
6. Nested glass / glass on every card — mud and GPU load.
7. Animating the blur chain — main-thread cost; animate opacity/transform.
8. Ignoring contrast — blur is decoration, the tint is the legibility layer.

## 9. Sources

- Hyprland **v0.57.0**: `src/config/values/ConfigValues.cpp`,
  `src/render/gl/blur/{Factory,Acrylic,Glass,Kawase,...}.cpp`, wiki
  `configuring/core/config-options` (blur variants), `layer-rules`.
- Quickshell **v0.3.2**: `Quickshell.Wayland.BackgroundEffect` (attached,
  `blurRegion: Region`), docs quickshell.org v0.3.2, source
  `src/wayland/background_effect/*`.
- Qt **6.12**: `QtQuick.Effects/RectangularShadow` (`plugins.qmltypes`).
- Apple HIG / WWDC25 “Meet Liquid Glass” (Regular/Clear materials, adaptive
  tint, specularity, lensing) as the conceptual target, not a parity claim.
- `xglassmorphism` skill: five-layer optics, tokens, accessibility, performance.
