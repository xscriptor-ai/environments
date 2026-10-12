# Animations

Baseline: Hyprland 0.55+ Lua, niri 26.04. This maps `hl.curve` / bezier / spring
and `hl.animation` leaf names to niri `animations {}`.

The models differ. Hyprland names animations by *leaf* (what is being animated)
and attaches a named curve plus a `speed` and optionally a `style`. niri names a
fixed set of animation *targets* and each target is either an easing animation
(`duration-ms` + `curve`) or a spring (physical parameters). There is no
`speed`, no named curve table, and no `style`.

Everything must be re-authored: map the leaf to a target, then choose an easing
or spring and tune it anew. Do not try to convert `speed` to `duration-ms`
numerically.

## Global controls

| Hyprland | niri |
| --- | --- |
| `hl.config({ animations = { enabled = true } })` | default; remove or comment `animations { off }` |
| `animations = { enabled = false }` | `animations { off }` |
| (none) | `animations { slowdown N }` (values below 1 speed up) |

## Leaf-to-target mapping

| Hyprland `hl.animation` leaf | niri target | Notes |
| --- | --- | --- |
| `windowsIn` | `window-open` | Uses `duration-ms` + `curve` by default. |
| `windowsOut` | `window-close` | Since: 0.1.5. |
| `windowsMove` | `window-movement` | Since: 0.1.5; spring by default. |
| (window resize) | `window-resize` | Since: 0.1.5; manual resizes only. |
| `workspaces` | `workspace-switch` | Spring by default; vertical. |
| (horizontal view scroll) | `horizontal-view-movement` | No Hyprland leaf; niri-only. |
| `border` | none | Borders do not animate. |
| `borderangle` | none | No border rotation/loop. |
| `fade` | none | Covered by window open/close. |
| `fadeIn` | none (use `window-open`) | |
| `fadeOut` | none (use `window-close`) | |
| `fadeSwitch` | none | |
| `fadeShadow` | none | |
| `fadeDim` | none | |
| `layers` | none | Layer surfaces do not have a configurable animation. |
| `specialWorkspace` | none | No special workspaces. |
| (config error UI) | `config-notification-open-close` | niri-only target. |
| (screenshot UI) | `screenshot-ui-open` | Since: 0.1.8. |
| (overview) | `overview-open-close` | Since: 25.05. |
| (recent windows) | `recent-windows-close` | Since: 25.11. |
| (exit dialog) | `exit-confirmation-open-close` | Since: 25.08. |

## Curves

Hyprland defines named bezier curves with two control points:
`hl.curve("overshot", { type = "bezier", points = { {0.13, 0.99}, {0.29, 1.15} } })`.

niri has four built-in easing curves plus a custom cubic-bezier (Since: 25.08):

- `ease-out-quad`, `ease-out-cubic`, `ease-out-expo`, `linear`
- `curve "cubic-bezier" x1 y1 x2 y2`

The control points are identical to CSS `cubic-bezier`, so a Hyprland bezier
maps directly:

| Hyprland curve | niri |
| --- | --- |
| `{ type = "bezier", points = { {0.25,0.1}, {0.25,1} } }` | `curve "cubic-bezier" 0.25 0.1 0.25 1` |
| `{ type = "bezier", points = { {0.13,0.99}, {0.29,1.15} } }` | `curve "cubic-bezier" 0.13 0.99 0.29 1.15` |
| `{ type = "bezier", points = { {0.16,1}, {0.3,1} } }` | `curve "ease-out-expo"` (built-in) or `cubic-bezier 0.16 1 0.3 1` |
| `{ type = "bezier", points = { {0,0}, {1,1} } }` | `curve "linear"` |
| `type = "spring"` | `spring damping-ratio=.. stiffness=.. epsilon=..` |

niri has no named-curve table, so reference the bezier inline on each
animation. Spring parameters (`damping-ratio`, `stiffness`, `epsilon`) have no
Hyprland counterpart and must be tuned; use the Elastic app for visuals.
`damping-ratio` above 1.0 is not recommended (numerical stability).

## Before / after

```lua
-- animations.lua (Hyprland)
hl.config({ animations = { enabled = true } })

hl.curve("smooth",         { type = "bezier", points = { {0.25, 0.1}, {0.25, 1} } })
hl.curve("overshot",       { type = "bezier", points = { {0.13, 0.99}, {0.29, 1.15} } })
hl.curve("easeOutExpo",    { type = "bezier", points = { {0.16, 1}, {0.3, 1} } })

hl.animation({ leaf = "windowsIn",  enabled = true, speed = 6, bezier = "overshot", style = "popin 80%" })
hl.animation({ leaf = "windowsOut", enabled = true, speed = 5, bezier = "easeOutExpo", style = "popin 80%" })
hl.animation({ leaf = "windowsMove", enabled = true, speed = 5, bezier = "overshot" })
hl.animation({ leaf = "border", enabled = true, speed = 10, bezier = "smooth" })
hl.animation({ leaf = "borderangle", enabled = true, speed = 100, bezier = "linear", style = "loop" })
hl.animation({ leaf = "workspaces", enabled = true, speed = 6, bezier = "overshot", style = "slide" })
hl.animation({ leaf = "specialWorkspace", enabled = true, speed = 6, bezier = "overshot", style = "slidevert" })
```

```kdl
// animations.kdl (niri)
animations {
    window-open {
        duration-ms 180
        curve "cubic-bezier" 0.13 0.99 0.29 1.15
    }

    window-close {
        duration-ms 180
        curve "ease-out-expo"
    }

    window-movement {
        spring damping-ratio=1.0 stiffness=800 epsilon=0.0001
    }

    window-resize {
        spring damping-ratio=1.0 stiffness=800 epsilon=0.0001
    }

    horizontal-view-movement {
        spring damping-ratio=1.0 stiffness=800 epsilon=0.0001
    }

    workspace-switch {
        spring damping-ratio=1.0 stiffness=1000 epsilon=0.0001
    }

    // border, borderangle, fade*, layers and specialWorkspace have no target.
}
```

## Notes on the lost options

- **`speed`.** No niri equivalent. A higher Hyprland speed is a shorter
  animation, but the mapping is not linear. Pick a `duration-ms` or spring
  stiffness that feels right.
- **`style`.** No equivalent for `popin`, `slide`, `slidevert`, `loop` or
  `fade`. niri's window open/close and workspace switch have fixed motion;
  re-create a custom look with `custom-shader` (Since: 0.1.6) if required.
- **`border` / `borderangle`.** niri does not animate border color or a
  rotating gradient.
- **`layers`.** No per-layer animation target.
- **`specialWorkspace`.** No special workspaces to animate.

## Custom shaders

niri's `window-open`, `window-close` and `window-resize` accept a
`custom-shader` (Since: 0.1.6). This is the escape hatch when a Hyprland `style`
must be reproduced. Example: a resize that shows the next texture stretched:

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

Custom shader interfaces are not covered by a backwards-compatibility promise;
a shader that fails to compile logs a warning and falls back. Since next release
a shader can be attached by path with `custom-shader path="./shader.glsl"`.

See `references/config-structure.md` for where `animations.kdl` fits in the
included tree.
