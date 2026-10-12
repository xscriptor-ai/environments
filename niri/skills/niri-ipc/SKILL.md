---
name: niri-ipc
description: Use when scripting or integrating with the running niri Wayland compositor: niri msg, niri msg --json, the event-stream, NIRI_SOCKET, the JSON socket protocol, raw-request, action, pick-window, focused-window, focused-output, outputs, workspaces, keyboard-layouts, and building a bar or indicator that updates without polling.
---

# Skill: niri-ipc

Orientation for talking to a running niri instance: the `niri msg` command
surface, the `--json` output that scripts should consume, the UNIX socket behind
it (`$NIRI_SOCKET`), and the continuous event stream that bars and indicators
should use instead of polling.

Baseline: **niri 26.04** (2026-04-25). niri uses date versioning (`25.01`,
`25.05`, `26.04`), not semantic versioning.

## The IPC surface

`niri msg` is a thin client over a UNIX domain socket at `$NIRI_SOCKET`.
Read-only queries return one response; `event-stream` keeps streaming until the
connection closes; `action` performs the same actions that binds invoke.

niri sets `XDG_CURRENT_DESKTOP=niri` and `NIRI_SOCKET` in the environment of the
processes it spawns; use either signal to detect that you are running under niri.

| Subcommand | What it returns |
| --- | --- |
| `outputs` | Connected outputs and their modes/state |
| `workspaces` | Workspaces with index, name, output, active/focused/urgent flags |
| `windows` | Open windows with id, app-id, title, workspace, layout |
| `layers` | Open layer-shell surfaces (namespace, output, layer, keyboard mode) |
| `focused-window` | The focused window, or `null` |
| `focused-output` | The focused output, or `null` |
| `keyboard-layouts` | Configured XKB layout names and the current index |
| `pick-window` | Interactive pick; prints the clicked window |
| `pick-color` | Interactive pick; prints an RGB color |
| `version` | Compositor and CLI version |
| `event-stream` | Continuous events (see below) |
| `overview-state` | Whether the Overview is open |
| `casts` | Active screencasts |
| `action` | Perform a bindable action |
| `output` | Temporarily change an output's configuration |
| `raw-request` | Send a raw JSON request read from stdin |
| `request-error` | Ask niri to return an error (testing) |

Full command and protocol detail, plus `socat`/`jq` examples, is in
`references/niri-msg.md`.

## Use the JSON output, not the formatted output

- `--json` / `-j` prints the response as JSON. Scripts must use it.
- The human-readable (non-JSON) output is **not** stable and may change in any
  release. Only the JSON output has a compatibility promise: existing fields and
  enum variants are not renamed, and non-optional fields are not removed, but new
  fields and variants *will* appear. Handle unknown fields gracefully.
- `niri msg` and the compositor are versioned together. After upgrading niri,
  restart the compositor before running a newer `niri msg`; a mismatch produces
  parse errors and a warning.

## Prefer the event stream over polling

The event stream (`niri msg event-stream`, JSON via `niri msg --json
event-stream`) exists specifically so that bars and indicators update the instant
something happens. Do not poll `workspaces`/`windows` in a loop: polling races
against the compositor, wakes up constantly, and can observe inconsistent
snapshots. The stream instead delivers the complete current state once when you
connect, then only the updates. Your state cannot desync if you apply the
updates correctly, and you do not need any other query request.

The model, every event variant, the non-atomic update caveat, and how to build a
bar state model from it live in `references/event-stream.md`. Ready-to-run
workspace switchers, focused-window indicators, output switchers, screenshot and
dynamic-cast recipes, and a Python/bash consumer skeleton live in
`references/scripting-examples.md`.

## When to access the socket directly

`niri msg --json` is a thin wrapper over writing a one-line JSON request to
`$NIRI_SOCKET` and reading a one-line JSON reply. For complex scripts, connect to
the socket yourself: write the request (single line, followed by a newline or a
flush plus write shutdown) and read one JSON reply. The reply is `{"Ok": ...}`
or `{"Err": ...}` wrapping the same body `niri msg --json` prints. Use
`niri msg --print-request ...` (Since: next release) to see the exact request
JSON, and `niri msg raw-request` to send raw JSON without `socat`.

## References

- `references/niri-msg.md` - every subcommand, the `--json` and
  `--print-request` flags, and the socket protocol with `socat` and `jq`.
- `references/event-stream.md` - the full-state-then-updates model, all event
  variants, the non-atomic caveat, and a bar state model.
- `references/scripting-examples.md` - practical, runnable recipes built only
  from real commands, plus a minimal event-stream consumer skeleton.
