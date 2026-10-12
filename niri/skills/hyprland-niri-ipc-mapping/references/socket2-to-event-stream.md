# `.socket2.sock` to the niri event stream

Hyprland emits newline-delimited text events on
`$XDG_RUNTIME_DIR/hypr/$HYPRLAND_INSTANCE_SIGNATURE/.socket2.sock` (`EVENT>>DATA`).
niri emits newline-delimited JSON events from `niri msg --json event-stream` (or
by sending `"EventStream"` to `$NIRI_SOCKET`). This file maps every event the
equisdots scripts consumed and shows the before/after consumer.

Baseline: **niri 26.04** (2026-04-25). The event stream exists Since 0.1.9.

## The model difference

Hyprland `.socket2.sock` is a **pure delta** stream: each event describes one
change and nothing else. If your reader starts after the stream began, or misses a
line, its state drifts permanently; the fix is to re-query `hyprctl` on every
event (which is what `workspaces.sh` does).

niri is a **state-snapshot-plus-delta** stream:

1. On connect it sends the complete current state: `WorkspacesChanged` (all
   workspaces), `WindowsChanged` (all windows), and `ConfigLoaded`.
2. Then it sends only deltas.

So a niri consumer does **not** need any other IPC request and cannot desync if it
applies deltas correctly. There is no need to re-query on each event. This is the
single most important rewrite for `workspaces.sh`.

## Event mapping

| Hyprland `.socket2.sock` line | Payload | niri event (JSON key) |
| --- | --- | --- |
| `workspace>>NAME` / `workspacev2>>ID,NAME` | workspace switched | `WorkspaceActivated` `{id, focused}` (plus `WorkspacesChanged` when the set changes) |
| `createworkspace>>NAME` / `createworkspacev2>>ID,NAME` | workspace created | `WorkspacesChanged` |
| `destroyworkspace>>NAME` / `destroyworkspacev2>>ID,NAME` | workspace removed | `WorkspacesChanged` |
| `moveworkspace>>NAME,MON` / `moveworkspacev2>>ID,NAME,MON` | workspace moved to monitor | `WorkspacesChanged` |
| `renamedworkspace>>OLD,NEW` | workspace renamed | `WorkspacesChanged` |
| `focusedmon>>MON,NAME` / `focusedmonv2>>MON,ID` | monitor focus changed | no dedicated event; `WorkspaceActivated` `{focused:true}` for the newly focused output's workspace |
| `activewindow>>CLASS,TITLE` | focused window changed (deprecated) | `WindowFocusChanged` `{id}` |
| `activewindowv2>>ADDRESS` | focused window changed (address only) | `WindowFocusChanged` `{id}` |
| `openwindow>>ADDR,WS,CLASS,TITLE` | window opened | `WindowOpenedOrChanged` `{window}` |
| `closewindow>>ADDR` | window closed | `WindowClosed` `{id}` |
| `movewindow>>ADDR,WS` / `movewindowv2>>ADDR,ID,WS` | window moved to workspace | `WindowOpenedOrChanged` with new `workspace_id` |
| `windowtitle>>ADDR` / `windowtitlev2>>ADDR,TITLE` | title changed | `WindowOpenedOrChanged` `{window}` |
| `changefloatingmode>>ADDR,0/1` | float/tile toggled | `WindowOpenedOrChanged` (`is_floating`) |
| `fullscreen>>0/1` | fullscreen toggled | **no direct event**; see below |
| `urgent>>ADDR` | window urgent | `WindowUrgencyChanged` `{id, urgent}`; workspace-level via `WorkspaceUrgencyChanged` |
| `activelayout>>KB,LAYOUT` | keyboard layout switched | `KeyboardLayoutSwitched` `{idx}` / `KeyboardLayoutsChanged` |
| `screencast>>0/1,0/1` | screencast started/stopped | `CastStartedOrChanged` / `CastStopped` / `CastsChanged` |
| `configreloaded>>` | config reloaded | `ConfigLoaded` `{failed}` |
| `monitoradded>>NAME` / `monitoraddedv2>>...` | monitor connected | **no event in 26.04**; query `niri msg --json outputs` |
| `monitorremoved>>NAME` | monitor disconnected | **no event in 26.04**; query `niri msg --json outputs` |
| `openlayer>>NS` / `closelayer>>NS` | layer surface shown/hidden | **no event**; query `niri msg --json layers` |
| `submap>>NAME` | submap entered/left | **no submaps in niri** |
| `togglegroup>>` / `moveintogroup>>` / `moveoutofgroup>>` | group changes | no groups; columns/tabs use `WindowLayoutsChanged`/`WindowOpenedOrChanged` |

Every niri event name, payload, and meaning is documented in the separate
`niri-ipc` skill under `references/event-stream.md`, derived from `enum Event` in
`/tmp/opencode/niri/niri-ipc/src/lib.rs`.

Two gaps deserve emphasis:

- **Outputs are not in the stream.** A bar that updates on `monitoradded` /
  `monitorremoved` must instead watch for output changes some other way (udev,
  `niri msg --json outputs` on a low cadence, or on demand). See
  `hyprctl-to-niri-msg.md`.
- **Fullscreen is not a field on niri windows.** The `Window` struct in 26.04 has
  no `is_fullscreen`. A fullscreen indicator that keyed off `fullscreen>>` has no
  event and no state to read; it must be dropped or approximated from geometry
  (`layout.tile_size` vs. output logical size) or from the app's own signals.

## Before / after: a line reader vs. a JSON reader

### Before (Hyprland) - socat + text parsing

```sh
#!/usr/bin/env bash
# Hyprland: read .socket2.sock lines, re-query hyprctl on each relevant event.
SOCK="${XDG_RUNTIME_DIR}/hypr/${HYPRLAND_INSTANCE_SIGNATURE}/.socket2.sock"
socat -u "UNIX-CONNECT:${SOCK}" - | while IFS= read -r line; do
    case "$line" in
        workspace*|focusedmon*|activewindow*|createwindow*|closewindow*|movewindow*|destroyworkspace*)
            # Re-query all state because the line is only a delta.
            hyprctl workspaces -j
            hyprctl activeworkspace -j
            ;;
    esac
done
```

Problems this shape carries: it depends on
`$HYPRLAND_INSTANCE_SIGNATURE`, pipes through `socat`, parses `>>`-delimited
strings that change between v1/v2, and re-queries the compositor on every event
(which is why the original script needed a 50 ms debounce to survive event
storms).

### After (niri) - `niri msg --json event-stream`

You do not need `socat`: `niri msg --json event-stream` connects to
`$NIRI_SOCKET` and prints one JSON event per line. The first events are the full
snapshot, so no re-query is needed.

```sh
#!/usr/bin/env bash
# niri: full snapshot first, then deltas. No hyprctl, no socat, no re-query.
niri msg --json event-stream | while IFS= read -r line; do
    key=$(printf '%s' "$line" | jq -r 'keys[0]')
    case "$key" in
        WorkspacesChanged)
            # Full replacement of workspace state.
            printf '%s' "$line" | jq -c '.WorkspacesChanged.workspaces'
            ;;
        WindowsChanged)
            printf '%s' "$line" | jq -c '.WindowsChanged.windows'
            ;;
        WorkspaceActivated|WorkspaceActiveWindowChanged|WindowOpenedOrChanged|WindowClosed|WindowFocusChanged)
            # One delta event; apply it to your model and render once.
            printf '%s\n' "$line"
            ;;
        ConfigLoaded)
            printf '%s' "$line" | jq -r 'select(.ConfigLoaded.failed) | "config failed"' >&2
            ;;
    esac
done
```

If you prefer the raw socket (to send other requests on a second connection), the
request token is the single JSON value `"EventStream"`:

```sh
printf '"EventStream"\n' | socat - UNIX-CONNECT:"$NIRI_SOCKET"
# -> {"Ok":"Handled"}
# -> {"WorkspacesChanged":{...}}
# -> {"WindowsChanged":{...}}
# -> {"ConfigLoaded":{"failed":false}}
# -> ... deltas ...
```

### Bash skeleton

The important part is building the model from the snapshot and then applying
deltas. A trimmed, runnable consumer:

```sh
#!/usr/bin/env bash
set -euo pipefail
sock="${NIRI_SOCKET:?not in a niri session}"

exec 3<>"$sock"
printf '"EventStream"\n' >&3
IFS= read -r reply <&3
[ "$reply" = '{"Ok":"Handled"}' ] || { echo "unexpected: $reply" >&2; exit 1; }

declare -A ws_active=() ws_focus=() win_ws=() win_focus=()
while IFS= read -r line <&3; do
    key=$(printf '%s' "$line" | jq -r 'keys[0]')
    case "$key" in
        WorkspacesChanged)
            ws_active=(); ws_focus=()
            while IFS=$'\t' read -r id act foc; do
                ws_active["$id"]=$act; ws_focus["$id"]=$foc
            done < <(printf '%s' "$line" | jq -r '.WorkspacesChanged.workspaces[] | "\(.id)\t\(.is_active)\t\(.is_focused)"')
            ;;
        WindowsChanged)
            win_ws=(); win_focus=()
            while IFS=$'\t' read -r id ws; do win_ws["$id"]=$ws; done \
                < <(printf '%s' "$line" | jq -r '.WindowsChanged.windows[] | "\(.id)\t\(.workspace_id)"')
            ;;
        WindowOpenedOrChanged)
            read -r id ws < <(printf '%s' "$line" | jq -r '.WindowOpenedOrChanged.window | "\(.id) \(.workspace_id)"')
            win_ws["$id"]=$ws
            ;;
        WindowClosed)
            id=$(printf '%s' "$line" | jq -r '.WindowClosed.id'); unset 'win_ws[$id]'
            ;;
        WindowFocusChanged)
            id=$(printf '%s' "$line" | jq -r '.WindowFocusChanged.id'); [[ $id != null ]] && echo "focused $id"
            ;;
        WorkspaceActivated)
            id=$(printf '%s' "$line" | jq -r '.WorkspaceActivated.id')
            act=$(printf '%s' "$line" | jq -r '.WorkspaceActivated.focused')
            ws_active["$id"]=true; ws_focus["$id"]=$act
            ;;
    esac
done
```

### Python skeleton

```python
#!/usr/bin/env python3
import json, os, socket

with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as s:
    s.connect(os.environ["NIRI_SOCKET"])
    s.sendall(b'"EventStream"\n')
    stream = s.makefile("r")
    assert json.loads(stream.readline()).get("Ok") == "Handled"

    workspaces: dict[int, dict] = {}
    windows: dict[int, dict] = {}
    for line in stream:                    # full snapshot first, then deltas
        ev = json.loads(line)
        if "WorkspacesChanged" in ev:
            workspaces = {w["id"]: w for w in ev["WorkspacesChanged"]["workspaces"]}
        elif "WindowsChanged" in ev:
            windows = {w["id"]: w for w in ev["WindowsChanged"]["windows"]}
        elif "WindowOpenedOrChanged" in ev:
            w = ev["WindowOpenedOrChanged"]["window"]; windows[w["id"]] = w
        elif "WindowClosed" in ev:
            windows.pop(ev["WindowClosed"]["id"], None)
        elif "WorkspaceActivated" in ev:
            a = ev["WorkspaceActivated"]
            for w in workspaces.values():
                w["is_active"] = (w["id"] == a["id"])
                if a["focused"]:
                    w["is_focused"] = (w["id"] == a["id"])
        elif "WindowFocusChanged" in ev:
            fid = ev["WindowFocusChanged"]["id"]
            for w in windows.values():
                w["is_focused"] = (w["id"] == fid)
        elif "WindowUrgencyChanged" in ev:
            u = ev["WindowUrgencyChanged"]
            if u["id"] in windows:
                windows[u["id"]]["is_urgent"] = u["urgent"]
        elif "WindowLayoutsChanged" in ev:
            for wid, layout in ev["WindowLayoutsChanged"]["changes"]:
                if wid in windows:
                    windows[wid]["layout"] = layout
        elif "ConfigLoaded" in ev and ev["ConfigLoaded"]["failed"]:
            print("config failed to load", flush=True)
        # ... render from `workspaces` / `windows` here ...
```

## Non-atomic caveat

niri event updates are atomic "where reasonable, **but not always**". The
documented example: a window can carry a `workspace_id` for a workspace that was
already removed, because the `WorkspacesChanged` that dropped it arrived before
the matching `WindowOpenedOrChanged`. Treat each event as a delta that may briefly
reference an id you have already dropped, and reconcile when the matching event
arrives. Do not assume referential integrity on every line.

## Reconnect handling

There is no in-band error event. If a line cannot be parsed or you hit EOF, the
stream ended: close, reconnect, and rebuild from the fresh
`WorkspacesChanged`/`WindowsChanged` snapshot. Because the snapshot is complete,
reconnect is cheap and always converges.

## Version gating

- Event stream: Since 0.1.9.
- `OverviewOpenedOrClosed`: Since 25.05.
- `KeyboardLayoutsChanged`/`KeyboardLayoutSwitched`, `CastsChanged`,
  `ScreenshotCaptured`: present in 26.04; verify against `enum Event` before
  relying on a variant on an older release.
- Output events and a `fullscreen` window field: absent in 26.04; do not wait for
  them.
