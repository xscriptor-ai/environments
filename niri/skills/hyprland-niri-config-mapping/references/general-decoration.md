# General, decoration, layout and effects

Baseline: Hyprland 0.55+ Lua, niri 26.04. This maps the Hyprland `general`,
`decoration`, `dwindle`, `master`, `misc`, `xwayland`, `ecosystem` and `cursor`
categories to niri `layout {}`, borders, shadows, blur and `prefer-no-csd`.

The headline difference: Hyprland's layout is a pluggable tiler (dwindle/master)
with dozens of per-layout knobs; niri has exactly one layout (scrollable
columns) and no per-layout options. Everything under `dwindle {}` and `master {}`
is lost. Hyprland blur is a global window decoration; niri blur is a global
`blur {}` tuning section that only takes effect where a window or layer opts in
via `background-effect` (Since: 26.04).

## general -> layout

| Hyprland `general` | niri | Notes |
| --- | --- | --- |
| `gaps_in` | `layout { gaps N }` | niri has a single `gaps`; it is both inner and outer. |
| `gaps_out` | not directly | Use positive `struts` (top/bottom) for a larger outer margin; separate inner/outer is not representable. Negative struts cancel outer gaps (Since: 0.1.8). |
| `border_size` | `layout { border { width N } }` | Border draws around all windows and shrinks them. Use `focus-ring` for active-only. |
| `float_gaps` | none | Floating windows are positioned by `default-floating-position` rules. |
| `layout = "dwindle"` | none | niri is always scrollable columns. |
| `resize_on_border` | none | niri resizes via actions/presets, not border drags. |
| `extend_border_grab_area` | none | No equivalent. |
| `allow_tearing` | none | No tearing control. |
| `snap { ... }` | none | niri floating windows do not snap to edges or each other. |
| `col.active_border` | `border.active-color` / `focus-ring.active-color` | Color maps; semantics differ (see below). |
| `col.inactive_border` | `border.inactive-color` / `focus-ring.inactive-color` | |
| `binds { ... }` | none | niri has no bind-behavior equivalents; most are special/scratchpad-specific. |

Border vs focus-ring semantics in niri:

- `border` is drawn around every window and affects their sizes.
- `focus-ring` is drawn around the active window only.
- Both render as a solid background rectangle behind windows by default; set
  `prefer-no-csd` (or a `draw-border-with-background` window rule) to draw them
  as a true ring around windows that omit CSD.

The equisdots `col.active_border` / `col.inactive_border` pair maps to the
niri `border` (all windows), because Hyprland's border color also has an active
and inactive state.

```lua
-- settings.lua (Hyprland)
hl.config({
    general = {
        gaps_in = 16,
        gaps_out = 25,
        border_size = 2,
        col = {
            active_border   = X.active_border,
            inactive_border = X.inactive_border,
        },
    },
})
```

```kdl
// settings.kdl (niri)
layout {
    // Single gaps value. 16 matches gaps_in; outer is then also 16.
    gaps 16

    // Optional: add outer margin on the vertical edges.
    struts {
        top 9
        bottom 9
    }

    border {
        width 2
        active-color "#7fc8ff"
        inactive-color "#505050"
    }
}
```

## decoration -> layout, borders, shadow, blur

| Hyprland `decoration` | niri | Notes |
| --- | --- | --- |
| `rounding` | `window-rule { geometry-corner-radius N }` (Since: 0.1.6) | Add `clip-to-geometry true` to clip the window itself. Not a `layout {}` option. |
| `active_opacity` / `inactive_opacity` | `window-rule { match is-active=false; opacity X }` | Applied per window surface. |
| `fullscreen_opacity` | none | No per-fullscreen opacity. |
| `dim_inactive` / `dim_strength` | none | Approximate with an inactive `opacity` rule; true dimming is lost. |
| `shadow.enabled` | `layout { shadow { on } }` (Since: 25.02) | |
| `shadow.range` | `shadow.softness` | Both are blur radius in logical px. |
| `shadow.render_power` | none | No equivalent. |
| `shadow.color` | `shadow.color` | |
| `shadow.color_inactive` | `shadow.inactive-color` | |
| `shadow.offset` | `shadow.offset x=.. y=..` | Hyprland `{x,y}` maps to `x=`/`y=`. |
| `shadow.scale` | none | Use `spread`. |
| `blur.enabled` | `blur { }` (Since: 26.04) + `background-effect` rules | See below. |
| `blur.size` / `blur.passes` | `blur { offset N; passes N }` | Re-tune; models differ. |
| `blur.noise` | `blur { noise N }` | |
| `blur.contrast` / `brightness` / `vibrancy` | `blur { saturation N }` (approx) | No contrast/brightness; saturation is the closest. |
| `blur.xray` | `background-effect { xray true/false }` | |
| `blur.ignore_opacity` | none | No equivalent. |
| `blur.popups` | `window-rule { popups { background-effect { blur true } } }` | Since: 26.04. |
| `blur.special` | none | No special workspaces. |
| `blur.new_optimizations` | none | Implementation detail. |

```lua
-- settings.lua (Hyprland)
hl.config({
    decoration = {
        rounding = 20,
        active_opacity = 0.85,
        inactive_opacity = 0.80,
        dim_inactive = true,
        dim_strength = 0.15,
        shadow = {
            enabled = true, range = 35, render_power = 5,
            color = "rgba(000000CC)", color_inactive = "rgba(00000088)",
            offset = { 0, 10 },
        },
        blur = {
            enabled = true, size = 8, passes = 3, noise = 0.02,
            vibrancy = 0.2, xray = false, popups = true,
        },
    },
})
```

```kdl
// settings.kdl (niri)
prefer-no-csd

layout {
    shadow {
        on
        softness 35
        offset x=0 y=10
        color "#000000cc"
        inactive-color "#00000088"
    }
}

// Global blur tuning (Since: 26.04). Blur itself is enabled per surface below.
blur {
    passes 3
    offset 3.0
    noise 0.02
    saturation 1.2
}

window-rule {
    match is-active=false
    opacity 0.80
}

window-rule {
    // Rounded corners for every window; clip so the window itself is rounded.
    geometry-corner-radius 20
    clip-to-geometry true

    // Hyprland blurred all windows; opt every window into blur here.
    background-effect {
        blur true
    }

    popups {
        background-effect { blur true }
    }
}
```

Note: applying `background-effect { blur true }` to every window reintroduces
per-window blur. If you only want glass panels and the shell, do not add the
catch-all rule and enable blur on those surface namespaces instead (see
`references/layer-rules.md`).

## dwindle and master -> nothing

Both sections configure Hyprland's tilers and have no niri counterpart.

| Hyprland | niri |
| --- | --- |
| `dwindle.preserve_split` | none |
| `dwindle.smart_split` | none |
| `dwindle.smart_resizing` | none |
| `dwindle.special_scale_factor` | none |
| `master.orientation` | none (`layout { center-focused-column }` is the closest concept) |
| `master.special_scale_factor` | none |

Port the intent, not the option. Where smart resizing was used to make a
column fill leftover space, niri's `expand-column-to-available-width` action is
the analogue. Where `preserve_split` controlled insertion direction, niri
inserts columns left/right of focus and you move them explicitly.

```kdl
// niri equivalents for the intent
layout {
    // Center the focused column instead of left-anchored scrolling.
    center-focused-column "always"
}
```

## misc -> scattered niri top-level options

| Hyprland `misc` | niri | Notes |
| --- | --- | --- |
| `font_family` | none | niri has no UI font setting. |
| `disable_hyprland_logo`, `disable_splash_rendering`, `force_default_wallpaper` | none | No logo or splash. |
| `vrr` | `output { variable-refresh-rate }` or a `variable-refresh-rate` window rule (Since: 0.1.9 for on-demand) | Per output / per window, not global. |
| `mouse_move_enables_dpms`, `key_press_enables_dpms` | none (monitors wake on input by default) | Use `power-off-monitors` / `power-on-monitors` actions. |
| `always_follow_on_dnd`, `layers_hog_keyboard_focus` | none | Different focus model. |
| `animate_manual_resizes`, `animate_mouse_windowdragging` | none | `window-resize` animation covers manual resizes. |
| `enable_swallow`, `swallow_regex` | none | niri has no window swallowing. |
| `focus_on_activate` | `window-rule { on-xdg-activate "focus" }` (Since: next release) | Closest control over activation requests. |

## xwayland, ecosystem, cursor

| Hyprland | niri | Notes |
| --- | --- | --- |
| `xwayland.force_zero_scaling` | none | niri uses `xwayland-satellite` (Since: 25.08); no scaling knob. |
| `ecosystem.no_update_news` / `no_donation_nag` | none | Not applicable. |
| `cursor.no_hardware_cursors` | none | No direct equivalent. |
| `cursor.no_warps` | none | niri only warps with `input { warp-mouse-to-focus }`, which is off by default. |
| `cursor.default_monitor`, `sync_gsettings_theme` | none | Cursor theme is set in `cursor {}` (see below). |

Cursor theme and size move to a top-level `cursor {}` block:

```kdl
cursor {
    xcursor-theme "Bibata-Modern-Classic"
    xcursor-size 24
    // hide-when-typing       // Since: 0.1.10
    // hide-after-inactive-ms 1000
}
```

See `references/input.md` for the `input {}` mapping and `references/layer-rules.md`
for the glass/backdrop-blur case that replaces Hyprland namespace blur.
