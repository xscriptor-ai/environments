# Quickshell module catalog & patterns (v0.3.x, September 2026)

## Runtime
- Repo quickshell-mirror/quickshell; docs quickshell.outfoxxed.me; LGPL-3.0. Arch extra `quickshell` (0.3.1), AUR `quickshell-git`. Distro availability: Fedora COPR errornointernet/quickshell, Debian/Ubuntu (PPA avengemedia/danklinux), Gentoo GURU, nixpkgs, openSUSE OBS.
- Run: `quickshell -c <name>` or `-p <path>`; instance mgmt subcommands (`qs list|log|kill` per changelog — verify locally). Hot reload on save.
- Env (0.3): `QS_DISABLE_FILE_WATCHER`, `QS_DISABLE_CRASH_HANDLER`, `QS_CRASHREPORT_URL`, `QS_APP_ID`, `QS_DROP_EXPENSIVE_FONTS`, `DefaultEnv` pragma.
- Shell dir: `Quickshell.shellDir` (renamed from shellRoot, 0.2). Imports: `import qs.path.to.module`; `//@ pragma Singleton`; app-id via `//@ pragma AppId`.

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

## Examples
Minimal bar, multi-monitor Scope+Variants+Process pattern, PopupWindow with `anchor.window`/`anchor.rect` + `HyprlandFocusGrab`: see the hyprland-qml agent SKILL body (canonical snippets).

## Real-world configs to study
caelestia-dots/shell (Soramane) · end-4 dots-hyprland (Illogical-Impulse) · zephyr (flickowoa) · vaxry's personal Quickshell config · wiki showcase: Noctalia, DankMaterialShell (Quickshell + Go).
