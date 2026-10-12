# The niri event stream

Since: 0.1.9.

The event stream lets a bar, indicator, or daemon react to compositor changes as
they happen instead of polling. Request it with `niri msg --json event-stream`
(one JSON event per line) or by sending the `"EventStream"` request to the
`$NIRI_SOCKET` socket. niri replies `{"Ok":"Handled"}` and then continuously
writes events until the connection is closed.

Baseline: **niri 26.04** (2026-04-25).

## The model: full state up front, then updates

The stream is designed so a client never needs any other request:

1. On connect, niri sends the **complete current state**: a `WorkspacesChanged`
   with every workspace, a `WindowsChanged` with every window, and a
   `ConfigLoaded` describing the last config load attempt.
2. After that, niri sends **only updates** to that state, as individual events.

The first workspace-related event you receive is always a full
`WorkspacesChanged`; you do not need to send `Workspaces`. Apply events to your
in-memory model as they arrive. If you build the model correctly, it cannot
desync from niri, and you never need to poll.

The stream carries workspace, window, keyboard-layout, overview, config, cast,
and screenshot state. It does **not** carry output add/remove/change events, nor
a dedicated IPC-error event; see "Not part of the 26.04 stream" below.

## How to read it

```sh
# Human-readable debug view.
niri msg event-stream

# One JSON object per line. Pipe through jq.
niri msg --json event-stream | jq -c '{key: (keys[0]), value: .[keys[0]]}'
```

Over the raw socket, the request is the single JSON token `"EventStream"`:

```sh
printf '"EventStream"\n' | socat - UNIX-CONNECT:"$NIRI_SOCKET"
```

After the `{"Ok":"Handled"}` reply, each subsequent line is one JSON event.
shutdown the write end (or just keep the socket open) and read lines. To send
other requests while streaming, open a **second** socket: after `EventStream`,
niri stops reading requests on that connection.

## Event variants

The JSON key is the Rust enum variant spelling (PascalCase). The table also
gives a kebab-case alias for readability; the alias is not the wire key.

| JSON key (wire) | Alias | Payload | Meaning |
| --- | --- | --- | --- |
| `WorkspacesChanged` | workspaces-changed | `{"workspaces":[Workspace,...]}` | Full workspace state; replaces the previous list |
| `WorkspaceUrgencyChanged` | workspace-urgent | `{"id":u64,"urgent":bool}` | A workspace gained/lost an urgent window |
| `WorkspaceActivated` | workspace-activated | `{"id":u64,"focused":bool}` | Workspace became active on its output; `focused` means it is now the single focused workspace |
| `WorkspaceActiveWindowChanged` | workspace-active-window-changed | `{"workspace_id":u64,"active_window_id":u64\|null}` | The active window on a workspace changed |
| `WindowsChanged` | windows-changed | `{"windows":[Window,...]}` | Full window state; replaces the previous list |
| `WindowOpenedOrChanged` | window-opened-or-changed | `{"window":Window}` | A toplevel opened or changed; upsert by `window.id` |
| `WindowClosed` | window-closed | `{"id":u64}` | Toplevel closed; remove it |
| `WindowFocusChanged` | window-focus-changed | `{"id":u64\|null}` | Newly focused window, or `null` if none |
| `WindowFocusTimestampChanged` | window-focus-timestamp-changed | `{"id":u64,"focus_timestamp":Timestamp\|null}` | Debounced MRU timestamp update (for Alt-Tab switchers) |
| `WindowUrgencyChanged` | window-urgency-changed | `{"id":u64,"urgent":bool}` | A window requests/releases attention |
| `WindowLayoutsChanged` | window-layouts-changed | `{"changes":[[u64,WindowLayout],...]}` | Layout (position/size) updates for windows, as id/layout pairs |
| `KeyboardLayoutsChanged` | keyboard-layouts-changed | `{"keyboard_layouts":{"names":[...],"current_idx":u8}}` | Configured layouts changed |
| `KeyboardLayoutSwitched` | keyboard-layout-switched | `{"idx":u8}` | Active layout index changed |
| `OverviewOpenedOrClosed` | overview-opened/closed | `{"is_open":bool}` | Overview toggled. Since: 25.05 |
| `ConfigLoaded` | config-loaded | `{"failed":bool}` | Config reload result (also sent on connect) |
| `ScreenshotCaptured` | screenshot-captured | `{"path":String\|null}` | A screenshot was saved (`null` if clipboard-only) |
| `CastsChanged` | casts-changed | `{"casts":[Cast,...]}` | Full screencast list; replaces the previous list |
| `CastStartedOrChanged` | cast-started-or-changed | `{"cast":Cast}` | A screencast started or changed |
| `CastStopped` | cast-stopped | `{"stream_id":u64}` | A screencast stopped |

`Workspace` carries `id`, `idx`, `name`, `output`, `is_urgent`, `is_active`,
`is_focused`, and `active_window_id`. `Window` carries `id`, `title`, `app_id`,
`pid`, `workspace_id`, `is_focused`, `is_floating`, `is_urgent`, `layout`, and
`focus_timestamp`.

## Not part of the 26.04 stream

The following are sometimes requested but are **not** emitted by niri 26.04. Do
not wait for them:

- **Output added / removed / changed.** The stream does not include output
  events. Query outputs with `niri msg --json outputs` or
  `niri msg --json focused-output` when you need them, or refresh on a low
  cadence rather than per-frame.
- **`ipc-error`.** There is no in-band error event. Handle malformed lines and
  socket disconnects at the transport level (an unreadable line or EOF means the
  stream ended; reconnect and rebuild state from the fresh full snapshot).

If you target a niri release that does emit these, version-gate accordingly.

## Updates are not always atomic

Where reasonable, event state updates are atomic, **but not always**. The
documented example: a window may reference a `workspace_id` for a workspace that
was already removed, because the `WorkspacesChanged` arrived before the
corresponding `WindowOpenedOrChanged`. Treat individual events as deltas that
may briefly reference ids you have already dropped; reconcile when the matching
event arrives rather than assuming referential integrity on every line.

## Building a bar state model

Keep two maps keyed by id and apply events in arrival order. Suggested handling:

| Event | Action on your state |
| --- | --- |
| `WorkspacesChanged` | Replace the whole workspace map (missing ids were deleted) |
| `WindowsChanged` | Replace the whole window map (missing ids were closed) |
| `WorkspaceActivated` | Set `is_active=true` for `id`; if `focused`, clear `is_focused` on all and set it on `id` |
| `WorkspaceUrgencyChanged` | Set `is_urgent` on the workspace |
| `WorkspaceActiveWindowChanged` | Set `active_window_id` on the workspace |
| `WindowOpenedOrChanged` | Upsert `window`; if `window.is_focused`, clear `is_focused` on all others |
| `WindowClosed` | Remove the window from the map |
| `WindowFocusChanged` | Clear `is_focused` on all; set it on `id` if non-null |
| `WindowUrgencyChanged` | Set `is_urgent` on the window |
| `WindowLayoutsChanged` | Replace `layout` for each `(id, layout)` pair |
| `KeyboardLayoutsChanged` / `KeyboardLayoutSwitched` | Update layout name list / current index |
| `OverviewOpenedOrClosed` | Update overview flag |
| `ConfigLoaded` | Surface a config-error indicator when `failed` is true |
| `CastsChanged` / `CastStartedOrChanged` / `CastStopped` | Maintain the cast list |

Practical notes:

- Window ids and workspace ids are opaque and stable only while the entity
  exists. Do not assume they increase, start at 1, or never wrap.
- A workspace `idx` is its position on its monitor and **changes** as workspaces
  are reordered or moved. Use `id` as the key; use `idx`/`name` for display and
  for `niri msg action focus-workspace`.
- Workspaces on different monitors can share the same `idx`.
- The workspace list only contains workspaces that currently exist; niri
  workspaces are dynamic.
- Rebuild from the full `WorkspacesChanged`/`WindowsChanged` on reconnect.

A minimal consumer in bash and Python is in `scripting-examples.md`.
