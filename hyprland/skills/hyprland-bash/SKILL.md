---
name: hyprland-bash
description: Bash scripting for the Hyprland/Quickshell stack (equisdots conventions). Covers script anatomy and strict-mode policy, caching env (QS_CACHE_DIR/STATE/RUN), hyprctl automation and persistence, socket2 event daemons with debounce/dedupe, inotify watchers, Quickshell IPC, systemd user units, rofi menus and notifications. Use when writing, reviewing or debugging any .sh under scripts/ deployed to ~/.config/hypr/scripts/.
---

# Bash for the Hyprland/Quickshell stack (verified 2026-10-15)

Sources: equisdots `hyprland@branch/experimental` (`scripts/`, `docs/scripts.md`, `ws-desktops-lib.sh`, `volume_listener.sh`, `reload.sh`, `scale-menu.sh`), Quickshell CLI, Hyprland wiki (Using hyprctl, IPC). Generic shell depth lives in the global `systems` skill — this skill is the stack's conventions. Deep templates: `references/daemons-and-watchers.md`; ready snippets: `references/recipes.md`.

## Where scripts live and how they are shaped

- Repo `scripts/*.sh` → deployed to `~/.config/hypr/scripts/` by the installer. Shared libs are sourced (`ws-desktops-lib.sh` style) with a header comment and `KEEP IN SYNC` notes where another language mirrors the constants (their monitor roster also lives in `workspaces.lua`).
- Runtime dirs come from `caching.sh`: it exports `QS_CACHE_DIR`, `QS_STATE_DIR`, `QS_RUN_DIR` and `qs_ensure_cache <module>`. New scripts use these, never invent paths.
- User-visible actions route through the shell IPC (`qs_manager.sh` is the central router for widget commands); scripts do not `pkill` the shell or ad-hoc kill windows in normal flows.

## Anatomy: shebang, strict mode, probes

```bash
#!/usr/bin/env bash
# One-shot: fail fast. Daemons: NOT -e (must survive single failures) — handle errors explicitly.
set -euo pipefail

# Probe with fallbacks instead of assuming binaries exist
QS=""; command -v quickshell >/dev/null 2>&1 && QS=quickshell || command -v qs >/dev/null 2>&1 && QS=qs
ENGINE="${XDG_DATA_HOME:-$HOME/.local/share}/equisdots/theme-sync/theme-sync.sh"
[ -x "$ENGINE" ] || ENGINE="$HOME/.local/bin/theme-sync"

# Best-effort side effects never abort the script
bash "$ENGINE" 2>/dev/null || true
```

- `hyprctl` talks to a synchronous socket with a 5 s cap: wrap hook-critical calls in `timeout 5`, batch control calls (`--batch "a ; b"`, escaping inner `;`), and never loop `hyprctl` per event without debouncing.
- All automation is Lua-first for state changes: `hyprctl eval 'hl.monitor({...})'` / `hl.config({...})`; then persist the user's intent to `~/.config/hypr/settings.json` (the `scale-menu.sh` / `monitor-manager.sh` pattern: apply live + record).
- Notifications: `hyprctl notify -1 3000 "rgb(...)" "msg"` (compositor-native) or `notify-send` / `swayosd-client` (desktop), always with an explicit timeout.

## The four script shapes

| Shape | Example | Key rules |
|---|---|---|
| One-shot action | `lock.sh`, `reload.sh`, `volume.sh` | strict mode, <50 ms when hook-triggered, explain failures via notification only if user-visible |
| Rofi/menu picker | `scale-menu.sh`, `monitor-manager.sh`, `gpu-mode.sh` | validate selection, apply via `hyprctl eval 'hl.*'`, persist to settings.json, notify result |
| Event daemon | `workspaces.sh`, `volume_listener.sh` | debounce (50 ms bursts), dedupe, `flock`/pidfile, zombie cleanup, systemd supervision |
| Watcher | `update_notifier.sh`, QML-driven `inotifywait` loops | one wait per invocation, exit after event, restart by the launcher, content-compare before re-applying |

Full skeletons (socket2 daemon, `pactl` listener, inotify watcher, systemd unit): `references/daemons-and-watchers.md`.

## Data handling

- `jq` is the JSON tool: `hyprctl monitors -j | jq -r '.[] | [.name, .description] | @tsv'` + `while IFS=$'\t' read -r name desc`. **Pitfall:** jq's `//` also substitutes on `false` — use `if has("k") then .k else default end` (documented in their libs).
- Settings edits are atomic: `jq ... > tmp && mv tmp settings.json`. Palettes/settings must keep unknown keys and validate `#rrggbb` values when writing colors.
- Quoting at the Lua boundary: `hl.dsp.exec_cmd` runs through `sh -c` — single-quote arguments; use `hl.dsp.exec_raw` when no shell features are needed. Inside bash use arrays and `--` terminators, never string-concatenated commands.

## Quality gates

1. `shellcheck` clean; `bash -n` in CI; `bash -c 'set -euo pipefail'` semantics tested for one-shots.
2. No blocking work in anything reachable from a bind or QML handler; else make it a daemon.
3. Daemons: debounce + dedupe + lock + log to stderr + meaningful exit codes; supervised by systemd (`Restart=always`, `PartOf=graphical-session.target`).
4. Watchers: atomic-write aware (watch the directory or use FileView), 250 ms debounce for edits that trigger expensive work (`theme-sync`, border pushes, QML reload).
5. CI: config changes gated by `Hyprland --verify-config`; headless runs per skill `arch-wsl-headless`.

Cross-refs: generated-by-the-shell scripts and Process integration → skill `quickshell`; Python tooling (theme-sync, generators) → skill `hyprland-python`; language decision table and cross-language escaping → skill `hyprland` → `references/scripts-and-tooling.md`.
