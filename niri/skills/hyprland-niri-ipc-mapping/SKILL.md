---
name: hyprland-niri-ipc-mapping
description: Use when porting Hyprland scripts and bars to niri: mapping hyprctl and hl.* eval to niri msg and niri msg action, replacing the socket2 event stream with niri msg --json event-stream, and rewriting HYPRLAND_INSTANCE_SIGNATURE/.socket2.sock consumers. Covers hyprctl monitors/workspaces/clients/activewindow/dispatch/switchxkblayout/cursorpos/keyword/eval/reload, NIRI_SOCKET, and script migration.
---

# Skill: hyprland-niri-ipc-mapping

This skill maps the two Hyprland IPC surfaces (the single-shot `hyprctl` command
and the `.socket2.sock` event stream) onto the niri surfaces. It is written for
the equisdots scripts, which live under `hyprland/scripts/` and are driven from
Quickshell.

Baseline: **niri 26.04** (2026-04-25). niri uses date versioning, not semver.

## The two mental models

| | Hyprland | niri |
| --- | --- | --- |
| One-shot query/command | `hyprctl <query>` / `hyprctl dispatch ...` / `hyprctl eval 'hl...'` | `niri msg <query>` / `niri msg action <name>` / `niri msg output ...` |
| Socket path | `$XDG_RUNTIME_DIR/hypr/$HYPRLAND_INSTANCE_SIGNATURE/.socket.sock`, `.socket2.sock` | `$NIRI_SOCKET` (one socket, both directions) |
| Event stream | text lines on `.socket2.sock` (`workspace>>1`, `activewindow>>app,title`, ...) | JSON lines from `niri msg --json event-stream` (`{"WorkspaceActivated":{...}}`) |
| Live config patch | `hyprctl keyword ...`, `hyprctl eval 'hl.config(...)'` | none general; edit KDL and reload. `niri msg output` is the one runtime exception |
| Config reload | `hyprctl reload` | save the file (watcher reloads) or `niri msg action load-config-file` |
| Stable output for scripts | JSON (`-j`); human output is not for parsing | JSON (`--json`); the human output is explicitly **not** stable |

The single biggest design change: Hyprland pushes state and lets you patch config
arbitrarily at runtime; niri pushes full state on connect and treats config as a
compiled KDL document that is reloaded as a whole.

## Rules that prevent most porting bugs

1. **Always use `--json` in scripts.** The formatted `niri msg` output (no
   `--json`) is not stable and may change in any release. `--json` keeps existing
   fields and variant names, but new fields/variants are added, so tolerate
   unknown keys.
2. **Prefer the event stream over polling.** Connect once, receive the full
   `WorkspacesChanged` / `WindowsChanged` / `ConfigLoaded` snapshot, then apply
   deltas. Do not run a `while sleep; do niri msg workspaces; done` loop.
3. **Ids are opaque and not stable across the entity's life.** Hyprland workspace
   `id` doubles as the user-facing index. niri separates the opaque `id` (stable
   while it exists) from `idx` (position on the monitor, which changes as
   workspaces move). Use `id` as a map key, `idx`/`name` for display and for
   `focus-workspace`.
4. **Outputs have no event-stream events in 26.04.** Query `niri msg --json
   outputs` / `focused-output` when you need them; do not wait for an output event.
5. **There is no `cursorpos` request.** See the limitations section of the
   command reference; pointer overlays must be redesigned.
6. **Only output state has a runtime setter** (`niri msg output`). Anything else
   "live" in Hyprland becomes "write KDL + reload".

## References

- `references/hyprctl-to-niri-msg.md` - command-by-command mapping table, the
  JSON shape differences, per-command `jq` recipes, and the documented gaps
  (`cursorpos`, `keyword`/`eval`, per-device layout switching).
- `references/socket2-to-event-stream.md` - every `.socket2.sock` line event
  mapped to its niri event-stream variant, plus a before/after consumer in bash
  and Python and the full-state-up-front rule.
- `references/scripts-and-watchers.md` - concrete rewrites of the equisdots
  scripts (`workspaces.sh`, `ws-desktops-lib.sh`, `scale-menu.sh`,
  `monitor-manager.sh`, `restore-monitors.sh`, `persist-display-config.sh`,
  `exit.sh`, `reload.sh`, `idle-mode.sh`), with the "trivial / redesign / loses a
  feature" call for each.
