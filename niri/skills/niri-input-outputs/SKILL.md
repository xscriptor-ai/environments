---
name: niri-input-outputs
description: Use when configuring niri input and display hardware in config.kdl, including the input {} section, keyboard, xkb (rules, model, layout, variant, options), numlock, repeat-delay, repeat-rate, track-layout, touchpad, tap, dwt, natural-scroll, accel-speed, accel-profile, click-method, mouse, trackpoint, trackball, tablet, touch, calibration-matrix, map-to-output, focus-follows-mouse, warp-mouse-to-focus, output "NAME" {}, monitor setup, mode, custom mode, modeline, scale (fractional), transform, position, off, variable-refresh-rate (VRR), focus-at-startup, backdrop-color, gestures {}, dnd-edge-view-scroll, hot-corners, switch-events {}, lid-close/lid-open, tablet-mode. Also covers niri msg outputs and niri msg output for runtime monitor control.
---

# Skill: niri-input-outputs

Input devices and displays are configured with two top-level sections plus two
smaller ones:

- `input {}` - keyboards, pointing devices, touch/tablets, and focus behavior.
- `output "NAME" {}` - one block per monitor, matched by name.
- `gestures {}` - drag-and-drop edge scrolling and hot corners.
- `switch-events {}` - laptop lid and convertible tablet-mode events.

Baseline for this resource set: **niri 26.04** (2026-04-25). niri uses date
versioning (`25.05`, `25.11`, `26.04`), not semantic versioning. Config lives at
`~/.config/niri/config.kdl` and is live-reloaded on save. Validate edits with
`niri validate`.

## How sections and flags behave

Omitting a whole section leaves every option in it at its default; niri fills in
defaults automatically. The only section that is not auto-filled is `binds {}`
(see `niri-keybindings`), so never delete an `input {}` or `output {}` block
merely to get defaults.

Most device options are **flags**: the node's presence enables the toggle, and
commenting it out (or omitting it) disables it. For example `tap` enables
tap-to-click, while `// tap` disables it. Do not write `tap true`.

```kdl
input {
    touchpad {
        tap              // enable tap-to-click
        natural-scroll   // invert scroll direction
        // dwt           // disabled: this flag is commented out
    }
}
```

A few options take an argument or property instead (`accel-speed 0.2`,
`click-method "clickfinger"`, `scroll-factor horizontal=2.0`,
`position x=1280 y=0`). Whether a token is a flag or takes an argument is fixed
by niri; supplying the wrong form is a config error.

## Keyboard layout from systemd-localed

Since: 25.08. If the `xkb {}` section is empty (the default), niri fetches the
keyboard layout from systemd-localed over the `org.freedesktop.locale1` D-Bus
interface. This lets installers and other tools set the layout once for the
whole system. The same settings are read by other programs such as GDM.

Inspect and change them with `localectl`:

```sh
localectl set-x11-keymap "us" "" "colemak_dh_ortho" "compose:ralt,ctrl:nocaps"
localectl
```

`set-x11-keymap` also converts the layout to a TTY keymap by default; add
`--no-convert` to skip that, for example `localectl set-x11-keymap --no-convert "us,ru"`.
Writing a non-empty `xkb {}` block in the config overrides localed.

## Minimal shape

```kdl
input {
    keyboard {
        xkb { layout "us"; options "compose:ralt,ctrl:nocaps" }
        track-layout "global"
        repeat-delay 600
        repeat-rate 25
    }
    touchpad { tap; natural-scroll; accel-speed 0.2 }
    mouse { natural-scroll }
    focus-follows-mouse max-scroll-amount="0%"
    warp-mouse-to-focus mode="center-xy"
    workspace-auto-back-and-forth
    mod-key "Alt"
}

output "eDP-1" {
    mode "1920x1080@120.030"
    scale 1.5
    position x=0 y=0
}

output "HDMI-A-1" {
    mode "2560x1440@143.912"
    scale 1.0
    position x=1920 y=0
    variable-refresh-rate
}
```

## Index

| Topic | Reference |
| --- | --- |
| Keyboard, xkb, repeat, numlock, mod key, every touchpad/mouse/trackpoint/trackball/tablet/touch option, focus options | `references/input.md` |
| Outputs by name, mode, scale, transform, position, VRR, per-output layout, runtime control | `references/outputs.md` |
| `gestures {}` settings, pointer/touchpad gesture semantics, `switch-events {}` | `references/gestures-and-switch-events.md` |

## References

- `references/input.md` - complete `input {}` reference with option tables,
  defaults, and version gates.
- `references/outputs.md` - complete `output "NAME" {}` reference, monitor
  discovery, positioning, and `niri msg output`.
- `references/gestures-and-switch-events.md` - `gestures {}`, the gesture
  catalog, and `switch-events {}` with example commands.
