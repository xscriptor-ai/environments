# Actions catalog

Every bindable action and its `niri msg action` equivalent. Baseline: niri
26.04. Action names are lowercase kebab-case and identical in `binds {}` and on
the command line. Run `niri msg action` for the live list with upstream
descriptions.

Arguments shown in `<>` are positional. Properties (`skip-confirmation`,
`write-to-disk`, `show-pointer`, `focus`,...) are written inside the action node
in config and as `--long` flags on the command line.

```kdl
Mod+1 { focus-workspace 1; }                 // bind
```
```sh
niri msg action focus-workspace 1            // IPC, same action
```

## Window focus and window move

| Action | Arguments | Description |
| --- | --- | --- |
| `focus-column-left` | | Focus the column to the left. |
| `focus-column-right` | | Focus the column to the right. |
| `focus-column-first` | | Focus the first column. |
| `focus-column-last` | | Focus the last column. |
| `focus-column-left-or-last` | | Focus the next column left, looping to last. |
| `focus-column-right-or-first` | | Focus the next column right, looping to first. |
| `focus-column` | `<index>` | Focus a column by index (1-based). |
| `focus-window-down` | | Focus the window below in a column. |
| `focus-window-up` | | Focus the window above in a column. |
| `focus-window-top` | | Focus the topmost window. |
| `focus-window-bottom` | | Focus the bottommost window. |
| `focus-window-down-or-top` | | Focus the window below, or the topmost at the bottom. |
| `focus-window-up-or-bottom` | | Focus the window above, or the bottommost at the top. |
| `focus-window-previous` | | Focus the previously focused window. |
| `focus-window-in-column` | `<index>` | Focus a window in the focused column by index (1-based). |
| `focus-window-down-or-column-left` | | Focus the window below or the column to the left. |
| `focus-window-down-or-column-right` | | Focus the window below or the column to the right. |
| `focus-window-up-or-column-left` | | Focus the window above or the column to the left. |
| `focus-window-up-or-column-right` | | Focus the window above or the column to the right. |
| `focus-window-or-workspace-down` | | Focus the window below or the workspace below. |
| `focus-window-or-workspace-up` | | Focus the window above or the workspace above. |
| `move-column-left` | | Move the focused column to the left. |
| `move-column-right` | | Move the focused column to the right. |
| `move-column-to-first` | | Move the focused column to the start of the workspace. |
| `move-column-to-last` | | Move the focused column to the end of the workspace. |
| `move-column-to-index` | `<index>` | Move the focused column to a 1-based index on its workspace. |
| `move-column-left-or-to-monitor-left` | | Move the column left, or to the left monitor at the edge. |
| `move-column-right-or-to-monitor-right` | | Move the column right, or to the right monitor at the edge. |
| `move-window-down` | | Move the focused window down in a column. |
| `move-window-up` | | Move the focused window up in a column. |
| `move-window-down-or-to-workspace-down` | | Move the window down, or to the workspace below at the bottom. |
| `move-window-up-or-to-workspace-up` | | Move the window up, or to the workspace above at the top. |

## Column operations

| Action | Arguments | Description |
| --- | --- | --- |
| `consume-or-expel-window-left` | | Consume the window left into a column, or expel it out left. |
| `consume-or-expel-window-right` | | Consume the window right into a column, or expel it out right. |
| `consume-window-into-column` | | Consume the window to the right into the focused column. |
| `expel-window-from-column` | | Expel the bottom window from the focused column to the right. |
| `swap-window-left` | | Swap the focused window with the one to the left. |
| `swap-window-right` | | Swap the focused window with the one to the right. |
| `expand-column-to-available-width` | | Expand the focused column into space not used by fully visible columns. |
| `set-column-width` | `"<change>"` | Change the focused column width; `"1000"`, `"-5"`, `"+5"`, `"25%"`, `"-10%"`, `"+10%"`. |
| `set-window-width` | `"<change>"` | Change the focused window width; same change syntax as `set-column-width`. |
| `set-window-height` | `"<change>"` | Change the focused window height; same change syntax. |
| `reset-window-height` | | Reset the focused window height back to automatic. |
| `switch-preset-column-width` | | Cycle forward through configured `preset-column-widths`. |
| `switch-preset-column-width-back` | | Cycle backward through `preset-column-widths`. |
| `switch-preset-window-width` | | Cycle window widths between presets. |
| `switch-preset-window-width-back` | | Cycle window widths backward between presets. |
| `switch-preset-window-height` | | Cycle window heights between presets. |
| `switch-preset-window-height-back` | | Cycle window heights backward between presets. |
| `center-column` | | Center the focused column on the screen. |
| `center-window` | | Center the focused window on the screen. |
| `center-visible-columns` | | Center all fully visible columns on the screen. |
| `maximize-column` | | Toggle the maximized (full-width) state of the focused column. |

Pixel sizes use logical (scaled) pixels: with `scale 2.0`, `set-column-width "100"`
occupies 200 physical pixels.

## Workspace operations

Workspace references accept an index or a name. Indexed commands are best-effort
in a dynamic workspace system: an index past the workspace count refers to the
bottommost empty workspace.

| Action | Arguments | Description |
| --- | --- | --- |
| `focus-workspace-down` | | Focus the workspace below. |
| `focus-workspace-up` | | Focus the workspace above. |
| `focus-workspace` | `<index\|name>` | Focus a workspace by index or name. |
| `focus-workspace-previous` | | Focus the previous workspace. |
| `move-window-to-workspace-down` | `focus=<bool>` | Move the focused window to the workspace below. |
| `move-window-to-workspace-up` | `focus=<bool>` | Move the focused window to the workspace above. |
| `move-window-to-workspace` | `<index\|name> focus=<bool>` | Move the focused window to a workspace by index or name. |
| `move-column-to-workspace-down` | `focus=<bool>` | Move the focused column to the workspace below. |
| `move-column-to-workspace-up` | `focus=<bool>` | Move the focused column to the workspace above. |
| `move-column-to-workspace` | `<index\|name> focus=<bool>` | Move the focused column to a workspace by index or name. |
| `move-workspace-down` | | Move the focused workspace down. |
| `move-workspace-up` | | Move the focused workspace up. |
| `move-workspace-to-index` | `<index>` | Move the focused workspace to an index on its monitor. |
| `move-workspace-to-monitor-left` | | Move the focused workspace to the monitor to the left. |
| `move-workspace-to-monitor-right` | | Move the focused workspace to the monitor to the right. |
| `move-workspace-to-monitor-down` | | Move the focused workspace to the monitor below. |
| `move-workspace-to-monitor-up` | | Move the focused workspace to the monitor above. |
| `move-workspace-to-monitor-previous` | | Move the focused workspace to the previous monitor. |
| `move-workspace-to-monitor-next` | | Move the focused workspace to the next monitor. |
| `move-workspace-to-monitor` | `<output>` | Move the focused workspace to a named monitor. |
| `set-workspace-name` | `<name>` | Set the name of the focused workspace. |
| `unset-workspace-name` | | Unset the name of the focused workspace. |

`focus=<bool>` defaults to `true`: the focus follows the moved window or column.
Set `focus=false` to keep focus on the original workspace.

```kdl
Mod+1 { focus-workspace 1; }
Mod+Ctrl+1 { move-column-to-workspace 1; }
Mod+Ctrl+Shift+1 { move-window-to-workspace "browser"; }
```

## Monitor operations

`<output>` is an output name from `niri msg outputs` (for example `eDP-1`).

| Action | Arguments | Description |
| --- | --- | --- |
| `focus-monitor-left` | | Focus the monitor to the left. |
| `focus-monitor-right` | | Focus the monitor to the right. |
| `focus-monitor-down` | | Focus the monitor below. |
| `focus-monitor-up` | | Focus the monitor above. |
| `focus-monitor-previous` | | Focus the previous monitor. |
| `focus-monitor-next` | | Focus the next monitor. |
| `focus-monitor` | `<output>` | Focus a monitor by output name. |
| `focus-window-or-monitor-up` | | Focus the window above, or the monitor above at the edge. |
| `focus-window-or-monitor-down` | | Focus the window below, or the monitor below at the edge. |
| `focus-column-or-monitor-left` | | Focus the column left, or the monitor left at the edge. |
| `focus-column-or-monitor-right` | | Focus the column right, or the monitor right at the edge. |
| `move-window-to-monitor-left` | | Move the focused window to the monitor to the left. |
| `move-window-to-monitor-right` | | Move the focused window to the monitor to the right. |
| `move-window-to-monitor-down` | | Move the focused window to the monitor below. |
| `move-window-to-monitor-up` | | Move the focused window to the monitor above. |
| `move-window-to-monitor-previous` | | Move the focused window to the previous monitor. |
| `move-window-to-monitor-next` | | Move the focused window to the next monitor. |
| `move-window-to-monitor` | `<output>` | Move the focused window to a named monitor. |
| `move-column-to-monitor-left` | | Move the focused column to the monitor to the left. |
| `move-column-to-monitor-right` | | Move the focused column to the monitor to the right. |
| `move-column-to-monitor-down` | | Move the focused column to the monitor below. |
| `move-column-to-monitor-up` | | Move the focused column to the monitor above. |
| `move-column-to-monitor-previous` | | Move the focused column to the previous monitor. |
| `move-column-to-monitor-next` | | Move the focused column to the next monitor. |
| `move-column-to-monitor` | `<output>` | Move the focused column to a named monitor. |

## Floating, tabs, fullscreen, and maximize

| Action | Arguments | Description |
| --- | --- | --- |
| `toggle-window-floating` | | Toggle the focused window between floating and tiling. |
| `move-window-to-floating` | | Move the focused window to the floating layout. |
| `move-window-to-tiling` | | Move the focused window to the tiling layout. |
| `focus-floating` | | Switch focus to the floating layout. |
| `focus-tiling` | | Switch focus to the tiling layout. |
| `switch-focus-between-floating-and-tiling` | | Toggle focus between the floating and tiling layouts. |
| `move-floating-window` | `x=<change> y=<change>` | Move the focused floating window on screen. |
| `toggle-column-tabbed-display` | | Toggle the focused column between normal and tabbed display (Since: 25.02). |
| `set-column-display` | `normal\|tabbed` | Set the focused column display mode explicitly. |
| `fullscreen-window` | | Toggle fullscreen on the focused window. |
| `maximize-window-to-edges` | | Toggle the maximized-to-edges state of the focused window (Since: 25.11). |
| `toggle-windowed-fullscreen` | | Toggle windowed (fake) fullscreen: the app believes it is fullscreen while staying a normal window (Since: 25.05). |

`maximize-window-to-edges` expands to the edges of the available area (no gaps,
borders, or struts; bars stay visible) and is what titlebar maximize buttons
request. `maximize-column` instead sets a full-width column and keeps gaps.

## Overview

| Action | Arguments | Description |
| --- | --- | --- |
| `toggle-overview` | | Toggle (open/close) the Overview (Since: 25.05). |
| `open-overview` | | Open the Overview. |
| `close-overview` | | Close the Overview. |

## Screenshot actions

The capture is stored to the clipboard and saved to disk according to the
`screenshot-path` option, unless disabled.

| Action | Properties | Description |
| --- | --- | --- |
| `screenshot` | `show-pointer=<bool>` | Open the built-in interactive screenshot UI. |
| `screenshot-screen` | `write-to-disk=<bool>` `show-pointer=<bool>` | Screenshot the focused screen (monitor). |
| `screenshot-window` | `write-to-disk=<bool>` `show-pointer=<bool>` | Screenshot the focused window. |

Property notes:

- `write-to-disk` defaults to `true`; set `write-to-disk=false` to skip saving
  (Since: 25.02).
- `show-pointer` defaults to `true` for `screenshot` and `screenshot-screen`, and
  to `false` for `screenshot-window`. Hiding the pointer is Since: 25.05; showing
  the pointer on a window screenshot is Since: 26.04 and only includes it if the
  window is currently receiving pointer input.
- In the interactive UI, `Ctrl+C` copies to the clipboard without writing to disk.

```kdl
binds {
    Print { screenshot; }
    Ctrl+Print { screenshot-screen write-to-disk=false show-pointer=false; }
    Alt+Print { screenshot-window show-pointer=true; }
}
```

## Screencast actions

Dynamic cast target support is Since: 25.05. All dynamic casts share the same
target; new casts start empty until changed.

| Action | Arguments | Description |
| --- | --- | --- |
| `set-dynamic-cast-window` | | Set the dynamic cast target to the focused window. |
| `set-dynamic-cast-monitor` | `<output>` | Set the dynamic cast target to a monitor (focused if omitted). |
| `clear-dynamic-cast-target` | | Clear the dynamic cast target, showing an empty stream. |
| `stop-cast` | `--session-id <id>` | Stop a PipeWire screencast by session id (IPC; `wlr-screencopy` casts cannot be stopped via IPC). |

```sh
niri msg action set-dynamic-cast-window --id "$(niri msg --json pick-window | jq .id)"
```

## Session, spawn, and miscellaneous

| Action | Arguments / Properties | Description |
| --- | --- | --- |
| `spawn` | `<program> [args...]` | Run a program. No shell; each argument is separate. `~` expands only at the start of the program name. |
| `spawn-sh` | `"<command>"` | Run a command through `sh -c`; supports shell variables, pipes, and `~` (Since: 25.08). |
| `quit` | `skip-confirmation=<bool>` | Exit niri (shows a confirmation dialog unless skipped). |
| `power-off-monitors` | | Power off all monitors via DPMS. Turn back on with any input. |
| `power-on-monitors` | | Power on all monitors via DPMS. |
| `do-screen-transition` | `delay-ms=<ms>` | Freeze the screen briefly, then crossfade (Since: 0.1.6; default freeze 250 ms). |
| `toggle-window-rule-opacity` | | Toggle the opacity window rule of the focused window (Since: 25.02). |
| `toggle-keyboard-shortcuts-inhibit` | | Toggle the keyboard-shortcuts inhibitor for the focused surface (Since: 25.02). |
| `switch-layout` | `next\|prev\|<index>` | Switch between configured keyboard layouts. |
| `show-hotkey-overlay` | | Show the Important Hotkeys overlay. |
| `load-config-file` | `--path <path>` | Reload the config, or load a specific file (IPC). |
| `change-vt` | `<n>` | Switch to virtual terminal `n`. Bind-only: not available as an `niri msg action`. |
| `suspend` | | Suspend the machine. Bind-only: not available as an `niri msg action`. Also triggered by `XF86PowerOff` unless power-key handling is disabled. |
| `toggle-debug-tint` | | Toggle a debug tint on windows. |
| `debug-toggle-opaque-regions` | | Toggle visualization of render-element opaque regions. |
| `debug-toggle-damage` | | Toggle visualization of output damage. |

`spawn` does not use a shell, so environment variables and `~` are not expanded
except a single leading `~` in the program name. Use `spawn-sh` when you need a
shell:

```kdl
binds {
    Mod+T { spawn "alacritty" "-e" "/usr/bin/fish"; }
    Mod+D { spawn-sh "alacritty -e /usr/bin/fish"; }
    Mod+Q { spawn-sh "notify-send clipboard \"$(wl-paste)\""; }
    Mod+Shift+E { quit skip-confirmation=true; }
    Mod+Shift+P { power-off-monitors; }
}
```

See `hotkey-overlay-and-inhibit.md` for `spawn`'s `allow-when-locked` and
`allow-inhibiting` properties.
