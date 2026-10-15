---
description: Collect a Hyprland diagnostic bundle (version, config errors, logs) and summarize findings
agent: hyprland-troubleshooting
---

Gather diagnostics for the current Hyprland session and summarize:

- `hyprctl version`
- `hyprctl configerrors`
- `Hyprland --verify-config` (static config check)
- `hyprctl monitors -j` and `hyprctl workspaces -j`
- Tail of the instance log: `$XDG_RUNTIME_DIR/hypr/$HYPRLAND_INSTANCE_SIGNATURE/hyprland.log` (last ~200 lines); if the session is dead, use the newest dir: `$XDG_RUNTIME_DIR/hypr/$(ls -t "$XDG_RUNTIME_DIR/hypr" | head -n1)/hyprland.log`; `hyprctl rollinglog -f` as fallback
- `hyprctl instances -j`

Then give a concise diagnosis: version-era notes (0.55+ Lua vs legacy conf), any config errors with line hints, and the top 1-3 likely fixes. Ask before changing anything.

$ARGUMENTS
