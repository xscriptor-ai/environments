# Verification: proving a migrated niri setup works

Baseline: **niri 26.04** (2026-04-25). Every command below is exact. Each check
lists the healthy result so a migration can pass or fail deterministically.
Run these in order; a failure early usually explains a later failure.

All `niri msg` commands require a running niri and `$NIRI_SOCKET` set. The
`--json` output is the stable contract; the human-readable output is not stable
and must not be parsed by scripts.

## 1. Config parses

- Command (offline, explicit path):
  `niri validate -c ~/.config/niri/config.kdl; echo "exit=$?"`
- Healthy: no error lines are printed and `exit=0`.
- Command (live session, default path):
  `niri validate; echo "exit=$?"`
- Healthy: same; no "Failed to parse the config file" notification appears.
- Failure signals: a nonzero exit, a line naming the file and a line/column, or a
  config notification pop-up. Fix and re-validate before continuing.

## 2. Session journal is clean

- Command: `journalctl --user-unit=niri -b --no-pager`
- Healthy startup lines (from the Xwayland docs) look like:
  ```
  niri[...]: INFO niri: starting version 26.04 ...
  niri[...]: INFO niri: listening on Wayland socket: wayland-1
  niri[...]: INFO niri: IPC listening on: /run/user/1000/niri.wayland-1.<pid>.sock
  niri[...]: INFO niri: listening on X11 socket: :0
  ```
- Command (filter for trouble):
  `journalctl --user-unit=niri -b --no-pager | rg -i "error|warn|panic|traceback"`
- Healthy: no error/panic lines. Warnings about custom shaders or a single bad
  output are the only acceptable warnings; investigate anything else.

## 3. IPC state matches the hardware

### Outputs

- Command: `niri msg --json outputs | jq .`
- Healthy: an object keyed by output name; each value has fields including
  `name`, `make`/`model`, `current_mode`, `modes`, `scale`, `transform`,
  `logical` (`x`, `y`, `width`, `height`), `vrr_supported`, `serial` (field names
  are niri's snake_case JSON; confirm against a live `niri msg --json outputs`).
- Checks:
  - `name` values match the `output` blocks in `config.kdl`.
  - `logical` sizes equal physical size divided by `scale`.
  - Adjacent outputs do not overlap (compare `x + width` against the next `x`).
- Failure signal: a monitor missing (check cabling/mode), wrong scale, or
  overlapping logical rectangles.

### Workspaces

- Command: `niri msg --json workspaces | jq .`
- Healthy: an array with `id`, `idx`, `name`, `output`, `is_active`,
  `is_focused`, `active_window_id`. There is exactly one `is_focused=true` entry
  (on the focused output).
- Check named workspaces from the migration appear with their `name` and stick to
  their `output`.

### Windows

- Command: `niri msg --json windows | jq .`
- Healthy: an array with `id`, `title`, `app_id`, `pid`, `workspace_id`,
  `is_focused`, `is_floating`, `is_urgent`.
- Checks: `app_id` values are what the window rules target (compare with
  `niri msg pick-window`); floating dialogs show `is_floating=true`.

### Focused window and output

- Commands:
  ```
  niri msg --json focused-window
  niri msg --json focused-output
  ```
- Healthy: `focused-window` is an object (or `null` when nothing is focused);
  `focused-output` matches the monitor with keyboard focus.
- Failure signal: `focused-window` stays `null` while a window is clearly focused
  (usually a stale `niri msg` against an older compositor; restart niri).

### Layers

- Command: `niri msg layers`
- Healthy: the namespaces of all layer-shell surfaces, e.g. `quickshell`,
  `qs-master`, `qs-popups`, `qs-floating-overlay`, `qs-widget-*`.
- Check each namespace has a matching `layer-rule` in `config.kdl` (Phase 9 of the
  checklist).

## 4. Event stream smoke test

- Command: `niri msg event-stream` (Ctrl-C to stop), then open/close a window and
  switch a workspace in another terminal.
- Healthy: the stream first emits the full current state in this order:
  `WorkspacesChanged` (every workspace), `WindowsChanged` (every window), and
  `ConfigLoaded` (the last config load attempt); after that it emits only
  incremental updates.
- Version note: there are **no** output add/remove/change events in the 26.04
  stream. Query outputs separately with `niri msg --json outputs` or
  `niri msg --json focused-output`, and rebuild all state from the full
  `WorkspacesChanged`/`WindowsChanged` snapshot on reconnect.
- Command (scriptable snapshot, first events only):
  `timeout 3 niri msg --json event-stream | head -n 5`
- Healthy: valid JSON objects, one per line, starting with the initial state
  events.
- Failure signal: parsing errors after upgrading niri but not `niri msg`; restart
  niri so both are the same version.
- Version note: `niri msg --print-request` (next release) prints the raw JSON
  request form; `niri msg raw-request` sends raw JSON. Use these when porting
  `.socket2` listeners to `$NIRI_SOCKET`.

## 5. Portals and screencasting

- Command (services):
  `systemctl --user status xdg-desktop-portal xdg-desktop-portal-gnome`
- Healthy: both active (or activatable) after logging in through
  `niri-session`/a display manager. Portals do **not** work from a bare `niri`
  process.
- Command (D-Bus presence):
  `busctl --user list | rg -i "portal|pipewire"`
- Healthy: `org.freedesktop.portal.Desktop` and a PipeWire service are listed.
- Command (pick a window and target it):
  ```
  niri msg --json pick-window | jq .
  niri msg action set-dynamic-cast-window --id "$(niri msg --json pick-window | jq .id)"
  ```
- Healthy: the picked window becomes the "niri Dynamic Cast Target" stream; the
  stream goes to empty when the target closes.
- Manual test: open OBS (or Firefox `getUserMedia`) and confirm both monitor and
  window capture work, and that "niri Dynamic Cast Target" is offered.
- Failure signal: empty portal list or a screencast dialog with no niri target
  usually means no session, no `xdg-desktop-portal-gnome`, or a leftover global
  `GDK_BACKEND`. Remove `GDK_BACKEND` from the environment and restart the
  session.

## 6. Xwayland

- Command: `echo "$DISPLAY"`
- Healthy: `:0` (niri exported it).
- Command: `journalctl --user-unit=niri -b --no-pager | rg "X11 socket"`
- Healthy: a line `listening on X11 socket: :0`.
- Command (functional): launch an X11-only client, e.g. `xeyes` or
  `env DISPLAY=:0 xdpyinfo | head -n 3`.
- Healthy: the X11 window appears and `xdpyinfo` prints the X server info.
- Checks: `xwayland-satellite --version` is `>= 0.7`; there is no manual
  `xwayland-satellite` or `DISPLAY` line in `config.kdl` (the built-in
  integration handles both since 25.08).

## 7. Lock and idle

- Command (lock): `loginctl lock-session`
- Healthy: the screen locks. The locker must be recoverable: bind it with
  `allow-when-locked=true` so pressing the bind on a dead-locker red screen
  spawns a fresh locker (see the niri FAQ).
- Command (manual lock test): `swaylock -f` (or the chosen locker).
- Healthy: lock screen appears and accepts the password.
- Command (idle): `systemctl --user status swayidle`
- Healthy: `active (running)`; the unit is `PartOf=graphical-session.target` and
  added to `niri.service`.
- Command (DPMS): `niri msg action power-off-monitors`
- Healthy: monitors sleep; move the mouse or press a key to wake them.
- Failure signal: idle never fires (unit not added to niri), or the session
  resumes to a locked/red screen with no way out (locker bind missing
  `allow-when-locked`).

## 8. Screenshots

- Command (interactive): `niri msg action screenshot`
- Healthy: the screenshot UI opens; selecting an area with the mouse and pressing
  Space saves to `screenshot-path`.
- Command (screen and window):
  ```
  niri msg action screenshot-screen
  niri msg action screenshot-window
  ```
- Healthy: files appear under the configured `screenshot-path`
  (`~/Pictures/Screenshots/...`), and the image is also on the clipboard.
- Command (clipboard-only):
  `niri msg action screenshot-screen --write-to-disk=false`
- Healthy: no file is written; the clipboard receives the image.
- Checks: `screenshot-path` is set in `config.kdl`; the built-in UI is not
  affected by `block-out-from "screencast"` (blocked windows show in the UI but
  not on a cast).

## 9. Multi-monitor and scaling

- Command:
  `niri msg --json outputs | jq '.[] | {name, scale, transform, logical}'`
- Healthy: each connected output present with the intended `scale` and
  `transform`; `logical` sizes consistent with scale (e.g. a 3840x2160 output at
  `scale 2` has `logical.width == 1920`).
- Command (directional actions):
  `niri msg action focus-monitor-right` then `niri msg action focus-monitor-left`.
- Healthy: focus moves only between directly adjacent outputs (position matters,
  not connector order).
- Command (move a column across monitors):
  `niri msg action move-column-to-monitor-right`
- Healthy: the column appears on the adjacent monitor.
- Check fractional scale: on a `scale 1.5` output, `gaps` and border widths are
  rounded to physical pixels (that is expected, Since 0.1.7).
- Failure signal: direction actions jump the wrong way (positions overlap or are
  unset) or a scaled output is clipped (wrong logical math in `position`).

## 10. Live reload and config errors

- Command: `touch ~/.config/niri/config.kdl`
- Healthy: niri reloads silently; `journalctl --user-unit=niri -b --no-pager | tail -n 5`
  shows no error.
- Command (intentional error): introduce an unknown key and save.
- Healthy: a config-notification pop-up appears and the journal logs the parse
  error; restoring the file clears it. `niri validate` returns nonzero.
- Failure signal: no notification or journal entry on a bad config (running an
  old binary), or changes not applying at all (editing the wrong path; verify
  `niri msg version` and `$NIRI_CONFIG`).

## 11. Performance sanity

- Command (GPU activity): `nvidia-smi` (NVIDIA) or `intel_gpu_top` (Intel) while
  scrolling workspaces and opening windows.
- Healthy: GPU utilization spikes during motion and returns to near-idle at rest;
  no sustained saturation from blur.
- Command (theme transition): `niri msg action do-screen-transition`
- Healthy: the screen freezes briefly then crossfades; confirms the render loop
  and animation config are healthy.
- Checks:
  - If blur is enabled (26.04), confirm `blur { passes 3; offset 3.0 }` is not
    causing dropped frames; increase `offset` before `passes` per the docs.
  - For hybrid-GPU laptops with external-display lag, consider the
    `render-drm-device` debug option (see the FAQ) and expect higher battery use.
  - Confirm no `niri` error loop in `journalctl --user-unit=niri -b`.
- Failure signal: constant high GPU, visible stutter while scrolling, or repeated
  VRR modeset (black flashes) on a monitor.

## 12. NVIDIA-specific (if applicable)

- Command: `cat /sys/module/nvidia_drm/parameters/modeset`
- Healthy: `Y` (kernel modesetting enabled).
- Check the journal for a clean start rather than a black screen:
  `journalctl --user-unit=niri -b --no-pager | head -n 20`.
- Apply the VRAM heap-reuse fix from the niri Nvidia page if VRAM use grows
  without bounds.

## Result matrix

| Area | Command | Healthy result |
| --- | --- | --- |
| Config | `niri validate -c ~/.config/niri/config.kdl` | exit 0, no errors |
| Journal | `journalctl --user-unit=niri -b` | startup INFO lines, no errors |
| Outputs | `niri msg --json outputs` | all monitors, correct scale/position |
| Workspaces | `niri msg --json workspaces` | one focused, named workspaces present |
| Windows | `niri msg --json windows` | correct `app_id`, floats as expected |
| Focus | `niri msg --json focused-window` | object or null |
| Layers | `niri msg layers` | shell namespaces present |
| Events | `niri msg event-stream` | state snapshot then deltas |
| Portals | `systemctl --user status xdg-desktop-portal-gnome` | active |
| Cast | `niri msg action set-dynamic-cast-window --id <id>` | target stream switches |
| Xwayland | `echo $DISPLAY` | `:0` |
| Lock | `loginctl lock-session` | screen locks, recoverable |
| Idle | `systemctl --user status swayidle` | active |
| Screenshot | `niri msg action screenshot-screen` | file + clipboard |
| Multi-monitor | `niri msg action focus-monitor-right` | adjacent output focused |
| Reload | `touch ~/.config/niri/config.kdl` | silent reload, no errors |
| Performance | `niri msg action do-screen-transition` | freeze then crossfade |

## See also

- `migration-checklist.md` - the ordered migration steps.
- `gap-register.md` - features that cannot be verified because they have no niri
  equivalent.
