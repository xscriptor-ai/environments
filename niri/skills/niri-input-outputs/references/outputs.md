# Outputs reference

Complete reference for niri output (monitor) configuration. Baseline: niri
26.04 (2026-04-25). Written for `~/.config/niri/config.kdl`.

By default niri turns on every connected monitor using its preferred mode. You
adjust that with `output "NAME" {}` sections, one per monitor.

```kdl
output "eDP-1" {
    // off
    mode "1920x1080@120.030"
    scale 2.0
    transform "normal"
    position x=0 y=0
    variable-refresh-rate
    focus-at-startup
    backdrop-color "#001100"
    // max-bpc 8

    hot-corners {
        // off
        top-left
    }

    layout {
        // ...layout settings for eDP-1...
    }

    // Custom modes. Caution: may damage your display.
    // mode custom=true "1920x1080@100"
    // modeline 173.00 1920 2048 2248 2576 1080 1083 1088 1120 "-hsync" "+vsync"
}
```

## Matching an output

An output is matched by one of two name forms:

- Connector name, for example `eDP-1`, `HDMI-A-1`, `DP-2`. The built-in laptop
  panel is usually `eDP-1`.
- Manufacturer, model, and serial separated by single spaces:
  `output "Some Company CoolMonitor 1234" {}`.

The name is case-insensitive (Since: 0.1.6). Matching by manufacturer, model,
and serial was added in Since: 0.1.9 (before that, only connector names worked).

List everything currently connected, with names, available modes, and VRR
support:

```sh
niri msg outputs
niri msg outputs --json
```

## Options at a glance

| Option | Form | Since | Notes |
| --- | --- | --- | --- |
| `off` | flag | | Turn the output off entirely. |
| `mode` | `"WxH"` or `"WxH@RR"` | | Resolution and refresh rate. |
| `mode custom=true` | `custom=true "WxH@RR"` | 25.11 | Force a mode the monitor does not advertise; refresh is mandatory. |
| `modeline` | 11 tokens | 25.11 | Full VESA modeline; overrides `mode`. |
| `scale` | float `0..10` | | Output scale; fractional allowed. |
| `transform` | one of 8 strings | | Rotate counter-clockwise, optionally flipped. |
| `position` | `x=<int> y=<int>` | | Position in the global logical coordinate space. |
| `variable-refresh-rate` | flag / `on-demand=true` | 0.1.5 / 0.1.9 | Enable VRR (adaptive sync). |
| `focus-at-startup` | flag | 25.05 | Focus this output when niri starts. |
| `background-color` | color | 0.1.8 | Deprecated in 25.11; use `layout { background-color; }`. |
| `backdrop-color` | color | 25.05 | Color shown between workspaces and in the overview. Alpha ignored. |
| `max-bpc` | `6`/`8`/`10`/`12`/`14`/`16` | after 26.04 | Limit bits per channel to reduce link bandwidth. |
| `hot-corners` | block | 25.11 | Per-output hot corners. |
| `layout` | block | 25.11 | Per-output layout overrides. |

## `off`

```kdl
output "HDMI-A-1" {
    off
}
```

## `mode`

Format `<width>x<height>` or `<width>x<height>@<refresh rate>`. If the refresh
rate is omitted, niri picks the highest refresh rate for that resolution. If the
mode is omitted or does not work, niri selects one automatically.

The refresh rate must match `niri msg outputs` **exactly**, including all three
decimal digits. High refresh-rate monitors often report 60 Hz as preferred, so
set the mode explicitly.

```kdl
// 144 Hz monitor that defaults to 60 Hz.
output "HDMI-A-1" {
    mode "2560x1440@143.912"
}

// Lower the resolution of the built-in panel, e.g. for testing.
output "eDP-1" {
    mode "1280x720"
}
```

### Custom modes

Since: 25.11. `mode custom=true` forces a mode that the monitor does not
advertise. The refresh rate is mandatory. Custom modes are not guaranteed to
work; niri is asking the monitor to run an unsupported mode.

```kdl
output "HDMI-A-1" {
    mode custom=true "2560x1440@143.912"
}
```

> Caution: an out-of-spec mode may damage a monitor, especially a CRT. Respect
> the maximum supported limits from the monitor documentation.

### `modeline`

Since: 25.11. Sets the mode directly from a full modeline, overriding any
`mode`. Compute values with `cvt` or `gtf`. Modelines are not guaranteed to
work and carry the same caution as custom modes.

```kdl
output "eDP-3" {
    modeline 173.00 1920 2048 2248 2576 1080 1083 1088 1120 "-hsync" "+vsync"
}
```

## `scale`

Sets the output scale. With no `scale`, niri guesses an appropriate value from
the monitor's physical size and resolution (Since: 0.1.6).

- Fractional scale is allowed, e.g. `scale 1.5` for 150% (Since: 0.1.7).
- Integer scale does not need a trailing dot: `scale 2` (Since: 0.1.7).
- Values `<= 0` or `> 10` fail config parsing (Since: 0.1.7).

```kdl
output "eDP-1" {
    scale 1.5
}
```

## `transform`

Rotates the output counter-clockwise. `flipped` variants also flip the output.

Valid values: `"normal"`, `"90"`, `"180"`, `"270"`, `"flipped"`,
`"flipped-90"`, `"flipped-180"`, `"flipped-270"`.

```kdl
output "HDMI-A-1" {
    transform "90"
}
```

## `position`

Sets the position in the global coordinate space. This affects directional
monitor actions (`focus-monitor-left`, ...) and cursor movement; the cursor can
only move between directly adjacent outputs.

> Positions use logical (scaled) pixels, not physical ones. A 3840x2160 output
> at `scale 2.0` has a logical size of 1920x1080, so an output placed directly
> to its right uses `x=1920`. If a position is unset or overlaps, niri places
> the output automatically.

```kdl
output "HDMI-A-1" {
    position x=1280 y=0
}
```

### Automatic positioning

Whenever the output configuration changes (including monitor hotplug), niri
recomputes positions from scratch:

1. Collect all connected monitors and their logical sizes.
2. Sort them by name, so the result does not depend on non-deterministic
   connection order at startup.
3. Place every output with an explicit `position` in order. If it overlaps an
   already placed output, place it to the right of all placed outputs and print
   a warning.
4. Place every output without an explicit `position` to the right of all placed
   outputs.

## `variable-refresh-rate`

Since: 0.1.5. Enables variable refresh rate (VRR / adaptive sync / FreeSync /
G-Sync) when the output supports it. Check support in `niri msg outputs`.

```kdl
output "HDMI-A-1" {
    variable-refresh-rate
}
```

Since: 0.1.9 - `on-demand=true` enables VRR only while this output shows a
window matching the `variable-refresh-rate` window rule (see
`niri-layout-rules`). This avoids driver quirks most of the time and is useful
for games and video players.

```kdl
output "HDMI-A-1" {
    variable-refresh-rate on-demand=true
}
```

Driver notes: if the cursor moves at a low framerate with VRR, try the
`disable-cursor-plane` debug flag and reconnect the monitor. If a capable
monitor is not detected, unplugging a different monitor sometimes helps. Some
monitors continuously modeset (flash black) with VRR enabled.

## `focus-at-startup`

Since: 25.05. Focuses this output when niri starts. If multiple outputs are
marked, the one appearing first in the config wins. If none are marked, niri
focuses the first output sorted by name.

```kdl
output "HDMI-A-1" {
    focus-at-startup
}

// Fallback if HDMI-A-1 is not connected.
output "DP-2" {
    focus-at-startup
}
```

## `background-color` (deprecated)

Since: 0.1.8. Sets the color drawn for workspaces on this output, visible when
no background tool (for example swaybg) is running. Until 25.05 the alpha
channel was ignored.

Since: 25.11 this option is deprecated. Set `background-color` inside the
output's `layout {}` block instead:

```kdl
output "HDMI-A-1" {
    layout {
        background-color "#003300"
    }
}
```

## `backdrop-color`

Since: 25.05. Sets the backdrop color niri draws for the output, visible
between workspaces and in the overview. The alpha channel is ignored.

```kdl
output "HDMI-A-1" {
    backdrop-color "#001100"
}
```

## `max-bpc`

Since: next release, after 26.04. Sets the maximum bits per channel for the
output. You do not normally need this; it affects the wire encoding of the
display signal, not the framebuffer format. Lowering it can help when hitting a
bandwidth limit. Valid values: `6`, `8`, `10`, `12`, `14`, `16`.

```kdl
output "HDMI-A-1" {
    max-bpc 8
}
```

## `hot-corners`

Since: 25.11. Customizes hot corners per output. By default the hot corners from
`gestures {}` (see `gestures-and-switch-events.md`) apply to every output. `off`
disables hot corners on the output; listing specific corners enables only those.

```kdl
output "HDMI-A-1" {
    hot-corners {
        bottom-left
        bottom-right
    }
}

output "DP-2" {
    hot-corners {
        off
    }
}
```

## Layout config overrides

Since: 25.11. A `layout {}` block inside `output {}` overrides top-level layout
settings for that output only. It accepts every option from the top-level
`layout {}` block (see `niri-layout-rules`).

```kdl
output "SomeCompany VerticalMonitor 1234" {
    transform "90"
    layout {
        default-column-width { proportion 1.0; }
    }
}

output "SomeCompany UltrawideMonitor 1234" {
    layout {
        default-column-width { proportion 0.25; }
        preset-column-widths {
            proportion 0.2
            proportion 0.25
            proportion 0.5
            proportion 0.75
            proportion 0.8
        }
    }
}
```

To unset a flag that is enabled globally, write it with `false`:

```kdl
layout {
    always-center-single-column
}

output "eDP-1" {
    layout {
        always-center-single-column false
    }
}
```

## Runtime output control

`niri msg output <NAME> <ACTION>` changes an output configuration temporarily.
Changes are **not** written to the config file and are forgotten if that
output's section later changes in the config. Discover names with
`niri msg outputs`.

```sh
# Turn an output off / on.
niri msg output DP-2 off
niri msg output DP-2 on

# Mode: explicit, custom, or automatic.
niri msg output DP-2 mode 2560x1440@144
niri msg output DP-2 mode auto
niri msg output DP-2 custom-mode 1920x1080@100
niri msg output DP-2 modeline 173.00 1920 2048 2248 2576 1080 1083 1088 1120 -hsync +vsync

# Scale: explicit or automatic.
niri msg output DP-2 scale 1.5
niri msg output DP-2 scale auto

# Transform and position.
niri msg output DP-2 transform 90
niri msg output DP-2 position set 2560 0
niri msg output DP-2 position auto

# Variable refresh rate.
niri msg output DP-2 vrr on
niri msg output DP-2 vrr on --on-demand
niri msg output DP-2 vrr off
```

`max-bpc` gains an IPC action only in the release after 26.04 and is not
available on the 26.04 CLI.

The mode argument uses the same `<WxH[@RR]>` syntax as the config; the refresh
rate still must match `niri msg outputs`.

## Multi-monitor example with mixed DPI

A 2880x1800 HiDPI laptop panel at scale 2.0 (logical width 1440) next to a
1920x1080 external at 100%, a vertical 1440x2560 panel, and VRR reserved for
games on the external:

```kdl
output "eDP-1" {
    mode "2880x1800@120.000"
    scale 2.0
    position x=0 y=0
}

output "Some Company CoolMonitor 1234" {
    mode "1920x1080@60.000"
    scale 1.0
    position x=1440 y=0
    variable-refresh-rate on-demand=true
}

output "Some Company VerticalMonitor 5678" {
    mode "2560x1440@60.000"
    scale 1.0
    transform "90"
    position x=3360 y=0

    // Wider columns on the rotated (portrait) panel.
    layout {
        default-column-width { proportion 0.75; }
    }
}
```

`eDP-1` occupies logical x `0..1440`, the external x `1440..3360`, and the
rotated panel x `3360..4800` (rotation swaps its logical width and height), so
the cursor can cross every boundary.
