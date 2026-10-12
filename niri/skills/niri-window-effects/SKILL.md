---
name: niri-window-effects
description: Use when configuring niri visual effects and screencasting: blur, background-effect, xray, saturation, noise, drop shadows, gradients, geometry-corner-radius and rounded corners, clip-to-geometry, block-out-from, the blur {} section, the animations {} section (window-open, window-close, window-movement, window-resize, workspace-switch, overview-open-close, custom-shader, spring, easing curves), pick-window cast targets, and xdg-desktop-portal-gnome screencasting.
---

# Skill: niri-window-effects

Orientation for niri's visual effects and screen-capture features: the
`background-effect {}` block on window and layer rules (blur, xray, saturation,
noise), the global `blur {}` section, corner rounding, the `animations {}`
section, and the screencasting controls (`block-out-from`, dynamic cast targets,
windowed fullscreen).

Baseline: **niri 26.04** (2026-04-25). niri uses date versioning (`25.01`,
`25.05`, `26.04`), not semantic versioning. Config is live-reloaded on save;
validate with `niri validate`.

## Where each effect is configured

| Effect | Where | Reference |
| --- | --- | --- |
| Blur, xray, saturation, noise | `window-rule { background-effect {} }`, `layer-rule { background-effect {} }`, pop-ups via `popups {}` | `references/background-effects.md` |
| Global blur tuning | top-level `blur {}` (`passes`, `offset`, `noise`, `saturation`, `off`) | `references/background-effects.md` |
| Rounded corners | `window-rule { geometry-corner-radius N }` and `clip-to-geometry true`; borders/focus-ring are drawn with a background that can show through transparent windows | `references/background-effects.md` |
| Animations | top-level `animations {}` (`off`, `slowdown`, per-animation easing or spring, `custom-shader`) | `references/animations.md` |
| Screencast privacy and targets | `window-rule`/`layer-rule { block-out-from }`, `is-window-cast-target`, dynamic cast actions, `toggle-windowed-fullscreen` | `references/screencasting.md` |

`background-effect` and the global `blur {}` section are Since: 26.04. Blur can
also be requested by applications through the `ext-background-effect` protocol
without any niri configuration.

## Minimal examples

Blur behind a terminal and a launcher, rounded corners globally:

```kdl
blur {
    passes 3
    offset 3
}

window-rule {
    match app-id=r#"^Alacritty$"#
    background-effect {
        blur true
    }
}

layer-rule {
    match namespace="^launcher$"
    background-effect {
        blur true
    }
}

window-rule {
    geometry-corner-radius 12
    clip-to-geometry true
}
```

Turn off all animations, then customize just window open/close:

```kdl
animations {
    // off
    window-open {
        duration-ms 150
        curve "ease-out-expo"
    }
    window-close {
        duration-ms 150
        curve "ease-out-quad"
    }
}
```

## References

- `references/background-effects.md` - blur, xray, saturation, noise; the
  `background-effect {}` block for windows and layers; `ext-background-effect`
  versus manual rules; global `blur {}`; pop-ups; non-xray experimental caveats;
  and interaction with semitransparent windows and the border/focus-ring
  background.
- `references/screencasting.md` - portal requirements, `block-out-from` for
  windows and layers, dynamic cast targets, the `is-window-cast-target`
  indicator, windowed fullscreen, `wl-mirror` mirroring, and
  `xdg-desktop-portal-gnome`.
- `references/animations.md` - the `animations {}` section, `off`/`slowdown`,
  every per-animation option, easing curves and springs, custom shaders, and
  synchronized animations.
