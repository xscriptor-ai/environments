# Xwayland and X11 applications

niri does not integrate Xwayland the way most other compositors do; it uses
`xwayland-satellite` and offers nested-compositor fallbacks for the rare X11
client that misbehaves. Baseline: niri 26.04 (2026-04-25).

## xwayland-satellite integration (Since: 25.08)

niri integrates with [xwayland-satellite] out of the box. Requirements:

- `xwayland-satellite >= 0.7` installed and available in `$PATH`.

With no further configuration, niri:

- creates X11 sockets on disk,
- exports `$DISPLAY`,
- spawns `xwayland-satellite` on demand when an X11 client connects,
- automatically restarts it if it dies.

If you previously had a custom config that manually started `xwayland-satellite`
and set `$DISPLAY`, **remove those customizations** so the automatic integration
can work.

This is used instead of Xwayland directly because X11 requires the compositor to
implement parts of an X11 window manager and a global coordinate system niri does
not have. xwayland-satellite handles the X11 peculiarities and gives niri normal
Wayland windows to manage.

### Verifying the integration

Check the niri unit log for the X11 socket line:

```sh
journalctl --user-unit=niri -b
```

Expected output includes both sockets:

```
niri[...]: listening on Wayland socket: wayland-1
niri[...]: IPC listening on: /run/user/1000/niri.wayland-1.2474.sock
niri[...]: listening on X11 socket: :0
```

Then confirm the environment variable:

```sh
echo "$DISPLAY"
# :0
```

xwayland-satellite works well with most applications: Steam, games, Discord,
and even Ardour with Wine Windows VST plugins.

### Disabling or customizing

Control the integration with the top-level `xwayland-satellite` option
(Since: 25.08):

```kdl
xwayland-satellite {
    // off                                  // disable: no X11 socket, no DISPLAY
    path "xwayland-satellite"               // default; looked up like any program
}
```

`off` disables the integration entirely. `path` points at a custom build:

```kdl
xwayland-satellite {
    path "~/source/rs/xwayland-satellite/target/release/xwayland-satellite"
}
```

## X11 apps that want global coordinates

X11 apps that position windows or bars at specific screen coordinates will not
behave correctly under xwayland-satellite and need a nested compositor. The
options below each provide an X11 environment inside a Wayland window.

### labwc

[labwc] is a stacking Wayland compositor with built-in Xwayland.

```sh
labwc                                        # opens as a niri window
env DISPLAY=:0 glxgears                      # run X11 apps inside it
```

### Xwayland in rootful mode

Invoke Xwayland directly and run an X11 window manager inside it:

```sh
Xwayland                                     # black, resizable window; Mod+Shift+F to fullscreen
env DISPLAY=:0 i3                            # an X11 WM inside
env DISPLAY=:0 flatpak run com.valvesoftware.Steam
```

With a fullscreen game inside a fullscreen rootful Xwayland you get a fairly
normal gaming experience.

> If you do not run an X11 window manager, Xwayland will close and reopen its
> window every time all X11 windows close and a new one opens. Start an X11 WM
> inside, or keep some long-running X11 window open, to prevent this.

**Clipboard caveat:** rootful Xwayland does not currently share the clipboard
with the compositor. Bridge textual data manually with [wl-clipboard]:

```sh
env DISPLAY=:0 xsel -ob | wl-copy                 # Xwayland -> niri
wl-paste -n | env DISPLAY=:0 xsel -ib             # niri -> Xwayland
```

Bind them if useful:

```kdl
binds {
    Mod+Shift+C { spawn "sh" "-c" "env DISPLAY=:0 xsel -ob | wl-copy"; }
    Mod+Shift+V { spawn "sh" "-c" "wl-paste -n | env DISPLAY=:0 xsel -ib"; }
}
```

### xwayland-run

[xwayland-run] runs one X11 client in a dedicated rootful Xwayland server,
handling the server, `DISPLAY`, and xauth, and closing the server when the client
exits:

```sh
xwayland-run <Xwayland arguments> -- your-x11-app <X11 app arguments>
```

Example:

```sh
xwayland-run -geometry 800x600 -fullscreen -- wine wingame.exe
```

### Cage

[Cage] runs a nested Wayland session that also supports Xwayland, with no extra
X11 window manager needed:

```sh
cage -- /path/to/application
```

Cage is meant for kiosks, so it only shows a single, topmost, fullscreen window.
You can prefix an application's desktop entry `Exec`:

```ini
[Desktop Entry]
Type=Application
Name=Spotify
Exec=cage -- flatpak run com.spotify.Client
Terminal=false
```

### gamescope

[gamescope] runs X11 games and even Steam itself:

```sh
gamescope -- flatpak run com.valvesoftware.Steam
gamescope -W 2560 -H 1440 -w 2560 -h 1440 -f -- flatpak run com.valvesoftware.Steam
```

Like Cage, gamescope shows only a single topmost window. For fullscreen games
see `application-issues.md`, which covers `--force-grab-cursor` and `--backend sdl`.

> If Steam terminates abnormally inside gamescope, later gamescope invocations
> may fail to start it. Run Steam inside a rootful Xwayland, exit it normally,
> and gamescope will work again.

## Proton-GE native Wayland

Some games can run as native Wayland clients, sidestepping X11, using a custom
Proton build such as [Proton-GE]. Set the launch option:

```sh
PROTON_ENABLE_WAYLAND=1 %command%
```

This is experimental and may not work with every game.

[xwayland-satellite]: https://github.com/Supreeeme/xwayland-satellite
[xwayland-run]: https://gitlab.freedesktop.org/ofourdan/xwayland-run
[labwc]: https://github.com/labwc/labwc
[Cage]: https://github.com/cage-kiosk/cage
[gamescope]: https://github.com/ValveSoftware/gamescope
[wl-clipboard]: https://github.com/bugaevc/wl-clipboard
[Proton-GE]: https://github.com/GloriousEggroll/proton-ge-custom
