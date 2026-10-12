# Hyprland to niri cheatsheet

One consolidated lookup for the most common Hyprland 0.55+ Lua directives and
their niri 26.04 equivalents. `none` means no direct equivalent; see the linked
reference for the closest approximation.

## Structure and reload

| Hyprland | niri |
| --- | --- |
| `hyprland.lua` + `require("x")` | `config.kdl` + `include "x.kdl"` |
| `pcall(require, "user")` | `include optional=true "user.kdl"` (26.04) |
| `hyprctl reload` | save the file (live reload) |
| `hyprctl reload full-reset` | edit/re-save, or `niri msg action load-config-file` |
| `hyprctl configerrors` | `niri validate` |
| `hyprctl eval '<lua>'` | none (only `niri msg output`) |
| `hyprctl setcursor T S` | `cursor { xcursor-theme T; xcursor-size S }` |

## Layout and decoration

| Hyprland | niri |
| --- | --- |
| `general:gaps_in` | `layout { gaps N }` |
| `general:gaps_out` | none (use `struts`, or accept equal gaps) |
| `general:border_size` | `layout { border { width N } }` |
| `general:col.active_border` | `border.active-color` / `focus-ring.active-color` |
| `general:col.inactive_border` | `border.inactive-color` / `focus-ring.inactive-color` |
| `general:layout = "dwindle"` | none (niri is scrollable columns) |
| `general:snap` | none |
| `general:allow_tearing` | none |
| `decoration:rounding` | `window-rule { geometry-corner-radius N }` (+ `clip-to-geometry true`) |
| `decoration:active_opacity` | `window-rule { opacity N }` |
| `decoration:inactive_opacity` | `window-rule { match is-active=false; opacity N }` |
| `decoration:dim_inactive` | none |
| `decoration:shadow` | `layout { shadow { on ... } }` |
| `decoration:shadow.range` | `shadow.softness` |
| `decoration:blur` | `blur {}` + `background-effect` rules (26.04) |
| `decoration:blur.size/passes` | `blur { offset N; passes N }` |
| `decoration:blur.noise` | `blur { noise N }` |
| `decoration:blur.vibrancy` | `blur { saturation N }` (approx) |
| `decoration:blur.xray` | `background-effect { xray true }` |
| `decoration:blur.popups` | `window-rule { popups { background-effect { blur true } } }` |
| `dwindle { }` / `master { }` | none |
| `misc:enable_swallow` | none |
| `misc:vrr` | `output { variable-refresh-rate }` |
| `misc:focus_on_activate` | `window-rule { on-xdg-activate "focus" }` |
| `xwayland:force_zero_scaling` | none |
| `ecosystem { }` | none |
| `cursor:no_hardware_cursors` | none |

## Input

| Hyprland | niri |
| --- | --- |
| `input:kb_layout` | `input { keyboard { xkb { layout "..." } } }` |
| `input:kb_variant/model/options/rules` | `xkb { variant/model/options/rules "..." }` |
| `input:repeat_rate` / `repeat_delay` | `keyboard { repeat-rate N; repeat-delay N }` |
| `input:numlock_by_default` | `keyboard { numlock }` (25.05) |
| `input:follow_mouse` | `input { focus-follows-mouse }` |
| `input:sensitivity` | `accel-speed N` |
| `input:accel_profile` | `accel-profile "adaptive"|"flat"` |
| `input:scroll_method` | `scroll-method "..."` |
| `input:scroll_button` | `scroll-button N` |
| `input:natural_scroll` | `natural-scroll` |
| `input:disable_while_typing` | `dwt` |
| `input:tap_to_click` | `tap` |
| `input:tap-and-drag` | `drag true|false` (25.05) |
| `input:drag_lock` | `drag-lock` (25.02) |
| `input:scroll_factor` | `scroll-factor N` |
| `input:left_handed` | `left-handed` |
| `input:middle_button_emulation` | `middle-emulation` |
| `input:clickfinger_behavior` | `click-method "clickfinger"` |
| `device "name" { }` | none; a device section fails `niri validate` |
| `hl.gesture({ fingers, direction, action })` | none (niri gestures are fixed) |

## Outputs

| Hyprland | niri |
| --- | --- |
| `hl.monitor({ output = "eDP-1" })` | `output "eDP-1" {}` |
| `output = ""` wildcard | omit the section |
| `mode = "preferred"/"highrr"/"highres"` | omit `mode` |
| `mode = "2560x1440@144"` | `mode "2560x1440@143.912"` (exact) |
| `position = "1920x0"` | `position x=1920 y=0` (logical pixels) |
| `position = "auto"` | omit `position` |
| `scale = 1.5` | `scale 1.5` |
| `transform = 1` | `transform "90"` |
| `mirror = "DP-1"` | none |
| `monitor = NAME, disable` | `output "NAME" { off }` |
| `vrr = 1` / `2` | `variable-refresh-rate` / `on-demand=true` |
| `hyprctl monitors` | `niri msg outputs` |
| `hyprctl eval hl.monitor(...)` | `niri msg output NAME ...` (session only) |

## Keybinds

| Hyprland | niri |
| --- | --- |
| `bind = SUPER, Return, exec, kitty` | `Mod+Return { spawn "kitty"; }` |
| `hl.dsp.exec_cmd("a b")` | `spawn-sh "a b"` (or `spawn "a" "b"`) |
| `killactive` | `close-window` |
| `exit` | `quit` |
| `togglefloating` | `toggle-window-floating` |
| `fullscreen` | `fullscreen-window` |
| `fullscreenstate, 0 3` | `maximize-window-to-edges` |
| `fakefullscreen` | `toggle-windowed-fullscreen` |
| `centerwindow` | `center-window` / `center-column` |
| `pin` | none |
| `togglesplit` / `layoutmsg` | none |
| `movefocus, l/r` | `focus-column-left/right` |
| `movefocus, u/d` | `focus-window-up/down` |
| `movewindow, l/r` | `move-column-left/right` |
| `movewindow, u/d` | `move-window-up/down` |
| `swapwindow, l/r` | `swap-window-left/right` |
| `resizeactive` | `set-column-width` / `set-window-height` |
| `cyclenext` | `focus-column-right-or-first` |
| `workspace, N` | `focus-workspace N` |
| `workspace, e+1/e-1` | `focus-workspace-down` / `-up` |
| `workspace, previous` | `focus-workspace-previous` |
| `movetoworkspace, N` | `move-window-to-workspace N` |
| `movetoworkspacesilent, N` | `move-window-to-workspace N focus=false` |
| `togglespecialworkspace` | none |
| `focusmonitor, +1/-1` | `focus-monitor-next` / `-previous` |
| `movewindow, mon:+1` | `move-window-to-monitor-next` / `-previous` |
| `movecurrentworkspacetomonitor` | `move-workspace-to-monitor-next` / `-previous` |
| `swapactiveworkspaces` | none |
| `toggleopaque` | `toggle-window-rule-opacity` (25.02) |
| `submap` | none |
| `locked` flag | `allow-when-locked=true` |
| `repeating` flag | default; `repeat=false` to disable |
| `mouse:272` / `mouse:273` | `MouseLeft` / `MouseRight` |

## Window rules

| Hyprland | niri |
| --- | --- |
| `class:REGEX` | `match app-id="REGEX"` |
| `title:REGEX` | `match title="REGEX"` |
| negative lookahead | `exclude` |
| `float` / `tile` | `open-floating true` / `false` |
| `size W H` | `default-column-width { fixed W; }` + `default-window-height { fixed H; }` |
| `move X Y` | `default-floating-position x=X y=Y` |
| `workspace NAME` | `open-on-workspace "NAME"` |
| `monitor NAME` | `open-on-output "NAME"` |
| `opacity A B` | `opacity A` + `match is-active=false { opacity B }` |
| `noblur` | `background-effect { blur false }` |
| `noshadow` | `shadow { off }` |
| `noanim` | none |
| `noborder` | `border { off }` / `focus-ring { off }` |
| `bordercolor` | `border { active-color "..." }` |
| `idleinhibit` | none |
| `pin` | none |
| `center` | `default-floating-position` / `open-maximized true` |
| `fullscreen` | `open-fullscreen true` |
| `maximize` | `open-maximized true` |
| `immediate` | none |
| `rounding N` | `geometry-corner-radius N` |
| `group` | `default-column-display "tabbed"` |
| `stayfocused` | `open-focused true` |
| (none) | `block-out-from "screencast"` |
| (none) | `variable-refresh-rate true` |

## Layer rules

| Hyprland | niri |
| --- | --- |
| `namespace:REGEX` | `match namespace="REGEX"` |
| `blur` | `background-effect { blur true }` (26.04) |
| `xray` | `background-effect { xray true }` |
| `ignorealpha` | none (use geometry / ext-background-effect) |
| `noanim` | none |
| `dimaround` | none |
| `blurpopups` | `popups { background-effect { blur true } }` |
| (none) | `block-out-from "screencast"` |
| (none) | `match layer="top"` (26.04) |
| (none) | `opacity N`, `shadow { on }`, `geometry-corner-radius N` |

## Workspaces and animations

| Hyprland | niri |
| --- | --- |
| static `workspace N` | dynamic; name it for persistence |
| `workspace_rule { monitor, default }` | `workspace "name" { open-on-output "..." }` |
| `persistent = true` | named workspaces always exist (0.1.6) |
| `on_created_empty = CMD` | none; use `spawn-at-startup` / a bind |
| `special:name` | none; approximate with a named workspace |
| `workspace_back_and_forth` | `input { workspace-auto-back-and-forth }` |
| `hl.curve` bezier | `curve "cubic-bezier" x1 y1 x2 y2` (25.08) |
| `leaf = "windowsIn"` | `window-open` |
| `leaf = "windowsOut"` | `window-close` |
| `leaf = "windowsMove"` | `window-movement` |
| `leaf = "workspaces"` | `workspace-switch` |
| `leaf = "border" / "borderangle"` | none |
| `leaf = "fade*"` | none |
| `leaf = "layers"` | none |
| `leaf = "specialWorkspace"` | none |
| `speed` | none; re-author as `duration-ms` or spring |

## Environment and autostart

| Hyprland | niri |
| --- | --- |
| `hl.env("VAR","v")` | `environment { VAR "v" }` |
| remove variable | `environment { VAR null }` |
| `exec-once = CMD` | `spawn-at-startup "bin" "arg"...` |
| shell command | `spawn-sh-at-startup "CMD"` (25.08) |
| `exec = CMD` (every reload) | none |
| `hl.on("hyprland.start", ...)` | `spawn-at-startup` / `spawn-sh-at-startup` |
| `XCURSOR_THEME` / `SIZE` env | `cursor { xcursor-theme; xcursor-size }` |
| `dbus-update-activation-environment` | handled by `niri-session` |
| (`.desktop` autostart) | supported out of the box under `niri-session` |

## IPC

| Hyprland | niri |
| --- | --- |
| `hyprctl monitors` | `niri msg outputs` |
| `hyprctl workspaces` | `niri msg workspaces` |
| `hyprctl clients` | `niri msg windows` |
| `hyprctl activewindow` | `niri msg focused-window` |
| `hyprctl layers` | `niri msg layers` |
| `hyprctl dispatch X` | `niri msg action X` |
| `hyprctl keyword X Y` | `niri msg output ...` (outputs only) |
| `.socket2.sock` | `niri msg --json event-stream` |

Baseline: niri 26.04 (2026-04-25). Version-gated rows note the introducing
release. When in doubt, run `niri validate` before reloading.
