# Layer surfaces: PanelWindow, WlrLayershell and sizing

Verified 2026-10-20 against the Quickshell v0.3.2 documentation (PanelWindow, WlrLayershell, Item Size and Position), the v0.3.2 changelog and a live Quickshell 0.3.2 session.

## 1. Types

- `PanelWindow` (`Quickshell`): platform-independent window attached to screen edges by anchors. On Wayland it is implemented with `WlrLayershell`. Use this for bars, panels, OSDs, docks and lockscreen-adjacent surfaces.
- `WlrLayershell` (`Quickshell.Wayland`): attached object for `PanelWindow` with `layer`, `namespace` and `keyboardFocus`. It is not a window type to instantiate directly in normal shell code.
- `PopupWindow`: xdg-popup anchored to a window or item (`anchor.window`, `anchor.rect`). Use it for menus and popovers. Prefer `HyprlandFocusGrab` for outside-click dismissal.
- `FloatingWindow`: normal managed window (dialogs; min/max/fullscreen; move/resize events since 0.3).
- `QsWindow`: base class; exposes `surfaceFormat`, `updatesEnabled` and the window lifecycle.

## 2. Size model

QML items have two size pairs:

- actual size: `width` / `height`
- implicit size: `implicitWidth` / `implicitHeight`

The rules that matter for shells:

- Implicit size flows from children to parent; actual size flows from parent/container to children.
- A window surface uses its implicit size as the requested size. The compositor may force a dimension through anchors.
- Set `implicitWidth` / `implicitHeight` on `PanelWindow` / `WlrLayershell`.
- Do not assign `width` / `height` on a layer-shell window. Quickshell 0.3.x logs a deprecation warning, and resizing the surface during an animation causes configure/buffer churn.
- Read `width` / `height` when you need the actual surface size; do not assign them.
- Do not use `childrenRect` in an implicit-size binding; it creates a binding loop. Use the children's implicit sizes or `MarginWrapperManager`.
- Zero-size items are a common bug: initialize implicit sizes on custom containers.

## 3. PanelWindow properties

- `anchors`: `top`, `bottom`, `left`, `right`; all off by default. Opposite anchors force the corresponding dimension to the screen size. `margins` apply only to anchored edges.
- `exclusiveZone` (int): reserved layout space. Requires exactly 1 or 3 anchors. Setting it implies `ExclusionMode.Normal`.
- `exclusionMode`: `Auto` (default; since 0.2 adds a zone for single-anchor panels), `Normal`, `Ignore`. Use `Ignore` for floating panels, OSDs and overlays that must not move windows.
- `margins`: offsets from screen edges. Margins opposite the anchor are included in the exclusion zone.
- `focusable`: whether the panel accepts keyboard focus. Maps to `WlrLayershell.keyboardFocus`. Defaults to false.
- `aboveWindows`: maps to the Wayland layer. Defaults to true.
- `screen`: bind to `modelData` inside `Variants` for per-monitor windows.
- `color`: use `"transparent"` and draw your own background.

## 4. WlrLayershell attached properties

- `layer`: `Background`, `Bottom`, `Top`, `Overlay`. Defaults to `Top`. Use `Overlay` only when the surface must sit above everything; Hyprland layer rules can target it by namespace.
- `namespace`: stable identifier per surface group. Defaults to `quickshell`. It cannot be changed after the window is connected; set it before mapping. Use one namespace per surface group so Hyprland blur/layer rules are precise.
- `keyboardFocus`: `None` (default), `OnDemand`, `Exclusive`.

## 5. Sizing recipes

### Bar

```qml
PanelWindow {
  anchors { top: true; left: true; right: true }
  implicitHeight: 32
  // bar content
}
```

### Top panel with a reveal

```qml
PanelWindow {
  id: bar
  anchors { top: true; left: true; right: true }
  implicitHeight: barH + gap + panelH   // fixed maximum

  mask: Region {
    Region { x: 0; y: 0; width: bar.width; height: barH }
    Region { x: 0; y: barH + gap; width: bar.width; height: panelH * reveal }
  }

  Item {
    id: clipBox
    y: barH + gap
    width: parent.width
    height: panelH * reveal
    clip: true

    Rectangle {
      width: parent.width
      height: panelH
      color: "#cc101014"
      radius: 8
    }
  }
}
```

`barH`, `gap` and `panelH` are shell-defined sizes; `reveal` is the animated 0..1 value. Animate `reveal` on the clip box, not `implicitHeight`.

### Bottom panel

- Anchor `bottom`, `left`, `right`; keep `implicitHeight` fixed.
- Anchor the clip box to the bottom and position the full-size content at `y: clipBox.height - panelH`.
- Mask the visible panel; the empty area stays click-through.

### Side panel

- Anchor `top` and `bottom` for a full-height side panel; set `implicitWidth`.
- If the panel is not full height, anchor one vertical edge and use margins.
- Clip the horizontal reveal inside the fixed surface; do not animate `implicitWidth`.

### Per-monitor windows

```qml
Variants {
  model: Quickshell.screens
  PanelWindow {
    required property var modelData
    screen: modelData
    anchors { top: true; left: true; right: true }
    implicitHeight: 30
  }
}
```

Keep shared state in a root `Scope`; do not duplicate timers or processes per screen.

### PopupWindow

```qml
PopupWindow {
  id: popup
  anchor.window: bar
  anchor.rect.x: bar.width - width
  anchor.rect.y: bar.height
  implicitWidth: 320
  implicitHeight: 240
  visible: false

  HyprlandFocusGrab {
    windows: [popup]
    active: popup.visible
    onCleared: popup.visible = false
  }
}
```

Popups are not layer surfaces, but the implicit-size rule still applies.

## 6. Mask, exclusion and input

- `exclusiveZone` reserves layout space (struts). It does not define the input region.
- `mask` defines the input region; regions outside the mask are click-through.
- A fixed tall surface with a small visible panel needs a mask; otherwise the transparent area receives clicks.
- `exclusionMode: Ignore` for panels that must not push windows.
- Keep one namespace per surface group for Hyprland layer rules and `hyprctl layers`.

## 7. Animation rules

- Never animate `implicitWidth` / `implicitHeight` of a layer surface per frame.
- Keep the surface at its maximum size and animate/clip the content inside it.
- One-time size changes (settings, monitor changes) are acceptable; complete them before starting a reveal.
- Buffer resizing during or after a close can appear as a stretch; a fixed surface avoids it.
- Measure cost only after correctness: `qs log`, `hyprctl layers`, and the compositor debug overlay.

## 8. Validation

- `qs --version` before writing; `qs log` for deprecation warnings.
- `hyprctl layers -j` shows namespace, x/y/w/h; verify the surface size and namespace.
- Open and close the panel; the layer size should not change per frame.
- Check one notification server and one SNI tray host per session.
- `qs ipc show` for exposed functions.

## 9. Common mistakes

- Assigning `width` / `height` to `PanelWindow` / `WlrLayershell`.
- Binding `implicitHeight` to a reveal animation.
- Using `childrenRect` for implicit size.
- `exclusiveZone` with 0/2/4 anchors.
- Forgetting `mask` on a tall transparent surface.
- Changing `WlrLayershell.namespace` after mapping.
- `ExclusionMode.Auto` on a single-anchor panel that should float.
- Multiple notification or tray hosts.
