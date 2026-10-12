# Background effects

Since: 26.04. niri can apply background effects to windows and layer-shell
surfaces: **blur**, **xray**, **saturation**, and **noise**.

Baseline: **niri 26.04** (2026-04-25).

## Where effects are configured

Background effects are set in a `background-effect {}` block:

- window rules: `window-rule { background-effect { ... } }`
- layer rules: `layer-rule { background-effect { ... } }`
- pop-ups: a `popups { background-effect { ... } }` block inside a window or
  layer rule

The same four options exist in both rule types:

| Option | Type | Meaning |
| --- | --- | --- |
| `blur` | `true` / `false` | Enable blur behind this window/surface; `false` force-disables it |
| `xray` | `true` / `false` | See through to the wallpaper (ignore windows below); `false` uses regular per-window blur |
| `noise` | number | Amount of pixel noise added to the background (reduces color banding) |
| `saturation` | number | Color saturation of the background (`0` desaturated, `1` normal, `2` = 200%) |

```kdl
// Enable blur behind the Alacritty terminal.
window-rule {
    match app-id="^Alacritty$"

    background-effect {
        blur true
    }
}

// Enable blur behind the fuzzel launcher.
layer-rule {
    match namespace="^launcher$"

    background-effect {
        blur true
    }
}
```

A window or layer surface must be **semitransparent** for the effect to be
visible; otherwise the opaque content covers it entirely.

> Warning: niri has **no `ignore_alpha` equivalent**. Forcing
> `background-effect { blur true }` (in a window or layer rule) blurs the
> **whole rectangle** of the surface, including fully transparent areas. On a
> large, mostly-transparent popup/overlay layer surface this paints a full-height
> blur sheet over the desktop. Prefer letting clients request blur through
> `ext-background-effect`, or scope forced blur to small surfaces (a thin bar),
> never a big popup host.

## `ext-background-effect` versus manual rules

Applications can request background blur themselves through the
[`ext-background-effect`](https://wayland.app/protocols/ext-background-effect-v1)
protocol. In that case the app usually exposes a "background blur" toggle you
must enable in its own settings; niri needs no rule.

The two paths shape the blur differently:

- Blur enabled by a niri `background-effect { blur true }` rule follows the
  window's **corner radius** as set by `geometry-corner-radius`.
- Blur enabled through `ext-background-effect` follows **exactly the shape the
  window requests**. A window with client-side rounded corners or a complex shape
  should set the corresponding blur shape through the protocol, and then it gets
  correctly shaped blur with no manual niri configuration.

For pop-ups, effects default to **non-xray**, because pop-ups generally appear on
top of windows.

## Global `blur {}` settings

The top-level `blur {}` section affects **all** background blur (both
protocol-requested and rule-configured).

```kdl
// These are the default values:
blur {
    // off
    passes 3
    offset 3
    noise 0.02
    saturation 1.5
}
```

| Option | Default | Notes |
| --- | --- | --- |
| `off` | (unset) | Flag: disables all blur, both window-requested and rule-configured |
| `passes` | `3` | Downsample/upsample passes for dual Kawase blur; more passes = larger, smoother, more GPU cost |
| `offset` | `3` | Pixel offset multiplier per pass; `1` is the original dual Kawase blur. Larger is smoother at no extra GPU cost, but too large produces artifacts |
| `noise` | `0.02` | Amount of noise added on top of the blur (reduces color banding) |
| `saturation` | `1.5` | Saturation applied to the blurred background; `>1` increases, `<1` reduces |

Tuning guidance from upstream: raise `offset` first (it costs no extra GPU
load) until artifacts appear, then increase `passes` by one, and repeat.

## Xray

Xray makes the window background see through to the wallpaper, ignoring any other
windows below. Enable it with `xray true` in a `background-effect {}` block.

Xray is **automatically enabled by default** whenever any other background effect
(such as blur) is active. This is because it is much more efficient: niri blurs
the background once and reuses the result, since the wallpaper rarely changes.
With an animated wallpaper, xray still recomputes the blur each frame, but only
once and shared across all windows rather than per window.

### Non-xray effects (experimental)

Set `xray false` to get regular blur in which everything below a window is
blurred. Non-xray blur and other non-xray effects are more expensive: niri
recomputes them whenever the window moves or the contents underneath change.

> Warning: non-xray effects are experimental in 26.04. They disappear during
> window open/close animations and while dragging a tiled window. Fixing this
> needs a rendering refactor to defer offscreen rendering.

```kdl
// Make floating windows use the regular blur (if enabled),
// while tiled windows keep using the efficient xray blur.
window-rule {
    match is-floating=true

    background-effect {
        xray false
    }
}
```

## Pop-ups

Blur the background behind a window's pop-up menus with a `popups {}` block
inside the window rule (Since: 26.04):

```kdl
// Blur the background behind pop-up menus in Nautilus.
window-rule {
    match app-id="Nautilus"

    popups {
        // Matches the default libadwaita pop-up corner radius.
        geometry-corner-radius 15
        opacity 0.5

        background-effect {
            blur true
        }
    }
}
```

The layer-rule equivalent (for example a Waybar menu):

```kdl
layer-rule {
    match namespace="^waybar$"

    popups {
        geometry-corner-radius 6
        opacity 0.85

        background-effect {
            blur true
        }
    }
}
```

Notes and limitations:

- `popups {}` affects only pop-ups created via Wayland's
  [`xdg-popup`](https://wayland.app/protocols/xdg-shell#xdg_popup), which is most
  real ones. Client-emulated "pop-ups" (drawn inside the window, common in game
  engines and Electron web apps) and `wl-subsurface` menus (some GTK 3 apps,
  notably some Firefox menus) are not affected. Input-method pop-ups (Fcitx) are
  not affected either.
- `opacity` inside `popups {}` is applied **on top of** the surface's own opacity
  rule.
- The effect looks correct only if the pop-up is a (rounded) rectangle and the
  app sets its Wayland geometry to exclude shadows. GTK 4 pop-ups with pointing
  arrows are not rounded rectangles, so blur sticks out where the arrow is. Such
  shapes need the app to implement `ext-background-effect`.

## Interaction with semitransparent windows and borders

Because the window must be semitransparent, effects interact with how niri draws
borders and focus rings:

- By default, the focus ring and border are rendered as a **solid background
  rectangle behind the window**, so they show through semitransparent windows
  (they are not just outlines). This is because windows using client-side
  decorations can have arbitrary shapes.
- To avoid the tint/see-through, set the top-level `prefer-no-csd` flag and
  restart the apps; niri then draws focus rings and borders *around* windows that
  agree to omit client-side decorations.
- Alternatively, override per window with the `draw-border-with-background`
  window rule (`false` stops the border from being drawn as a background
  rectangle).

## Implementation notes

- `ext-background-effect` is supported for **toplevels, layer surfaces, and
  pop-ups**, which covers the vast majority of real usage.
- It is not implemented for `wl_subsurface` (would need `clip-to-geometry`
  support for background effects), lock surfaces (not useful, would show the
  locked-session background), and the cursor / drag-and-drop icon (the cursor is
  rendered separately, which conflicts with non-xray effects requiring the whole
  scene to render in one go).
