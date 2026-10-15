# Bash recipes for Hyprland management

Working snippets for the stack's day-to-day scripts. Verified 2026-10-15 (`hyprctl` surface per wiki snapshot, conventions per equisdots `scripts/`).

## jq cookbook (hyprctl -j)

```bash
# Monitors: name + description as TSV for shell loops
hyprctl monitors -j | jq -r '.[] | [.name, .description] | @tsv'

# Focused monitor
hyprctl monitors -j | jq -r '.[] | select(.focused) | .name'

# Clients of the active workspace, class + title
hyprctl clients -j | jq -r --argjson ws "$(hyprctl activeworkspace -j | jq .id)" \
  '.[] | select(.workspace.id == $ws) | [.class, .title] | @tsv'

# Window count per workspace
hyprctl clients -j | jq -r 'group_by(.workspace.id)[] | "\(.[0].workspace.id)\t\(length)"'

# Boolean/absent key handling — NEVER `.k // default` on booleans: jq's // also replaces false
jq -r 'if has("borderFollowPalette") then .borderFollowPalette else true end' settings.json
```

Rules: parse with `-j` + `jq` (never scrape the human output), iterate with `while IFS=$'\t' read -r`, quote `"$var"` everywhere.

## hyprctl control recipes

```bash
# Multiple control calls in one synchronous round-trip (escape inner semicolons; do not spam)
hyprctl --batch 'dispatch "hl.dsp.focus({ workspace = \"3\" })" ; dispatch "hl.dsp.submap(\"reset\")"'

# Apply state through the Lua API
hyprctl eval 'hl.monitor({ output = "DP-1", mode = "2560x1440@165", position = "0x0", scale = 1 })'
hyprctl eval 'hl.config({ ["general.gaps_in"] = 0 })'

# Target a specific instance (multiple compositors)
hyprctl -i <instance> monitors -j          # id or unique id substring
```

### Persist intent to settings.json (atomic, key-preserving)

```bash
persist() {  # persist <jq-program>: prints the new document to stdout
  local file="$HOME/.config/hypr/settings.json" tmp
  tmp="$(mktemp "${file}.XXXX")"
  if jq "$1" "$file" > "$tmp"; then mv "$tmp" "$file"; else rm -f "$tmp"; return 1; fi
}

# Example: record the chosen scale for DP-1
persist '.monitors.DP-1.scale = 1.25' || notify "scale-menu: could not persist"
```
Apply live **and** persist: the `scale-menu.sh` / `monitor-manager.sh` contract ("remember it" is the user expectation for monitors/scale/borders).

## Quickshell IPC (no killing the shell)

```bash
# Resolve the binary name across installs
QS=""; command -v quickshell >/dev/null 2>&1 && QS=quickshell || command -v qs >/dev/null 2>&1 && QS=qs

# Full QML reload (reload.sh pattern)
$QS -p ~/.config/hypr/scripts/quickshell/Shell.qml ipc call topbar forceReload 2>/dev/null || true

# Talk to a module's IpcHandler
$QS ipc call timex toggle          # if the target shell is the running one
$QS ipc prop get bar visible
```

## Notifications & OSD

```bash
notify() { hyprctl notify -1 3000 "rgb(f7f1ff)" "$1"; }          # compositor-native
swayosd-client --output-volume 0                                   # OSD without changing level
notify-send -t 3000 -a "scale-menu" "Display" "Scale set to 125%"  # desktop notification
```

## Rofi menu skeleton (picker scripts)

```bash
#!/usr/bin/env bash
set -euo pipefail
choices=$'100%\n125%\n150%'
selection="$(printf '%s\n' "$choices" | rofi -dmenu -i -p 'Scale')" || exit 0  # Esc = no-op
[ -n "$selection" ] || exit 0
# ... apply selection via hyprctl eval + persist(), then notify
```

## Audio / brightness (their script patterns)

```bash
pamixer --get-volume; pamixer -i 5; pamixer --get-mute             # volume.sh
brightnessctl set 5%+                                              # internal backlight
brightness="$(brightnessctl -m | cut -d, -f4 | tr -d %)"           # ddcutil fallback for external monitors
```

## Session lifecycle helpers

```bash
# Graceful exit (exit.sh): stop user targets, then exit the compositor
systemctl --user stop graphical-session.target 2>/dev/null || true
hyprctl dispatch exit

# Last (crashed) session log from a TTY
cat "$XDG_RUNTIME_DIR/hypr/$(ls -t "$XDG_RUNTIME_DIR/hypr" | head -n1)/hyprland.log"
```

## CI / hygiene

```bash
shellcheck scripts/*.sh                       # per-repo CI
for f in scripts/*.sh; do bash -n "$f" || exit 1; done
Hyprland --verify-config                      # config gate (Lua)
```

## Anti-patterns (do not do)

- `hyprctl` inside a per-event loop without debounce; unbatched multi-call sequences.
- `pkill hyprland` / `killall qs` in normal flows; use `qs kill -i <id>` / IPC.
- Parsing human `hyprctl` output with `awk/sed`; always `-j` + `jq` (or python, skill `hyprland-python`).
- `eval`, `ls | ...` parsing, unquoted expansions, `sh` vs `bash` mixing.
- Writing `settings.json` non-atomically or dropping unknown keys.
- Leaving daemons unsupervised: if it matters, it is a systemd user unit.
