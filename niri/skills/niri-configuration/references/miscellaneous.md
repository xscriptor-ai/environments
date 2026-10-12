# Miscellaneous top-level options: operational guide

Copy-paste snippets and the caveats that matter in practice. Baseline:
niri 26.04 (2026-04-25).

## Autostart

Three mechanisms, in increasing order of preference on a systemd session.

### 1. `spawn-at-startup` (process, no shell)

Use when you have a simple command with separate arguments. No shell features.

```kdl
spawn-at-startup "waybar"
spawn-at-startup "swaybg" "-i" "/home/user/wallpaper.png"
```

### 2. `spawn-sh-at-startup` (shell command)

Since: 25.08. Use for variables, pipes, `&&`, or `~` expansion. The whole string
goes to `sh` verbatim.

```kdl
spawn-sh-at-startup "wl-paste --watch cliphist store"
spawn-sh-at-startup "qs -c ~/source/qs/MyAwesomeShell"
```

### 3. xdg-desktop-autostart / systemd user services

When niri runs as a systemd session (via `niri-session` or a display manager),
niri supports xdg-desktop-autostart out of the box. Apps configured to autostart
in GNOME "just work", with no `spawn-at-startup` needed.

Prefer this over `spawn-at-startup` for:

- apps you also want under other desktops,
- things that benefit from systemd ordering/restart (for example a shell,
  notification daemon, or portals),
- Flatpak apps, whose `.desktop` autostart entries are honored.

Check status:

```bash
systemctl --user status --user <unit>
systemctl --user list-dependencies graphical-session.target
```

Rule of thumb: use systemd user units for services that must restart or be
ordered; use `spawn-at-startup` for one-shot companions.

## Environment variables and the systemd caveat

`environment {}` only affects processes niri itself spawns. It does not enter
the systemd global environment.

```kdl
environment {
    QT_QPA_PLATFORM "wayland"
    ELECTRON_OZONE_PLATFORM_HINT "auto"
    DISPLAY null
}
```

Consequence: if a desktop shell is started by systemd and you launch apps from
its launcher, those apps will not see these variables. To make variables visible
to everything, set them in the login shell config (for example
`~/.bash_profile` / `~/.zprofile`); `niri-session` runs through the login shell
and imports those variables into systemd before starting niri. Note that this
also applies to other compositors.

Debug what a process actually sees:

```bash
tr '\0' '\n' < /proc/$(pgrep -n waybar)/environ | sort
```

## Cursor hiding

Both options are Since: 0.1.10.

```kdl
cursor {
    hide-when-typing                 // hide while keys are pressed
    hide-after-inactive-ms 1000      // hide after 1s without movement
}
```

- `hide-when-typing` can break Wine/Wayland games using mouselook: if the view
  jumps when you press a key and move the mouse, comment this out.
- `hide-after-inactive-ms` is a plain millisecond count; omit the node to keep
  the cursor always visible after inactivity.
- Theme/size live in the same block:

```kdl
cursor {
    xcursor-theme "breeze_cursors"
    xcursor-size 48
}
```

## Screenshot path

The path is formatted with `strftime(3)`; a leading `~` expands to home. niri
creates the last directory automatically.

```kdl
screenshot-path "~/Pictures/Screenshots/Screenshot from %Y-%m-%d %H-%M-%S.png"
```

Common `strftime` specifiers:

| Specifier | Value |
| --- | --- |
| `%Y` | 4-digit year |
| `%m` | month, zero-padded |
| `%d` | day of month, zero-padded |
| `%H` | hour, 24-hour, zero-padded |
| `%M` | minute, zero-padded |
| `%S` | second, zero-padded |
| `%F` | `%Y-%m-%d` |
| `%T` | `%H:%M:%S` |

Disable saving to disk entirely with `null` (screenshots still go to the
clipboard):

```kdl
screenshot-path null
```

Use a subdirectory you own; niri creates only the final component.

## Overview styling

Since: 25.05.

```kdl
overview {
    zoom 0.5                 // 0 to 0.75; lower = smaller workspaces
    backdrop-color "#262626" // alpha ignored; per-output override available

    workspace-shadow {
        // off
        softness 40
        spread 10
        offset x=0 y=10
        color "#00000050"
    }
}
```

- `zoom` below `0.5` fits more workspaces; above makes each larger.
- `backdrop-color` shows behind and between workspaces.
- `workspace-shadow` mirrors the layout `shadow` section but is tuned for a
  normalized 1080 px-tall workspace, so use larger values than window shadows.
- Disable the shadow entirely with `off`.

The backdrop color can also be overridden per output in the `output "NAME"`
section for a mixed-DPI setup.

## Clipboard primary selection

Since: 25.02.

```kdl
clipboard {
    disable-primary
}
```

Disables middle-click paste (the Wayland primary selection). The change applies
only to applications started after the edit, so restart affected apps after
toggling it.

## Blur tuning

Since: 26.04. `blur {}` is global; enabling blur itself uses `ext-background-effect`
or a `background-effect { blur true }` rule in a window/layer rule.

```kdl
blur {
    // off
    passes 3
    offset 3
    noise 0.02
    saturation 1.5
}
```

These four values are the defaults.

Tuning order (increase `offset` before `passes`):

1. Start from `passes 3`, `offset 3`.
2. Increase `offset` gradually. This is free on the GPU and widens the blur.
3. When you start seeing artifacts (ghosting/banding), stop.
4. If you still want a smoother blur, raise `passes` by 1 (costs GPU), then go
   back to step 2 and increase `offset` again.
5. Repeat until it looks right.

Notes:

- `noise` fights color banding on smooth backgrounds; keep it small (`0.01` to
  `0.05`).
- `saturation` above `1` makes the blurred backdrop more vivid; below `1` more
  muted.
- `off` disables blur globally, including client-requested blur. Use it to
  A/B-test for GPU cost.
- Confirm the effect is actually active: the window must be semitransparent, and
  focus ring/border can draw over the blur.
