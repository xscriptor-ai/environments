# Quickshell 0.2 to 0.3: migration and deprecations

Verified 2026-10-20 against the Quickshell v0.3.2 changelog, the v0.3.2 documentation (Item Size and Position) and a live Quickshell 0.3.2 session.

Use this page when porting an older shell or reviewing code that may still use removed or renamed APIs. The detailed API remains in `SKILL.md` and the other references; this page is the migration checklist.

## 1. Layer-surface sizing (0.3.x)

Quickshell 0.3.x logs:

```text
Setting `width` is deprecated. Set `implicitWidth` instead.
Setting `height` is deprecated. Set `implicitHeight` instead.
```

when a layer-shell window assigns its actual size.

- Use `implicitWidth` / `implicitHeight` on `PanelWindow` / `WlrLayershell`.
- Read `width` / `height` when you need the actual surface size; do not assign them.
- Do not bind the implicit size to an animated reveal. A surface resize forces a Wayland configure and buffer reallocation; during a 60-144 Hz animation this causes jank, and after closing the compositor can briefly stretch the old buffer.
- Keep the layer surface at its maximum size and animate/clip the content inside it. Mask the transparent area so clicks pass through.
- A `PanelWindow` with opposite anchors gets the screen dimension on that axis. Use margins and a fixed implicit size for the other axis.

See `patterns.md` for the fixed-surface reveal pattern.

## 2. Imports and paths (0.2)

- `import "root:/foo"` is replaced by `import qs.foo` (root-relative imports). Keep `qs.*` for multi-file shells; `.qmlls.ini` makes it LSP-friendly.
- Relative paths that escape the shell directory (`../../foo.png`, etc.) are not allowed. Use `Qt.resolvedUrl()` inside the shell, or an absolute path/URL for external files.
- `Quickshell.shellRoot` is `Quickshell.shellDir`.
- Add an empty `.qmlls.ini` next to `shell.qml`; Quickshell fills it. Gitignore it.

## 3. PanelWindow and exclusion (0.2+)

- `ExclusionMode.Auto` adds an exclusion zone for single-anchor panels (0.2). This can surprise a panel that was meant to float; set `exclusionMode: ExclusionMode.Ignore` when you do not want a strut.
- Margins opposite the anchor are included in the exclusion zone.
- `exclusiveZone` requires exactly 1 or 3 anchors; with 0/2/4 anchors it does not reserve space.
- Set `WlrLayershell.namespace` per surface group. The default namespace is `quickshell`; a stable namespace makes Hyprland layer rules and `hyprctl layers` precise.

## 4. Qt Quick Controls styling (0.2)

`QT_QUICK_CONTROLS_STYLE` and `QT_STYLE_OVERRIDE` are ignored unless the root shell uses:

```qml
//@ pragma RespectSystemStyle
```

Without it Quickshell forces Fusion for consistency. Prefer the shell's own theme or the official Hyprland style where applicable.

## 5. 0.3 breaking changes and additions

- Config paths are no longer canonicalized. The shell id is derived from the symlink path; a config behind a symlink gets a new shell id and new state/cache directories. Move the old directories or set an explicit `ShellId`.
- `FloatingWindow`: min/max/fullscreen and move/resize events; dialog windows.
- `BackgroundEffect` (ext-background-effect) for real backdrop blur where the compositor supports it.
- `WindowManager` / `Windowset` (ext-workspace) for compositor-agnostic workspace views.
- `Quickshell.Networking` (NetworkManager) and `Quickshell.Bluetooth` (BlueZ).
- `PolkitAgent`, `IdleInhibitor`, `IdleMonitor`, `ShortcutInhibitor`.
- `Pipewire.PwNodePeakMonitor` for audio peaks.
- `IpcHandler` signal listeners and version-gated `//@ if` pragmas.
- `ScreencopyView` Vulkan backend; per-corner `Region` radius.
- The Hyprland module understands the 0.55+ Lua config era.

## 6. 0.3.2

- Qt 6.12 support.
- Hyprland workspace address format support.
- Session-lock, PAM subprocess, notification and PipeWire fixes. See the official changelog.

## 7. Migration checklist

1. Check the target: `qs --version`; read `qs log` on startup.
2. Search the shell for `width:` / `height:` under `PanelWindow` / `WlrLayershell`; convert to implicit sizes.
3. Search for `root:/`, `shellRoot` and `../../` paths; convert to `qs.*`, `shellDir` and `Qt.resolvedUrl()`.
4. Search for `QT_QUICK_CONTROLS_STYLE` / `QT_STYLE_OVERRIDE`; add `RespectSystemStyle` only if the shell really follows the system style.
5. Check single-anchor `PanelWindow`s for unintended `ExclusionMode.Auto` struts.
6. Re-test popups, lockscreen, notifications and tray after upgrading; keep one notification server and one SNI host per session.
7. Keep the surface size stable during animations; animate and clip inside the surface.
