---
name: niri-layout-rules
description: Use when configuring niri window placement and appearance in config.kdl: the layout block (gaps, borders, focus-ring, shadow, struts, tab-indicator, insert-hint, geometry-corner-radius), window-rule, layer-rule, open-floating, open-maximized, block-out-from, background-effect, floating windows, tabs, fullscreen, and maximize-window-to-edges. Covers match/exclude conditions (regex app-id and title, is-active, is-focused, is-floating, at-startup) and per-output/per-workspace layout overrides.
---

# Skill: niri-layout-rules

Orientation for everything that controls where niri puts windows and how they
look: the global `layout {}` block, `window-rule {}`, and `layer-rule {}`.
niri is a scrollable-tiling compositor: windows form columns on an infinite
horizontal strip, and a rule only changes how a window is placed, sized, or
drawn, never the strip model itself.

Baseline: **niri 26.04** (2026-04-25). Config is `~/.config/niri/config.kdl`.
Validate with `niri validate`. Find a window's `app-id` and `title` with
`niri msg pick-window`; find layer namespaces with `niri msg layers`.

## Layout block

`layout {}` is the global default for column widths, spacing, and decorations.
Every key can be overridden per output and per named workspace with a nested
`layout {}` block (Since: 25.11). The most common keys:

```kdl
layout {
    gaps 16
    center-focused-column "never"
    default-column-width { proportion 0.5; }
    border { width 2; active-color "#7fc8ff"; inactive-color "#505050"; }
    focus-ring { off }
    shadow { on; softness 30; offset x=0 y=5; }
}
```

- `gaps` accepts fractional values (Since: 0.1.7). `struts` accept negative
  values to emulate "inner" gaps (Since: 0.1.8).
- `border` is **off by default**; `focus-ring` is **on by default**. Both take
  `width`, `active-color`, `inactive-color`, `urgent-color`, and gradients.
- `default-column-width {}` (empty) lets the window choose its width.
- `shadow` is off by default (Since: 25.02); enable it and pair it with
  `prefer-no-csd`/`geometry-corner-radius` for clean corners.

See `references/layout.md` for every key, built-in defaults, gradient color
spaces, struts, tab indicator, insert hint, and per-output/workspace overrides.

## Window rules

`window-rule {}` matches individual toplevels and sets opening or dynamic
properties. Rules are processed top-to-bottom; later matches override earlier
ones. Use `match` (any one applies) and `exclude` (none may apply); multiple
matchers inside one directive are AND-ed.

```kdl
window-rule {
    match app-id="firefox$" title="^Picture-in-Picture$"
    open-floating true
    default-column-width { fixed 480; }
    default-window-height { fixed 270; }
    default-floating-position x=32 y=32 relative-to="bottom-left"
}
```

See `references/window-rules.md` for the full matcher list, all rule names,
precedence/merging semantics, and at least eight worked examples.

## Layer rules

`layer-rule {}` is the layer-shell equivalent of `window-rule {}`. It matches on
`namespace` (regex), `at-startup`, and `layer` (Since: 26.04), and sets
`opacity`, `block-out-from`, `shadow`, `geometry-corner-radius`,
`place-within-backdrop`, `background-effect`, and `popups`. There is no
`is-active`/`is-focused` matcher for layer surfaces.

See `references/layer-rules.md` for the complete reference and Waybar, mako, and
Quickshell examples.

## Floating, tabs, fullscreen

Floating windows always draw above tiled windows and do not scroll. Tabs put
multiple windows in one column at the same size. Fullscreen, maximize-to-edges,
and full-width maximize are three distinct sizing modes with different
interactions with gaps, struts, and layers.

See `references/floating-tabs-fullscreen.md`.

## References

- `references/layout.md` - every `layout {}` option with defaults, examples, and
  per-output/per-workspace overrides.
- `references/window-rules.md` - `window-rule {}` matchers, properties,
  precedence, and worked examples.
- `references/layer-rules.md` - `layer-rule {}` matchers, properties, and shell
  examples.
- `references/floating-tabs-fullscreen.md` - floating layout, tabbed columns,
  fullscreen, maximize, maximize-to-edges, and windowed fullscreen.
