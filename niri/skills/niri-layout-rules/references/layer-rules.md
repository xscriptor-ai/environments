# Layer rules reference

Since: 25.01. `layer-rule {}` adjusts behavior for individual layer-shell
surfaces (bars, notification daemons, launchers, wallpapers, shells). Matching
and precedence work exactly like [window rules](./window-rules.md): rules are
processed in order, `match` directives are OR-ed, matchers inside one directive
are AND-ed, and `exclude` prevents a rule from applying.

Find a surface's namespace with `niri msg layers`.

## Anatomy of a rule

```kdl
layer-rule {
    match namespace="waybar"
    match at-startup=true
    match layer="top"

    // Applied continuously.
    opacity 0.5
    block-out-from "screencast"
    // block-out-from "screen-capture"

    shadow {
        on
        // off
        softness 40
        spread 5
        offset x=0 y=5
        draw-behind-window true
        color "#00000064"
        inactive-color "#00000064"
    }

    geometry-corner-radius 12
    place-within-backdrop true
    baba-is-float true

    background-effect {
        xray true
        blur true
        noise 0.05
        saturation 3
    }

    popups {
        opacity 0.5
        geometry-corner-radius 6
        background-effect {
            xray true
            blur true
            noise 0.05
            saturation 3
        }
    }
}
```

## Matching

| Matcher | Type | Meaning | Since |
| --- | --- | --- | --- |
| `namespace` | regex string | Matches anywhere in the surface namespace | 25.01 |
| `at-startup` | bool | Within the first 60 seconds after niri starts | 25.01 |
| `layer` | string | Layer-shell layer: `"background"`, `"bottom"`, `"top"`, or `"overlay"` | 26.04 |

Notes:

- `namespace` is a Rust `regex` pattern matched anywhere in the namespace, using
  the same syntax as `app-id`/`title` in window rules.
- There is **no** `is-active`, `is-focused`, `is-floating`, or `is-urgent`
  matcher for layer surfaces. Only `namespace`, `at-startup`, and `layer` exist.
- `exclude` accepts the same matchers as `match`.

```kdl
// Match surfaces with a namespace containing "waybar".
layer-rule {
    match namespace="waybar"
}

// Match all overlay-layer surfaces.
layer-rule {
    match layer="overlay"
}
```

## Properties

All layer-rule properties apply continuously to open surfaces. There is no
`focus-ring`, `border`, `tab-indicator`, `clip-to-geometry`, or `tiled-state`
for layer surfaces.

### `opacity`

Surface opacity: `0.0` fully transparent, `1.0` fully opaque. Applied on top of
the surface's own opacity, and to every child individually, so subsurfaces and
pop-ups show content behind them.

```kdl
layer-rule {
    match namespace="^launcher$"
    opacity 0.95
}
```

### `block-out-from`

Block the surface from screencasts or all screen captures; it is replaced with a
solid black rectangle. Useful for notifications. The caveats and semantics are
the same as the [`block-out-from` window rule](./window-rules.md#block-out-from).

| Value | Effect |
| --- | --- |
| `"screencast"` | Blocked from xdg-desktop-portal screencasts; not from third-party screenshot tools. |
| `"screen-capture"` | Blocked from all captures including third-party screenshot tools. |

```kdl
layer-rule {
    match namespace="^notifications$"
    block-out-from "screencast"
}
```

### `shadow`

Since: 25.02. Same options as [the layout `shadow` section](./layout.md#shadow)
(`on`/`off`, `softness`, `spread`, `offset`, `draw-behind-window`, `color`,
`inactive-color`).

Unlike window shadows, layer surface shadows are **never** enabled by the layout
config; they always require a layer rule with `on`.

> Layer surfaces cannot report their visual geometry. If a surface includes
> invisible margins (common with mako), niri draws the shadow behind the entire
> surface including those margins. Configure the client to remove its own
> margins or shadows when using niri shadows.

```kdl
layer-rule {
    match namespace="^launcher$"
    shadow {
        on
    }
    // Fuzzel defaults to 10 px rounded corners.
    geometry-corner-radius 10
}
```

### `geometry-corner-radius`

Since: 25.02. Corner radius of the surface. This only affects the shadow; it
rounds the shadow's corners to match. One value applies to all corners; four
values are top-left, top-right, bottom-right, bottom-left.

```kdl
layer-rule {
    match namespace="^launcher$"
    geometry-corner-radius 12
}
```

### `place-within-backdrop`

Since: 25.05. Set to `true` to place the surface into the backdrop shown in the
Overview and between workspaces. Only works for **background** layer surfaces
that ignore exclusive zones (typical wallpaper tools). Layers in the backdrop
ignore all input.

```kdl
layer-rule {
    match namespace="^wallpaper$"
    place-within-backdrop true
}
```

### `baba-is-float`

Since: 25.05. April Fools' feature: make layer surfaces float up and down.

```kdl
layer-rule {
    match namespace="^launcher$"
    baba-is-float true
}
```

### `background-effect`

Since: 26.04. Override background effects for the surface.

| Option | Values | Meaning |
| --- | --- | --- |
| `xray` | `true`/`false` | `true` enables see-through xray; `false` disables it. |
| `blur` | `true`/`false` | `true` enables blur; `false` force-disables it. Unset means blur when the surface requests it. |
| `noise` | number | Pixel noise added to the background to hide blur banding. |
| `saturation` | number | Background saturation: `0` desaturated, `1` normal, `2` 200%. |

```kdl
layer-rule {
    match layer="top"
    match layer="overlay"
    background-effect {
        xray false
    }
}
```

> Warning: niri has **no `ignore_alpha` equivalent**. Forcing
> `background-effect { blur true }` blurs the **whole rectangle** of the surface,
> including fully transparent areas. On a large, mostly-transparent popup/overlay
> layer surface this paints a full-height blur sheet over the desktop. Prefer
> letting clients request blur through `ext-background-effect`, or scope forced
> blur to small surfaces (a thin bar), never a big popup host.

### `popups`

Since: 26.04. Override properties for the surface's pop-ups (e.g. a Waybar menu
opened from an item). Supports `opacity`, `geometry-corner-radius`, and
`background-effect`. `opacity` applies on top of the surface's own opacity.

```kdl
layer-rule {
    match namespace="^waybar$"
    popups {
        // GTK 3 default popup corner radius.
        geometry-corner-radius 6
        opacity 0.85
        background-effect {
            blur true
        }
    }
}
```

> Affects only xdg-popup surfaces. Shells that emulate pop-ups by drawing them
> inside a normal layer surface are not affected, nor are input-method pop-ups
> such as Fcitx. Pop-ups with custom shapes need the `ext-background-effect`
> protocol for correct blur.

## Shell examples

### Waybar: blur, rounded shadow, and blurred menus

```kdl
layer-rule {
    match namespace="^waybar$"

    shadow {
        on
        softness 20
        offset x=0 y=4
        color "#00000080"
    }

    geometry-corner-radius 10

    background-effect {
        blur true
        xray true
    }

    popups {
        geometry-corner-radius 6
        opacity 0.9
        background-effect {
            blur true
        }
    }
}
```

### mako notifications: block from screencasts

mako uses the namespace `notifications` by default.

```kdl
layer-rule {
    match namespace="^notifications$"

    block-out-from "screencast"
    opacity 0.95
    shadow {
        on
        softness 24
        color "#00000070"
    }
}
```

### Quickshell: dim and blur a shell panel

Quickshell surfaces use the namespace `quickshell` (or a sub-namespace beginning
with it).

```kdl
layer-rule {
    match namespace="^quickshell"

    opacity 0.92
    background-effect {
        blur true
        xray true
        saturation 1.2
    }
}
```

### fuzzel launcher: semi-transparent with a shadow

```kdl
layer-rule {
    match namespace="^launcher$"

    opacity 0.95
    shadow {
        on
    }
    // Fuzzel defaults to 10 px rounded corners.
    geometry-corner-radius 10
}
```

### swaybg wallpaper in the overview backdrop

```kdl
layer-rule {
    match namespace="^wallpaper$"

    place-within-backdrop true
}
```

### Startup-only opacity fade-in for a bar

```kdl
layer-rule {
    match namespace="^waybar$"
    match at-startup=true

    opacity 0.5
}
```

See also `references/window-rules.md` for toplevel equivalents and
`references/layout.md` for the shared `shadow` options.
