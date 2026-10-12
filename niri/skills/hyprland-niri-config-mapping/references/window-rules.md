# Window rules

Baseline: Hyprland 0.55+ Lua (and legacy `windowrule` / `windowrulev2`
hyprlang), niri 26.04. This maps window rules and their effects to niri
`window-rule {}`.

## Three syntaxes, one destination

Hyprland has three spellings. All produce a `window-rule {}` in niri.

| Version | Hyprland |
| --- | --- |
| Legacy | `windowrule = float, class:^(pavucontrol)$` |
| 0.4x+ | `windowrulev2 = float, class:^(pavucontrol)$, title:^(Open File)(.*)$` |
| 0.53+ named block (Lua) | `hl.window_rule({ match = { class = "^(pavucontrol)$" }, float = true })` |

```kdl
// niri
window-rule {
    match app-id="^pavucontrol$"
    open-floating true
}
```

## Matching

| Hyprland field | niri matcher | Notes |
| --- | --- | --- |
| `class:REGEX` | `match app-id="REGEX"` | App ID. |
| `title:REGEX` | `match title="REGEX"` | Window title. |
| `initialClass:` | `match app-id` | niri has no separate initial class. |
| `initialTitle:` | `match title` | |
| `xwayland:1` | none | No Xwayland matcher. |
| `floating:1` | `match is-floating=true` | Since: 25.01; applies after open only. |
| `focus:1` | `match is-focused=true` | |
| `fullscreen:1` | none | No direct fullscreen matcher. |
| `workspace:NAME` | `match at-startup` + `open-on-workspace` | Workspace is a rule *effect* in niri. |
| `monitor:NAME` | `open-on-output "NAME"` | Output is an effect, not a matcher. |
| (negation `class:^(?!...)$`) | `exclude app-id="..."` | niri provides `exclude` instead of negative lookahead. |

Rules are evaluated top to bottom. A window matches a rule if it matches **any**
`match` line and **none** of the `exclude` lines. You cannot unset a property in
a later rule; override it with a different value, or `exclude`.

Regular expressions are Rust regex syntax. Use raw KDL strings when the pattern
contains backslashes:

```kdl
window-rule {
    exclude app-id=r#"^org\.telegram\.desktop$"# title="^Media viewer$"
}
```

## Effect mapping

| Hyprland effect | niri | Notes |
| --- | --- | --- |
| `float` | `open-floating true` | |
| `tile` | `open-floating false` | Overrides auto-float. |
| `size W H` | `default-column-width { fixed W; }` + `default-window-height { fixed H; }` | Applies on open. |
| `size "W H"` (percent) | `default-column-width { proportion W; }` | Fractions of the output. |
| `minsize W H` / `maxsize W H` | `min-width` / `max-width` / `min-height` / `max-height` | Logical pixels; enforced continuously. |
| `move X Y` | `default-floating-position x=X y=Y relative-to=...` | Since: 25.01. |
| `workspace NAME` | `open-on-workspace "NAME"` | Works only with a named workspace. |
| `workspace special:X` | `open-on-workspace "X"` | Named workspace approximation. |
| `opacity A` | `opacity A` | Both active and inactive. |
| `opacity A B` | two rules: `opacity A` and `match is-active=false { opacity B }` | niri has one opacity per rule. |
| `noblur` | `background-effect { blur false }` | Since: 26.04. |
| `noshadow` | `shadow { off }` | Since: 25.02. |
| `noanim` | none | **No per-window animation opt-out.** |
| `noborder` | `border { off }` / `focus-ring { off }` | |
| `bordercolor COLOR` | `border { active-color "..." inactive-color "..." }` | |
| `idleinhibit` | none | Use another idle-inhibitor mechanism. |
| `pin` | none | niri has no window pinning. |
| `center` | `default-floating-position` (floating opens centered by default) or `open-maximized true` | No `center` keyword. |
| `fullscreen` | `open-fullscreen true` | Can be set to `false` to prevent. |
| `maximize` | `open-maximized true` | Full-width column, keeps gaps. |
| `immediate` | none | No tearing. |
| `keepaspectratio` | none | |
| `rounding N` | `geometry-corner-radius N` (+ `clip-to-geometry true`) | Since: 0.1.6. |
| `group` | `default-column-display "tabbed"` | Since: 25.02. |
| `suppressevent` | none | |
| `stayfocused` | `open-focused true` | Since: 25.01. |
| `activatefocus` | `open-focused true` | |
| `renderunfocused` | none | No equivalent. |

niri-only effects useful when porting Hyprland behavior:

| niri | Purpose |
| --- | --- |
| `block-out-from "screencast"` / `"screen-capture"` | Hide from captures (no Hyprland equivalent). |
| `variable-refresh-rate true` | Enable on-demand VRR for matching windows (Since: 0.1.9). |
| `on-xdg-activate "focus" / "set-urgent" / "ignore"` | Control activation stealing (Since: next release). |
| `scroll-factor N`, `pinch-sensitivity N` | Per-window input tuning (Since: 25.02 / next release). |
| `draw-border-with-background` | Override whether borders draw as solid rectangles. |
| `tiled-state true` | Inform the window it is tiled (Since: 25.05). |
| `geometry-corner-radius` |
| `popups { ... }` | Style the window's xdg-popups (Since: 26.04). |
| `background-effect { xray/blur/noise/saturation }` | Ext-background-effect override (Since: 26.04). |

## Worked examples

### Floating system windows

```lua
-- windowrules.lua (Hyprland)
hl.window_rule({ match = { class = "^(pavucontrol)$" }, float = true })
hl.window_rule({ match = { class = "^(pavucontrol)$" }, center = true })
hl.window_rule({ match = { class = "^(pavucontrol)$" }, size = { 800, 600 } })
```

```kdl
// window-rules.kdl (niri)
window-rule {
    match app-id="^pavucontrol$"
    open-floating true
    default-column-width { fixed 800; }
    default-window-height { fixed 600; }
    // Floating windows open centered by default, so "center" is implicit.
}
```

### File dialogs by title

```lua
-- Hyprland
hl.window_rule({ match = { title = "^(Open File)(.*)$" }, float = true })
hl.window_rule({ match = { title = "^(Save As)(.*)$" }, float = true })
```

```kdl
// niri
window-rule {
    match title="^Open File.*$"
    open-floating true
}

window-rule {
    match title="^Save As.*$"
    open-floating true
}
```

### Picture-in-Picture: float, pin, size, position

```lua
-- Hyprland
hl.window_rule({ match = { title = "^(Picture-in-Picture)$" }, float = true })
hl.window_rule({ match = { title = "^(Picture-in-Picture)$" }, pin = true })
hl.window_rule({ match = { title = "^(Picture-in-Picture)$" }, size = { 640, 360 } })
hl.window_rule({ match = { title = "^(Picture-in-Picture)$" }, move = { "100% - 660", "100% - 380" } })
```

```kdl
// niri
window-rule {
    match title="^Picture-in-Picture$"

    open-floating true
    default-column-width { fixed 640; }
    default-window-height { fixed 360; }

    // Hyprland "100% - 660 / 100% - 380" is bottom-right minus the window size.
    // Anchor bottom-right with a small gap instead.
    default-floating-position x=32 y=32 relative-to="bottom-right"

    // "pin" has no niri equivalent; drop it.
}
```

### Opacity

```lua
-- Hyprland (two values = active/inactive)
hl.window_rule({ match = { class = "^(kitty)$" }, opacity = "0.95 0.95" })
hl.window_rule({ match = { class = "^(firefox)$" }, opacity = "0.98 0.98" })
```

```kdl
// niri: one rule per state.
window-rule {
    match app-id="^kitty$"
    opacity 0.95
}

window-rule {
    match app-id="^firefox$"
    opacity 0.98
}
```

To reproduce an inactive-only value, use `match is-active=false`:

```kdl
window-rule {
    match is-active=false
    opacity 0.85
}
```

### Workspace assignment

```lua
-- Hyprland: browser on workspace 2, code on 3, games on 6
hl.window_rule({ match = { class = "^(firefox)$" }, workspace = "2" })
hl.window_rule({ match = { class = "^(Code)$" }, workspace = "3" })
hl.window_rule({ match = { class = "^(steam)$" }, workspace = "6" })
```

```kdl
// niri: workspaces are named, not numbered.
workspace "browser"
workspace "code"
workspace "games"

window-rule {
    match app-id="^firefox$"
    open-on-workspace "browser"
}

window-rule {
    match app-id="^Code$"
    open-on-workspace "code"
}

window-rule {
    match app-id="^steam$"
    open-on-workspace "games"
}
```

Indexed `open-on-workspace` does not exist; a workspace reference is always a
name. See `references/workspaces.md` for the model shift. If you want the app on
a specific monitor instead, use `open-on-output "NAME"`.

### Games: fullscreen and tearing

```lua
-- Hyprland
hl.window_rule({ match = { class = "^(steam_app_.*)$" }, fullscreen = true })
hl.window_rule({ match = { class = "^(steam_app_.*)$" }, immediate = true })
hl.window_rule({ match = { class = "^(.*%.exe)$" }, immediate = true })
```

```kdl
// niri
window-rule {
    match app-id="^steam_app_"
    open-fullscreen true
    // "immediate" (tearing) has no equivalent; drop it.
}
```

### Rounded corners and border color

```lua
-- Hyprland uses decoration rounding + bordercolor
hl.window_rule({ match = { class = "^(kitty)$" }, bordercolor = "rgb(7fc8ff)" })
```

```kdl
// niri
window-rule {
    match app-id="^kitty$"
    geometry-corner-radius 20
    clip-to-geometry true
    border {
        on
        active-color "#7fc8ff"
    }
}
```

### Preventing focus steal

```kdl
// niri-only, no Hyprland equivalent
window-rule {
    match app-id="^firefox$" title="^Picture-in-Picture$"
    open-floating true
    on-xdg-activate "set-urgent"
}
```

### Hiding from screencasts

```kdl
// niri-only; no Hyprland equivalent
window-rule {
    match app-id=r#"^org\.keepassxc\.KeePassXC$"#
    block-out-from "screencast"
}
```

## Ordering and overrides

Put generic rules first, specific overrides last:

```kdl
window-rule {
    open-maximized true
}

window-rule {
    match app-id="^Alacritty$"
    open-maximized false
}
```

When you must exempt a subset, use `exclude` rather than a negative lookahead:

```kdl
window-rule {
    match app-id=r#"^org\.telegram\.desktop$"#
    exclude title="^Media viewer$"
    open-on-output "HDMI-A-1"
}
```
