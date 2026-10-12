# Layer rules and glass blur

Baseline: Hyprland 0.55+ Lua, niri 26.04. This maps Hyprland `layerrule` to
niri `layer-rule {}`, and in particular the glass/backdrop-blur workflow.

## The blur migration

Hyprland's layer rule `blur = true` enables the same global decoration blur for
a layer surface. In niri (Since: 26.04) blur is a property of an explicit
`background-effect` block, tuned globally by the top-level `blur {}` section.

So the glass migration is two parts:

1. A top-level `blur {}` section that tunes blur once (passes, offset, noise,
   saturation). This replaces `decoration:blur` size/passes/noise/vibrancy.
2. A `layer-rule { background-effect { blur true } }` per namespace that should
   be frosted. This replaces `layerrule = blur, ^namespace$`.

niri blur is only applied where a surface requests it (ext-background-effect) or
where a window/layer rule enables it. There is no global "blur everything"
switch.

## layerrule -> layer-rule

| Hyprland `layerrule` | niri `layer-rule` | Notes |
| --- | --- | --- |
| `namespace:REGEX` / `match = { namespace = REGEX }` | `match namespace="REGEX"` | Rust regex; raw string for backslashes. |
| `blur` | `background-effect { blur true }` | Since: 26.04. |
| `ignorealpha A` | none | No direct knob. niri shapes blur to geometry/corner radius. See below. |
| `xray` | `background-effect { xray true }` | Xray is on by default when other effects are active. |
| `noanim` | none | **No per-layer animation opt-out.** |
| `dimaround` | none | No dimming. |
| `blurpopups` | `popups { background-effect { blur true } }` | Since: 26.04. |
| `animation` | none | No layer animation config. |
| (niri-only) `match layer="top"` | `match layer` | Since: 26.04. |
| (niri-only) `opacity N` | `opacity` | Continuous layer opacity. |
| (niri-only) `shadow { on }` | `shadow` | Since: 25.02; must be enabled per layer. |
| (niri-only) `geometry-corner-radius N` | corner radius for shadow/blur. |
| (niri-only) `block-out-from "screencast"` | Hide notifications from captures. |
| (niri-only) `place-within-backdrop true` | Put a wallpaper layer in the overview backdrop. |

## The equisdots glass rules, migrated

```lua
-- layers.lua (Hyprland)
local namespaces = {
    "^qs-master$",
    "^quickshell$",
    "^qs-floating-overlay$",
    "^qs-popups$",
    "^qs-widget-",
}
for _, ns in ipairs(namespaces) do
    hl.layer_rule({ match = { namespace = ns }, blur = true, ignore_alpha = 0.15 })
end
```

KDL has no loops, so express the set as one regex or repeat the rule. A single
alternation is compact:

```kdl
// layer-rules.kdl (niri)
blur {
    passes 3
    offset 3.0
    noise 0.02
    saturation 1.5
}

layer-rule {
    // One regex covering all shell namespaces.
    // Note: "-" is literal outside a character class.
    match namespace="^(qs-master|quickshell|qs-floating-overlay|qs-popups|qs-widget-)"
    background-effect {
        blur true
    }
}
```

Written out per namespace:

```kdl
layer-rule {
    match namespace="^qs-popups$"
    background-effect { blur true }
    // Notifications get their own pop-ups; frost those too.
    popups {
        background-effect { blur true }
    }
}
```

## `ignorealpha` and transparent regions

Hyprland's `ignorealpha 0.15` stops fully transparent regions of a layer (host
padding, shadow margins, fullscreen overlays) from producing blurred
rectangles. niri has no equivalent numeric threshold. Instead:

- Blur via a rule follows the surface's geometry and the
  `geometry-corner-radius` layer-rule value.
- If the client supports the `ext-background-effect` protocol, it can request a
  correctly shaped blur (including rounded corners) itself, and niri will follow
  it exactly. Prefer this for modern shells.
- For shell surfaces with large transparent padding, reduce the surface size to
  the visible region in the shell itself, or split overlays into separate layer
  surfaces, so there is no invisible area to blur.

State this as a gap: exact `ignorealpha` behavior is not reproducible in
26.04.

## Worked example: Waybar/fuzzel frost

```lua
-- Hyprland
hl.layer_rule({ match = { namespace = "^waybar$" }, blur = true, ignore_alpha = 0.1 })
hl.layer_rule({ match = { namespace = "^launcher$" }, blur = true })
```

```kdl
// niri
layer-rule {
    match namespace="^waybar$"
    background-effect { blur true }
    // Waybar pop-up menus.
    popups {
        background-effect { blur true }
    }
}

layer-rule {
    match namespace="^launcher$"
    background-effect { blur true }
    // Fuzzel defaults to 10 px rounded corners.
    geometry-corner-radius 10
    shadow {
        on
    }
}
```

## Hiding notifications from screencasts

No Hyprland layer rule does this; niri can. Useful for notification daemons
(mako, Dunst, the Quickshell notification namespace):

```kdl
layer-rule {
    match namespace="^qs-popups$"
    block-out-from "screencast"
}
```

## Layer matching reference

Find the namespaces of the running surfaces:

```sh
niri msg layers
```

Match on namespace (any substring, Rust regex) and, Since: 26.04, on layer:

```kdl
layer-rule {
    match namespace="^notifications$"
    match layer="overlay"
    opacity 0.95
}
```

`match layer` values are `"background"`, `"bottom"`, `"top"`, `"overlay"`.
`at-startup=true` matches only during the first 60 seconds after niri starts.

See `references/window-rules.md` for the shared `match`/`exclude` evaluation
model, and `references/general-decoration.md` for the global `blur {}` tuning
that these layer rules depend on.
