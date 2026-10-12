# Top-level options

Complete reference for everything that lives at the top level of the niri
config, outside the dedicated input/output/binds-family sections. Baseline:
niri 26.04 (2026-04-25).

## Section pointers

These top-level sections have their own documentation; only their location in
the file is described here.

| Section | Repeatable | What it configures |
| --- | --- | --- |
| `input {}` | no | Keyboard, touchpad, mouse, trackpoint, trackball, touch, tablet, gestures, focus-follows-mouse |
| `output "NAME" {}` | per output name | Mode, scale, transform, position, per-output backdrop, VRR, etc. List names with `niri msg outputs` |
| `binds {}` | no | Key and mouse bindings. Not defaulted: never delete it unless you want no binds |
| `switch-events {}` | no | Lid open/close and tablet-mode switch actions |
| `layout {}` | no | Gaps, column widths, focus ring, border, shadow, struts, tab indicators |
| `workspace "name" {}` | per workspace name | Named workspace placement and per-workspace layout overrides |
| `window-rule {}` | yes | Per-window behavior matched by app-id/title; rules stack in order |
| `layer-rule {}` | yes | Per-layer-shell behavior matched by namespace |
| `animations {}` | no | Global animation enable/slowdown and per-animation overrides |
| `gestures {}` | no | DND, hot-corners, and other gesture settings |
| `recent-windows {}` | no | Recent-windows view configuration |
| `debug {}` | no | Debugging hooks (see `niri-troubleshooting`) |
| `include "file.kdl"` | yes | Include another config file (Since: 25.11) |

Only `output`, `workspace`, `window-rule`, `layer-rule`, and `include` may be
repeated; all other sections appear exactly once.

## `spawn-at-startup`

Spawn a process when niri starts. The first argument is the program path/name,
followed by its arguments. Repeatable. Behaves like the `spawn` bind action.

```kdl
spawn-at-startup "waybar"
spawn-at-startup "alacritty"
```

Default: none. When niri runs as a systemd session, xdg-desktop-autostart works
out of the box, which is often preferable to this option.

## `spawn-sh-at-startup`

Since: 25.08.

Run a single shell command string at startup, passed verbatim to `sh`. Use it
for variables, pipes, and `~` expansion. Repeatable.

```kdl
spawn-sh-at-startup "qs -c ~/source/qs/MyAwesomeShell"
```

Default: none.

## `prefer-no-csd`

Flag. Ask applications to omit client-side decorations. If a client explicitly
requests CSD, the request is honored. Clients are also told they are tiled,
which removes some rounded corners. With it set, apps negotiating server-side
decorations via `xdg-decoration` get a focus ring/border drawn *around* them
without a solid background.

```kdl
prefer-no-csd
```

Default: off.

Note: changing this does not fully apply to already-running applications (title
bars remain, some windows become rectangular). Restart applications to apply it.
This is a workaround for an SDL2 bug.

## `screenshot-path`

Where screenshots are saved. A leading `~` expands to the home directory. The
path is formatted with `strftime(3)`. niri creates the last directory if needed.
Set to `null` to disable saving screenshots to disk.

```kdl
screenshot-path "~/Pictures/Screenshots/Screenshot from %Y-%m-%d %H-%M-%S.png"

// Disable saving to disk.
screenshot-path null
```

Default (shipped config): `"~/Pictures/Screenshots/Screenshot from %Y-%m-%d %H-%M-%S.png"`.

## `environment`

Set or remove environment variables for processes spawned by niri.

```kdl
environment {
    QT_QPA_PLATFORM "wayland"   // set a variable
    DISPLAY null                // remove a variable
}
```

Default: none.

Caveat: these variables do **not** propagate to the systemd global environment,
so applications started by systemd (for example via a shell's launcher) may not
see them. Set variables in the login shell config instead if you need them
everywhere; `niri-session` imports login-shell variables into systemd before
starting niri.

## `cursor`

Set the cursor theme and size, and export `XCURSOR_THEME` / `XCURSOR_SIZE`.

```kdl
cursor {
    xcursor-theme "breeze_cursors"
    xcursor-size 48

    hide-when-typing                 // Since: 0.1.10
    hide-after-inactive-ms 1000      // Since: 0.1.10
}
```

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `xcursor-theme` | string | system default | Cursor theme name |
| `xcursor-size` | integer | system default | Cursor size in pixels |
| `hide-when-typing` | flag | off | Hide the cursor while a key is pressed |
| `hide-after-inactive-ms` | integer (ms) | off | Hide after this much cursor inactivity |

`hide-when-typing` may interfere with Wine/Wayland games that use mouselook;
disable it if the view jumps when you press a key and move the mouse together.

## `overview`

Since: 25.05. Settings for the Overview (zoomed-out workspace view).

```kdl
overview {
    zoom 0.5
    backdrop-color "#262626"

    workspace-shadow {
        // off
        softness 40
        spread 10
        offset x=0 y=10
        color "#00000050"
    }
}
```

| Option | Type | Meaning |
| --- | --- | --- |
| `zoom` | float, `0` to `0.75` | How much workspaces shrink in the overview; lower is smaller |
| `backdrop-color` | color | Backdrop behind workspaces; alpha is ignored; per-output override available |
| `workspace-shadow` | section | Shadow behind workspaces; mirrors layout `shadow` |

`workspace-shadow` mirrors the layout `shadow` section (softness, spread,
offset, color, `off`) and is configured for a workspace normalized to 1080 px
tall, so use larger spread/offset/softness than for window shadows.

## `xwayland-satellite`

Since: 25.08. Integration with
[xwayland-satellite](https://github.com/Supreeeme/xwayland-satellite).

When a recent enough xwayland-satellite is found, niri creates the X11 sockets
and sets `DISPLAY`, then auto-spawns xwayland-satellite when an X11 client
connects. If Xwayland dies, niri keeps watching the socket and restarts it.

```kdl
xwayland-satellite {
    // off
    path "xwayland-satellite"
}
```

| Option | Default | Meaning |
| --- | --- | --- |
| `off` | integration on | Disable creation of the X11 socket and `DISPLAY` |
| `path` | `"xwayland-satellite"` | Path to the binary; non-absolute names are looked up on `PATH` |

## `clipboard`

Since: 25.02.

```kdl
clipboard {
    disable-primary
}
```

| Option | Default | Meaning |
| --- | --- | --- |
| `disable-primary` | off | Disable the primary clipboard (middle-click paste) |

Toggling `disable-primary` applies only to applications started afterward.

## `hotkey-overlay`

Settings for the "Important Hotkeys" overlay.

```kdl
hotkey-overlay {
    skip-at-startup
    hide-not-bound       // Since: 25.08
}
```

| Option | Default | Meaning |
| --- | --- | --- |
| `skip-at-startup` | off | Do not show the hotkey overlay at startup |
| `hide-not-bound` | off | Hide actions that are not bound (by default they are shown to prevent confusion) |

Customize which binds appear with the `hotkey-overlay-title` bind property.

## `config-notification`

Since: 25.08. Settings for the config created/failed notification.

```kdl
config-notification {
    disable-failed
}
```

| Option | Default | Meaning |
| --- | --- | --- |
| `disable-failed` | off | Do not show the "Failed to parse the config file" notification |

## `blur`

Since: 26.04. Global settings that affect all background blur (window- and
layer-surface). See `niri-window-effects` for enabling blur per window/layer.

```kdl
// These are the default values:
blur {
    // off
    passes 3
    offset 3
    noise 0.02
    saturation 1.5
}
```

| Option | Default | Meaning |
| --- | --- | --- |
| `off` | blur available | Disable all blur, both requested by clients and set in rules |
| `passes` | `3` | Number of dual-kawase downsample/upsample passes; more is smoother and costlier |
| `offset` | `3` | Pixel offset multiplier per pass; larger is smoother at no extra GPU cost, until artifacts appear |
| `noise` | `0.02` | Noise added on top of the blur, to reduce color banding |
| `saturation` | `1.5` | Saturation applied to the blurred background; `>1` increases, `<1` decreases |

Tuning: increase `offset` first (no extra GPU cost) until you see artifacts,
then increase `passes` by 1 and repeat. Fractions are allowed, e.g. `offset 3.0`
or `offset 3.5`.
