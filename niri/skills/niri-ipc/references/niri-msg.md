# The `niri msg` command surface

`niri msg` communicates with the running niri instance over the IPC socket. It
is a thin client: each request produces one reply (except `event-stream`), and
`action` reuses the same action vocabulary as key binds.

Baseline: **niri 26.04** (2026-04-25).

## Flags

| Flag | Meaning |
| --- | --- |
| `--json` / `-j` | Print the response as JSON instead of formatted text. Use this in scripts. |
| `--print-request` | Print the JSON request that would be sent, without sending it. Since: next release. |

`niri msg --help` lists the subcommands. `niri msg action` lists every action
with a short description.

## Subcommands

### Query commands

| Command | Reply body (`niri msg --json <cmd>`) |
| --- | --- |
| `niri msg outputs` | Object keyed by output name, each value the output struct |
| `niri msg workspaces` | Array of workspace objects |
| `niri msg windows` | Array of window objects |
| `niri msg layers` | Array of layer-surface objects |
| `niri msg focused-window` | One window object, or `null` |
| `niri msg focused-output` | One output object, or `null` |
| `niri msg keyboard-layouts` | `{"names": [...], "current_idx": N}` |
| `niri msg overview-state` | `{"is_open": true|false}` |
| `niri msg casts` | Array of active screencasts |
| `niri msg version` | `{"compositor": "...", "cli": "..."}` |

`niri msg --json outputs` prints the response body directly (a JSON object),
not wrapped in `Ok`/`Err`:

```sh
$ niri msg --json outputs | jq -r 'keys[]'
eDP-1
HDMI-A-1
```

### Interactive pick commands

- `niri msg pick-window` - click a window and print its information.
- `niri msg pick-color` - click a pixel and print `{"rgb": [r, g, b]}` with each
  channel in `0.0..=1.0`.

```sh
$ niri msg --json pick-window | jq -r '.app_id'
Alacritty
$ niri msg --json pick-color | jq -c .rgb
[0.10196078431372549,0.10196078431372549,0.10196078431372549]
```

### Actions

`niri msg action <name> [args]` performs an action. Binds and IPC share the
action vocabulary, so any bindable action can be triggered from a script.

```sh
niri msg action focus-workspace 2
niri msg action focus-workspace "web"
niri msg action focus-window --id 12
niri msg action close-window --id 12
niri msg action set-dynamic-cast-window --id 12
niri msg action toggle-windowed-fullscreen
niri msg action screenshot
niri msg action load-config-file --path /path/to/config.kdl
```

### Event stream

`niri msg event-stream` continuously prints events (PascalCase variant names,
debug formatting). `niri msg --json event-stream` prints one JSON event per line.
See `event-stream.md`.

### Raw request

`niri msg raw-request` reads a raw JSON request from stdin and sends it:

```sh
$ echo '{"Action":{"FocusWorkspace":{"reference":{"Id":8}}}}' | niri msg raw-request
"Handled"
```

### Temporary output configuration

`niri msg output <name> <action>` changes an output's configuration for the
current session only; it is not written to the config file, and is forgotten if
the config later changes that output. Run `niri msg outputs` to get output names.

## JSON output stability

- `--json` output has a compatibility promise: existing fields and enum variants
  are not renamed, and non-optional fields are not removed. New fields and enum
  variants **will** be added, so tolerate unknown keys.
- The formatted, human-readable output (no `--json`) is **not** stable. niri
  reserves the right to change it in any release. Never parse it.
- Upgrading `niri msg` without restarting the compositor can produce parse errors
  because the CLI and compositor are versioned together.

## The socket protocol

`niri msg --json` wraps the following protocol, which you can speak directly for
complex scripts.

niri sets `XDG_CURRENT_DESKTOP=niri` and `NIRI_SOCKET` in the environment of the
processes it spawns, so a client can detect that it is running under niri from
either one.

- Socket path: the UNIX domain socket named by `$NIRI_SOCKET`.
- Request: one JSON value on a single line, followed by a newline character, or
  by flushing and shutting down the write end of the connection.
- Reply: one JSON value on a single line.
- A reply is `{"Ok": <body>}` or `{"Err": "<message>"}`, where `<body>` is the
  same JSON object `niri msg --json` prints.
- Requests are processed one at a time and time passes between them, so sending
  `Workspaces` and `Windows` together may return inconsistent snapshots. This
  applies to actions too.
- After you send an `EventStream` request, niri stops reading further requests on
  that socket and streams events. Use a second socket if you need to send
  requests while streaming.

`--print-request` (Since: next release) shows the exact wire request:

```sh
$ niri msg --print-request action focus-workspace 2
{"Action":{"FocusWorkspace":{"reference":{"Index":2}}}}
```

### Testing with socat

```sh
$ socat STDIO "$NIRI_SOCKET"
"FocusedWindow"
{"Ok":{"FocusedWindow":{"id":12,"title":"~","app_id":"Alacritty","workspace_id":6,"is_focused":true}}}
```

The first line is what you type; the second is niri's reply. Request enum
variants are spelled in PascalCase (`FocusedWindow`, `Outputs`, `EventStream`,
`Action`, ...).

### Requesting an event stream over the socket

```sh
$ socat STDIO "$NIRI_SOCKET"
"EventStream"
{"Ok":"Handled"}
{"WorkspacesChanged":{"workspaces":[...]}}
{"WindowsChanged":{"windows":[...]}}
{"ConfigLoaded":{"failed":false}}
...
```

### `jq` recipes

```sh
# Names of all connected outputs.
niri msg --json outputs | jq -r 'keys[]'

# Focused workspace index on the focused output.
niri msg --json workspaces | jq -r '(.[] | select(.is_focused)) | .idx'

# App id of the focused window, or "none".
niri msg --json focused-window | jq -r '.app_id // "none"'

# Ids and titles of every open window.
niri msg --json windows | jq -r '.[] | "\(.id)\t\(.title)"'

# Current keyboard layout name.
niri msg --json keyboard-layouts | jq -r '.names[.current_idx]'

# Active screencast stream ids.
niri msg --json casts | jq -r '.[] | .stream_id'
```

## Request and response types

The full Rust type surface is documented at
`https://niri-wm.github.io/niri/niri_ipc/`. In JSON:

| Request | Reply variant |
| --- | --- |
| `"Version"` | `{"Ok":{"Version":"26.4.0"}}` |
| `"Outputs"` | `{"Ok":{"Outputs":{ "<name>": {...} }}}` |
| `"Workspaces"` | `{"Ok":{"Workspaces":[...]}}` |
| `"Windows"` | `{"Ok":{"Windows":[...]}}` |
| `"FocusedWindow"` | `{"Ok":{"FocusedWindow": {...}|null}}` |
| `"EventStream"` | `{"Ok":"Handled"}` then events |
| `{"Action":{...}}` | `{"Ok":"Handled"}` |
| `{"Output":{"output":"eDP-1","action":...}}` | `{"Ok":{"OutputConfigChanged":"Applied"}}` |
