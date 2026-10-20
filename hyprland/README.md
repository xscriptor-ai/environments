# Hyprland Pack — agents, skills and docs (October 2026)

Agents, skills, commands and documentation for OpenCode covering the CURRENT state of Hyprland (v0.56.x, the Lua 5.5 config era) plus the surrounding stacks: Quickshell shells, live debugging on Arch, and headless/WSL testing.

## Contents

- `agents/` — 13 specialized subagents (opencode frontmatter, allow permissions).
- `skills/` — 9 deep-reference skills with `references/`:
  - `hyprland` — the core reference (Lua era + legacy hyprlang, options, IPC, rules, scripts/tooling router).
  - `hyprland-lua` — complete Lua 5.5 + `hl.*` API, binds/flags/dispatchers, events, timers, custom layouts, stubs/LSP, debugging.
  - `hyprland-bash` — the stack's `.sh` conventions: anatomy/strict mode, caching env, hyprctl automation, socket2 daemons, watchers, Quickshell IPC, systemd units, rofi menus.
  - `hyprland-python` — `.py` tooling: theme-sync targets, palette generators, hyprctl/socket automation, atomic file contracts, CLI design, packaging, pytest.
  - `quickshell` — deep Quickshell v0.3.x: CLI, QML language, module catalog, debugging, patterns, and the design system (tokens, palette-generator contract, dimensions/transitions tokens, **Material-You structure tokens** shape/spacing/elevation/state/motion, layout hygiene).
  - `hyprland-qml` — shell landscape cross-reference (Quickshell/Wayle/AGS/Waybar).
  - `hyprland-tools` — hyprlock/hypridle/hyprpaper/hyprsunset/portal/hyprpm versions.
  - `hyprland-live-debug` — live debugging on Arch: logs, coredumps/gdb, bisect, ASan, DRM/GPU logs, portals, input, perf, playbooks.
  - `arch-wsl-headless` — Arch in WSL2 + headless Hyprland testing/debugging (official archlinux-wsl, d3d12 GPU, `AQ_NO_KMS_REQUIREMENT`, wayvnc, CI recipes).
- `commands/` — 2 commands: `/hypr-config`, `/hypr-diag`.
- `docs/` — state of the ecosystem 2026 (versions, changes, source map, knowledge traps).

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

## Style conventions (keep these when editing the pack)

- **Language: English only** in agents, skills, commands and docs (matches the upstream ecosystem documentation).
- **No emojis.** Typographic marks (`·`, `→`, `≤`, `≥`, `≠`, `§`, `±`, `×`, dashes) and **Nerd Font glyphs** (PUA `U+F0000+`) are fine — font glyphs, not emoji.
- Version-sensitive claims carry a date and sources: “Verified YYYY-MM-DD against official sources: …”.
- Design guidance must preserve the three hard requirements: modern & dense (no dead space), friendly, no overlapping controls/hitboxes.

## Key findings this pack corrects (against old documentation)

1. **Lua config since Hyprland 0.55** (2026-05): `~/.config/hypr/hyprland.lua` with the `hl.config/hl.bind/hl.dsp.*/hl.on/...` API on embedded **Lua 5.5**. hyprlang `.conf` is deprecated (notice since 0.56.1). There is no "Hyprland 1.0"; the line stays on 0.x (v0.56.2, 2026-08-05).
2. **Start sessions with `start-hyprland`** (since 0.53 — crash recovery + safe mode); bare `Hyprland` triggers a watchdog warning. `Hyprland --verify-config` validates configs without a session (SSH/WSL/CI).
3. **Wiki moved and versioned**: https://wiki.hypr.land/ (per-release snapshots; legacy hyprlang → 0.54 pages). Logs live at `$XDG_RUNTIME_DIR/hypr/<instance>/hyprland.log` (+ `hyprctl rollinglog`).
4. **Window rules rewritten in 0.53** (new syntax; `windowrulev2` no longer exists).
5. **Official UI ≠ QML**: the official direction is hyprtoolkit (C++); Qt/QML is peripheral only (hyprland-qt-support = the "Hyprland" style for Qt Quick Controls; hyprland-qtutils archived → hyprland-guiutils).
6. **Real QML on Hyprland = Quickshell** (v0.3.2, docs quickshell.org, repo git.outfoxxed.me; GitHub org quickshell-mirror is a mirror). HyprPanel is archived (2026-04) → successor Wayle (Rust/GTK4). AGS/Astal (GTK/TS) and Waybar+SwayNC are still alive. Size layer surfaces with `implicitWidth`/`implicitHeight`; direct `width`/`height` on `PanelWindow`/`WlrLayershell` is deprecated in Quickshell 0.3.x.
7. **hyprpm is now in-tree** in hyprwm/Hyprland (standalone repo removed).
8. **WSL is a headless test rig, not a desktop**: official Arch WSL images (`wsl --install archlinux`), GPU via mesa d3d12/vulkan-dzn, Hyprland headless with `AQ_NO_KMS_REQUIREMENT=1` + wayvnc; WSLg nested compositing is unreliable.

Primary sources: github.com/hyprwm/Hyprland (releases), wiki.hypr.land, quickshell.org, wayle.app, aylur.github.io/ags, wiki.archlinux.org (Hyprland, Install Arch Linux on WSL), lua.org/manual/5.5.
