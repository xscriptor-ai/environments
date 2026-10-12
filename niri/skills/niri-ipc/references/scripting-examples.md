# Scripting examples

Practical recipes using only real `niri msg` / `$NIRI_SOCKET` commands. All
examples assume `jq` is installed and that `$NIRI_SOCKET` is exported (it is set
inside a niri session). Baseline: **niri 26.04** (2026-04-25).

## Workspace switcher for a bar

List workspaces with their index, name, and output, then focus the chosen one.
`focus-workspace <index>` acts on the **focused output**, so focus the output
first when the target lives elsewhere.

```sh
#!/usr/bin/env bash
set -euo pipefail

list=$(niri msg --json workspaces \
  | jq -r 'sort_by(.output, .idx)[] | "\(.idx)\t\(.name // "ws-\(.idx)")\t\(.output // "no-output")"')

choice=$(printf '%s\n' "$list" | fuzzel --dmenu --prompt 'Workspace> ') || exit 0
[ -z "$choice" ] && exit 0

idx=$(printf '%s' "$choice" | cut -f1)
out=$(printf '%s' "$choice" | cut -f3)

niri msg action focus-monitor "$out"
niri msg action focus-workspace "$idx"
```

A simple text-only indicator for a shell prompt or bar script:

```sh
niri msg --json workspaces \
  | jq -r 'sort_by(.idx)[] | "\(if .is_focused then "*" else " " end)\(.idx)\(if .is_urgent then "!" else "" end)"'
```

## Focused-window / class indicator

```sh
niri msg --json focused-window \
  | jq -r 'if . == null then "desktop" else (.app_id // .title // "unknown") end'
```

Title plus class:

```sh
niri msg --json focused-window \
  | jq -r 'if . == null then "" else "\(.app_id // "?") - \(.title // "?")" end'
```

## Output switcher

```sh
#!/usr/bin/env bash
set -euo pipefail

choice=$(niri msg --json outputs | jq -r 'keys[]' | fuzzel --dmenu --prompt 'Output> ') || exit 0
[ -n "$choice" ] && niri msg action focus-monitor "$choice"
```

## Screenshot via action

```sh
niri msg action screenshot            # interactive screenshot UI
niri msg action screenshot-screen     # focused output
niri msg action screenshot-window     # focused window

# Without writing to disk and without the pointer:
niri msg action screenshot-screen --write-to-disk=false --show-pointer=false

# To an explicit absolute path:
niri msg action screenshot-screen --path /tmp/shot.png
```

The output location for the disk write follows the `screenshot-path` config
option. `niri msg --json event-stream` emits `ScreenshotCaptured` with the saved
path.

## Dynamic cast with pick-window

Since: 25.05. The "niri Dynamic Cast Target" stream starts empty; select a
target before it produces video.

```sh
#!/usr/bin/env bash
set -euo pipefail

id=$(niri msg --json pick-window | jq -r '.id')
[ "$id" != "null" ] && niri msg action set-dynamic-cast-window --id "$id"

# Or target the focused monitor / clear:
niri msg action set-dynamic-cast-monitor
niri msg action clear-dynamic-cast-target
```

If the cast target disappears (for example the window closes), the stream returns
to empty on its own.

## Reading the keyboard layout

```sh
niri msg --json keyboard-layouts | jq -r '.names[.current_idx]'
```

To switch layouts from a script (index is zero-based on the wire; the CLI
accepts a layout argument):

```sh
niri msg action switch-layout next
```

## Reacting to window open / close

```sh
niri msg --json event-stream | while IFS= read -r line; do
  key=$(printf '%s' "$line" | jq -r 'keys[0]')
  case "$key" in
    WindowOpenedOrChanged)
      printf '%s' "$line" | jq -r '.WindowOpenedOrChanged.window | "opened \(.id) \(.app_id // "?")"'
      ;;
    WindowClosed)
      printf '%s' "$line" | jq -r '"\("closed \(.WindowClosed.id)")"'
      ;;
  esac
done
```

Filter a single event type directly with `jq`:

```sh
niri msg --json event-stream \
  | jq --unbuffered -c 'select(has("WindowFocusChanged"))'
```

## Minimal event-stream consumer skeleton

### Bash

```sh
#!/usr/bin/env bash
set -euo pipefail

sock="${NIRI_SOCKET:?NIRI_SOCKET is not set; are you inside a niri session?}"

exec 3<>"$sock"
printf '"EventStream"\n' >&3
IFS= read -r reply <&3
[ "$reply" = '{"Ok":"Handled"}' ] || { echo "unexpected reply: $reply" >&2; exit 1; }

declare -A win_by_id=()

while IFS= read -r line <&3; do
  key=$(printf '%s' "$line" | jq -r 'keys[0]')
  case "$key" in
    WindowsChanged)
      unset win_by_id
      declare -A win_by_id
      while IFS=$'\t' read -r id app title; do
        win_by_id["$id"]="$app - $title"
      done < <(printf '%s' "$line" | jq -r '.WindowsChanged.windows[] | "\(.id)\t\(.app_id // "")\t\(.title // "")"')
      ;;
    WindowOpenedOrChanged)
      read -r id app title < <(printf '%s' "$line" | jq -r '.WindowOpenedOrChanged.window | "\(.id) \(.app_id // "") \(.title // "")"')
      win_by_id["$id"]="$app - $title"
      ;;
    WindowClosed)
      id=$(printf '%s' "$line" | jq -r '.WindowClosed.id')
      unset "win_by_id[$id]"
      ;;
    WindowFocusChanged)
      focused=$(printf '%s' "$line" | jq -r '.WindowFocusChanged.id')
      if [ "$focused" != "null" ] && [ -n "${win_by_id[$focused]:-}" ]; then
        echo "${win_by_id[$focused]}"
      else
        echo "desktop"
      fi
      ;;
    ConfigLoaded)
      if [ "$(printf '%s' "$line" | jq -r '.ConfigLoaded.failed')" = "true" ]; then
        echo "config failed to load" >&2
      fi
      ;;
  esac
done
```

### Python

```python
#!/usr/bin/env python3
import json
import os
import socket

sock_path = os.environ["NIRI_SOCKET"]

with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as s:
    s.connect(sock_path)
    s.sendall(b'"EventStream"\n')

    stream = s.makefile("r")
    reply = json.loads(stream.readline())
    assert reply.get("Ok") == "Handled", reply

    workspaces = {}   # id -> workspace dict
    windows = {}      # id -> window dict

    for line in stream:
        event = json.loads(line)

        if "WorkspacesChanged" in event:
            workspaces = {w["id"]: w for w in event["WorkspacesChanged"]["workspaces"]}
        elif "WindowsChanged" in event:
            windows = {w["id"]: w for w in event["WindowsChanged"]["windows"]}
        elif "WindowOpenedOrChanged" in event:
            w = event["WindowOpenedOrChanged"]["window"]
            windows[w["id"]] = w
        elif "WindowClosed" in event:
            windows.pop(event["WindowClosed"]["id"], None)
        elif "WorkspaceActivated" in event:
            ws = event["WorkspaceActivated"]
            for w in workspaces.values():
                w["is_active"] = w["id"] == ws["id"]
                if ws["focused"]:
                    w["is_focused"] = w["id"] == ws["id"]
        elif "WindowFocusChanged" in event:
            focused = event["WindowFocusChanged"]["id"]
            for w in windows.values():
                w["is_focused"] = w["id"] == focused
        elif "WindowUrgencyChanged" in event:
            u = event["WindowUrgencyChanged"]
            if u["id"] in windows:
                windows[u["id"]]["is_urgent"] = u["urgent"]
        elif "WindowLayoutsChanged" in event:
            for wid, layout in event["WindowLayoutsChanged"]["changes"]:
                if wid in windows:
                    windows[wid]["layout"] = layout

        active = next((w for w in windows.values() if w["is_focused"]), None)
        print(active["app_id"] if active else "desktop", flush=True)
```

Both skeletons rebuild the full state from `WorkspacesChanged` / `WindowsChanged`
on connect and then apply deltas. On an unreadable line or EOF, treat the stream
as ended and reconnect, which delivers a fresh full snapshot. See
`event-stream.md` for the complete event list and the non-atomic caveat.
