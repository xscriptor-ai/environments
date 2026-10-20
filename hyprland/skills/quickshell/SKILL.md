---
name: quickshell
description: Deep Quickshell v0.3.x reference for building QML/Wayland shells (bars, panels, popups, OSDs, docks, lockscreens, notification centers, trays). Covers install/dirs/CLI, QML language, full module catalog, modern UI design (tokens, Material-You structure tokens, glass, motion, layout hygiene, Hack Nerd Font), qmlls/QML debugging, performance and Hyprland integration. Use when writing, reviewing or debugging Quickshell configs, or when a shell misbehaves at runtime.
---

# Quickshell (October 2026)

Quickshell is THE QML route for Wayland shells on Hyprland (official Hyprland itself ships no QML shell; its own UI direction is hyprtoolkit/C++). It talks to the compositor through wlr-layer-shell, wlr-foreign-toplevel, screencopy, data-control, and the Hyprland IPC sockets.

- Current release: **v0.3.2** (2026-10-08). Canonical repo: `git.outfoxxed.me/outfoxxed/quickshell`; GitHub mirror `quickshell-mirror/quickshell` is read-only. Docs: **https://quickshell.org/** (versioned; v0.3.2 docs cover the 0.3.x line). License LGPL-3.0.
- Arch: `pacman -S quickshell` (extra, 0.3.2) or AUR `quickshell-git` (master; reinstall if Qt updates). WSL/headless testing: see skill `arch-wsl-headless`.
- Verified **2026-10-20** against official sources (v0.3.2 changelog, quickshell.org v0.3.2 docs including Item Size and Position, v0.3.2 release notes): Qt 6.12 support, Hyprland workspace address format, session-lock fixes, PAM subprocess crash fix; default layer namespace `quickshell` (override via `WlrLayershell.namespace`). Always check `qs --version` on the target.

## Layout, discovery, launch

- Configs are folders: `~/.config/quickshell/<name>/shell.qml`, or a top-level `~/.config/quickshell/shell.qml` (then it takes precedence and is called "default"). `/etc/xdg/quickshell/...` works too.
- `qs` == `quickshell`. Run: `qs` (default config), `qs -c mybar`, `qs -p ~/myshell` (or a raw .qml file). `-n/--no-duplicate` exits if already running; `-d/--daemonize` detaches. `QS_CONFIG_PATH` == `--path`, `QS_CONFIG_NAME` == `--config`.
- Uppercase-named `.qml` files next to the root are auto-imported as types (`Bar.qml` -> `Bar {}`). `pragma Singleton` (or `//@ pragma Singleton`) files become singletons. Subfolders import as `import qs.sub.dir` (LSP-friendly; prefer over `import "root:/..."`, which is discouraged).
- Hot reload is built in: saving any file reloads the shell (a reload popup appears; suppress with `QS_NO_RELOAD_POPUP` or by hooking it in your config; disable watching with `QS_DISABLE_FILE_WATCHER`).
- Editor: create an empty `.qmlls.ini` next to `shell.qml`; Quickshell replaces it with a managed qmlls config (gitignore it). See `references/debugging.md` for qmlls setup/caveats.
- Session is single-process: one Quickshell instance can host every bar/panel/popup/OSD/everything. Do NOT spawn one process per widget (memory).

## CLI quick sheet (0.3.x)

```bash
qs -c mybar                 # run config "mybar"
qs -p ./shell.qml           # run a path
qs list [-a] [-j]           # instances (current display by default)
qs log [-t 200] [-f] [file] # print/follow the instance log (log.qslog)
qs kill -i <id>             # kill an instance
qs ipc show                                   # list IpcHandler targets
qs ipc call <target> <fn> [args...]           # call into the shell
qs ipc listen <target> <signal>               # subscribe to shell signals
qs ipc prop get <target> <prop>               # read exposed properties
qs -v ...                   # -v INFO, -vv DEBUG; --log-rules "qs.*=true" (QT_LOGGING_RULES syntax)
qs --debug 8080 --waitfordebug   # QML debugger port (Qt Creator / qtdeclarative tools)
```

## Shell structure (canonical)

```qml
// shell.qml — one file per concern; shared logic in a root Scope
import Quickshell
import Quickshell.Hyprland
import QtQuick

Scope {
  id: root
  Variants {                 // one PanelWindow per screen
    model: Quickshell.screens
    PanelWindow {
      required property var modelData
      screen: modelData
      anchors { top: true; left: true; right: true }
      implicitHeight: 30
      Text { anchors.centerIn: parent; text: Hyprland.focusedWorkspace?.name ?? "" }
    }
  }
}
```

- `PanelWindow` is the layer-shell bar/panel. `PopupWindow` anchors to windows/items (`anchor.window`, `anchor.rect`); `FloatingWindow` is a normal managed window (dialogs, move/resize, max/min/fullscreen). `QsWindow` is the base.
- Anchors: `anchors.{top,bottom,left,right}`; opposite anchors force full width/height; `margins` apply only to anchored edges; `exclusiveZone` reserves compositor space (exactly 1 or 3 anchors; implies ExclusionMode.Normal); `exclusionMode: Auto|Normal|Ignore`; `focusable` -> keyboard focus; `aboveWindows` -> layer.
- Layer-surface sizing: use `implicitWidth`/`implicitHeight` (and animate those). Assigning `width`/`height` directly on `PanelWindow`/`WlrLayershell` is deprecated in Quickshell 0.3.x and logs a runtime warning. Never resize a layer surface on every frame during a reveal: keep the surface size stable and animate/clip the content.
- Popups: prefer `HyprlandFocusGrab {}` for outside-click dismissal under Hyprland; plain `grabFocus` steals focus and misbehaves.
- Pragma notes: `//@ pragma AppId`, `ShellId`, `Env VAR = v`, `DefaultEnv VAR = v` (only in root shell.qml), `RespectSystemStyle` (otherwise Controls style is forced to Fusion), `UseQApplication` (QtWidgets styles), `DropExpensiveFonts`. `//@ if/endif` with `hasVersion()/hasQtVersion()/env()/isEnvSet()` for version-gated code.

## Reality checks that save hours

- Theming contract: palettes are **base16 + roles JSON** under `~/.config/hypr/scripts/quickshell/dock/palettes/`, selected via `settings.json → bar.palette`; the shell derives every role live (FileView watchers + content-compare). No matugen/generator service — your binary only writes the files (`design-and-effects.md` §2).
- One notification server (`Quickshell.Services.Notifications`) and one SNI tray host (`Quickshell.Services.SystemTray`) per session — running dunst/mako/swaync/Waybar tray too causes lost notifications/icons.
- Don't parse `hyprctl` from `Process` when `Quickshell.Hyprland` exposes it (workspaces, windows, focused monitor, events, GlobalShortcut).
- Hyprland 0.55+ config is Lua: autostart the shell with `hl.on("hyprland.start", function() hl.exec_cmd("qs -c mybar") end)`; never `exec-once =`.
- Paths in strings (Image.source, FileView) resolve to Quickshell's CWD, not the QML file. Use `Qt.resolvedUrl("...")`, or `Quickshell.dataPath()/cachePath()/statePath()` for reserved dirs.
- A window created opaque stays opaque: set `surfaceFormat.opaque = false` before switching to translucent colors.

## Modern UI baseline (non-negotiables)

1. **Dense, no dead space** — layouts fill their region; leftover space is distributed, never left as holes.
2. **Friendly** — comfortable targets (≥24 px in bars), hover/active states, soft contrast, readable sizes.
3. **No overlaps** — one hitbox per control, ≥4 px separation, text elides before colliding, popups offset from their trigger.
4. **Hack Nerd Font** is the baseline typeface (monospace; glyphs double as icons; Regular/Bold only). Full rules in `references/design-and-effects.md`.

## Where to go next (references/)

- `references/design-and-effects.md` — design tokens, **theme contract for the palette generator binary** (settings.json + base16/roles, live reload, no matugen), glass/blur, elevation, **layout hygiene (density, friendliness, zero overlap)**, **dimensions & transitions tokens (equisdots experimental vs Caelestia/MD3)**, Hack Nerd Font typography, widget recipes, quality gate.
- `references/qml-language.md` — QML for shell authors: imports, properties/bindings/scoping, functions/lambdas, signals, types/singletons, models, reactive and lazy-loading semantics.
- `references/modules.md` — full module catalog and notable types (Quickshell, .Wayland, .Hyprland, .Io, Services.*, .Widgets, .Networking, .Bluetooth, ...).
- `references/patterns.md` — bar+popup+OSD+lockscreen+notification/tray patterns, fixed-surface reveals, Process/FileView/JsonAdapter data flow, per-monitor state.
- `references/migration.md` — 0.2 to 0.3 migration: layer-surface sizing, `qs.*` imports, `shellDir`, exclusion and Qt style, 0.3 additions, and a checklist.
- `references/debugging.md` — CLI logs, crash handler, QML debugger, qmlls, common runtime failures, memory/performance work.
