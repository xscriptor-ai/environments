# `hyprctl` to `niri msg` command mapping

Every table row is grounded in a real Hyprland command used by the equisdots
scripts and a real niri 26.04 equivalent. Where there is no equivalent, the gap is
stated explicitly. Always pass `--json` (`-j`) in scripts on both sides.

Baseline: **niri 26.04** (2026-04-25).

## Core command table

| Hyprland | niri 26.04 | Notes |
| --- | --- | --- |
| `hyprctl monitors -j` | `niri msg --json outputs` | Array vs. name-keyed object. See shape table. |
| `hyprctl monitors -j \| jq '.[] \| select(.focused)'` | `niri msg --json focused-output` | niri returns the object directly, or `null`. |
| `hyprctl workspaces -j` | `niri msg --json workspaces` | Hyprland keeps stale workspaces; niri workspaces are dynamic. |
| `hyprctl activeworkspace -j` | `niri msg --json workspaces \| jq '[.[] \| select(.is_focused)][0]'` | niri has no `activeworkspace`; filter the array. |
| `hyprctl clients -j` | `niri msg --json windows` | `class` -> `app_id`; `address` -> numeric `id`. |
| `hyprctl activewindow -j` | `niri msg --json focused-window` | Hyprland returns `{}` when none; niri returns `null`. |
| `hyprctl layers -j` | `niri msg --json layers` | Fields differ; see shape table. |
| `hyprctl devices -j` (keyboards) | `niri msg --json keyboard-layouts` | No per-device detail; global layout set only. |
| `hyprctl version -j` | `niri msg --json version` | Field names differ (`version` vs `compositor`/`cli`). |
| `hyprctl dispatch <d>` | `niri msg action <name>` | See dispatcher table. |
| `hyprctl switchxkblayout main next` | `niri msg action switch-layout next` | Global layout switch; no per-device target. |
| `hyprctl cursorpos` | none | No non-interactive pointer query. See limitations. |
| `hyprctl keyword <opt> <val>` | none | Edit KDL; reload. See limitations. |
| `hyprctl eval 'hl...'` | none | Edit KDL; reload. One exception: `niri msg output`. |
| `hyprctl reload` | save `config.kdl`, or `niri msg action load-config-file` | niri watches the config file. |
| `hyprctl dispatch exit` / `hl.dsp.exit()` | `niri msg action quit --skip-confirmation` | See `scripts-and-watchers.md`. |
| `hyprctl output create/remove` | none in 26.04 | Outputs are hardware-driven. |
| `hyprctl hyprpaper ...` | not IPC | Wallpaper handled by an external tool; see the tooling skill. |
| `hyprctl getoption <opt> -j` | none | Read from the parsed KDL config instead. |
| `hyprctl setcursor <theme> <size>` | none | `cursor { xcursor-theme; xcursor-size; }` in KDL, then reload. |

`niri msg --help` lists subcommands; `niri msg action --help` lists every action.
Because the CLI is a thin wrapper over the socket, the authoritative action list is
`/tmp/opencode/niri/niri-ipc/src/lib.rs` (`enum Action`) or
`https://niri-wm.github.io/niri/niri_ipc/enum.Action.html`.

## JSON shape differences

### Outputs / monitors

| Concept | Hyprland (`hyprctl monitors -j`) | niri (`niri msg --json outputs`) |
| --- | --- | --- |
| Container | JSON array | Object keyed by output name |
| Name | `name` | key of the object, and `name` field |
| Identity | `description` (make model serial) | `make`, `model`, `serial` (separate fields) |
| Current mode | `width`, `height`, `refreshRate` (Hz, float) | `modes[current_mode]`, where `refresh_rate` is **millihertz** (int) |
| All modes | `availableModes` (strings `WxH@RHz`) | `modes` array of `{width,height,refresh_rate,is_preferred}` |
| Enabled | `disabled` bool | `logical == null` means unmapped/disabled |
| Position/scale | `x`, `y`, `scale`, `transform` (int) | `logical.x`, `logical.y`, `logical.scale`, `logical.transform` (string: `normal`/`90`/...) |
| VRR | `vrr` bool | `vrr_supported`, `vrr_enabled` |
| Focus | `focused` bool | use `niri msg focused-output` |

```sh
# Hyprland: names of all monitors
hyprctl monitors -j | jq -r '.[].name'

# niri: names of all outputs (keys of the object)
niri msg --json outputs | jq -r 'keys[]'

# Hyprland: the focused monitor
hyprctl monitors -j | jq -r '.[] | select(.focused) | .name'

# niri: the focused output name (null if none)
niri msg --json focused-output | jq -r '.name // "none"'

# Hyprland: current mode of eDP-1
hyprctl monitors -j | jq -r '.[] | select(.name=="eDP-1") | "\(.width)x\(.height)@\(.refreshRate)"'

# niri: current mode of eDP-1 (refresh_rate is millihertz)
niri msg --json outputs | jq -r '
  ."eDP-1" as $o
  | $o.modes[$o.current_mode]
  | "\(.width)x\(.height)@\(.refresh_rate / 1000)"'
```

### Workspaces

| Concept | Hyprland (`workspaces -j`) | niri (`workspaces`) |
| --- | --- | --- |
| Stable id | `id` (int, also the visible number) | `id` (opaque u64; do not display) |
| Position/id shown | `id` and `name` | `idx` (u8, position on its output; changes) and `name` (optional) |
| Output | `monitor`, `monitorID` | `output` (name, nullable) |
| Window count | `windows` | derive from `windows` (count by `workspace_id`) |
| Last title | `lastwindowtitle` | derive from `active_window_id` -> window |
| Focus/active | `activeworkspace` command; no bool in list | `is_active` (per output) and `is_focused` (single, global) |
| Urgent | `isurgent` | `is_urgent` |

```sh
# Hyprland: active workspace id
hyprctl activeworkspace -j | jq '.id'

# niri: focused workspace idx (for focus-workspace), or null
niri msg --json workspaces | jq -r '[.[] | select(.is_focused)][0].idx'

# niri: the workspace objects that are active on their output
niri msg --json workspaces | jq -c '[.[] | select(.is_active)]'

# niri: workspace ids with the number of windows on each
niri msg --json workspaces as $ws
| niri msg --json windows as $win
| $ws | map(. as $w | {id, idx, output, windows: ([$win[] | select(.workspace_id == $w.id)] | length)})
```

### Windows / clients

| Concept | Hyprland (`clients -j`) | niri (`windows`) |
| --- | --- | --- |
| Id | `address` (`"0x..."` hex string) | `id` (u64) |
| App id | `class` | `app_id` |
| Title | `title` | `title` |
| Workspace | `workspace.id` (int) | `workspace_id` (u64) |
| Monitor | `monitor` (int id) | join via the workspace `output` |
| Focus | `focusHistoryID`/`focused` on activewindow | `is_focused` bool |
| Floating | `floating` | `is_floating` |
| Urgent | no direct per-window bool | `is_urgent` |
| Fullscreen | `fullscreen` (int mode) | not on the window; use `layout` + actions |
| Geometry | `at`, `size` (arrays) | `layout.tile_size`, `layout.window_size`, `layout.pos_in_scrolling_layout` |
| PID | `pid` | `pid` (nullable) |

```sh
# Hyprland: focused class and title
hyprctl activewindow -j | jq -r 'if .class == null then "" else "\(.class)\n\(.title)" end'

# niri: focused app_id and title (null-safe)
niri msg --json focused-window | jq -r 'if . == null then "" else "\(.app_id // "")\n\(.title // "")" end'

# Hyprland: class per workspace
hyprctl clients -j | jq '[.[] | {ws: .workspace.id, class}] | group_by(.ws)'

# niri: app_id per workspace id
niri msg --json windows | jq '[.[] | {ws: .workspace_id, app: .app_id}] | group_by(.ws)'

# niri: the (column, tile) position of every tiled window
niri msg --json windows | jq -r '.[] | "\(.id)\t\(.layout.pos_in_scrolling_layout)"'
```

### Layers, keyboard layouts, version

| Concept | Hyprland | niri |
| --- | --- | --- |
| Layer surfaces | no direct `hyprctl` list; `hyprctl layers` exists but is limited | `niri msg --json layers`: `namespace`, `output`, `layer`, `keyboard_interactivity` |
| Active keyboard layout | `hyprctl devices -j` -> `keyboards[] | select(.main) | .active_keymap` | `niri msg --json keyboard-layouts` -> `{names, current_idx}` |
| Version | `hyprctl version -j` -> `{branch, commit, version, ...}` | `niri msg --json version` -> `{compositor, cli}` |

```sh
# Hyprland: first two letters of the main keyboard layout
hyprctl devices -j | jq -r '(.keyboards[] | select(.main) | .active_keymap) // .keyboards[0].active_keymap' | cut -c1-2

# niri: current layout name
niri msg --json keyboard-layouts | jq -r '.names[.current_idx]'

# niri: version
niri msg --json version | jq -r '.compositor'
```

## Dispatcher (`hyprctl dispatch`) to action (`niri msg action`)

Hyprland `dispatch` string to niri action name (kebab-case of the Rust variant in
`lib.rs`). Arguments are the same idea, different names.

| Hyprland dispatch | niri action |
| --- | --- |
| `workspace <id>` | `focus-workspace <idx-or-name>` |
| `workspace e+1` / `e-1` | `focus-workspace-down` / `focus-workspace-up` |
| `movetoworkspace <id>` | `move-window-to-workspace <idx-or-name>` |
| `movetoworkspacesilent <id>` | `move-window-to-workspace <ref> --focus false` |
| `focusmonitor <name>` | `focus-monitor <name>` |
| `movewindow mon:<name>` | `move-window-to-monitor <name>` |
| `togglefloating` | `toggle-window-floating` |
| `fullscreen [0|1]` | `fullscreen-window` |
| `killactive` | `close-window` |
| `swapwindow l/r/u/d` | `swap-window-left` / `-right`, `move-window-up` / `-down` |
| `movewindow l/r/u/d` | `move-column-left` / `-right`, `move-window-up` / `-down` |
| `resizeactive` | `set-window-width` / `set-window-height` (with a `SizeChange`) |
| `togglespecialworkspace` | none (no scratchpad; use a named workspace) |
| `exit` | `quit --skip-confirmation` |
| `exec <cmd>` | no action from scripts; spawn directly (see note) |
| `execr <cmd>` | no action from scripts; spawn directly |

Note on spawning: Hyprland exposes `dispatch exec`. niri has `spawn` and
`spawn-sh` **actions** that exist for key binds (`niri msg action spawn -- ...`
works over IPC too), but for a script it is almost always simpler and more
predictable to just run the command directly in the script. Use the action only
when you specifically need niri to own the child process.

Volume, brightness and other non-compositor commands were never `hyprctl`
features; they stay as-is (`wpctl`, `brightnessctl`, ...).

## Output configuration at runtime

niri is the one place with a runtime config path: `niri msg output <name>
<action>`. It changes the output **temporarily** (not written to the config file)
and is forgotten if the config later changes that output. To persist, write an
`output "<name>" { ... }` block in KDL.

| Hyprland (`hl.monitor({...})` via `hyprctl eval`) | niri |
| --- | --- |
| `output = "N", mode = "WxH@R", scale = S, position = "XxY"` | `niri msg output N mode WxH@R` then `scale S`, then `position set X Y` |
| `disabled = true` | `niri msg output N off` |
| `disabled = false` | `niri msg output N on` |
| `transform = N` | `niri msg output N transform 90` |
| `vrr = 1` | `niri msg output N vrr on` |
| `vrr = 2` (fullscreen only) | `niri msg output N vrr on --on-demand` |
| `bitdepth = 10` | `niri msg output N max-bpc 10` |
| `mirror = "name"` | none in 26.04; use `wl-mirror` (a window, not a hardware mirror) |
| `position = "auto"` | `niri msg output N position auto` |
| `mode = "preferred"` | `niri msg output N mode auto`, or omit and let niri pick |

```sh
# Hyprland: apply a scale live
hyprctl eval 'hl.monitor({ output = "eDP-1", mode = "highrr", position = "auto", scale = 1.5 })'

# niri: same, temporary, output must exist
niri msg output eDP-1 scale 1.5
niri msg output eDP-1 mode 2560x1440    # highest rate for that resolution
niri msg output eDP-1 position auto
```

To persist, write KDL and reload. Outputs can be matched by connector name or by
`make model serial` (Since: 0.1.9), which survives connector renames:

```kdl
output "BOE NE160WUM-NXA" {
    mode "2560x1600@120.000"
    scale 1.5
    position x=0 y=0
}
```

## Documented limitations

### `hyprctl cursorpos` - no equivalent

Hyprland prints `x, y` for the pointer. niri 26.04 has **no** request for the
cursor position. `niri msg pick-color` and `niri msg pick-window` are interactive
(they take an overlay click) and do not report an arbitrary resting position.
Workarounds:

- Move the pointer-dependent logic into the layer-shell app itself. In Quickshell
  a `PointerHandler` / `hoverEnabled` item receives pointer coordinates relative
  to its own surface, which is enough for overlays and mascots.
- Use a small standalone Wayland client that binds `wl_seat`/`wl_pointer` and
  prints `motion` events (for example a `wev`-style tool). This is the only way to
  get global coordinates, and it requires the surface to receive pointer focus.
- If the value is only needed at click time, use `niri msg pick-color` /
  `pick-window`, which give the clicked entity without needing coordinates.

Do not pretend a query exists; if an equisdots feature depends on `cursorpos`,
record it in the gap register and choose one of the above.

### `hyprctl keyword` / `hyprctl eval` - no equivalent

There is no arbitrary runtime option setter. The niri config is a KDL document
that is parsed and reloaded as a whole. To change something:

1. Edit `~/.config/niri/config.kdl` (or an included `*.kdl` file).
2. Save. The config watcher reloads automatically; or force it with
   `niri msg action load-config-file` (optionally `--path /abs/file.kdl`).

This has two consequences for migrated scripts:

- A "live preview while dragging a slider" (the equisdots `hypr-effects.sh`
  pattern) becomes "write KDL, wait for the visible config reload". niri reloads
  are cheap but not per-frame; throttle writes.
- Per-key partial updates are not possible. Regenerate the whole affected KDL
  block from your JSON state (same as `hypr-effects.sh` already does for its
  `.lua` outputs), rather than patching one field.

The `output` state is the single exception, handled above.

### Per-device keyboard layout switching

`hyprctl switchxkblayout <device> next` acts on a named device. niri keeps a
single global configured layout set: `niri msg action switch-layout next` (or
`prev`, or an index). There is no per-device target and no `devices` list. If a
script switched one physical keyboard independently, that behavior is dropped;
depending on the use case it can be approximated by scoping layout changes to
window rules or by using per-device XKB in the compositor configuration if the
target niri release grows support.

### `hyprctl getoption`

Hyprland lets scripts read the effective value of any option. niri has no
equivalent query; read the value from your own state file or parse the KDL config
you generated. Do not scrape `niri msg` for it.

### No output events in the event stream

The event stream (26.04) carries workspace, window, keyboard-layout, overview,
config, cast and screenshot state. It does **not** carry output added/removed/
changed. Poll `niri msg --json outputs` only when outputs actually change (for
example from a udev/`drm` hotplug signal), not in a tight loop.

## Version gating

- `niri msg --json` stability contract: Since 26.04 as documented; applies to all
  26.x. New fields/variants may be added at any release.
- `niri msg --print-request`: Since: next release (not in 26.04).
- Output matching by `make model serial`: Since 0.1.6/0.1.9.
- `xwayland-satellite` integration: Since 25.08 (relevant if scripts assume X11).
- Event stream itself: Since 0.1.9.
