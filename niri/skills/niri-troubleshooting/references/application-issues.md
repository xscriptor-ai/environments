# Per-application workarounds

Documented fixes for specific applications on niri, plus general notes on
client-side vs server-side decorations. Baseline: niri 26.04 (2026-04-25).

## General: CSD, SSD, and `prefer-no-csd`

Wayland clients choose their own decorations:

- **CSD** (client-side decorations): the window draws its own title bar and
  rounded corners. Its shape is arbitrary, so niri draws borders/focus rings as
  a solid background rectangle behind it (visible through semitransparent
  windows).
- **SSD** (server-side decorations): niri negotiates decorations through the
  xdg-decoration protocol and can draw borders and focus rings natively.

Set the top-level `prefer-no-csd` flag to ask apps to omit CSD and to inform them
they are tiled:

```kdl
prefer-no-csd
```

Changing `prefer-no-csd` does not fully affect already running applications
(it makes some windows rectangular but does not remove title bars, partly to
work around an SDL2 bug). **Restart the applications** after changing it.

Trade-off: with `prefer-no-csd`, edge resize handles do not show; resize by
holding `Mod` and the right mouse button instead.

## Electron applications

Electron can run directly on Wayland, but it is not the default. Which fix
applies depends on the Electron version.

Electron >= 39 - pass the command-line flag if the app does not default to
Wayland:

```
--ozone-platform=wayland
```

Electron < 39 - set an environment variable in the niri config:

```kdl
environment {
    ELECTRON_OZONE_PLATFORM_HINT "auto"
}
```

Electron <= 28 - pass command-line flags to the target application:

```
--enable-features=UseOzonePlatform --ozone-platform-hint=auto
```

If the app has a desktop entry, put the arguments in its `Exec` line.

## VSCode

If some VSCode hotkeys misbehave, start Xwayland and set `DISPLAY=:0` for VSCode,
while still running it with the Wayland backend. VSCode currently queries the
X server unconditionally for a keymap.

## JetBrains IDEs

JetBrains IDEs can run natively on Wayland but do not by default.

For JetBrainsRuntime > 17, add this VM option under
`help -> edit custom vm options -> add`:

```
-Dawt.toolkit.name=WLToolkit
```

If the settings window fails to load under Wayland and the UI becomes
unresponsive, also add:

```
-Dsun.awt.wl.WindowDecorationStyle=builtin
```

This gives the settings window a titlebar but makes the IDE functional.

## WezTerm

> Both issues appear fixed in the WezTerm nightly build.

Bug 1: WezTerm waits for a zero-sized Wayland configure event, so its window
never shows. Work around with a window rule (included in the default config):

```kdl
window-rule {
    match app-id=r#"^org\.wezfurlong\.wezterm$"#
    default-column-width {}
}
```

The empty `default-column-width {}` lets WezTerm pick its own initial width.

Bug 2: WezTerm chooses a wrong size in the tiled state and cannot be resized.
niri puts windows in the tiled state with `prefer-no-csd`. If you hit this,
comment out `prefer-no-csd` and restart WezTerm.

## Ghidra

Some Java apps like Ghidra show up blank under xwayland-satellite. Run them with:

```
_JAVA_AWT_WM_NONREPARENTING=1
```

## Zen Browser

DMABUF screencasts are disabled in Zen, so screencasting does not work out of
the box. Open `about:config` and set:

```
widget.dmabuf.force-enabled = true
```

## GTK 4 dead keys / Compose

GTK 4.20 stopped handling dead keys and Compose on its own on Wayland. Either run
an IME like IBus or Fcitx5, or set:

```kdl
environment {
    GTK_IM_MODULE "simple"
}
```

Note that the niri `environment` block does not propagate to apps and shells
started by systemd (for example DankMaterialShell and its launcher). For those,
set the variable in your login shell config such as `~/.bash_profile`; it will
then apply to all compositors, not just niri.

## Fullscreen games (gamescope)

Many native and Wine games have issues under non-stacking desktops. Valve's
gamescope usually avoids them:

```sh
gamescope -f -w 1920 -h 1080 -W 1920 -H 1080 --force-grab-cursor --backend sdl -- <game>
```

- Replace the width/height values (1080p shown) with your resolution.
- `--force-grab-cursor` uses relative mouse movement, preventing the cursor from
  escaping the game window on multi-monitor setups.
- `--backend sdl` is currently required because gamescope's default Wayland
  backend does not lock the cursor properly.

Steam users should use gamescope via a game's launch options, replacing the
executable with `%command%`. Lutris exposes its own gamescope options.

This method does not require Xwayland for X11 games because gamescope creates its
own Xwayland server. For Wayland-native games, pass `--expose-wayland` to
gamescope to remove X11 entirely.

## Steam

Some systems show a fully black Steam window. Via Steam's tray icon (or by
finding the Steam menu at the top left), go to Settings -> Interface and
**disable** GPU accelerated rendering in web views. Restart Steam.

If you do not want to disable GPU acceleration, try the launch argument:

```
-system-composer
```

Steam notifications ignore the standard notification daemon and appear as
floating windows in the center. Move them with a window rule:

```kdl
window-rule {
    match app-id="steam" title=r#"^notificationtoasts_\d+_desktop$"#
    default-floating-position x=10 y=10 relative-to="bottom-right"
}
```

## Waybar and other GTK 3 components

If rounded Waybar corners show black pixels, set the Waybar opacity to `0.99`.
GTK 3 has a bug where it reports a surface as fully opaque even with rounded
corners, so niri fills the transparent corner pixels with black. An opacity below
1 stops GTK reporting the surface as opaque.

## X11 apps that need global coordinates

See the `niri-session-integration` skill's `references/xwayland.md` for
nested-compositor fallbacks (labwc, rootful Xwayland, xwayland-run, Cage,
gamescope) for X11 apps that position windows at specific screen coordinates.
