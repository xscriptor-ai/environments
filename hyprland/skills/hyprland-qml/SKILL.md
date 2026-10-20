---
name: hyprland-qml
description: Build QML/QtQuick UIs on Hyprland with Quickshell v0.3.x. Use when creating/modifying QML bars, panels, popups, OSDs, docks, trays or notification centers; also for Qt app theming env and the modern shell landscape (Wayle, AGS/Astal, Waybar).
---

# QML Interfaces for Hyprland (October 2026)

Quickshell is the QML route for Hyprland shells. Official Hyprland has no QML rendering path of its own; its own UI direction is hyprtoolkit (C++). HyprPanel is ARCHIVED (2026-04; it was AGS/GJS+TS, never QML); successor: Wayle (Rust/GTK4).

**Full depth (install, CLI, modules, debugging, patterns) lives in the sibling skill `quickshell`** — read it before writing or reviewing shell code. This skill stays as the short cross-reference. Migration and deprecations (0.2 to 0.3): skill `quickshell` -> `references/migration.md`.

## Quickshell facts

- Stable: **v0.3.2** (2026-10-08). Repo: `git.outfoxxed.me/quickshell/quickshell` (GitHub mirror: quickshell-mirror/quickshell). Docs: **quickshell.org** (versioned, v0.3.2 covers 0.3.x). Arch: `pacman -S quickshell` (extra, 0.3.2) or `quickshell-git`. Verified 2026-10-20 against the v0.3.2 docs/changelog.
- Config discovery: `~/.config/quickshell/<name>/shell.qml` (every subfolder with shell.qml is a config; a top-level `shell.qml` takes precedence). Run: `qs -c <name>` / `qs -p <path>`; hot reload built in. Instance ops: `qs list`, `qs log -t 200`, `qs kill -i <id>`, `qs ipc show|call`.
- Uppercase `.qml` files = reusable types; `pragma Singleton` = singletons; subfolders import as `import qs.path.to.module`. `.qmlls.ini` enables LSP.
- Key modules: `Quickshell` (PanelWindow/PopupWindow/FloatingWindow, Variants, Scope, ShellScreen...), `Quickshell.Wayland` (WlrLayershell, ScreencopyView, WlSessionLock, IdleMonitor, BackgroundEffect...), `Quickshell.Hyprland` (Hyprland IPC singleton, HyprlandWorkspace/Window/Toplevel, GlobalShortcut, HyprlandFocusGrab), `Quickshell.Io`, services (Notifications/SystemTray/Mpris/Pipewire/UPower/Pam/Greetd/Polkit), `Quickshell.Networking`, `.Bluetooth`, `.Widgets`.
- Layer semantics: anchors attach screen edges; opposite anchors force full width/height; exclusiveZone (1 or 3 anchors) reserves space; focusable/keyboardFocus; aboveWindows/layer.
- Size layer surfaces with `implicitWidth`/`implicitHeight`; direct `width`/`height` on `PanelWindow`/`WlrLayershell` is deprecated in Quickshell 0.3.x and can resize the surface mid-animation.
- **One notification server & one SNI tray host per session.**

## Minimal shell

```qml
import Quickshell
import QtQuick
PanelWindow {
  anchors { top: true; left: true; right: true }
  implicitHeight: 30
  Text { anchors.centerIn: parent; text: "hello" }
}
```
Multi-monitor: `Variants { model: Quickshell.screens; PanelWindow { required property var modelData; screen: modelData; ... } }` with shared logic in a root `Scope`.

## Launch from Hyprland (Lua config era)

```lua
hl.on("hyprland.start", function()
  hl.dispatch(hl.dsp.exec_cmd("qs -c mybar"))
end)
```

## Qt env trio for Hyprland

```lua
hl.env("QT_QPA_PLATFORM", "wayland;xcb")
hl.env("QT_QPA_PLATFORMTHEME", "qt6ct")
-- QT_WAYLAND_DISABLE_WINDOWDECORATION=1 only matters on xcb fallback
```
Qt Quick Controls styling: official hyprland-qt-support provides the "Hyprland" style (run QML apps with `QT_QUICK_CONTROLS_STYLE=org.hyprland.style`); Quickshell ignores system style unless `//@ pragma RespectSystemStyle`.

## Shell landscape (who to recommend)

| Stack | Tech | For |
|---|---|---|
| Quickshell | QML/QtQuick | custom QML UIs (this skill) |
| Wayle v0.7 | Rust/GTK4/Relm4, TOML config | HyprPanel successors, batteries-included |
| AGS/Astal | GTK + TS/JS (Gnim) | TypeScript fans |
| Waybar+SwayNC | GTK/CSS | minimal classic |

Full details: skill `quickshell` (deep reference: CLI, QML language, modules, debugging, patterns) plus `references/quickshell.md` (condensed catalog) and `references/shell-landscape.md` (comparison + daemon contracts).
