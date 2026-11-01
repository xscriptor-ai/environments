# Hyprland Pack — agents, skills and docs (November 2026)

Agents, skills, commands and documentation for OpenCode covering the CURRENT state of Hyprland (**v0.57.x, Lua-only config era**) plus the surrounding stacks: Quickshell shells, live debugging on Arch, and headless/WSL testing.

## Start here

New to the desktop stack? Read `skills/hyprland/references/from-zero.md` and copy `skills/hyprland/references/starter-hyprland.lua` to `~/.config/hypr/hyprland.lua`. Both files are installed with the `hyprland` skill.

## Contents

- `agents/` — 13 specialized subagents (opencode frontmatter, allow permissions).
- `skills/` — 9 deep-reference skills with `references/`:
  - `hyprland` — the core reference (Lua-only era, removed hyprlang, options, IPC, rules, scripts/tooling router; from-zero setup guide and starter config).
  - `hyprland-lua` — complete Lua 5.5 + `hl.*` API, binds/flags/dispatchers, events, timers, custom layouts, stubs/LSP, debugging.
  - `hyprland-bash` — the stack's `.sh` conventions: anatomy/strict mode, caching env, hyprctl automation, socket2 daemons, watchers, Quickshell IPC, systemd units, rofi menus.
  - `hyprland-python` — `.py` tooling: theme-sync targets, palette generators, hyprctl/socket automation, atomic file contracts, CLI design, packaging, pytest.
  - `quickshell` — deep Quickshell v0.3.x: CLI, QML language, module catalog, debugging, patterns, a 0.2 to 0.3 migration/deprecations reference, a deep layer-surface API guide, and the design system (tokens, palette-generator contract, dimensions/transitions tokens, **Material-You structure tokens** shape/spacing/elevation/state/motion, layout hygiene).
  - `hyprland-qml` — shell landscape cross-reference (Quickshell/Wayle/AGS/Waybar).
  - `hyprland-tools` — hyprlock/hypridle/hyprpaper/hyprsunset/portal/hyprpm versions.
  - `hyprland-live-debug` — live debugging on Arch: logs, coredumps/gdb, bisect, ASan, DRM/GPU logs, portals, input, perf, playbooks.
  - `arch-wsl-headless` — Arch in WSL2 + headless Hyprland testing/debugging (official archlinux-wsl, d3d12 GPU, `AQ_NO_KMS_REQUIREMENT`, wayvnc, local validation recipes).
- `commands/` — 2 commands: `/hypr-config`, `/hypr-diag`.
- `docs/` — state of the ecosystem, November 2026 (versions, 0.57 changes, source map, knowledge traps).

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
- Prefer the tag artifacts over the moving `main` wiki for defaults, ranges and API names; the wiki may describe unreleased work.

## Key findings this pack corrects (against old documentation)

1. **Lua config since Hyprland 0.55** (2026-05): `~/.config/hypr/hyprland.lua` with `hl.config/hl.bind/hl.dsp.*/hl.on/...` on embedded **Lua 5.5**. hyprlang was deprecated in 0.55 **and removed in 0.57.0** (2026-10-28): a `.conf` file is parsed as Lua and fails. There is no "Hyprland 1.0".
2. **0.57 is the current baseline** (v0.57.0, 2026-10-28): `hyprctl keyword` is gone, `hyprctl dispatch` takes a Lua expression, option ranges are enforced in Lua configs, and the renderer gained swappable blur variants, window wobble, a `layers` category, new rules and new events.
3. **Start sessions with `start-hyprland`** (since 0.53 — crash recovery + safe mode); bare `Hyprland` triggers a watchdog warning. `Hyprland --verify-config` validates configs without a session and now fails on out-of-range values.
4. **Wiki moved and versioned**: https://wiki.hypr.land/ (lowercase nested paths, per-release snapshots). Logs live at `$XDG_RUNTIME_DIR/hypr/<instance>/hyprland.log` (plus `hyprctl rollinglog`).
5. **Window rules were rewritten in 0.53**; 0.57 adds `no_glow`, `no_wobble`, `no_xdg_drags`, `active_border`, `inactive_border`, and workspace `no_wobble`.
6. **Official UI ≠ QML**: the official direction is hyprtoolkit (C++); Qt/QML is peripheral only (hyprland-qt-support = the "Hyprland" style for Qt Quick Controls; hyprland-qtutils archived → hyprland-guiutils).
7. **Real QML on Hyprland = Quickshell** (v0.3.2, docs quickshell.org, repo git.outfoxxed.me; GitHub org quickshell-mirror is a read-only mirror). HyprPanel is archived (2026-04) → successor Wayle (v0.7.0, Rust/GTK4). AGS/Astal (GTK/TS) and Waybar+SwayNC remain viable. Size layer surfaces with `implicitWidth`/`implicitHeight`; direct `width`/`height` on `PanelWindow`/`WlrLayershell` is deprecated in Quickshell 0.3.x.
8. **hyprpm is in-tree** in hyprwm/Hyprland (standalone repo removed); plugin ABI must match the running compositor exactly.
9. **WSL is a headless test rig, not a desktop**: official Arch WSL images (`wsl --install archlinux`), GPU via mesa d3d12/vulkan-dzn, Hyprland headless with `AQ_NO_KMS_REQUIREMENT=1` + wayvnc; WSLg nested compositing is unreliable.
10. **Config values have real limits**: e.g. `decoration.shadow.render_power` is `1..4`. 0.57 reports out-of-range values as config errors, so generated configs must clamp. Verify locally with `Hyprland --verify-config` and `hyprctl configerrors`.

## Ecosystem versions at a glance (2026-11-01)

Hyprland 0.57.0 · Lua 5.5.1 · aquamarine 0.15.1 · hyprutils 0.14.3 · hyprlang 0.6.8 · hyprlock 0.9.6 · hypridle 0.1.8 · hyprpaper 0.8.4 · hyprpicker 0.4.7 · hyprsunset 0.4.0 · xdg-desktop-portal-hyprland 1.4.1 · hyprlauncher 0.1.7 · hyprpolkitagent 0.2.0 · hyprshutdown 0.1.1 · hyprpwcenter 0.1.2 · hyprland-guiutils 0.2.2 · Quickshell 0.3.2 · Wayle 0.7.0 · AGS 3.1.2 · Waybar 0.15.0 · SwayNC 0.12.6 · hyprshot 1.3.0 · cliphist 0.7.0.

Primary sources: github.com/hyprwm/Hyprland (v0.57.0 tag and releases), wiki.hypr.land, quickshell.org, wayle.app, aylur.github.io/ags, Arch `extra` package metadata, wiki.archlinux.org (Hyprland, Install Arch Linux on WSL), lua.org/manual/5.5.
