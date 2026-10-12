# Floating windows, tabs, fullscreen, and maximize

These four features all change how a window occupies space. They interact with
the `layout {}` block (gaps, struts, borders, shadows) in different ways.

## Floating windows

Since: 25.01. Floating windows always draw on top of tiled windows. The floating
layout does not scroll. Each workspace/monitor has its own floating layout, just
like it has its own tiling layout.

New windows automatically float when they:

- have a parent (e.g. dialogs), or
- are fixed size (e.g. splash screens).

### Switching a window between floating and tiling

- Bind `toggle-window-floating` (default `Mod+V`).
- Right-click while dragging/moving the window.
- Use a window rule with `open-floating true`/`false`. `true` forces floating;
  `false` forces tiling and overrides the automatic floating logic.

```kdl
binds {
    Mod+V { toggle-window-floating; }
    Mod+Shift+V { switch-focus-between-floating-and-tiling; }
}

// Force PiP floating; force everything else that would auto-float into tiling.
window-rule {
    match app-id="firefox$" title="^Picture-in-Picture$"
    open-floating true
}

window-rule {
    open-floating false
}
```

### Focus and positioning

`switch-focus-between-floating-and-tiling` moves focus between the tiling layout
and the floating layout. While focused on the floating layout, navigation binds
such as `focus-column-right` operate on the floating window.

Position a floating window precisely with the IPC action:

```sh
niri msg action move-floating-window -x 100 -y 200
```

Set the initial floating position with a window rule:

```kdl
window-rule {
    match app-id="firefox$" title="^Picture-in-Picture$"
    open-floating true
    default-floating-position x=32 y=32 relative-to="bottom-left"
}
```

See `references/window-rules.md#default-floating-position` for the full
`relative-to` semantics.

## Tabs (tabbed columns)

Since: 25.02. A column can present its windows as tabs instead of vertical
tiles. All tabs in a column have the same window size, which is useful to gain
vertical space.

```kdl
binds {
    Mod+W { toggle-column-tabbed-display; }
}
```

All other binds are unchanged:

- Switch tabs with `focus-window-down` / `focus-window-up` (default `Mod+Down` /
  `Mod+Up` or `Mod+J` / `Mod+K`).
- Add or remove windows with `consume-window-into-column` / `expel-window-from-column`.
- Move into or out of the current column with `consume-or-expel-window-left` /
  `consume-or-expel-window-right`.

Unlike regular columns, tabbed columns can go fullscreen with multiple windows.

### Tab indicator

Tabbed columns show a tab indicator on the side; clicking it switches tabs. It
is configured by the [`tab-indicator` layout section](./layout.md#tab-indicator)
and can be overridden per window with the
[`tab-indicator` window rule](./window-rules.md#tab-indicator).

By default the indicator draws outside the column and can overlay adjacent
windows or go off-screen. `place-within-column` puts it inside the column and
adjusts the window size to make room; this is useful for thicker indicators or
very small gaps.

```kdl
layout {
    tab-indicator {
        place-within-column
        width 8
        gap 8
    }
}
```

## Fullscreen vs maximize vs maximize-to-edges

| Mode | Action / default bind | Covers | Respects gaps/struts | Borders | Multi-window |
| --- | --- | --- | --- | --- | --- |
| Maximized column | `maximize-column` / `Mod+F` | Whole screen width | Yes (gaps and struts) | Yes | Yes, in the same column |
| Maximize to edges | `maximize-window-to-edges` / `Mod+M` | Available screen area | No (bar still visible, no gaps/struts) | No | Only in a tabbed column |
| Fullscreen | `fullscreen-window` / `Mod+Shift+F` | Entire screen | No | No | n/a (single window) |

### Maximized (full-width) columns

`maximize-column` expands the column width to the whole screen. It still leaves
space for [struts](./layout.md#struts) and [gaps](./layout.md#gaps), and can
contain multiple windows; windows keep their borders. It is equivalent to
`proportion 1.0` column width, or `set-column-width "100%"`.

Open a window in a maximized column with `open-maximized true`.

### Windows maximized to edges

Since: 25.11. `maximize-window-to-edges` expands a single window to the edges of
the available screen area, like other desktop environments: the bar stays
visible, but struts, gaps, and borders are gone. Windows are aware of this state
and usually square their corners. They can also request it (titlebar maximize
button or double-click), and niri will honor the request.

Multiple maximized windows can share a [tabbed column](#tabs-tabbed-columns),
but not a regular column.

Open a window maximized to edges, or prevent it, with the window rule:

```kdl
window-rule {
    open-maximized-to-edges true
}
```

### Fullscreen windows

`fullscreen-window` covers the entire screen; this is the usual state for video
players, presentations, and games. Windows are aware of their fullscreen status
and may hide titlebars and other UI.

niri renders a solid black backdrop behind fullscreen windows, matching the
screen when the window itself stays smaller (as defined by the xdg-shell
protocol). While a fullscreen window is focused and not animating, it covers
floating windows and the top layer-shell layer. To show notifications or a
launcher over fullscreen windows, put them on the overlay layer-shell layer.

Open a window fullscreen, or prevent it, with the window rule:

```kdl
window-rule {
    match app-id=r#"^org\.telegram\.desktop$"# title="^Media viewer$"
    open-fullscreen false
}
```

### Common behaviors

- Fullscreen and maximize-to-edges windows can only be in the scrolling
  (tiling) layout. Fullscreening or maximizing a floating window moves it into
  the scrolling layout; un-fullscreening/un-maximizing returns it to floating.
- Because niri is scrollable-tiling, fullscreen and maximized windows remain
  normal participants: you can scroll left/right from them and see other
  windows, including in the Overview.
- Fullscreen and maximize-to-edges are window-aware states. Windows sometimes
  want to restore them on open, best done during the initial configure sequence;
  `open-maximized-to-edges` and `open-fullscreen` rules can then block or adjust
  the request. Requests made shortly after the initial configure (some clients
  do this) arrive once the window is already open, so those rules have no
  effect.

## Windowed fullscreen

Since: 25.05. `toggle-windowed-fullscreen` tells a window it is in fullscreen
without actually making it fullscreen. This is useful for screencasting
browser-based presentations: the browser UI is hidden while the window keeps its
normal size.

While in windowed fullscreen, use the niri action to maximize or unmaximize the
window. Window-side titlebar maximize buttons and gestures may not work, because
the window always believes it is in fullscreen.

```kdl
binds {
    Mod+Shift+C { toggle-windowed-fullscreen; }
}
```

## Interaction with layout

- **Gaps**: apply to tiled and maximized columns; maximize-to-edges and
  fullscreen ignore them.
- **Struts**: apply to tiled and maximized columns; maximize-to-edges leaves the
  area used by layer-shell panels; fullscreen covers the whole output.
- **Borders and shadows**: retained on maximized columns; maximize-to-edges and
  fullscreen drop them. `geometry-corner-radius`/`clip-to-geometry` still shape
  the window itself.
- **Floating**: floating windows sit above tiled ones. A focused,
  non-animating fullscreen window covers floating windows and the top
  layer-shell layer.
- **Tabs**: a tabbed column sizes every tab to the same window size, and is the
  only column kind that can hold multiple maximized-to-edges windows.

See `references/layout.md`, `references/window-rules.md`, and
`references/layer-rules.md` for the options referenced here.
