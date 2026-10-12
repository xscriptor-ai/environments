# Keybinds and dispatchers

Baseline: Hyprland 0.55+ Lua (and legacy `bind =` hyprlang), niri 26.04. This
maps `hl.bind` / `bind` / `bindm` and `hl.dsp.*` dispatchers to niri `binds {}`
and actions.

niri binds and `niri msg action` share one action vocabulary: any bindable
action can also be invoked from a script as `niri msg action <name>`. That makes
the mapping useful for both config and IPC migration. Run `niri msg action` for
the live list.

## Syntax shape

| Hyprland Lua | Hyprland hyprlang | niri KDL |
| --- | --- | --- |
| `hl.bind("SUPER + Return", hl.dsp.exec_cmd("kitty"))` | `bind = SUPER, Return, exec, kitty` | `Mod+Return { spawn "kitty"; }` |
| `hl.bind("SUPER + SHIFT + Q", hl.dsp.window.kill())` | `bind = SUPER SHIFT, Q, killactive` | `Mod+Shift+Q { close-window; }` |
| `hl.bind("SUPER + mouse:272", hl.dsp.window.drag(), { mouse = true })` | `bindm = SUPER, mouse:272, movewindow` | `Mod+MouseLeft { move-window... }` (built in) |

Notes:

- niri uses `Mod` for the portable modifier (`Super` on a TTY, `Alt` nested).
  `Super`/`Win` also work explicitly. Use `Mod` for a migrated config.
- Modifier separators are `+`; key names are XKB names (`Return`, `Left`,
  `period`, `XF86AudioRaiseVolume`).
- niri binds repeat by default (Since: 0.1.8); Hyprland's `repeating` flag is
  therefore the default. Disable with `repeat=false`, rate-limit with
  `cooldown-ms=`.
- Hyprland `locked` maps to `allow-when-locked=true` on `spawn` (Since: 0.1.5).
- Hyprland mouse binds `mouse:272` (left) / `mouse:273` (right) map to
  `MouseLeft` / `MouseRight`. Binding `Mod+MouseLeft`/`Mod+MouseRight` in niri
  overrides the built-in interactive move/resize gestures.
- Scroll binds: Hyprland `mouse_down`/`mouse_up` map to
  `WheelScrollDown`/`WheelScrollUp`; touchpad ticks to
  `TouchpadScrollDown`/`TouchpadScrollUp`.

## Dispatcher and action mapping

This is the core table. Left column covers both the classic dispatcher name and
the Lua API used in the equisdots config.

| Hyprland dispatcher / `hl.dsp` | niri action | Notes |
| --- | --- | --- |
| `exec, CMD` / `hl.dsp.exec_cmd(CMD)` | `spawn-sh "CMD"` or `spawn "bin" "arg"` | Hyprland runs through a shell; use `spawn-sh` for that, `spawn` for argv. |
| `execr` | `spawn-sh` | No raw equivalent needed. |
| `exit` / `hl.dsp.exit()` | `quit` | niri shows a confirmation dialog; `quit skip-confirmation=true` skips it. |
| `killactive` / `hl.dsp.window.kill()` | `close-window` | Direct. |
| `closewindow` | `close-window` | Same. |
| `togglefloating` / `hl.dsp.window.float({action="toggle"})` | `toggle-window-floating` | Direct. |
| `float` | `move-window-to-floating` | |
| `tile` | `move-window-to-tiling` | |
| `fullscreen` / `hl.dsp.window.fullscreen()` | `fullscreen-window` | Direct toggle. |
| `fullscreenstate, 0 2` (maximize) | `maximize-column` | Full-width column, keeps gaps. |
| `fullscreenstate, 0 3` (maximize to edges) | `maximize-window-to-edges` | Since: 25.11; edge-to-edge. |
| `fakefullscreen` | `toggle-windowed-fullscreen` | Since: 25.05. |
| `pin` / `hl.dsp.window.pin()` | none | niri has no window pinning. Floating windows already sit above tiled ones. |
| `centerwindow` / `hl.dsp.window.center()` | `center-window` (floating) or `center-column` (tiling) | Choose based on state. |
| `pseudo` | none | No pseudo-tile. |
| `togglesplit` / `hl.dsp.layout("togglesplit")` | none | niri keeps one scrollable layout; no split toggle. |
| `splitratio`, `layoutmsg`, `swapsplit` | none | No layout messages. |
| `movefocus, l/r/u/d` / `hl.dsp.focus({direction=...})` | `focus-column-left/right` (l/r), `focus-window-up/down` (u/d) | Horizontal is columns, vertical is windows inside a column. |
| `movewindow, l/r/u/d` / `hl.dsp.window.move({direction=...})` | `move-column-left/right` (l/r), `move-window-up/down` (u/d) | Same axis split. |
| `swapwindow, l/r/u/d` | `swap-window-left` / `swap-window-right` | niri swaps within a column set; no vertical swap primitive. |
| `resizeactive, X Y` / `hl.dsp.window.resize({x,y})` | `set-column-width "+N"` / `set-window-height "+N"` | Tiling resize is by column width and window height. |
| `resizeactive` on floating window | `move-floating-window x=.. y=..` (position) and `set-window-width`/`set-window-height` | Floating size uses window width/height actions. |
| `cyclenext` / `hl.dsp.window.cycle_next()` | `focus-column-right-or-first` / `focus-column-left-or-last` | niri cycles columns, not a most-recently-used list. |
| `cyclenext, prev` / `cycle_next({next=false})` | `focus-column-left-or-last` | |
| `bringactivetotop` / `bring_to_top()` | none | Z-order is layout-defined; floating is always on top. |
| `focuscurrentorlast` | `focus-window-previous` | Closest MRU-like action. |
| `focusurgentorlast` | none | No urgent-window cycling. |
| `workspace, N` / `focus({workspace=...})` | `focus-workspace N` or `focus-workspace "name"` | Index means "position on the focused monitor". |
| `workspace, e+1` / `workspace, e-1` | `focus-workspace-down` / `focus-workspace-up` | niri workspaces are vertical. |
| `workspace, previous` / `focus({workspace="previous"})` | `focus-workspace-previous` | Direct. |
| `movetoworkspace, N` | `move-window-to-workspace N` | Moves the window. |
| `movetoworkspacesilent, N` | `move-window-to-workspace N focus=false` | `focus=false` keeps focus behind. |
| `movewindow` to workspace | `move-column-to-workspace N` | To move a whole column. |
| `togglespecialworkspace` / `workspace.toggle_special()` | none | No scratchpad. Approximate with a named workspace (see `references/workspaces.md`). |
| `move to special:` | `move-window-to-workspace "name"` | Move to a named workspace. |
| `focusmonitor, +1/-1` / `focus({monitor="+1"})` | `focus-monitor-next` / `focus-monitor-previous` | Relative, not numeric. |
| `focusmonitor, NAME` | `focus-monitor "NAME"` | By output name. |
| `movewindow, mon:+1` / `move({monitor="+1"})` | `move-window-to-monitor-next` / `move-window-to-monitor-previous` | Relative. |
| `movecolumn` to monitor | `move-column-to-monitor-next` / `-previous` | |
| `movecurrentworkspacetomonitor` / `workspace.move({monitor})` | `move-workspace-to-monitor-next` / `-previous` / `move-workspace-to-monitor "NAME"` | niri moves, it does not swap. |
| `swapactiveworkspaces` / `workspace.swap_monitors` | none | **No workspace swap**; move one workspace manually instead. |
| `changegroupactive`, `movegroupwindow` | `consume-window-into-column`, `expel-window-from-column` | Group semantics differ; these are the column analogues. |
| `togglegroup` | `toggle-column-tabbed-display` | Since: 25.02. |
| `alterzorder` | none | No z-order control. |
| `toggleopaque` | `toggle-window-rule-opacity` | Only works if the window has an opacity rule set (Since: 25.02). |
| `submap` | none | See "Submaps" below. |
| `togglespecialworkspace` | none | See `references/workspaces.md`. |

### Moving windows vs columns

Hyprland's `movewindow` moves a single window; niri distinguishes moving a
window within its column (`move-window-up/down`) from moving the whole column
(`move-column-left/right`). When porting:

- Horizontal Hyprland moves are usually whole-column moves in niri
  (`move-column-left/right`).
- Vertical Hyprland moves are window-in-column moves
  (`move-window-up/down`), unless you intend to move between workspaces
  (`move-window-to-workspace-up/down`).

```kdl
binds {
    Mod+H { focus-column-left; }
    Mod+L { focus-column-right; }
    Mod+K { focus-window-up; }
    Mod+J { focus-window-down; }

    Mod+Shift+H { move-column-left; }
    Mod+Shift+L { move-column-right; }
    Mod+Shift+K { move-window-up; }
    Mod+Shift+J { move-window-down; }
}
```

## spawn vs spawn-sh

`hl.dsp.exec_cmd("kitty --class dropdown")` passes one string that Hyprland
hands to a shell. niri deliberately does not use a shell for `spawn`:

- `spawn "kitty" "--class" "dropdown"` - each argument separate, no shell,
  no variable/`~` expansion (except a single leading `~` in the program name).
- `spawn-sh "kitty --class dropdown"` - the whole string goes to `sh -c`,
  supporting variables, pipes, `~` and process substitution (Since: 25.08).

Rule of thumb for the migration:

- If the Hyprland command is a plain program with simple args, emit `spawn`
  with separate arguments.
- If it contains `&&`, `|`, `$(...)`, `~`, or `$VARS`, emit `spawn-sh`.

```lua
-- keybinds.lua (Hyprland)
hl.bind(mod .. "Return", hl.dsp.exec_cmd(V.terminal))
hl.bind("ALT + F4", hl.dsp.window.kill())
hl.bind(mod .. "SHIFT + R", hl.dsp.exec_cmd("hyprctl reload"))
```

```kdl
// keybinds.kdl (niri)
binds {
    Mod+Return { spawn "kitty"; }
    Alt+F4 { close-window; }
    Mod+Shift+R { spawn-sh "niri validate && niri msg action load-config-file"; }
}
```

The equisdots `run(script, args)` helper built command strings; port it to
either `spawn "bash" "-c" "..."` or `spawn-sh "..."`.

## Submaps have no equivalent

Hyprland submaps are temporary keybinding layers:

```
# Hyprland
bind = SUPER, R, submap, resize
submap = resize
binde = , right, resizeactive, 10 0
binde = , left,  resizeactive, -10 0
submap = reset
```

niri has no submaps. Alternatives, in order of preference:

1. **Flatten into distinct modifiers.** Bind the submap actions directly with
   a modifier chord (for example `Mod+Ctrl+H/L`). This is the simplest and
   survives reloads.

   ```kdl
   binds {
       Mod+Ctrl+H { set-column-width "-5%"; }
       Mod+Ctrl+L { set-column-width "+5%"; }
       Mod+Ctrl+J { set-window-height "-5%"; }
       Mod+Ctrl+K { set-window-height "+5%"; }
   }
   ```

2. **Use the overview/hotkey tools.** niri's built-in hotkey overlay and
   `niri msg action` do not replace submaps, but they list and trigger actions
   without needing a mode.

3. **Swap configuration.** A script can write a different `binds` include and
   reload the config, emulating a modal layer at the cost of a parse/reload per
   switch. This is fragile; prefer option 1 unless the submap is large.

4. **Handle the mode outside niri.** For complex modal input, run a helper
   (for example a small script listening to a key) that calls
   `niri msg action ...`. Treat this as application logic, not compositor
   config.

Do not attempt to recreate Hyprland's `submap = reset`; there is no config
state to reset in niri.

## Full before / after

```lua
-- keybinds.lua (Hyprland)
hl.bind(mod .. "Return", hl.dsp.exec_cmd("kitty"))
hl.bind(mod .. "Q", hl.dsp.window.kill())
hl.bind(mod .. "Space", hl.dsp.window.float({ action = "toggle" }))
hl.bind(mod .. "left",  hl.dsp.focus({ direction = "l" }))
hl.bind(mod .. "right", hl.dsp.focus({ direction = "r" }))
hl.bind(mod .. "up",    hl.dsp.focus({ direction = "u" }))
hl.bind(mod .. "down",  hl.dsp.focus({ direction = "d" }))
hl.bind(mod .. "Tab", hl.dsp.focus({ workspace = "previous", on_current_monitor = true }))
hl.bind(mod .. "A", hl.dsp.workspace.toggle_special("files"))
hl.bind("XF86AudioRaiseVolume", run(scripts .. "/volume.sh", "up"), { locked = true, repeating = true })
```

```kdl
// keybinds.kdl (niri)
binds {
    Mod+Return { spawn "kitty"; }
    Mod+Q { close-window; }
    Mod+Space { toggle-window-floating; }

    Mod+Left  { focus-column-left; }
    Mod+Right { focus-column-right; }
    Mod+Up    { focus-window-up; }
    Mod+Down  { focus-window-down; }

    Mod+Tab { focus-workspace-previous; }

    // No togglespecialworkspace: use a named workspace "files".
    Mod+A { focus-workspace "files"; }
    Mod+Shift+A { move-window-to-workspace "files"; }

    XF86AudioRaiseVolume allow-when-locked=true { spawn-sh "~/.config/niri/scripts/volume.sh up"; }
}
```

## Bind options

| Hyprland bind option | niri property |
| --- | --- |
| `locked` | `allow-when-locked=true` (on `spawn` only) |
| `repeating` | default; disable with `repeat=false`, limit with `cooldown-ms=N` |
| `release` | none |
| `non_consuming`, `transparent` | none; use `allow-inhibiting=false` to always handle a bind |
| `ignore_mods` | none |
| `long_press` | none |
| `mouse = true` | mouse buttons are first-class (`MouseLeft`, ...) |

```kdl
binds {
    Mod+T repeat=false { spawn "alacritty"; }
    Mod+WheelScrollDown cooldown-ms=150 { focus-workspace-down; }
    Super+Alt+L allow-inhibiting=false { spawn "swaylock"; }
    Mod+Shift+S hotkey-overlay-title="Toggle style" { spawn-sh "theme.sh"; }
}
```
