# Window rules reference

`window-rule {}` adjusts behavior for individual toplevel windows. A rule has
`match`/`exclude` directives that select windows and any number of properties to
apply. Rules are processed in order of appearance; to target the `app-id` or
`title` of a window, run `niri msg pick-window` and click it.

## Anatomy of a rule

```kdl
window-rule {
    match title="Firefox"
    match app-id="Alacritty"
    match is-active=true
    match is-focused=false
    match is-active-in-column=true
    match is-floating=true
    match is-window-cast-target=true
    match is-urgent=true
    match at-startup=true

    // Applied once, at the initial configure request.
    default-column-width { proportion 0.75; }
    default-window-height { fixed 500; }
    open-on-output "Some Company CoolMonitor 1234"
    open-on-workspace "chat"
    open-maximized true
    open-maximized-to-edges true
    open-fullscreen true
    open-floating true
    open-focused false
    on-xdg-activate "focus"

    // Applied continuously while the window is open.
    draw-border-with-background false
    opacity 0.5
    block-out-from "screencast"
    variable-refresh-rate true
    default-column-display "tabbed"
    default-floating-position x=100 y=200 relative-to="bottom-left"
    scroll-factor 0.75
    pinch-sensitivity 1.25
    tiled-state true
    baba-is-float true

    focus-ring {
        on
        width 4
        active-color "#7fc8ff"
        inactive-color "#505050"
        urgent-color "#9b0000"
    }

    border {
        // Same options as focus-ring.
    }

    shadow {
        on
        softness 40
        spread 5
        offset x=0 y=5
        draw-behind-window true
        color "#00000064"
        inactive-color "#00000064"
    }

    tab-indicator {
        active-color "red"
        inactive-color "gray"
        urgent-color "blue"
    }

    geometry-corner-radius 12
    clip-to-geometry true

    background-effect {
        xray true
        blur true
        noise 0.05
        saturation 3
    }

    popups {
        opacity 0.5
        geometry-corner-radius 15
        background-effect {
            xray true
            blur true
            noise 0.05
            saturation 3
        }
    }

    min-width 100
    max-width 200
    min-height 300
    max-height 300
}
```

## Matching

Each rule has zero or more `match` and `exclude` directives. The rule applies
when the window matches **any** `match` directive and **none** of the `exclude`
directives. Directives are OR-ed; the matchers inside a single directive are
AND-ed.

```kdl
window-rule {
    // Match all Telegram windows...
    match app-id=r#"^org\.telegram\.desktop$"#

    // ...except the media viewer window.
    exclude title="^Media viewer$"

    open-on-output "HDMI-A-1"
}
```

Two matchers in one directive require both to hold:

```kdl
window-rule {
    // Firefox windows with "Gmail" in the title.
    match app-id="firefox" title="Gmail"
}
```

Multiple `match` directives are alternatives:

```kdl
window-rule {
    // Firefox, but only when active...
    match app-id="firefox" is-active=true

    // ...or Telegram.
    match app-id=r#"^org\.telegram\.desktop$"#

    // ...but never the Telegram media viewer.
    exclude app-id=r#"^org\.telegram\.desktop$"# title="Media viewer"
}
```

> There is no `match-any` key. The OR behavior is expressed by writing several
> `match` directives; a single directive ANDs its matchers.

### Matcher reference

| Matcher | Type | Meaning | Since |
| --- | --- | --- | --- |
| `app-id` | regex string | Matches anywhere in the window app ID | - |
| `title` | regex string | Matches anywhere in the window title | - |
| `is-active` | bool | Active window (same as active border/focus-ring color); one per workspace on the focused monitor | - |
| `is-focused` | bool | Window with keyboard focus; only one exists at a time | - |
| `is-active-in-column` | bool | The active window within its column (last focused in that column) | 0.1.6 |
| `is-floating` | bool | Floating window; applies only after the window is open | 25.01 |
| `is-window-cast-target` | bool | Target of an ongoing individual-window screencast | 25.02 |
| `is-urgent` | bool | Window requesting the user's attention | 25.05 |
| `at-startup` | bool | Within the first 60 seconds after niri starts | 0.1.6 |

Details:

- **`app-id` and `title`** are Rust `regex` patterns matched anywhere in the
  string. Use raw KDL strings for regex-heavy patterns:
  `exclude app-id=r#"^org\.keepassxc\.KeePassXC$"#`. The supported syntax is
  documented at <https://docs.rs/regex/latest/regex/#syntax>.
- **`is-active` vs `is-focused`**: every workspace on the focused monitor has
  one active window, so there are usually several `is-active` windows at once.
  When a layer-shell launcher or pop-up menu takes keyboard focus, no window
  matches `is-focused`.
- **`is-active-in-column`**: always exactly one such window per column. Since:
  25.01 it matches `true` during initial opening as well.
- **`is-floating`** only applies once the window is already open, so it cannot
  change opening properties such as `default-window-height` or
  `open-on-workspace`.
- **`is-window-cast-target`** matches individual-window screencasts only, not
  windows merely visible in a monitor screencast.
- **`at-startup`** is useful for `open-on-output`-style rules you only want right
  after startup.

## Rule precedence and merging

- Rules are evaluated **in order of appearance**. Put generic rules first, then
  override for specific windows later.
- A later matching rule overrides scalar and color properties set earlier.
- You cannot "unset" a property in a later rule, only set a different value. Use
  `exclude` to keep a rule from applying at all.

```kdl
// All windows open maximized...
window-rule {
    open-maximized true
}

// ...then Alacritty opens unmaximized.
window-rule {
    match app-id="Alacritty"
    open-maximized false
}
```

- `focus-ring`, `border`, `shadow`, and `tab-indicator` blocks **merge**
  property-by-property across rules. Setting a solid color in a later rule
  clears an earlier gradient for that slot.
- For `focus-ring`/`border`/`shadow`/`tab-indicator`, both `on` and `off` flags
  exist. Within one rule `on` wins over `off`. Applied across rules in sequence,
  each `off` disables and each `on` enables.
- Opening properties are read once, when niri sends the initial configure
  request. Dynamic properties apply continuously while the window is open.

## Opening properties

Applied once, at the initial configure request.

### `default-column-width`

Default width for the new window; same syntax as
`preset-column-widths` (`proportion` or `fixed`). Also applies to floating
windows despite the word "column". An empty block `{}` lets the window choose.

```kdl
window-rule {
    match app-id=r#"^blender$"#
    match app-id=r#"^gimp"#
    default-column-width { fixed 1200; }
}
```

### `default-window-height`

Since: 25.01. Default height for the new window.

```kdl
window-rule {
    match app-id="firefox$" title="^Picture-in-Picture$"
    open-floating true
    default-column-width { fixed 480; }
    default-window-height { fixed 270; }
}
```

### `open-on-output`

Open the window on a specific output. If the output does not exist, the window
opens on the focused output as usual. A window opened on a non-focused output is
not automatically focused. Since: 0.1.9 the value may be a connector name or the
monitor's manufacturer, model, and serial.

```kdl
window-rule {
    match app-id="firefox$"
    open-on-output "HDMI-A-1"
    // Or: open-on-output "Some Company CoolMonitor 1234"
}
```

### `open-on-workspace`

Since: 0.1.6. Open the window on a specific named workspace. If it does not
exist, the window opens on the focused workspace as usual. A window opened on a
non-focused output is not automatically focused.

```kdl
window-rule {
    match app-id=r#"^org\.gnome\.Fractal$"#
    open-on-workspace "chat"
}
```

### `open-maximized`

Open the window as a maximized (full-width) column. Maximized columns still
leave space for gaps and struts and can contain multiple windows.

```kdl
window-rule {
    match app-id="firefox$"
    open-maximized true
}
```

### `open-maximized-to-edges`

Since: 25.11. Open the window maximized to edges (no gaps, struts, or borders).
Set to `false` to prevent such a window from opening maximized to edges.

```kdl
window-rule {
    open-maximized-to-edges true
}

window-rule {
    match app-id=r#"^org\.telegram\.desktop$"#
    open-maximized-to-edges false
}
```

### `open-fullscreen`

Open the window fullscreen. Set to `false` to prevent it from opening
fullscreen.

```kdl
window-rule {
    match app-id=r#"^org\.telegram\.desktop$"# title="^Media viewer$"
    open-fullscreen false
}
```

### `open-floating`

Since: 25.01. Open the window in the floating layout. Set to `false` to force a
window into the tiling layout, overriding automatic floating logic.

```kdl
window-rule {
    match app-id="firefox$" title="^Picture-in-Picture$"
    open-floating true
}

window-rule {
    open-floating false
}
```

### `open-focused`

Since: 25.01. Set to `false` to stop a window from being auto-focused on open.
Set to `true` to focus a window that normally would not be auto-focused.

```kdl
window-rule {
    match app-id="^gimp" title="^GIMP Startup$"
    open-focused false
}

window-rule {
    match app-id=r#"^org\.keepassxc\.KeePassXC$"# title="^Unlock Database - KeePassXC$"
    open-focused true
}
```

### `on-xdg-activate`

Since: next release. What niri does when a window requests activation via
xdg-activation.

| Value | Behavior |
| --- | --- |
| `"ignore"` | Neither focus nor mark urgent. |
| `"set-urgent"` | Always mark urgent instead of focusing. |
| `"focus"` | Always focus, even for requests without a serial. |

When unset, niri focuses requests with a valid serial and marks urgent requests
without a serial. Requests with a set-but-invalid serial are ignored unless the
`honor-xdg-activation-with-invalid-serial` debug flag is set.

```kdl
window-rule {
    match title="^Picture-in-Picture$"
    open-floating true
    on-xdg-activate "set-urgent"
}
```

## Dynamic properties

Applied continuously while the window is open.

### `opacity`

Window opacity: `0.0` fully transparent, `1.0` fully opaque. Applied on top of
the window's own opacity, so semitransparent windows become more transparent.
Applied to every surface individually, so subsurfaces and pop-ups show window
content behind them. Toggle it at runtime with `toggle-window-rule-opacity`.

```kdl
window-rule {
    match is-active=false
    opacity 0.95
}
```

### `variable-refresh-rate`

Since: 0.1.9. When `true`, this window enables VRR on any output with on-demand
VRR while it is displayed there.

```kdl
output "HDMI-A-1" {
    variable-refresh-rate on-demand=true
}

window-rule {
    match app-id="^mpv$"
    variable-refresh-rate true
}
```

### `default-column-display`

Since: 25.02. Default display mode for columns created from this window. One of
`"normal"` or `"tabbed"`. Used whenever the window enters its own column:
opening, expelling, or moving from the floating layout.

```kdl
window-rule {
    match app-id="^evince$"
    default-column-display "tabbed"
}
```

### `default-floating-position`

Since: 25.01. Initial position for the window when it opens on or moves to the
floating layout. Afterwards the window remembers its last floating position.
Coordinates are logical and relative to the working area.

`relative-to` may be `top-left` (default), `top-right`, `bottom-left`,
`bottom-right`, `top`, `bottom`, `left`, or `right`. Single-side values center
the window along that side. Coordinate direction flips with `relative-to`: with
`bottom-left`, positive `y` moves up.

```kdl
window-rule {
    match app-id="firefox$" title="^Picture-in-Picture$"
    default-floating-position x=32 y=32 relative-to="bottom-left"
}
```

A dropdown-style terminal:

```kdl
window-rule {
    match app-id="^dropdown$"
    open-floating true
    default-floating-position x=0 y=0 relative-to="top"
    default-window-height { proportion 0.5; }
    default-column-width { proportion 0.8; }
}
```

### `scroll-factor`

Since: 25.02. Multiplied with the scroll factor of the input device.

```kdl
window-rule {
    match app-id="firefox$"
    scroll-factor 0.75
}
```

### `pinch-sensitivity`

Since: next release. Multiplied with the touchpad pinch sensitivity.

```kdl
window-rule {
    match app-id="firefox$"
    pinch-sensitivity 1.25
}
```

### `draw-border-with-background`

Override whether the border and focus ring draw with a solid background. `true`
draws solid rectangles even for windows that omit client-side decorations;
`false` draws borders around the window even for CSD windows.

At the default (`true`) niri paints a **solid rectangle** in the border colour
behind the window; combined with any window `opacity`, this tints translucent
windows the border colour. Set `draw-border-with-background false` - for example
in a catch-all window rule - to draw the border as a ring instead. Note also that
using the palette's loud accent as the active border colour clashes; the muted
colour (`color8`) is a neutral choice.

```kdl
window-rule {
    draw-border-with-background false
}
```

### `focus-ring` and `border`

Since: 0.1.6. Override the focus ring and border for the window. Same options as
[the layout section](./layout.md#focus-ring-and-border), plus `on` to enable a
decoration that is otherwise disabled. `on` takes precedence over `off`.

```kdl
window-rule {
    focus-ring {
        off
        width 2
    }
}

window-rule {
    border {
        on
        width 8
    }
}
```

### `shadow`

Since: 25.02. Override the shadow for the window. Same options as
[the layout section](./layout.md#shadow), plus `off` to disable a shadow that is
otherwise enabled. `on` takes precedence over `off`.

```kdl
window-rule {
    match is-floating=true
    shadow {
        on
    }
}
```

### `tab-indicator`

Since: 25.02. Override tab indicator options for the window. Same options as
[the layout section](./layout.md#tab-indicator). Tab colors from this rule take
precedence over the layout options.

```kdl
window-rule {
    match app-id=r#"^org\.keepassxc\.KeePassXC$"#
    tab-indicator {
        inactive-color "darkred"
    }
}
```

### `geometry-corner-radius`

Since: 0.1.6. Corner radius of the window in logical pixels. On its own it only
affects the border and focus ring (rounding their corners to match). Set
`clip-to-geometry true` to also round the window itself. One value applies to
all corners; four values are top-left, top-right, bottom-right, bottom-left.

```kdl
window-rule {
    geometry-corner-radius 12
}

window-rule {
    // GTK 3 style: only top corners rounded.
    match app-id="^gedit$"
    geometry-corner-radius 8 8 0 0
}
```

### `clip-to-geometry`

Since: 0.1.6. Clip the window to its visual geometry. Cuts out client-side
shadows and rounds corners per `geometry-corner-radius`.

```kdl
prefer-no-csd

layout {
    focus-ring { off }
    border { width 2 }
}

window-rule {
    geometry-corner-radius 12
    clip-to-geometry true
}
```

### `tiled-state`

Since: 25.05. Inform the window that it is tiled; most windows respond by
becoming rectangular and hiding client-side shadows. Useful to override niri's
default link with `prefer-no-csd`.

```kdl
window-rule {
    match is-floating=false
    tiled-state true
}
```

### `baba-is-float`

Since: 25.02. April Fools' 2025 feature: make windows float up and down.

```kdl
window-rule {
    match is-floating=true
    baba-is-float true
}
```

### `block-out-from`

Block a window out of screencasts or all screen captures. It is replaced with a
solid black rectangle.

| Value | Effect |
| --- | --- |
| `"screencast"` | Blocked from xdg-desktop-portal screencasts and the built-in screenshot UI. Not blocked from third-party screenshot tools. |
| `"screen-capture"` | Blocked from all captures, including third-party screenshot tools and automatic `screenshot-screen`/`screenshot-window`. Interactive built-in screenshot still works. |

Preview with `preview-render` in the debug section.

```kdl
window-rule {
    match app-id=r#"^org\.keepassxc\.KeePassXC$"#
    match app-id=r#"^org\.gnome\.World\.Secrets$"#
    block-out-from "screencast"
}
```

> Blocking out based on a dynamically changing title is unreliable: title and
> app ID are not double-buffered, so a sensitive tab can flash on a screencast
> when switching tabs.

### `background-effect`

Since: 26.04. Override background effects for the window.

| Option | Values | Meaning |
| --- | --- | --- |
| `xray` | `true`/`false` | `true` enables see-through xray; `false` disables it (non-xray effects are experimental). |
| `blur` | `true`/`false` | `true` enables background blur; `false` force-disables it. Unset means blur when the app requests it. |
| `noise` | number | Pixel noise added to the background, to hide blur color banding. |
| `saturation` | number | Background saturation: `0` desaturated, `1` normal, `2` 200%. |

Xray is enabled automatically whenever another background effect is active. See
`niri-window-effects` for details.

```kdl
window-rule {
    match is-floating=true
    background-effect {
        xray false
    }
}
```

### `popups`

Since: 26.04. Override properties for the window's pop-ups (menus and tooltips).
Supports `opacity`, `geometry-corner-radius`, and `background-effect`. `opacity`
applies on top of the surface's own opacity.

```kdl
window-rule {
    match app-id="Nautilus"
    popups {
        geometry-corner-radius 15
        opacity 0.5
        background-effect {
            blur true
        }
    }
}
```

> `popups` affects only xdg-popup surfaces. Client-emulated pop-ups and
> wl-subsurface menus (some GTK 3 and Firefox menus) are not affected, nor are
> input-method pop-ups such as Fcitx. Pop-ups with custom shapes (e.g. GTK 4
> `has-arrow` menus) need the `ext-background-effect` protocol for correct blur.

### Size overrides

`min-width`, `min-height`, `max-width`, and `max-height` amend the window's size
limits in logical pixels. The window always has the final say.

> `max-height` only applies to automatically-sized windows if it equals
> `min-height`. Either set them equal or change the height manually with
> `set-window-height`.

```kdl
window-rule {
    match app-id=r#"^com\.obsproject\.Studio$"#
    min-width 876
}
```

## Worked examples

### 1. Generic maximize, then exception

```kdl
window-rule {
    open-maximized true
}

window-rule {
    match app-id="Alacritty"
    open-maximized false
}
```

### 2. Telegram on a monitor, except its media viewer

```kdl
window-rule {
    match app-id=r#"^org\.telegram\.desktop$"#
    exclude title="^Media viewer$"
    open-on-output "HDMI-A-1"
}
```

### 3. Firefox picture-in-picture as a small floating window

```kdl
window-rule {
    match app-id="firefox$" title="^Picture-in-Picture$"
    open-floating true
    default-column-width { fixed 480; }
    default-window-height { fixed 270; }
    default-floating-position x=32 y=32 relative-to="bottom-left"
    on-xdg-activate "set-urgent"
}
```

### 4. Red decorations for windows being screencast

```kdl
window-rule {
    match is-window-cast-target=true
    focus-ring {
        active-color "#f38ba8"
        inactive-color "#7d0d2d"
    }
    border {
        inactive-color "#7d0d2d"
    }
    shadow {
        color "#7d0d2d70"
    }
    tab-indicator {
        active-color "#f38ba8"
        inactive-color "#7d0d2d"
    }
}
```

### 5. Password managers blocked from screencasts

```kdl
window-rule {
    match app-id=r#"^org\.keepassxc\.KeePassXC$"#
    match app-id=r#"^org\.gnome\.World\.Secrets$"#
    block-out-from "screencast"
}
```

### 6. Rounded corners, clipped geometry, no CSD

```kdl
prefer-no-csd

layout {
    focus-ring { off }
    border { width 2 }
}

window-rule {
    geometry-corner-radius 12
    clip-to-geometry true
}
```

### 7. Dim inactive windows

```kdl
window-rule {
    match is-active=false
    opacity 0.95
}
```

### 8. Dropdown terminal anchored to the top edge

```kdl
window-rule {
    match app-id="^dropdown$"
    open-floating true
    default-floating-position x=0 y=0 relative-to="top"
    default-window-height { proportion 0.5; }
    default-column-width { proportion 0.8; }
}
```

### 9. Blur behind Nautilus pop-up menus

```kdl
window-rule {
    match app-id="Nautilus"
    popups {
        geometry-corner-radius 15
        opacity 0.5
        background-effect {
            blur true
        }
    }
}
```

### 10. Shadow only for floating windows

```kdl
window-rule {
    match is-floating=true
    shadow {
        on
        softness 40
        offset x=0 y=8
    }
}
```

### 11. Startup-only monitor placement

```kdl
window-rule {
    match at-startup=true
    open-on-output "HDMI-A-1"
}
```

### 12. Guaranteed minimum width for a misbehaving app

```kdl
window-rule {
    match app-id=r#"^com\.obsproject\.Studio$"#
    min-width 876
}
```

See also `references/layer-rules.md` for layer-shell surfaces and
`references/floating-tabs-fullscreen.md` for how the opening properties interact
with the floating, tabbed, fullscreen, and maximize behaviors.
