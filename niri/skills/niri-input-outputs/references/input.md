# Input reference

Complete reference for the niri `input {}` section. Baseline: niri 26.04
(2026-04-25). Written for `~/.config/niri/config.kdl`.

```kdl
input {
    keyboard { /* ... */ }
    touchpad { /* ... */ }
    mouse { /* ... */ }
    trackpoint { /* ... */ }
    trackball { /* ... */ }
    tablet { /* ... */ }
    touch { /* ... */ }

    // disable-power-key-handling
    // warp-mouse-to-focus
    // focus-follows-mouse
    // workspace-auto-back-and-forth
    // mod-key "Super"
    // mod-key-nested "Alt"
}
```

Device sections apply to every device of that type. Within them, most options
are **flags**: write the node to enable it, comment it out to disable it.

## Keyboard

```kdl
input {
    keyboard {
        xkb {
            // rules ""
            // model ""
            layout "us"
            variant "colemak_dh_ortho"
            options "compose:ralt,ctrl:nocaps"
            // file "~/.config/keymap.xkb"
        }
        track-layout "global"
        repeat-delay 600
        repeat-rate 25
        // numlock
    }
}
```

### `xkb`

`rules`, `model`, `layout`, `variant`, and `options` are passed directly to
libxkbcommon (the same library used by most Wayland compositors). See
`xkeyboard-config(7)` for the accepted values. `layout` and `options` accept
comma-separated lists, for example `layout "us,ru"`.

Since: 25.02 - `file "~/.config/keymap.xkb"` loads a complete keymap from a
`.xkb` file. This overrides all other `xkb {}` settings.

Since: 25.08 - an empty `xkb {}` makes niri read the layout from systemd-localed
(see the skill overview for the `localectl` workflow).

### `track-layout`

When several layouts are configured, controls whether the active layout is
remembered globally or per window.

| Value | Meaning |
| --- | --- |
| `"global"` | The layout change applies to all windows (default). |
| `"window"` | Each window tracks its own layout. |

```kdl
input {
    keyboard {
        xkb { layout "us,ru"; }
        track-layout "window"
    }
}
```

### `repeat-delay`, `repeat-rate`

`repeat-delay` is the delay in milliseconds before key repeat starts (default
`600`). `repeat-rate` is the number of characters per second once repeating
(default `25`). Both match the wlroots/sway defaults.

### `numlock`

Since: 25.05. Flag. Turns on Num Lock automatically at startup. Disable it
(comment it out) on laptops whose keyboard overlays Num Lock keys onto the
regular keys.

## `Mod` key customization

Since: 25.05. `mod-key` and `mod-key-nested` change what `Mod` means in
`binds {}`. By default `Mod` is `Super` on a TTY and `Alt` in a nested winit
window.

Valid modifiers: `Super` (alias `Win`), `Alt`, `Mod3`, `Mod5`, `Ctrl` (alias
`Control`), `Shift`. `Mod5` maps to `ISO_Level3_Shift`; `Mod3` maps to
`ISO_Level5_Shift`.

```kdl
// Use Alt normally, and Super inside a nested window.
input {
    mod-key "Alt"
    mod-key-nested "Super"
}
```

Avoid `Ctrl` and `Shift`: many default binds use `Mod`, none of them pass
through to the focused window, and `Ctrl`/`Shift` are commonly needed by
applications and for typing.

## Pointing devices

Settings for `touchpad`, `mouse`, `trackpoint`, and `trackball` are passed to
libinput, so they look the same as in other libinput-based compositors. You can
inspect raw events with `libinput debug-events`.

### Options common to all device sections

| Option | Form | Default | Meaning |
| --- | --- | --- | --- |
| `off` | flag | off | Send no events from this device. |

### Options common to `touchpad`, `mouse`, `trackpoint`, `trackball`

| Option | Form | Default | Meaning |
| --- | --- | --- | --- |
| `natural-scroll` | flag | off | Invert the scroll direction. |
| `accel-speed` | `-1.0`..`1.0` | `0.0` | Pointer acceleration speed. |
| `accel-profile` | `"adaptive"` or `"flat"` | `"adaptive"` | `flat` disables pointer acceleration. |
| `scroll-method` | see below | varies by device | When to emit scroll events instead of pointer motion. |
| `scroll-button` | button code | unset | Button used by `on-button-down`. Find codes in `libinput debug-events`. (Since: 0.1.10) |
| `scroll-button-lock` | flag | off | Toggle scrolling instead of holding; second press disengages, double click clicks the underlying button. (Since: 25.08) |
| `left-handed` | flag | off | Left-handed mode. |
| `middle-emulation` | flag | off | Middle click by pressing left and right together. |

`scroll-method` values: `"no-scroll"`, `"two-finger"`, `"edge"`,
`"on-button-down"`. The default depends on the device type.

### `touchpad`

| Option | Form | Default | Meaning |
| --- | --- | --- | --- |
| `off` | flag | off | Disable the touchpad. |
| `tap` | flag | off | Tap-to-click. |
| `dwt` | flag | off | Disable while typing. |
| `dwtp` | flag | off | Disable while trackpointing. |
| `drag` | `true` / `false` | unset | Control tap-and-drag. (Since: 25.05) |
| `drag-lock` | flag | off | Keep dragging after briefly lifting the finger. (Since: 25.02) |
| `natural-scroll` | flag | off | Invert scroll direction. |
| `accel-speed` | `-1.0`..`1.0` | `0.0` | Pointer acceleration speed. |
| `accel-profile` | `"adaptive"` / `"flat"` | `"adaptive"` | Accel profile. |
| `pinch-sensitivity` | float | `1.0` | Scale pinch-gesture sensitivity; `>1.0` more sensitive, `<1.0` less. (Since: next release, after 26.04) |
| `scroll-factor` | value or `horizontal=`, `vertical=` | `1.0` | Scale scroll speed. (Since: 0.1.10; split form Since: 25.08) |
| `scroll-method` | `"two-finger"` (default), `"edge"`, `"no-scroll"`, `"on-button-down"` | `"two-finger"` | Scroll method. |
| `scroll-button` | button code | unset | Button for `on-button-down`. |
| `scroll-button-lock` | flag | off | Toggle scrolling. (Since: 25.08) |
| `tap-button-map` | `"left-right-middle"` / `"left-middle-right"` | `"left-right-middle"` | Button order for two/three-finger taps. |
| `click-method` | `"button-areas"` / `"clickfinger"` | `"clickfinger"` | Clickpad software-button behavior. |
| `left-handed` | flag | off | Left-handed mode. |
| `disabled-on-external-mouse` | flag | off | Ignore the touchpad while an external pointer is connected. |
| `middle-emulation` | flag | off | Middle click emulation. |

### `mouse`

| Option | Form | Default | Meaning |
| --- | --- | --- | --- |
| `off` | flag | off | Disable the mouse. |
| `natural-scroll` | flag | off | Invert scroll direction. |
| `accel-speed` | `-1.0`..`1.0` | `0.0` | Pointer acceleration speed. |
| `accel-profile` | `"adaptive"` / `"flat"` | `"adaptive"` | Accel profile. |
| `scroll-factor` | value or `horizontal=`, `vertical=` | `1.0` | Scale scroll speed. |
| `scroll-method` | `"no-scroll"` (default), `"two-finger"`, `"edge"`, `"on-button-down"` | `"no-scroll"` | Scroll method. |
| `scroll-button` | button code | unset | Button for `on-button-down`. |
| `scroll-button-lock` | flag | off | Toggle scrolling. (Since: 25.08) |
| `left-handed` | flag | off | Left-handed mode. |
| `middle-emulation` | flag | off | Middle click emulation. |

### `trackpoint`

| Option | Form | Default | Meaning |
| --- | --- | --- | --- |
| `off` | flag | off | Disable the trackpoint. |
| `natural-scroll` | flag | off | Invert scroll direction. |
| `accel-speed` | `-1.0`..`1.0` | `0.0` | Pointer acceleration speed. |
| `accel-profile` | `"adaptive"` / `"flat"` | `"adaptive"` | Accel profile. |
| `scroll-method` | `"on-button-down"` (default), `"no-scroll"` | `"on-button-down"` | Scroll method. |
| `scroll-button` | button code | unset | Button for `on-button-down`. |
| `scroll-button-lock` | flag | off | Toggle scrolling. (Since: 25.08) |
| `left-handed` | flag | off | Left-handed mode. |
| `middle-emulation` | flag | off | Middle click emulation. |

### `trackball`

Same options as `trackpoint`, with `scroll-method "on-button-down"` as the
default. There is no `scroll-factor` on `trackpoint` or `trackball`.

### `tablet`

Tablets are absolute pointing devices. When a tablet is not mapped to any
output it maps to the union of all connected outputs without aspect-ratio
correction (Since: 0.1.7).

| Option | Form | Default | Meaning |
| --- | --- | --- | --- |
| `off` | flag | off | Disable the tablet. |
| `map-to-output` | output name | unset | Map the tablet to one output, e.g. `"eDP-1"`. |
| `map-to-focused-output` | flag | off | Map to the focused output; takes precedence over `map-to-output`. (Since: 26.04) |
| `map-to-focused-window` | flag | off | Map to the focused window geometry; takes precedence over both options above, falling back to them when no window is focused. (Since: next release, after 26.04) |
| `left-handed` | flag | off | Left-handed mode. |
| `calibration-matrix` | six floats | identity | Calibration matrix. (Since: 25.02) |

When both `map-to-output` and `map-to-focused-window` are set, the flag maps to
the active window on that output. Without `map-to-output`, it follows the
globally focused window.

### `touch`

Touchscreens are absolute pointing devices.

| Option | Form | Default | Meaning |
| --- | --- | --- | --- |
| `off` | flag | off | Disable the touch device. |
| `map-to-output` | output name | unset | Map the touchscreen to one output. |
| `calibration-matrix` | six floats | identity | Calibration matrix. (Since: 25.11) |

```kdl
input {
    tablet { map-to-output "eDP-1" }
    touch  { map-to-output "eDP-1" }
}
```

Valid output names are the same ones used in `output "NAME" {}` (see
`outputs.md`), including the manufacturer/model/serial form.

### `calibration-matrix`

Six floating-point numbers applied as the libinput calibration matrix:

```kdl
input {
    tablet {
        calibration-matrix 1.0 0.0 0.0 0.0 1.0 0.0
    }
}
```

See the libinput `LIBINPUT_CALIBRATION_MATRIX` documentation for worked
examples.

## General settings

These apply to input as a whole, not to one device.

### `disable-power-key-handling`

By default niri takes over the power button so it puts the machine to sleep
instead of powering off. Set this flag to handle the power button elsewhere
(for example in `logind.conf`).

```kdl
input {
    disable-power-key-handling
}
```

### `warp-mouse-to-focus`

Warps the mouse to newly focused windows. It does not make a hidden cursor
visible again. By default the cursor warps independently on each axis, so a
purely horizontal move is not combined with a vertical one.

Since: 25.05 - customize with the `mode` property:

| `mode` | Behavior |
| --- | --- |
| unset | Warp separately per axis; only move as far as needed. |
| `"center-xy"` | Warp both axes together: if the mouse is outside the window, move to the window center. |
| `"center-xy-always"` | Warp both axes together even if the mouse is already inside the window. |

```kdl
input {
    warp-mouse-to-focus mode="center-xy"
}
```

### `focus-follows-mouse`

Focus windows and outputs automatically when the pointer moves over them.

Since: 0.1.8 - the optional `max-scroll-amount` property is a percentage of the
working-area width. Focus only moves if the resulting view scroll is at most
that amount.

```kdl
input {
    // Focus only if it does not scroll the view at all.
    focus-follows-mouse max-scroll-amount="0%"
}
```

```kdl
input {
    // Allow focus if it scrolls at most 10% of the screen.
    focus-follows-mouse max-scroll-amount="10%"
}
```

### `workspace-auto-back-and-forth`

Normally, `focus-workspace <same index>` twice does nothing. With this flag,
switching to the current workspace by index again switches to the previous
workspace. niri remembers the origin workspace even if workspaces were
reordered in between.

```kdl
input {
    workspace-auto-back-and-forth
}
```

## Per-device configuration

niri 26.04 does **not** support configuring individual devices under a
`device "name" {}` block. Every option above applies to all devices of one
type; there is no per-device selector in the 26.04 config (upstream lists
individual device configuration as planned). Do not write a `device` block: it
will fail `niri validate`.

If two devices of the same type need different settings, the only supported
approach in 26.04 is to accept the shared per-type settings or to change the
device's behavior outside niri (for example with a libinput udev override).
Watch for the `device` construct in a release after 26.04.

## Worked examples

Laptop with a touchpad and a trackpoint:

```kdl
input {
    keyboard {
        xkb {
            layout "us,ru"
            options "grp:alt_shift_toggle,ctrl:nocaps"
        }
        numlock
        repeat-delay 450
        repeat-rate 30
    }
    touchpad {
        tap
        dwt
        natural-scroll
        accel-speed 0.25
        disabled-on-external-mouse
    }
    trackpoint {
        natural-scroll
        accel-speed -0.1
        middle-emulation
    }
}
```

Multi-axis scroll tuning (Since: 25.08):

```kdl
input {
    touchpad {
        scroll-factor horizontal=1.0 vertical=-2.0
    }
    mouse {
        scroll-factor 2.0
    }
}
```

Num Lock and layout tracking per window:

```kdl
input {
    keyboard {
        xkb { layout "us,de" }
        track-layout "window"
        numlock
    }
}
```
