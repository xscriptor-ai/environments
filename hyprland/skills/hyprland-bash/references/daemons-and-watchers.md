# Daemons and watchers — compositor-friendly templates

Every template here exists so a script never degrades the Hyprland session: no busy loops, no unbatched `hyprctl` floods, no blocked event loop, survives compositor restarts. Verified 2026-10-15 against the equisdots `scripts/` conventions.

## 1. socket2 event daemon (canonical shape)

Requirements it satisfies: single instance (`flock`), 50 ms burst debounce with trailing flush, EOF detection (socket dies on compositor restart → exit → systemd restarts), re-resolve of the instance socket, state written atomically.

```bash
#!/usr/bin/env bash
# workspaces-daemon.sh — regenerate workspace JSON for the bar on Hyprland events.
# Supervised by systemd (Restart=always). Deliberately no `set -e`: must survive transient errors.

STATE_DIR="${QS_STATE_DIR:-${XDG_RUNTIME_DIR:-/tmp}/qs-desktops}"
mkdir -p "$STATE_DIR"
exec 9>"$STATE_DIR/workspaces-daemon.lock" || exit 1
flock -n 9 || exit 0                        # a twin is already running

resolve_socket() {                          # instance signature changes on compositor restart
  local dir newest
  dir="${XDG_RUNTIME_DIR:-/tmp}/hypr"
  newest="$(ls -t "$dir" 2>/dev/null | head -n1)" || return 1
  [ -n "$newest" ] && SOCK="$dir/$newest/.socket2.sock"
}

emit() {                                    # generate + atomic publish
  local tmp="$STATE_DIR/workspaces.json.tmp"
  hyprctl clients -j | jq -r '...' > "$tmp" && mv "$tmp" "$STATE_DIR/workspaces.json"
}

pending=0
while :; do                                 # outer loop: reconnect after compositor restart
  if ! resolve_socket || [ ! -S "$SOCK" ]; then sleep 2; continue; fi
  while :; do
    if IFS= read -r -t 0.05 line; then      # data: mark dirty (leading-edge + coalescing)
      case "${line%%>>*}" in
        openwindow|closewindow|movewindowv2|workspacev2|focusedmonv2|activespecialv2) pending=1 ;;
      esac
    else
      rc=$?
      (( rc > 128 )) || break               # rc==1 => EOF: socket gone, rebuild the connection
      if (( pending )); then emit; pending=0; fi   # trailing flush: >=50 ms of silence
    fi
  done < <(socat -U - UNIX-CONNECT:"$SOCK" 2>/dev/null)
  sleep 1
done
```

Notes:
- `read -t 0.05` distinguishes **data** (rc 0), **timeout** (rc >128, safe to flush) and **EOF** (rc 1, reconnect). This is the trick that makes debounce correct in bash without extra processes.
- Their `workspaces.sh` computes `id / state (active|occupied|empty) / tooltip / classes` JSON and performs zombie cleanup; `volume_listener.sh` shows the same pattern for `pactl subscribe` with device-switch dedupe (`if sink changed: update trackers, no OSD`).
- Keep the debounce constant in one place (50 ms for window churn, 250 ms for file edits) and comment it.

## 2. inotify watcher (one shot per event, restarted by the launcher)

```bash
#!/usr/bin/env bash
# watch-settings.sh — exit after one settings.json change; the caller (QML Process or systemd) restarts it.
FILE="$HOME/.config/hypr/settings.json"
while [ ! -f "$FILE" ]; do sleep 1; done     # wait for existence before arming
inotifywait -qq -e modify -e close_write "$FILE"
```

- Everything in the stack writes atomically (`tmp` + `mv`): a file-level inotify watch **dies on the inode** after the first rename. Watch the directory (`-e moved_to -e create --format '%f'` and filter) or use Quickshell `FileView` (follows the path). The QML side pattern (`Scaler.qml`): Process runs the watcher, on exit re-reads the file and restarts the watcher.
- Content-compare before expensive work: identical re-reads must be no-ops (palette/settings readers already do this; keep it when adding new watchers).

## 3. systemd user unit template

```ini
# ~/.config/systemd/user/equisdots-workspaces.service
[Unit]
Description=Hyprland workspaces daemon (equisdots)
PartOf=graphical-session.target
After=graphical-session.target
ConditionEnvironment=HYPRLAND_INSTANCE_SIGNATURE

[Service]
Type=simple
ExecStart=%h/.config/hypr/scripts/workspaces.sh
Restart=always
RestartSec=2
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=graphical-session.target
```

- Session targets: `hyprland-session.target`/`graphical-session.target` are integrated by Hyprland (do not add manual `systemctl` lines to the Lua config; clean leftovers with `systemctl --user revert hyprland-session.target`). `HYPRLAND_NO_SD_TARGET=1` disables the integration when multiple sessions are intentional.
- Prefer units over autostart chains for daemons that must survive; keep `hypridle`-style daemons on their native autostart.
- Debug: `systemctl --user status <unit>`, `journalctl --user -u <unit> -f`, `systemd-analyze --user blame` for slow sessions.

## 4. Supervisor rules (when not using systemd)

If a daemon is started from the Lua config/autostart instead of a unit:
- `flock` guard + pidfile in `$QS_RUN_DIR`; on start, kill a stale pid only if it is not alive (`kill -0`).
- Restart policy: outer `while :; do ...; sleep 2; done` with capped backoff; never crash-loop without sleeping.
- Log to stderr only (journald/session captures it); no log files unless `$QS_STATE_DIR` is used.

## 5. Compositor-citizenship checklist for every daemon/watcher

1. Never block: no long commands in the event path; heavy work happens after debounce or in a subshell.
2. `hyprctl` calls: batched, `-j` when parsing, `timeout 5`, and rate-limited (<= 20/s absolute worst case; the compositor dispatches synchronously).
3. State changes via `hyprctl eval 'hl.*'`, persistence to `settings.json` only when the user expectation is "remember it".
4. Atomic writes + unknown-key preservation + fallbacks (`x` palette).
5. Single instance + restart-safe + debounced + deduped.
6. Logs to stderr, exit codes meaningful, nothing depends on stdout when called from hooks.
