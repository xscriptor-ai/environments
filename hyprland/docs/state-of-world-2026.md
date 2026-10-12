# Hyprland — state of the ecosystem, September 2026

Compiled on 2026-09-09 while verifying primary sources (hyprwm GitHub releases, wiki.hypr.land, quickshell.outfoxxed.me, wayle.app, AUR). Useful to date knowledge and detect staleness.

## Verified versions

| Component | Latest | Date |
|---|---|---|
| Hyprland | v0.56.2 | 2026-08-05 |
| hyprutils | v0.14.2 | 2026-09-05 |
| hyprlang | v0.6.8 | 2026-01 (maintenance) |
| hyprwayland-scanner | v0.4.6 | 2026-04 |
| hyprgraphics | v0.5.1 | 2026-04 |
| hyprcursor | v0.1.13 | 2025-07 |
| hyprlock | v0.9.6 | 2026-07 |
| hypridle | v0.1.8 | 2026-07 |
| hyprpaper | v0.8.4 | 2026-04 |
| hyprpicker | v0.4.7 | 2026-05 |
| xdg-desktop-portal-hyprland | v1.4.1 | 2026-07 |
| hyprland-guiutils | v0.2.2 | active (successor of hyprland-qtutils, archived) |
| hyprland-qt-support | v0.1.0 | active |
| Quickshell | v0.3.1 | 2026-08 |
| Wayle | v0.7.0 | 2026-07 |
| AGS (Astal+Gnim) | v3.1.2 | 2026-04 |
| Waybar | v0.15.0 | 2026-02 |
| SwayNC | v0.12.6 | 2026-03 |
| hyprshot (community) | 1.3.0 | 2024-06 (dormant) |
| cliphist | 0.7.0 | 2025-10 |

## Timeline of changes that break old knowledge

- v0.42 (2024-08): wlroots out → Aquamarine.
- v0.49 (2025-05): Permission Manager; hyprpm with sudo.
- v0.50 (2025-07): first test-suite (hyprtester); monitor v2 syntax.
- v0.51 (2025-09): configurable gestures; `hyprctl getprop`.
- v0.52 (2025-11): qtutils → guiutils (`misc:disable_hyprland_guiutils_check`).
- v0.53 (2025-12): **windowrules rewrite** (biggest break of the hyprlang era).
- v0.54 (2026-02): togglesplit/swapsplit removed; hyprpm nix integration.
- v0.55 (2026-05): **Lua config by default + Lua layout API + springs + glows**; hyprlang deprecated.
- v0.56 (2026-07): Lua REPL in hyprctl; full-reload; custom Lua gestures; `.conf` deprecation notice (0.56.1).

## Visible roadmap

- Open 0.57 milestone (no date). No 1.0 in any milestone.
- hyprwire + hyprtavern (new IPC protocol + session bus): early development; today both UNIX sockets remain in force.
- Official UI: hyprtoolkit (C++) + hyprlauncher/hyprpolkitagent/hyprpwcenter/hyprshutdown. Official QML = hyprland-qt-support (the "Hyprland" Qt Quick Controls style).

## Current documentation map

- Wiki: https://wiki.hypr.land/ — versioned; lowercase paths: `configuring/core/*` (config-options, binds, dispatchers, rules/*, animations, environment-variables, advanced-configuration/using-hyprctl, lua-utilities, events), `configuring/layouts/*` (dwindle, master, scrolling, monocle, custom-layouts), `hypr-ecosystem/*`, `plugins/`, `ipc/`, `nix/`.
- Per-release snapshots via the version selector (e.g. `/0.56.0/`); hyprlang syntax only lives on the 0.54 pages.
- News: https://hypr.land/news (RSS hypr.land/rss.xml); blog.hyprland.org is down/irrelevant.
- Quickshell: quickshell.outfoxxed.me (docs 0.3.1); repo quickshell-mirror/quickshell.
- Wayle: wayle.app. AGS: aylur.github.io/ags and /astal.

## Knowledge traps (2023-2024 → 2026)

1. `wiki.hyprland.org/Configuring/Variables` no longer exists → `wiki.hypr.land/configuring/core/config-options/`.
2. `exec-once =`, `env =`, `windowrule =`, `animation = bezier` → Lua API (only valid ≤ 0.54).
3. HyprPanel as a QML bar → it never was one (AGS/GJS) and is archived; successor Wayle.
4. "Quickshell at quickshell.outfoxxed.dev" → `.me`; GitHub org quickshell-mirror.
5. hyprland-qtutils → archived (2025-11); it has no "QtScreenManager/QmlUtils" QML modules.
6. QML modules in vaxry's bar: vaxry uses Quickshell (personal config), not official hyprwm code.
7. socket2 events that do NOT exist: trayicon*, groupopen, screenresize, lockactivegroup.
8. `misc.vfr` → `debug.vfr` (0.55); `decoration.shadow.ignore_window` removed (0.55); `render.cm_fs_passthrough` removed; `master.center_master_slaves_on_right` → `center_master_fallback`.
