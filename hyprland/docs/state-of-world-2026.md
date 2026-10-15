# Hyprland — state of the ecosystem, October 2026

Compiled on 2026-09-09 and re-verified on 2026-10-15 against primary sources (hyprwm GitHub releases, wiki.hypr.land, quickshell.org, wayle.app, Arch packages, ArchWiki, Microsoft WSL). Useful to date knowledge and detect staleness.

## Verified versions

| Component | Latest | Date |
|---|---|---|
| Hyprland | v0.56.2 | 2026-08-05 |
| aquamarine | v0.15.1 | 2026-09-17 |
| hyprutils | v0.14.2 | 2026-09-05 |
| hyprlang | v0.6.8 | 2026-01 (maintenance) |
| hyprwayland-scanner | v0.4.6 | 2026-04 |
| hyprgraphics | v0.5.1 | 2026-04 |
| hyprcursor | v0.1.13 | 2025-07 |
| hyprtoolkit | v0.6.0 | 2026-09-09 |
| hyprlock | v0.9.6 | 2026-07 |
| hypridle | v0.1.8 | 2026-07 |
| hyprpaper | v0.8.4 | 2026-04 |
| hyprpicker | v0.4.7 | 2026-05 |
| hyprsunset | v0.4.0 | 2026-07 (Arch) |
| xdg-desktop-portal-hyprland | v1.4.1 | 2026-07 |
| hyprlauncher | v0.1.6 | 2026-04 |
| hyprpolkitagent | v0.2.0 | 2026-09-09 |
| hyprsysteminfo | v0.2.0 | 2026-04 |
| hyprshutdown | v0.1.1 | 2026-05 |
| hyprpwcenter | v0.1.2 | 2026-02 |
| hyprland-guiutils | v0.2.2 | active (successor of hyprland-qtutils, archived) |
| hyprland-qt-support | v0.1.0 | active |
| Quickshell | v0.3.2 | 2026-10-08 |
| Wayle | v0.7.0 | 2026-07 |
| AGS (Astal+Gnim) | v3.1.2 | 2026-04 |
| Waybar | v0.15.0 | 2026-02 |
| SwayNC | v0.12.6 | 2026-03 |
| hyprshot (community) | 1.3.0 | 2024-06 (dormant) |
| cliphist | 0.7.0 | 2025-10 |

Host-side wildcards that affect testing: WSL 3.0.3 (2026-10-09), WSLg 1.0.71+ (bundled), archlinux-wsl (official monthly images), yuk7/ArchWSL 26.10.14.0, Lua 5.5.1 (2026-08-03; Hyprland requires Lua >= 5.5).

Arch package checks (2026-10-15, extra): hyprland 0.56.2-4, quickshell 0.3.2-1, aquamarine 0.15.1-1, hyprutils 0.14.2-1, portal 1.4.1-2, hyprsunset 0.4.0-3.

## Timeline of changes that break old knowledge

- v0.42 (2024-08): wlroots out → Aquamarine.
- v0.49 (2025-05): Permission Manager; hyprpm with sudo.
- v0.50 (2025-07): first test-suite (hyprtester); monitor v2 syntax; GLES 3.0 renderer floor.
- v0.51 (2025-09): configurable gestures; `hyprctl getprop`.
- v0.52 (2025-11): qtutils → guiutils (`misc:disable_hyprland_guiutils_check`).
- v0.53 (2025-12): **windowrules rewrite**; **`start-hyprland` wrapper** (crash recovery + safe mode; bare `Hyprland` warns).
- v0.54 (2026-02): togglesplit/swapsplit removed; hyprpm nix integration.
- v0.55 (2026-05): **Lua config by default (Lua 5.5) + Lua layout API + springs + glows + `hl.permission`/`hl.timer`/queries**; hyprlang deprecated; systemd session target integrated.
- v0.56 (2026-07): Lua REPL in hyprctl; full-reload; custom Lua gestures; `.conf` deprecation notice (0.56.1); `--verify-config` era tooling; hyprctl `instances`.
- Post-0.56.2 (main): nothing user-facing merged that isn't in 0.56.2 for config authors (stubs and APIs verified against the v0.56.2 tag).

## Visible roadmap

- Open 0.57 milestone (no date). No 1.0 in any milestone.
- hyprwire + hyprtavern (new IPC protocol + session bus): early development; today both UNIX sockets remain in force.
- Official UI: hyprtoolkit 0.6.0 (C++) + hyprlauncher/hyprpolkitagent/hyprpwcenter/hyprshutdown/hyprsysteminfo. Official QML = hyprland-qt-support (the "Hyprland" Qt Quick Controls style).
- Quickshell tracking Hyprland evolution (v0.3.2 already handles Hyprland's new workspace address format).

## Current documentation map

- Wiki: https://wiki.hypr.land/ — versioned; lowercase paths: `configuring/core/*` (config-options, binds [+ subpages flags/gestures/submaps/devices/globals/keyboard-layouts/switches], dispatchers, rules/*, animations, environment-variables, autostart, advanced-configuration/{using-hyprctl, lua-utilities, events, notifications, permissions}), `configuring/layouts/*` (dwindle, master, scrolling, monocle, custom-layouts), `configuring/extra/*` (multi-gpu, virtual-gpu, performance, tearing, xwayland, systemd), `hypr-ecosystem/{dev,user}/*`, `plugins/`, `ipc/`, `nix/`, `crashes-and-bugs`, `contributing-and-debugging/*` (incl. `tests/`).
- Per-release snapshots via the version selector (e.g. `/0.56.0/`); hyprlang syntax only lives on the 0.54 pages.
- News: https://hypr.land/news (RSS hypr.land/rss.xml); blog.hyprland.org is down/irrelevant.
- Quickshell: https://quickshell.org/docs/v0.3.0/ (docs for 0.3.x); repo git.outfoxxed.me/quickshell/quickshell (GitHub mirror quickshell-mirror/quickshell).
- Wayle: wayle.app. AGS: aylur.github.io/ags and /astal.
- Lua 5.5: https://www.lua.org/manual/5.5/ (Hyprland embeds upstream Lua; stubs generated from source).

## Knowledge traps (2023-2024 → 2026)

1. `wiki.hyprland.org/Configuring/Variables` no longer exists → `wiki.hypr.land/configuring/core/config-options/`.
2. `exec-once =`, `env =`, `windowrule =`, `animation = bezier` → Lua API (only valid ≤ 0.54).
3. HyprPanel as a QML bar → it never was one (AGS/GJS) and is archived; successor Wayle.
4. "Quickshell at quickshell.outfoxxed.dev" → quickshell.org (and .me); repo moved to git.outfoxxed.me (GitHub is a mirror).
5. hyprland-qtutils → archived (2025-11); it has no "QtScreenManager/QmlUtils" QML modules.
6. QML modules in vaxry's bar: vaxry uses Quickshell (personal config), not official hyprwm code.
7. socket2 events that do NOT exist: trayicon*, groupopen, screenresize, lockactivegroup.
8. `misc.vfr` → `debug.vfr` (0.55); `decoration.shadow.ignore_window` removed (0.55); `render.cm_fs_passthrough` removed; `master.center_master_slaves_on_right` → `center_master_fallback`.
9. Bare `Hyprland` sessions: the supported entrypoint is `start-hyprland` (0.53+); bare start logs a watchdog warning.
10. hyprland.log location: `$XDG_RUNTIME_DIR/hypr/<instance>/hyprland.log` (never `~/.local/state/hyprland/`); logs also available via `hyprctl rollinglog`.
11. "Hyprland in WSL with WSLg as desktop" → no; WSL is a headless test rig (render-only GPU or vgem + `AQ_NO_KMS_REQUIREMENT=1`, drive via wayvnc). Official Arch images exist now (`wsl --install archlinux`).
12. Lua is 5.5, not LuaJIT/5.1: no `bit` library, integers/bitops native, `global` declarations.
