# Animations

Baseline: **niri 26.04** (2026-04-25).

All animations are configured in the single top-level `animations {}` section.
Every animation can be set to an easing animation or a spring, disabled
individually with `off`, or disabled/slowed globally.

## The `animations {}` section

Here is the full set of animations with their upstream default values:

```kdl
animations {
    // Uncomment to turn off all animations.
    // You can also put "off" into each individual animation to disable it.
    // off

    // Slow down all animations by this factor. Values below 1 speed them up instead.
    // slowdown 3.0

    // Individual animations.

    workspace-switch {
        spring damping-ratio=1.0 stiffness=1000 epsilon=0.0001
    }

    window-open {
        duration-ms 150
        curve "ease-out-expo"
    }

    window-close {
        duration-ms 150
        curve "ease-out-quad"
    }

    horizontal-view-movement {
        spring damping-ratio=1.0 stiffness=800 epsilon=0.0001
    }

    window-movement {
        spring damping-ratio=1.0 stiffness=800 epsilon=0.0001
    }

    window-resize {
        spring damping-ratio=1.0 stiffness=800 epsilon=0.0001
    }

    config-notification-open-close {
        spring damping-ratio=0.6 stiffness=1000 epsilon=0.001
    }

    exit-confirmation-open-close {
        spring damping-ratio=0.6 stiffness=500 epsilon=0.01
    }

    screenshot-ui-open {
        duration-ms 200
        curve "ease-out-quad"
    }

    overview-open-close {
        spring damping-ratio=1.0 stiffness=800 epsilon=0.0001
    }

    recent-windows-close {
        spring damping-ratio=1.0 stiffness=800 epsilon=0.001
    }
}
```

## Global controls

- `off` - a flag that disables all animations at once. It can also be placed
  inside any individual animation node to disable just that one.
- `slowdown <factor>` - slows all animations by this factor; values below `1.0`
  speed them up.

```kdl
animations {
    off
}
```

## Animation types

### Easing

An easing animation changes the value over a set duration using an interpolation
curve. Set exactly these two parameters:

- `duration-ms` - duration in milliseconds.
- `curve` - the easing curve name.

```kdl
animations {
    window-open {
        duration-ms 150
        curve "ease-out-expo"
    }
}
```

Available curves:

| Curve | Since |
| --- | --- |
| `ease-out-quad` | 0.1.5 |
| `ease-out-cubic` | |
| `ease-out-expo` | |
| `linear` | 0.1.6 |
| `cubic-bezier` | 25.08 |

`cubic-bezier` takes four numbers defining the control points, matching CSS
`cubic-bezier(x1, y1, x2, y2)`:

```kdl
animations {
    window-open {
        // Same as CSS cubic-bezier(0.05, 0.7, 0.1, 1)
        curve "cubic-bezier" 0.05 0.7 0.1 1
    }
}
```

### Spring

A spring animation uses a physical spring model. It feels better with touchpad
gestures because it accounts for the finger velocity at release, and it can
oscillate at the end depending on the parameters. Springs have three mandatory
parameters and no directly settable duration; tune them by trial and error.

```kdl
animations {
    workspace-switch {
        spring damping-ratio=1.0 stiffness=1000 epsilon=0.0001
    }
}
```

| Parameter | Meaning |
| --- | --- |
| `damping-ratio` | `0.1` to `10.0`. Below `1.0` = underdamped (oscillates), above `1.0` = overdamped (no oscillation), exactly `1.0` = critically damped |
| `stiffness` | Lower values make the animation slower and more prone to oscillation |
| `epsilon` | Lower the value if the animation "jumps" at the end |

> Warning: overdamped springs (damping ratio above `1.0`) currently have
> numerical stability issues and may cause graphical glitches. Setting
> `damping-ratio` above `1.0` is not recommended.

The spring **mass** is hardcoded to `1.0` and cannot be changed. To emulate a
different mass, change `stiffness` proportionally (doubling mass equals halving
stiffness). Even at `damping-ratio=1.0` a spring may oscillate if launched with
enough velocity from a touchpad swipe.

## Per-animation reference

| Animation | Type (default) | Since | What it animates |
| --- | --- | --- | --- |
| `workspace-switch` | spring | | Switching workspaces up/down, including after the vertical touchpad gesture |
| `window-open` | easing | | Window opening |
| `window-close` | easing | 0.1.5 | Window closing |
| `horizontal-view-movement` | spring | | Horizontal camera movement (focus scrolling to an off-screen window, a new off-screen window, after a horizontal gesture) |
| `window-movement` | spring | 0.1.5 | Movement of windows within a workspace (moving columns/windows, windows moving aside on open/close, consume/expel). Excludes camera movement |
| `window-resize` | spring | 0.1.5 | Window resize. Only manual resizes are animated (`switch-preset-column-width`, `maximize-column`); resizes of up to 10 pixels are not animated |
| `config-notification-open-close` | spring (`damping-ratio=0.6`) | | Open/close of the config parse-error and new-default-config notifications. A single open **and** close animation |
| `exit-confirmation-open-close` | spring (`damping-ratio=0.6`) | 25.08 | Open/close of the exit confirmation dialog |
| `screenshot-ui-open` | easing | 0.1.8 | Fade-in of the screenshot UI |
| `overview-open-close` | spring | 25.05 | Open/close zoom of the Overview |
| `recent-windows-close` | spring | 25.11 | Close fade-out of the recent-windows switcher |

Note that `config-notification-open-close`, `exit-confirmation-open-close`, and
`overview-open-close` are single nodes that cover both directions; there are no
separate `-open` and `-close` options for them.

## Custom shaders

Since: 0.1.6. `window-open`, `window-close`, and `window-resize` accept a
`custom-shader` that draws the window during that animation. If the shader fails
to compile, niri prints a warning and falls back to the default or previous
successfully compiled shader (see the journal when running as a systemd service:
`journalctl -ef /usr/bin/niri`).

Custom shaders have **no backwards-compatibility guarantee**; their interface may
change between releases.

The `window-open` shader entry point is `open_color`:

```kdl
animations {
    window-open {
        duration-ms 250
        curve "linear"

        custom-shader r"
            vec4 open_color(vec3 coords_geo, vec3 size_geo) {
                vec4 color = vec4(0.0);

                if (0.0 <= coords_geo.x && coords_geo.x <= 1.0
                        && 0.0 <= coords_geo.y && coords_geo.y <= 1.0)
                {
                    vec4 from = vec4(1.0, 0.0, 0.0, 1.0);
                    vec4 to = vec4(0.0, 1.0, 0.0, 1.0);
                    color = mix(from, to, coords_geo.y);
                }

                return color * niri_clamped_progress;
            }
        "
    }
}
```

The `window-close` entry point is `close_color`; the example fades a gradient
away with `return color * (1.0 - niri_clamped_progress);`.

The `window-resize` entry point is `resize_color`, which can sample the next
(resized) texture immediately:

```kdl
animations {
    window-resize {
        custom-shader r"
            vec4 resize_color(vec3 coords_curr_geo, vec3 size_curr_geo) {
                vec3 coords_tex_next = niri_geo_to_tex_next * coords_curr_geo;
                vec4 color = texture2D(niri_tex_next, coords_tex_next.st);
                return color;
            }
        "
    }
}
```

Since: next release, the shader can also be attached by path instead of inline:

```kdl
animations {
    window-open {
        custom-shader path="./my-shader.glsl"
    }
}
```

## Synchronized animations

Since: 0.1.5. When two animations are meant to play together, niri drives both
with the same configuration. For example, a window resize that also moves the
view uses the `window-resize` configuration rather than
`horizontal-view-movement`; resizing a window vertically makes other windows move
using `window-resize` rather than `window-movement`. This matters especially for
animated resizes with `center-focused-column "always"`.

A few actions still lack this synchronization. For best results, keep the
following three related animations at the same parameters (they match by
default): `horizontal-view-movement`, `window-movement`, `window-resize`.

## Examples

Disable all animations:

```kdl
animations {
    off
}
```

Disable only window open/close animations:

```kdl
animations {
    window-open {
        off
    }
    window-close {
        off
    }
}
```

Customize window open and close with easings:

```kdl
animations {
    window-open {
        duration-ms 220
        curve "ease-out-cubic"
    }
    window-close {
        duration-ms 120
        curve "cubic-bezier" 0.4 0.0 1.0 1.0
    }
}
```

Slow everything down to a third of the normal speed:

```kdl
animations {
    slowdown 3.0
}
```
