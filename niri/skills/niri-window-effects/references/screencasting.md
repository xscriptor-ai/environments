# Screencasting

Baseline: **niri 26.04** (2026-04-25).

## Portal-based screencasting requirements

niri's primary screencasting interface is through **portals and PipeWire**. It is
supported by OBS, Firefox, Chromium, Electron apps, Telegram, and others. Both
whole monitors and individual windows can be captured.

Requirements:

- A working D-Bus session.
- PipeWire.
- `xdg-desktop-portal-gnome`.
- niri running as a session, i.e. started through `niri-session` or from a
  display manager. Running the compositor as a nested window or bare on a TTY is
  not enough for portals.

On widely used distributions this should work out of the box.

Alternatively, tools that rely on the `ext-image-copy-capture` protocol or the
older `wlr-screencopy` also work; niri supports both.

## Block out windows and layers

Windows can be replaced with solid black rectangles in screencasts, useful for
password managers or messenger windows. Use the `block-out-from` window rule:

```kdl
// Block out password managers from screencasts.
window-rule {
    match app-id=r#"^org\.keepassxc\.KeePassXC$"#
    match app-id=r#"^org\.gnome\.World\.Secrets$"#

    block-out-from "screencast"
}
```

Layer surfaces such as notifications use the layer-rule equivalent:

```kdl
// Block out mako notifications from screencasts.
layer-rule {
    match namespace="^notifications$"

    block-out-from "screencast"
}
```

Two modes are available:

| Value | Effect |
| --- | --- |
| `"screencast"` | Blocks the surface only from `xdg-desktop-portal` screencasts |
| `"screen-capture"` | Blocks from *all* screen captures, including third-party screenshot tools |

Caveats:

- With `"screencast"`, third-party screenshot tools are **not** blocked. If you
  open a screenshot tool with preview while screencasting, blocked-out windows
  will be visible on the screencast. The built-in screenshot UI is not affected:
  you can select an area while seeing all windows normally, and on a screencast
  the selection UI shows windows blocked out.
- `"screen-capture"` also blocks the fully automatic actions `screenshot-screen`
  and `screenshot-window`, but still lets you use the interactive built-in
  screenshot UI.
- Do not block out based on a dynamically changing window title (for example a
  specific Firefox tab). Window title and app id are not double-buffered in the
  Wayland protocol, so sensitive contents can flash on the screencast for an
  instant when switching tabs or titles.

To preview and tune these rules, use the `preview-render` option in the debug
section of the config.

## Dynamic screencast target

Since: 25.05. niri exposes a special screencast stream shown as "niri Dynamic
Cast Target" in the screencast dialog. Pick it, then change what it shows with
these actions (they also work as key binds):

| Action | Effect |
| --- | --- |
| `set-dynamic-cast-window` | Cast the focused window, or `--id <id>` |
| `set-dynamic-cast-monitor` | Cast the focused monitor, or a named output |
| `clear-dynamic-cast-target` | Reset to an empty video stream |

The stream does not start until you make the first target selection. If the cast
target disappears (for example the target window closes), the stream returns to
empty. All dynamic casts share the same target, and a newly created dynamic cast
starts empty until you change it (to avoid sharing something sensitive by
mistake).

Interactive pick on the command line:

```sh
niri msg action set-dynamic-cast-window --id $(niri msg --json pick-window | jq .id)
```

Clear it:

```sh
niri msg action clear-dynamic-cast-target
```

## Indicate screencasted windows

Since: 25.02. The `is-window-cast-target=true` window-rule matcher matches
windows targeted by an ongoing individual-window screencast. It does not match
windows that merely happen to be visible in a full-monitor screencast. Use it
with special border colors to indicate what is being cast.

```kdl
// Indicate screencasted windows with red colors.
window-rule {
    match is-window-cast-target=true

    focus-ring {
        active-color "#f38ba8"
        inactive-color "#7d0d2d"
    }

    border {
        inactive-color "#7d0d2d"
    }

    shadow {
        color "#7d0d2d70"
    }

    tab-indicator {
        active-color "#f38ba8"
        inactive-color "#7d0d2d"
    }
}
```

This also works for windows targeted by dynamic screencasts, but not for windows
that just happen to be visible in a full-monitor cast.

## Windowed (fake/detached) fullscreen

Since: 25.05. When screencasting browser-based presentations, you often want to
hide the browser UI, which normally requires real fullscreen. On an ultrawide
monitor or when you want the browser to stay a smaller window, use
`toggle-windowed-fullscreen`: it tells the app it went fullscreen while leaving
it a normal, resizable, movable window.

```kdl
binds {
    Mod+Ctrl+Shift+F { toggle-windowed-fullscreen; }
}
```

Not all apps react to fullscreening, so it may look as if the bind did nothing.

## Screen mirroring with wl-mirror

niri has no built-in output mirroring. Use the third-party
[`wl-mirror`](https://github.com/Ferdi265/wl-mirror) tool, which mirrors an
output into a window. The example requires `jq`:

```kdl
binds {
    Mod+P repeat=false { spawn-sh "wl-mirror $(niri msg --json focused-output | jq -r .name)"; }
}
```

Focus the output you want to mirror, press the bind, move the `wl-mirror` window
to the target output, then fullscreen it (by default `Mod+Shift+F`).

## `xdg-desktop-portal-gnome` notes

- `xdg-desktop-portal-gnome` is the portal implementation niri's screencasting is
  built around; without it, portal-based casts (OBS, browsers) will not work.
- Because capture goes through the portal and PipeWire, running niri as a session
  (`niri-session` or a display-manager session) is required so the D-Bus
  activation and portal services are available.
- Interactive window picking in the screencast dialog is provided by the portal.
  For scripted, repeatable selection, use the dynamic cast target actions and
  `niri msg --json pick-window` instead.
