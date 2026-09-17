---
description: Collect a Hyprland diagnostic bundle (version, config errors, logs) and summarize findings
agent: hyprland-troubleshooting
---

Gather diagnostics for the current Hyprland session and summarize:

- `hyprctl version`
- `hyprctl configerrors`
- `hyprctl monitors -j` and `hyprctl workspaces -j`
- Tail of ~/.local/state/hyprland/hyprland.log (last ~200 lines), or journalctl --user -b -g hyprland if that path is empty
- `hyprctl instances -j`

Then give a concise diagnosis: version-era notes (0.55+ Lua vs legacy conf), any config errors with line hints, and the top 1-3 likely fixes. Ask before changing anything.

$ARGUMENTS
