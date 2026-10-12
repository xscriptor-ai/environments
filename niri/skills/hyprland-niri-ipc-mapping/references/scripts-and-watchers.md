# Rewriting the equisdots scripts for niri

This file walks the equisdots Hyprland scripts under `hyprland/scripts/` and the
Quickshell touchpoints, states what each does today, gives the niri 26.04 rewrite,
and classifies the effort. The compositor-agnostic scripts are called out so you
do not rewrite them by mistake.

Baseline: **niri 26.04** (2026-04-25).

## Classification at a glance

| Script | Today | niri outcome | Class |
| --- | --- | --- | --- |
| `workspaces.sh` (classic view) | `hyprctl workspaces/clients/activeworkspace` poll on every socket2 event | event-stream consumer building a live model | **Redesign** |
| `workspaces.sh` (unified view) | fixed workspace ids `(d-1)*R+rank` across monitors | named workspaces per (desktop, rank) | **Redesign (semantics change)** |
| `ws-desktops-lib.sh` | `hyprctl monitors` -> desc->name, eval focus | `niri msg --json outputs` + `focus-monitor`/`focus-workspace` | **Redesign** |
| `scale-menu.sh` | seed from `hyprctl monitors`, apply via `hyprctl eval hl.monitor` | seed from `niri msg outputs`, apply via `niri msg output ... scale` | **Port, simpler** |
| `monitor-manager.sh` | rofi + `hl.monitor` presets, refresh-rate picker | same UI, `niri msg output` setters | **Port, loses mirror** |
| `restore-monitors.sh` | 2 s poll reconciler, EDID-keyed, `hl.monitor` | KDL writer + reconciler; no mirror | **Redesign, loses mirror** |
| `persist-display-config.sh` | emits `desc\|x\|y\|...\|mode` | emit KDL `output` blocks (or niri-shaped state) | **Redesign (output format)** |
| `exit.sh` | stop targets + `hl.dsp.exit()` | `niri msg action quit --skip-confirmation` | **Trivial** |
| `reload.sh` | Quickshell IPC + theme-sync | unchanged; add config reload only if wanted | **Trivial** |
| `idle-mode.sh` | start/stop `hypridle` | start/stop `swayidle`; commands -> `niri msg action power-off-monitors` | **Small redesign** |
| `init.sh`, `wallpapers*.sh` | wallpaper via `davincix` CLI | unchanged (layer-shell wallpaper tool) | **No change** |
| `qs_manager.sh` | routing + `hyprctl eval` workspace moves | replace the two eval lines with `niri msg action` | **Small** |
| `screenshot.sh` | `grim`/`satty`/`gpu-screen-recorder` | mostly unchanged; see the tooling skill | **Small** |
| `core/compositors/Hyprland.qml` | `hyprctl activewindow`, `eval`, `switchxkblayout` | niri backend; see below | **Redesign** |
| `core/scripts/hypr-effects.sh` | live `hyprctl eval` of decoration knobs | write KDL + reload (loses live preview) | **Loses a feature** |

## `workspaces.sh` - workspace-state daemon

Today (lines 55-103 for the classic view, 112-194 for the unified view, 211-229
for the loop):

- `print_workspaces_classic` runs `hyprctl workspaces -j` and `hyprctl
  activeworkspace -j`, then a second `hyprctl clients -j` pass in Python to build
  per-workspace app lists.
- `print_workspaces_unified` runs `hyprctl monitors -j`, `clients -j`,
  `workspaces -j` and computes desktops from the `(d-1)*R+rank` id scheme.
- The loop connects to `.socket2.sock` with `socat`, matches
  `workspace*|focusedmon*|activewindow*|...`, drains a 50 ms storm, and re-runs
  `print_workspaces` (re-querying the compositor every time).

niri rewrite:

- Connect once to `niri msg --json event-stream`. Build `workspaces` (keyed by
  `id`) and `windows` (keyed by `id`) from the initial `WorkspacesChanged` /
  `WindowsChanged`. On every delta, update the model and re-render once.
- Per-workspace app classes come from the model: group `windows` by
  `workspace_id`, collect `app_id`. No second query, no `socat`, no debounce
  hack - the event stream is already coalesced by the compositor, and there is no
  re-query to storm.
- The fixed 1..SEQ_END pill row must change: niri workspaces are dynamic and have
  no permanent index. Render the workspaces that actually exist, using `idx` for
  display and `name` when set. `focus-workspace <idx>` acts on the focused
  output, so a click must `focus-monitor <output>` first when the target is on
  another output.
- For the "static desktops" feel the classic view emulated, declare named
  workspaces in KDL and focus them by name.

```sh
# Replace the hyprctl re-query with one event stream consumer.
niri msg --json event-stream | while IFS= read -r line; do
  key=$(printf '%s' "$line" | jq -r 'keys[0]')
  case "$key" in
    WorkspacesChanged|WindowsChanged|WindowOpenedOrChanged|WindowClosed|\
    WorkspaceActivated|WorkspaceActiveWindowChanged|WindowFocusChanged|\
    WindowLayoutsChanged)
      render_from_model "$line"
      ;;
  esac
done
```

Effort: **Redesign**. The plumbing gets shorter, but the data model changes from
"poll id 1..N" to "maintain dynamic state".

## `ws-desktops-lib.sh` - unified desktops roster

Today:

- `ws_connected_ranks` maps roster descriptions to connector names via `hyprctl
  monitors -j | jq '.[] | [.name, .description]'`.
- `ws_focused_monitor` picks the `focused == true` monitor.
- `ws_desktop_goto` loops `hyprctl eval 'hl.dispatch(hl.dsp.focus({ monitor = ... }))'`
  then `... focus({ workspace = N })`, and finally restores the original monitor.
- `ws_desktop_move_window` reads `hyprctl activewindow -j | .monitor`, resolves the
  monitor name, and moves the window with `hl.dsp.window.move({ workspace = N })`.
- The id scheme is `ws_slot_id = (desktop - 1) * ROSTER_W + rank`.

niri rewrite:

- The roster maps cleanly: niri outputs expose `make`, `model`, and `serial`
  separately. Build the same `desc -> name` map as `"<make> <model> <serial>"` or
  use the connector name from `niri msg --json outputs` keys. Output sections in
  KDL can be matched by `make model serial` too, which survives connector renames
  (the same motivation as the old EDID `desc` keying).
- The `(d-1)*R+rank` scheme has no direct analogue because niri has no static
  per-monitor workspace ids. The faithful port is one **named workspace per
  (desktop, rank)**, for example `d3-r2`, declared in KDL with `open-on-output`
  pinned to each roster screen by make/model/serial. Named workspaces always
  exist and can be focused by name, which restores the persistent-desktop feel.
- Focus by name is global, so `ws_desktop_goto` calls `niri msg action
  focus-workspace "dK-rR"` for each rank, then `focus-monitor` on the original
  output to restore keyboard focus.
- Moving a window: `niri msg --json focused-window | jq .id`, resolve its
  `workspace_id` -> `output` from the model, then `niri msg action
  move-window-to-workspace <name> --window-id <id>` (or the focused-window form).

```kdl
// Roster screen pinned by EDID-ish identity, plus one workspace per desktop.
output "Xiaomi Corporation P27FBB-RGGL 5275600003084" { position x=2560 y=0 }

workspace "d1-r2" { open-on-output "Xiaomi Corporation P27FBB-RGGL 5275600003084" }
workspace "d2-r2" { open-on-output "Xiaomi Corporation P27FBB-RGGL 5275600003084" }
```

```sh
# Jump every roster screen to desktop 3.
for rank in $RANKS; do
  niri msg action focus-workspace "d3-r$rank"
done
niri msg action focus-monitor "$ORIGINAL_OUTPUT"
```

Effort: **Redesign**. The behavior can be preserved, but the identity model moves
from integer arithmetic on workspace ids to named-workspace membership. Record the
mapping in an ADR.

## `scale-menu.sh` - global display scale

Today: seeds `settings.json` from `hyprctl -j monitors`, applies a ladder value to
every monitor through `hyprctl eval 'hl.monitor({..., scale = S})'`, then persists
the layout via `persist-display-config.sh`.

niri rewrite:

- Seed from `niri msg --json outputs` instead of `hyprctl monitors`. The live
  scale is `."<name>".logical.scale`.
- Apply with `niri msg output <name> scale <value>` per connected output. This is
  the one runtime setter niri exposes, and it is temporary.
- To persist, write the scale into the KDL output block and reload. The
  `settings.json` record for Quickshell stays as-is.
- The ladder must include only scales the panel accepts; unlike Hyprland there is
  no silent snap to a nearby value, but a value can still be ineffective if the
  mode does not divide cleanly.

```sh
for out in $(niri msg --json outputs | jq -r 'keys[]'); do
  niri msg output "$out" scale "$SCALE"
done
# then rewrite the matching output blocks in config.kdl and reload
niri msg action load-config-file
```

Effort: **Port, simpler**. The Hyprland Python mode-matching block is deleted.

## `monitor-manager.sh` - rofi monitor menu

Today: presets (`right`, `left`, `above`, `below`, `mirror`, `only-primary`,
`only-external`) applied through `hl.monitor`, a refresh-rate picker that resolves
the exact `availableModes` string, and an info notification. `get_monitors` is
`hyprctl monitors -j`.

niri rewrite:

- Replace `get_monitors` with `niri msg --json outputs`. Field renames:
  `description` -> `make`+`model`+`serial`; `width/height/refreshRate` ->
  `modes[current_mode]`; `x/y/scale/transform` -> `logical.*`; `disabled` ->
  `logical == null`.
- `apply_monitor_lua "{ output = ..., mode = ..., position = "0x0", scale = ... }"`
  becomes `niri msg output <name> mode <WxH@R>` followed by `position set X Y`
  and `scale S`. For disabling: `niri msg output <name> off`.
- Exact-mode resolution is simpler: iterate `modes[]` and pick the
  `refresh_rate` (millihertz) nearest the requested rate.
- **`mirror` has no equivalent.** 26.04 has no hardware output mirroring;
  `wl-mirror` mirrors an output into a window, not a real mirror. Drop or
  reimplement as a window.

```sh
# only-external, niri
for out in $(niri msg --json outputs | jq -r 'keys[]'); do
  [ "$out" = "$EXTERNAL" ] || niri msg output "$out" off
done
```

Effort: **Port, loses mirror**.

## `restore-monitors.sh` - reconciler

Today: a 2 s poll loop that reads `~/.config/hypr/display-config`, compares live
`hyprctl monitors -j` state against each saved rule (matched by EDID
`description`), and re-applies drift with `hl.monitor`. Extended fields include
transform, vrr, bitdepth, color management, mirror, and disabled.

niri rewrite:

- There are **no output events** in the niri event stream, so a poll loop is still
  required (2 s is fine; do not hammer it).
- Live state from `niri msg --json outputs`; identity from `make model serial`
  (or the connector name).
- Apply with `niri msg output ...` (temporary) **or** write the desired state into
  KDL and `load-config-file`. Because the reconciler's job is to survive relogin,
  the KDL writer is the durable choice; a runtime `niri msg output` only fixes the
  current session.
- `mirror` is dropped. `colorManagementPreset` and `currentFormat` bit depth have
  no direct `niri msg outputs` equivalents in 26.04; drop those extended fields or
  read them from another source.

Effort: **Redesign, loses mirror and some extended fields**.

## `persist-display-config.sh` - persist live layout

Today: emits a pipe-delimited `desc|x|y|scale|mode|transform|vrr|bitdepth|cm|
mirror|disabled` file.

niri rewrite: read `niri msg --json outputs` and emit KDL `output` blocks. This
removes the custom file format entirely and lets niri own persistence.

```kdl
output "BOE NE160WUM-NXA" {
    mode "2560x1600@120.000"
    scale 1.5
    position x=0 y=0
    variable-refresh-rate
}
```

Generate the mode string from `modes[current_mode]` as
`"<width>x<height>@<refresh_rate/1000>"` and match the monitored output by
`"<make> <model> <serial>"` so connector renames do not matter. Effort:
**Redesign (output format)**; the pipe file and its backup logic can be deleted.

## `exit.sh` - logout

Today:

```sh
systemctl --user stop graphical-session.target
systemctl --user stop graphical-session-pre.target
sleep 0.5
hyprctl eval 'hl.dispatch(hl.dsp.exit())'
```

niri rewrite: the same systemd teardown is fine, and the compositor exit is

```sh
niri msg action quit --skip-confirmation
```

`--skip-confirmation` is required in a script; without it niri waits for an
interactive confirmation. Effort: **Trivial**.

## `reload.sh` - shell + theme reload

Today it calls the QuickShell IPC (`topbar forceReload`) and runs `theme-sync`.
Neither touches the compositor, so **no change** is needed for niri. If you also
want it to force a compositor config reload, append:

```sh
niri msg action load-config-file
```

Effort: **Trivial**.

## `idle-mode.sh` - idle/auto-lock control

Today: starts/stops the `hypridle` daemon based on `idle-settings.json`.

niri rewrite: the control shape (awake stops the daemon, normal starts it) is
identical; only the daemon changes to `swayidle` and the commands in its config
change. `SIGSTOP`/kill semantics stay the same. The idle command that used to be
a hypridle action becomes:

```sh
swayidle -w \
  timeout 600 'swaylock -f' \
  timeout 601 'niri msg action power-off-monitors' \
  before-sleep 'swaylock -f'
```

`start_idle`/`stop_idle` in the script become `pgrep -x swayidle` / `pkill -x
swayidle`. Effort: **Small redesign**; details are in the separate
`hyprland-niri-tooling-mapping` skill, `references/lock-idle.md`.

## `qs_manager.sh` - workspace/desktop routing

Today: the fast path forwards numeric/next/prev switches. The two compositor
calls to change are:

```sh
hyprctl eval "hl.dispatch(hl.dsp.window.move({ workspace = $ACTION }))"
hyprctl eval "hl.dispatch(hl.dsp.focus({ workspace = $ACTION }))"
```

niri equivalents:

```sh
niri msg action move-window-to-workspace "$ACTION"
niri msg action focus-workspace "$ACTION"
```

For `next`/`prev`, Hyprland uses `workspace = "e+1"`/`"e-1"`; niri uses
`focus-workspace-down` and `focus-workspace-up`. The unified-desktops branch routes
into `ws-desktops-lib.sh`, which is covered above. Everything else in
`qs_manager.sh` (Quickshell IPC, network/BT handling, wallpaper prep) is
compositor-agnostic. Effort: **Small**.

## Quickshell: `core/compositors/Hyprland.qml`

This is the compositor abstraction point; a `Niri.qml` sibling should provide the
same four operations:

| Property/function | Hyprland today | niri |
| --- | --- | --- |
| `workspacesCommand` | `bash -c ~/.config/hypr/scripts/workspaces.sh` | same script, rewritten as above |
| `keyboardCommand` | `kb_fetch.sh` -> `hyprctl devices -j` | `niri msg --json keyboard-layouts` |
| `focusCommand` | `hyprctl activewindow -j` -> class/title | `niri msg --json focused-window` -> `app_id`/`title` |
| `switchWorkspace(name)` | `qs_manager.sh <name>` | same, with the routing above |
| `cycleKeyboardLayout()` | `hyprctl switchxkblayout main next` | `niri msg action switch-layout next` |
| `setWindowBorders(active, inactive)` | `hyprctl eval 'hl.config(...)'` live | **loses live update**: write KDL + reload |

The `focusCommand` rewrite (note the `null` vs `{}` difference):

```sh
niri msg --json focused-window \
  | jq -r 'if . == null then empty else "\(.app_id // "")\n\(.title // "")" end'
```

`kb_fetch.sh` becomes a one-liner:

```sh
niri msg --json keyboard-layouts | jq -r '.names[.current_idx]'
```

## `core/scripts/hypr-effects.sh` - window effects (loses a feature)

Today this is the clearest "no niri equivalent" case. It reads live values with
`hyprctl -j getoption`, previews changes with `hyprctl eval 'hl.config(...)'`, and
persists by regenerating `window-effects.lua` / `gaps.lua`. The live preview is
per-frame while a slider is dragged.

Under niri:

- There is no `getoption` and no runtime `hl.config`. Values live in the KDL
  `layout { ... }`, `window-rule`, and top-level blocks.
- The persisted `.lua` files become one or more `.kdl` include files. Keep the
  JSON state as the source of truth, but the "preview" step must write the KDL and
  wait for the config reload; there is no per-frame live patch.
- `niri msg action load-config-file` can force the reload immediately after a
  write, which keeps the UI responsive, but a drag cannot update every frame.

Effort: **Loses a feature** (live preview). The persistence half ports; the
interactive live half becomes write-and-reload and should be throttled (for
example on slider release, not on value change).

## Border recolor specifically

`Hyprland.qml:setWindowBorders` pushes a palette-driven active/inactive border
color live. niri draws borders through `layout { border { ... } }` and
`window-rule { border { ... } }`. The faithful port is:

```kdl
layout {
    border {
        on
        width 2
        active-color "#89b4fa"
        inactive-color "#45475a"
    }
}
```

To recolor from the shell palette, regenerate that block (or a `colors.kdl`
include) and reload. The color change applies on the next reload, not
instantaneously mid-animation. This is the same "write KDL + reload" pattern as
`hypr-effects.sh`; treat both as one feature.

## Summary of feature losses

| Lost feature | Script(s) | Replacement or decision |
| --- | --- | --- |
| `hyprctl cursorpos` | any pointer overlay | redesign with in-surface pointer handling; see the IPC reference |
| `hyprctl keyword` / `eval` live patch | `hypr-effects.sh`, border recolor, `scale-menu.sh` | write KDL + `load-config-file` |
| Static per-monitor workspace ids | `workspaces.sh`, `ws-desktops-lib.sh` | dynamic model + named workspaces |
| Hardware output mirror | `monitor-manager.sh`, `restore-monitors.sh` | drop, or `wl-mirror` as a window |
| Per-device keyboard layout | `Hyprland.qml` / `kb_fetch.sh` | global `switch-layout` only |
| Fullscreen event | any bar using `fullscreen>>` | no niri event or field; derive from geometry or drop |
| Monitor hotplug events | `restore-monitors.sh` | poll `niri msg --json outputs` (no stream events) |
