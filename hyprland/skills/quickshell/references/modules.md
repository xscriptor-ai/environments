# Quickshell module & type catalog (v0.3.x, verified Oct 2026)

Per-module index of the 0.3.0 docs types list plus the v0.3.2 changelog. Anything not listed here still exists in the live docs — check quickshell.org/docs/v0.3.0/types/.

## Quickshell (core)

Windows: `PanelWindow` (layer-shell) · `PopupWindow` (anchored popup) · `FloatingWindow` (managed window; dialogs, move/resize, min/max/fullscreen) · `QsWindow` (base; `surfaceFormat`, `updatesEnabled`).

Structure/logic: `Scope` (non-visual root) · `Singleton` · `Variants` (per-model instance sets, e.g. screens) · `LazyLoader` · `BoundComponent` · `ObjectModel` · `ObjectRepeater` · `ScriptModel` · `ShellRoot` · `ShellScreen`.

Values/helpers: `SystemClock` · `PersistentProperties` · `DesktopEntries`/`DesktopEntry`/`DesktopAction` · `ColorQuantizer` · `Region`/`RegionShape` · `Edges` · `ExclusionMode` · `PopupAnchor`/`PopupAdjustment` · `QsMenuOpener`/`QsMenuHandle`/`QsMenuEntry`/`QsMenuAnchor`/`QsMenuButtonType` · `Reloadable`/`Retainable`/`RetainableLock` · `TransformWatcher` · `ElapsedTimer` · `EasingCurve` · `Intersection`.

Global singleton `Quickshell`: `Quickshell.screens`, `.shellDir` (renamed from shellRoot in 0.2), `.dataDir`/`.stateDir`/`.cacheDir`, `Quickshell.dataPath()/statePath()/cachePath()`, `.execDetached()`, `.iconPath()`, `.hasVersion()`, `QuickshellSettings`.

## Quickshell.Wayland

`WlrLayershell` (raw layer-shell surface; PanelWindow wraps it) · `WlrLayer` · `WlrKeyboardFocus` · `Toplevel`/`ToplevelManager` · `WlSessionLock`/`WlSessionLockSurface` (lockscreen) · `ScreencopyView` (screencopy; Vulkan since 0.3) · `IdleInhibitor` · `IdleMonitor` · `ShortcutInhibitor` · `BackgroundEffect` (ext-background-effect blur).

## Quickshell.Hyprland

Singleton `Hyprland` (IPC): `Hyprland.monitors`, `.workspaces`, `.focusedWorkspace`, `.focusedMonitor`, `.activeToplevel`, `.focusedWindow`, `.dispatch()`, `.requestDispatch()`; events via `HyprlandEvent`. Types: `HyprlandMonitor` · `HyprlandWorkspace` · `HyprlandWindow`/`HyprlandToplevel` · `HyprlandFocusGrab` · `GlobalShortcut` (register compositor binds from QML; 0.3 understands the Lua-era config). No type named KeyboardShortcut.
Note: v0.3.2 added support for Hyprland's new workspace **address** format — keep `quickshell` updated on 0.57+ Hyprland.

## Quickshell.Io

`Process` (spawn/detach; `command`, `running`, `manuallyStarted`, `stdout/stderr`) · `StdioCollector` (whole output string) · `SplitParser` (line/stream chunks) · `DataStream`/`DataStreamParser` (binary) · `FileView`/`FileViewAdapter` (watched text files; `watchChanges`, `printErrors`) · `Socket`/`SocketServer` · `IpcHandler` (expose shell functions to `qs ipc`) · `JsonAdapter`/`JsonObject` (typed JSON over FileView/Process).

## Quickshell.Services.*

- `Notifications`: `NotificationServer` (implement the org.freedesktop.Notifications daemon in QML), `Notification`, `NotificationAction`, enums `NotificationUrgency`/`NotificationCloseReason`.
- `SystemTray`: `SystemTray` + `SystemTrayItem` (SNI host; unique per session), `Category`/`Status`.
- `Mpris`: `Mpris`, `MprisPlayer`, playback/loop enums.
- `Pipewire`: `Pipewire`, `PwNode(+Audio)`, `PwLink`, `PwLinkGroup`, `PwNodeLinkTracker` (redirect node output — app volume/mute), `PwObjectTracker`, `PwNodePeakMonitor` (0.3), enums.
- `UPower`: `UPower`, `UPowerDevice`, `PowerProfiles`/`PowerProfile`, device state/type enums.
- `Pam`: `PamContext` (lock screen auth), `PamResult`/`PamError`.
- `Polkit`: `PolkitAgent` + `AuthFlow` (0.3).
- `Greetd`: `Greetd`, `GreetdState`.

## Other modules

- `Quickshell.Networking` (NetworkManager): `Network`, `NetworkDevice`, `WifiDevice`, `WiredDevice`, `WifiNetwork`, `NMSettings`, ... (0.3; NetworkManager required).
- `Quickshell.Bluetooth` (BlueZ): `Bluetooth`, `BluetoothAdapter`, `BluetoothDevice`.
- `Quickshell.DBusMenu`: DBus menu models for SNI.
- `Quickshell.Widgets`: `ClippingRectangle`, `ClippingWrapperRectangle`, `IconImage`, `WrapperItem/WrapperArea/WrapperRectangle/WrapperManager/MarginWrapperManager`, `WrapperMouseArea`.
- `Quickshell.WindowManager` (0.3, ext-workspace): `WindowManager`, `Windowset`, `WindowsetProjection`, `ScreenProjection` — compositor-agnostic window/workspace view.
- `Quickshell.I3`: `I3`, `I3Event`, `I3Monitor`, `I3Workspace` (i3/Sway backend).

## Runtime env vars (0.3)

`QS_DISABLE_FILE_WATCHER` (no hot reload) · `QS_DISABLE_CRASH_HANDLER` · `QS_CRASHREPORT_URL` · `QS_APP_ID` · `QS_ICON_THEME` · `QS_DROP_EXPENSIVE_FONTS` · `QS_NO_XINERAMA_STRUTS` · `QS_NO_RELOAD_POPUP` · `QS_CONFIG_PATH`/`QS_CONFIG_NAME`. Plus all standard Qt (`QT_QPA_PLATFORM`, `QT_SCALE_FACTOR`, ...).

## Optional Qt packages (distro names vary)

`qtsvg` (SVG icons) · `qtimageformats` (WEBP, ...) · `qtmultimedia` (video/audio widgets) · `qt5compat` (gaussian blur in MultiEffect fallbacks; prefer MultiEffect).
