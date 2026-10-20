# Quickshell module catalog & patterns (v0.3.x, October 2026)

## Runtime
- Repo `git.outfoxxed.me/quickshell/quickshell` (GitHub mirror quickshell-mirror/quickshell); docs **quickshell.org** (versioned; v0.3.2 = 0.3.x); LGPL-3.0. Arch extra `quickshell` (0.3.2), AUR `quickshell-git`. Distro availability: Fedora Rawhide + COPR errornointernet/quickshell, Debian unstable/testing, Ubuntu PPA avengemedia/danklinux, OBS home:AvengeMedia:danklinux, Gentoo GURU, Guix, nixpkgs.
- Run: `qs -c <name>` / `qs -p <path>`; instance ops `qs list [-a] [-j]`, `qs log [-t N] [-f]`, `qs kill -i <id>`, `qs ipc show|call|listen|prop get`; `qs --debug <port> [--waitfordebug]` for QML debugging. Hot reload on save.
- Env (0.3): `QS_DISABLE_FILE_WATCHER`, `QS_DISABLE_CRASH_HANDLER`, `QS_CRASHREPORT_URL`, `QS_APP_ID`, `QS_DROP_EXPENSIVE_FONTS`, `QS_ICON_THEME`, `QS_NO_RELOAD_POPUP`, `DefaultEnv` pragma. Shell dir: `Quickshell.shellDir` (renamed from shellRoot, 0.2). Imports: `import qs.path.to.module`; `//@ pragma Singleton`; app-id via `//@ pragma AppId`.
- v0.3.2 (2026-10-08): Qt 6.12 support, Hyprland new workspace address format, session-lock/PAM/notification fixes. v0.3.0 added: Polkit agent, idle inhibitors/timeouts, shortcut inhibition, FloatingWindow min/max/fullscreen + move/resize, Pipewire peak monitor, Networking, WindowManager (ext-workspace), BackgroundEffect, IPC signal listeners, version-gated pragmas.

## Core types (Quickshell module)
Windows: `PanelWindow` (layer-shell bar) `PopupWindow` (anchored) `FloatingWindow` (managed window; dialogs, move/resize, min/max/fullscreen since 0.3) `QsWindow`.
Logic: `Scope` (non-visual root) `Singleton` `Variants` (per-screen instances) `LazyLoader` `BoundComponent` `ObjectModel` `ShellRoot`.
Utils: `SystemClock` `PersistentProperties` `DesktopEntries` `ColorQuantizer` `Region` `Edges` `ExclusionMode` `PopupAnchor` `QsMenuOpener/Handle/Entry/Anchor/ButtonType` `ShellScreen` `Reloadable` `Retainable(Lock)` `TransformWatcher` `ElapsedTimer` `EasingCurve` `Intersection` `ObjectComparison`.
Global singleton `Quickshell`: `.screens` `.shellDir` `.cacheDir` `.execDetached()`. `QuickshellSettings` for user settings.

## Wayland module
`WlrLayershell` `WlrLayer` `Toplevel` `ToplevelManager` `WlrKeyboardFocus` `WlSessionLock(+Surface)` `ScreencopyView` (Vulkan since 0.3) `IdleInhibitor` `IdleMonitor` `ShortcutInhibitor` `BackgroundEffect` (ext-background-effect blur).

## Hyprland module (Quickshell.Hyprland)
`Hyprland` (IPC singleton) `HyprlandEvent` `HyprlandMonitor` `HyprlandWorkspace` `HyprlandWindow` `HyprlandToplevel` `HyprlandFocusGrab` `GlobalShortcut`. No type named KeyboardShortcut. v0.3 supports Lua-style config for the module (Hyprland 0.55+ era).

## Io / services / other modules
Io: `Process` `StdioCollector` `FileView` `Socket` `SocketServer` `IpcHandler` `JsonAdapter` `JsonObject` `DataStream` `SplitParser`.
Services (Quickshell.Services.*): `Notifications` (NotificationServer/Notification — DIY notification daemon) `SystemTray` (SystemTray/Item — SNI host) `Mpris` `Pipewire` (Pipewire/PwNode/…/PwNodePeakMonitor) `UPower` `Pam` (PamContext) `Greetd` `Polkit` (PolkitAgent/AuthFlow).
Others: `Quickshell.Networking` (NM-backed Network/NetworkDevice/WifiDevice/WiredDevice/WifiNetwork/NMSettings) `Quickshell.Bluetooth` (BlueZ) `Quickshell.DBusMenu` `Quickshell.Widgets` (ClippingRectangle/IconImage/Wrapper*) `Quickshell.I3` `Quickshell.WindowManager` (WindowManager/Windowset/…, ext-workspace).

## PanelWindow semantics
`anchors.{left,right,top,bottom}` attach screen edges (opposite pair = full width/height; all off by default) · `margins` apply to anchored edges · `exclusiveZone` reserves compositor space (needs exactly 1 or 3 anchors; implies ExclusionMode.Normal) · `exclusionMode` Auto (default; since 0.2 auto-adds zone for single-anchor panels)/Normal/Ignore · `focusable` → WlrLayershell.keyboardFocus · `aboveWindows` → layer · `screen` binding for per-monitor instances.
Size with `implicitWidth`/`implicitHeight`; direct `width`/`height` on `PanelWindow`/`WlrLayershell` is deprecated in 0.3.x and forces a surface resize. Keep the layer surface size stable during reveal animations and animate/clip the content. Migration and deprecations: see skill `quickshell` → `references/migration.md`.

## Examples
Minimal bar, multi-monitor Scope+Variants+Process pattern, PopupWindow with `anchor.window`/`anchor.rect` + `HyprlandFocusGrab`: see the hyprland-qml agent SKILL body (canonical snippets).

## Real-world configs to study
caelestia-dots/shell (Soramane) · end-4 dots-hyprland (Illogical-Impulse) · zephyr (flickowoa) · vaxry's personal Quickshell config · wiki showcase: Noctalia, DankMaterialShell (Quickshell + Go).
