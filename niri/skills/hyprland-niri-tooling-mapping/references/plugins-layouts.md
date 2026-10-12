# Plugins and layouts: `hyprpm` vs. niri

Hyprland has a plugin system: `hyprpm` builds C++ shared objects against
Hyprland's internal headers and loads them at runtime, and many popular features
(scrolling layouts, i3-style trees, per-monitor workspace splitting, Expo) exist
only as plugins. niri has **no plugin ABI and no plugin loader**. Its model is
built in, and its extension points are configuration, rules, IPC, layer-shell
tools, and custom animation shaders.

Baseline: **niri 26.04** (2026-04-25).

## The plugin model difference

| | Hyprland (`hyprpm`) | niri 26.04 |
| --- | --- | --- |
| Mechanism | C++ shared object hooking internal APIs | none |
| Compatibility | Locked to a Hyprland version; breaks on upgrade | n/a |
| What it changes | Layouts, decorations, rendering, behaviors | n/a |
| Extension points | Plugins | KDL config, window/layer rules, IPC + event-stream, `wlr-layer-shell` tools, custom animation shaders |

Consequence for migration: any behavior that came from a Hyprland plugin must be
re-expressed with niri's native features, moved to an external layer-shell
program + IPC, or dropped. There is no way to load the plugin under niri.

## Replacing layout-oriented plugins

niri's core layout is **scrollable columns on an infinite horizontal strip** per
workspace, with vertical tiling inside a column and optional tabs. Most layout
plugins become either built-in behavior or a small configuration change.

| Hyprland plugin / layout | niri replacement | Notes |
| --- | --- | --- |
| `hyprscroller` (scrolling layout) | native | Scrolling columns are niri's default model; nothing to add |
| `hy3` / i3-style tree | columns + tabs | No tree layout; use columns, `consume-window-into-column`, `expel-window-from-column`, `toggle-column-tabbed-display` |
| `master` / `dwindle` layout knobs | column presets | `preset-column-widths`, `default-column-width`, `center-focused-column`, `always-center-single-column` |
| monocle layout | `maximize-column` / fullscreen | Bind `maximize-column`, or use tabs + `always-center-single-column` for a single centered column |
| `hyprsplit` (workspaces per monitor) | native | niri workspaces are already per-monitor and can move between monitors |
| `hyprexpo` (Expo) | native Overview | `toggle-overview` (Since 25.05); also has workspace shadows and a backdrop |
| `hyprbars` / custom titlebars | native decorations | niri draws focus-ring, border and tab-indicator; see `layout {}` and window rules |
| window shader plugins (focus/glow/etc.) | custom animation shaders only | niri custom shaders apply to open/close/resize animations, not arbitrary per-frame window shading |

### Scrolling and columns (the `hyprscroller` case)

Nothing to install. The following are native:

- Open a window: it becomes a new column, or a tile in the focused column,
  depending on the column's state.
- `focus-column-left/right`, `focus-window-up/down`,
  `move-column-left/right`, `move-window-up/down`.
- `consume-window-into-column` / `expel-window-from-column` to build vertical
  stacks.
- `switch-preset-column-width` to cycle widths.

### Tabs (the `hy3` / monocle case)

Since 25.02, a column can present its windows as tabs:

```kdl
binds {
    Mod+W { toggle-column-tabbed-display; }
}
```

All other binds stay the same: switch tabs with `focus-window-up/down`, add tabs
with `consume-window-into-column`, remove with `expel-window-from-column`. The
`tab-indicator` section in the layout config styles the side indicator, including
`place-within-column`. To make windows open tabbed by default:

```kdl
layout {
    default-column-display "tabbed"
    // or per window:
    // window-rule { default-column-display "tabbed"; }
}
```

### Column presets (the `master`/`dwindle` case)

```kdl
layout {
    center-focused-column "never"       // "always" | "never" | "on-overflow"
    always-center-single-column
    preset-column-widths {
        proportion 0.25
        proportion 0.5
        fixed 800
    }
    default-column-width { proportion 0.5; }
    preset-window-heights {
        proportion 0.5
        proportion 0.8
    }
    insert-hint { /* ... */ }
}
```

Bind `switch-preset-column-width` (and its `-back` variant) to cycle them. There
is no master/stack split; the equivalent is column widths plus `move-column-left`
and `move-column-to-first`/`-last`.

### Overview (the `hyprexpo` case)

niri's Overview is native: `toggle-overview` / `open-overview` / `close-overview`,
configured under `overview {}` (`zoom`, `backdrop-color`, `workspace-shadow`).
It can show the wallpaper behind workspaces with a layer rule
`place-within-backdrop true`.

## Custom shaders: the main extension point

What remains extensible in niri's rendering is **animation shaders**. Open, close
and resize animations can run a custom fragment shader:

```kdl
animations {
    window-open {
        duration-ms 250
        curve "ease-out-expo"
        custom-shader r"
            // GLSL fragment shader; see examples/open_custom_shader.frag
        "
    }
    window-close {
        custom-shader path="./shaders/close.glsl"
    }
}
```

Rules and caveats:

- The shader is a GLSL fragment shader for the window during that animation; the
  niri repo ships documented examples under `examples/`
  (`open_custom_shader.frag`, `close_custom_shader.frag`,
  `resize_custom_shader.frag`).
- **Custom shaders have no backwards-compatibility guarantee.** niri reserves the
  right to change the shader interface; if a shader fails to compile, niri prints
  a warning and falls back to the default (or the previous successfully compiled
  shader).
- Inline `custom-shader "..."` works across releases; attaching by
  `custom-shader path="..."` is **Since: next release**.
- Custom shaders affect animation rendering only. They are not a general
  per-window post-process hook, so plugins that shaded every window continuously
  (glow, gradient borders, ripples) cannot be reproduced exactly.

This is the closest niri analogue to "a rendering plugin", and it is intentionally
narrow. For decoration-like effects use the static `border`, `focus-ring`,
`shadow`, `background-effect` (blur/xray/saturation/noise, Since 26.04), and
`tab-indicator` rule options instead.

## What cannot be replaced

| Hyprland plugin capability | niri status |
| --- | --- |
| New layout algorithm | impossible without patching niri; use columns/tabs |
| Arbitrary per-window GLSL effects | not available; only open/close/resize animation shaders |
| Runtime behavior hooks (custom focus, smart gaps, etc.) | not available; approximate with rules and `spawn`/IPC |
| Custom titlebars/bars drawn by the compositor | use layer-shell (Quickshell/Waybar) instead |

If an equisdots feature depended on a Hyprland plugin, record it as a gap and pick
a native approximation or an external layer-shell program; do not attempt to port
the plugin.

## Version gating

- Scrollable columns: core niri model, all versions.
- Tabs (`toggle-column-tabbed-display`, `default-column-display`): Since 25.02.
- Overview: Since 25.05.
- `custom-shader` inline: present since the 0.1.x animation work; `custom-shader
  path=...`: Since next release (not in 26.04).
- Background effects (blur/xray/saturation/noise): Since 26.04.
- No plugin ABI: true for all niri versions; there is no roadmap entry to invent
  one here.
