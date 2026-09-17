---
description: Scaffold a fresh, current Hyprland Lua config (hyprland.lua) for version >= 0.55 with sane defaults
agent: hyprland-lua-config
---

Create a fresh, minimal-but-sane Hyprland config for the CURRENT installed version.

1. Detect the version with `hyprctl version` (if unavailable, ask the user for their distro and Hyprland version).
2. If >= 0.55: generate `hyprland.lua` (paths, monitors, general/decoration options, keybinds, autostart via hl.on("hyprland.start", ...)) using the `hl.*` API. Place it at ~/.config/hypr/hyprland.lua but do NOT overwrite an existing config without asking.
3. If < 0.55: generate legacy hyprland.conf instead (hyprlang), and warn the user they are on a deprecated config line that upstream is dropping.
4. Verify with `hyprctl reload` + `hyprctl configerrors` where possible.

$ARGUMENTS
