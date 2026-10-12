# Hyprland Pack — agents, skills and docs (September 2026)

Agents, skills, commands and documentation for OpenCode covering the CURRENT state of Hyprland (v0.56.x, the Lua config era).

## Contents

- `agents/` — 12 specialized subagents (opencode frontmatter, allow permissions).
- `skills/` — 3 deep-reference skills (`hyprland`, `hyprland-qml`, `hyprland-tools`) with `references/`.
- `commands/` — 2 commands: `/hypr-config`, `/hypr-diag`.
- `docs/` — state of the ecosystem 2026 (versions, changes, source map).

## Install

```bash
# Agents (flat copy, as opencode expects)
cp agents/*.md ~/.config/opencode/agents/
# Skills (one folder per skill)
cp -r skills/* ~/.config/opencode/skills/
# Commands
cp commands/*.md ~/.config/opencode/commands/
```

Then restart opencode. The agents already ship with `permission` allow-all (no prompts when delegating), like the rest of the installed pack.

## Key findings this pack corrects (against old documentation)

1. **Lua config since Hyprland 0.55** (2026-05): `~/.config/hypr/hyprland.lua` with the `hl.config/hl.bind/hl.dsp.*/hl.on/...` API. hyprlang `.conf` is deprecated (notice since 0.56.1). There is no "Hyprland 1.0"; the line stays on 0.x (v0.56.2, 2026-08-05).
2. **Wiki moved and versioned**: https://wiki.hypr.land/ (per-release snapshots; legacy hyprlang → 0.54 pages).
3. **Window rules rewritten in 0.53** (new syntax; `windowrulev2` no longer exists).
4. **Official UI ≠ QML**: the official direction is hyprtoolkit (C++); Qt/QML is peripheral only (hyprland-qt-support = the "Hyprland" style for Qt Quick Controls; hyprland-qtutils archived → hyprland-guiutils).
5. **Real QML on Hyprland = Quickshell** (v0.3.1, quickshell-mirror org). HyprPanel is archived (2026-04) → successor Wayle (Rust/GTK4). AGS/Astal (GTK/TS) and Waybar+SwayNC are still alive.
6. **hyprpm is now in-tree** in hyprwm/Hyprland (standalone repo removed).

Primary sources: github.com/hyprwm/Hyprland (releases), wiki.hypr.land, quickshell.outfoxxed.me, wayle.app, aylur.github.io/ags.
