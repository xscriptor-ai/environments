# Shell landscape 2026 — comparison & daemon contracts

## Stacks (verified September 2026)

| Stack | Repo / docs | Tech | Status |
|---|---|---|---|
| Quickshell | quickshell-mirror/quickshell; quickshell.outfoxxed.me | QML/QtQuick6 | Active, v0.3.1 (2026-08); Arch extra |
| Wayle | wayle-rs/wayle; wayle.app | Rust + GTK4 + Relm4 | Active, v0.7.0 (2026-07); AUR wayle-bin |
| AGS/Astal | Aylur/ags (scaffolding for Astal+Gnim); aylur.github.io/ags, /astal | GTK3/4 + JS/TS | Active, v3.1.2 (2026-04) |
| Waybar + SwayNC | Alexays/Waybar; ErikReider/SwayNotificationCenter | GTK/CSS | Active: Waybar 0.15.0 (2026-02), SwayNC 0.12.6 (2026-03) |
| HyprPanel | Jas-SinghFSU/HyprPanel | AGS/GJS+TS | ARCHIVED 2026-04-27 → migrate to Wayle |
| ashell | community | Rust/iced | niche |
| EWW | community | GTK3/Yuck | aging, not for new projects |

Hyprland official UI direction: hyprtoolkit (C++ Wayland-native toolkit) + first-party apps (hyprlauncher, hyprpolkitagent, hyprpwcenter, hyprshutdown, hyprland-welcome). Qt/QML only in peripheral official projects (hyprland-qt-support style, hyprsysteminfo, hyprqt6engine).

## Wayle quick reference (successor of HyprPanel)
- Config `~/.config/wayle/config.toml` (live reload), GUI `wayle-settings`, CLI `wayle config`.
- Bar layout declarative: `[bar] location/scale`, `[[bar.layout]] monitor="*" left=[...] center=[...] right=[...]`, modules with `[modules.clock] format="%H:%M"` etc.
- Ships bar + notifications + OSD + wallpaper + device controls; per-compositor modules: Hyprland, Niri, Mango (Sway planned). Needs wlr-layer-shell. Deps/daemons: bluez, NetworkManager, upower, power-profiles-daemon.

## AGS/Astal quick notes
AGS v1 (GTK3/GJS) is dead; current = Astal (Vala/C, GTK3+4) + Gnim (JSX for GJS) + TS bindings. Packaging: `aylurs-gtk-shell-git`, `libastal-*` AUR.

## Daemon contract (one per session — avoid duplication)
1. One full bar/panel stack per screen edge region (or coordinate exclusive zones).
2. One org.freedesktop.Notifications server: Quickshell in-shell NotificationServer, Wayle built-in, or SwayNC/dunst/mako. Mixing = lost notifications.
3. One SNI tray host exporting org.kde.StatusNotifierWatcher: Quickshell SystemTray, Waybar tray, Wayle built-in.
4. One wallpaper daemon (hyprpaper or shell wallpaper support).
5. Screenshot: hyprshot or grim+slurp. Clipboard: cliphist (0.7.0) + wl-clipboard.
6. Screen sharing via xdg-desktop-portal-hyprland (v1.4.1) — compositor Permission Manager prompts when `ecosystem.enforce_permissions`; share-picker app is Qt-based.

## Migration HyprPanel → Wayle
- JSON `~/.config/hyprpanel/config.json` → TOML; modules/layout differ — port module by module using wayle.app docs ("config reference").
- Start with default config (`wayle` first run generates one), then re-add modules.
