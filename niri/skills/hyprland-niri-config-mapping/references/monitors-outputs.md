# Monitors and outputs

Baseline: Hyprland 0.55+ Lua, niri 26.04. This maps Hyprland `monitor =` /
`hl.monitor` to niri `output "NAME" {}`, and `hyprctl monsters`/`hyprctl eval`
to `niri msg outputs` / `niri msg output`.

## The wildcard disappears

Hyprland needs a wildcard monitor line to turn on every connected display:

```lua
-- monitors.lua (Hyprland)
hl.monitor({ output = "", mode = "highrr", position = "auto", scale = "auto" })
```

niri enables all connected monitors with their preferred mode, guessed scale and
automatic position by default. There is no wildcard output. The migration is to
write **no output section at all** and let the defaults apply. Only add
`output "NAME" {}` sections for monitors that need explicit settings.

| Hyprland wildcard | niri |
| --- | --- |
| `hl.monitor({ output = "", mode = "highrr", position = "auto", scale = "auto" })` | No section; niri defaults already do this |

## hl.monitor / monitor -> output

| Hyprland | niri `output "NAME"` | Notes |
| --- | --- | --- |
| `output = "eDP-1"` | `output "eDP-1" {}` | Match by connector, or by manufacturer/model/serial. |
| `output = "desc:Vendor Model Serial"` | `output "Vendor Model Serial" {}` | Strip the `desc:` prefix; niri matches the raw string. |
| `output = ""` (wildcard) | omit | No wildcard in niri. |
| `mode = "preferred"` | omit `mode` | niri picks automatically. |
| `mode = "highrr"` | omit `mode` | niri picks a mode automatically; there is no explicit "highest refresh" selector. Set an explicit mode for high-refresh panels. |
| `mode = "highres"` | omit `mode` | Same approximation; no explicit "highest resolution" selector. |
| `mode = "2560x1440"` | `mode "2560x1440"` | niri picks the highest refresh for that resolution. |
| `mode = "2560x1440@144"` | `mode "2560x1440@143.912"` | Refresh must match `niri msg outputs` exactly, to three decimals. |
| `position = "auto"` | omit `position` | Direct. |
| `position = "1920x0"` | `position x=1920 y=0` | Different syntax, same meaning. |
| `scale = "auto"` | omit `scale` | niri guesses from physical size and resolution. |
| `scale = 1.5` | `scale 1.5` | Fractional allowed. |
| `transform = 0..7` | `transform "normal" / "90" / "180" / "270" / "flipped" / ...` | See table below. |
| `mirror = "DP-1"` | none | **niri has no monitor mirroring.** See below. |
| `monitor = NAME, disable` | `off` | Direct. |
| `vrr = 1` | `variable-refresh-rate` | Per output. |
| `vrr = 2` (on demand) | `variable-refresh-rate on-demand=true` | Since: 0.1.9. |
| `bitdepth` | none | Use `max-bpc` (Since: after 26.04) for wire bandwidth only. |
| `cm = "hdmi"` | none | No equivalent. |
| `sdrbrightness` / `sdrgamut` / `supports_wide_color` | none | No equivalent in 26.04. |
| `addreserved` | none | Use `layout { struts { ... } }`, but this is global, not per monitor. |
| `focusAtStartup` (implicit primary) | `focus-at-startup` | Since: 25.05. Add to the desired primary. |

### transform

Hyprland uses a numeric transform; niri uses strings.

| Hyprland `transform` | niri `transform` |
| --- | --- |
| `0` | `"normal"` |
| `1` | `"90"` |
| `2` | `"180"` |
| `3` | `"270"` |
| `4` | `"flipped"` |
| `5` | `"flipped-90"` |
| `6` | `"flipped-180"` |
| `7` | `"flipped-270"` |

## Mirroring has no equivalent

Hyprland `mirror = "DP-1"` duplicates one output onto another. niri 26.04 has no
mirror option, in config or in `niri msg output`. There is no approximation that
keeps the mirror as a first-class output. Practical options:

- Run a mirroring tool on top of niri (for example a screen-copy/Wayland
  headless approach), accepting it is not compositor-native.
- Keep the physical layout one-monitor-per-output and use workspaces on both.

State this as a gap in the migration and do not try to fake `mirror` with
`position`/`scale`.

## Migrating an EDID / `desc:` rule

Hyprland keys a monitor by its description, e.g. the equisdots rules:

```lua
local MON_LEFT3 = "desc:Xiaomi Corporation P27FBB-RGGL 5275600003570"
hl.monitor({ output = MON_LEFT3, mode = "1920x1080@60", position = "0x0", scale = 1 })
```

niri matches the same identity by writing the description as the output name,
without the `desc:` prefix, with single spaces between manufacturer, model and
serial. Get the exact string from `niri msg outputs`.

```sh
niri msg outputs
# eDP-1
# HDMI-A-1
# "Xiaomi Corporation P27FBB-RGGL 5275600003570"
```

```kdl
// monitors.kdl (niri)
output "Xiaomi Corporation P27FBB-RGGL 5275600003570" {
    mode "1920x1080@60.000"
    position x=0 y=0
    scale 1.0
}
```

Output names are case-insensitive (Since: 0.1.6). Matching by
manufacturer/model/serial is Since: 0.1.9. The same string can be used by
`open-on-output` in window rules and `open-on-output` in a `workspace` block.

## Logical-pixel positioning for multi-DPI

niri positions outputs in **logical (scaled) pixels**, not physical pixels.
Hyprland's `position` is physical. A 3840x2160 display at scale 2.0 occupies a
logical 1920x1080 box, so the next output starts at `x=1920`, not `x=3840`.
Rotation swaps logical width and height.

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
}
```

Here `eDP-1` has logical width `2880 / 2 = 1440`, so the external panel starts
at `x=1440`. If you copy a Hyprland physical layout verbatim to niri, adjacent
monitors with mixed scale will overlap, and niri will fall back to automatic
placement (and print a warning). Recompute every `x` as the sum of preceding
logical widths.

If a position is omitted or overlaps, niri places the output automatically to
the right of all already-placed outputs, sorted by name, independently of
hotplug order.

## Runtime monitor control

| Hyprland | niri |
| --- | --- |
| `hyprctl monitors all` | `niri msg outputs` / `niri msg --json outputs` |
| `hyprctl eval 'hl.monitor({ output = "DP-2", mode = "2560x1440@144" })'` | `niri msg output DP-2 mode 2560x1440@144` |
| `hyprctl keyword monitor ...` | `niri msg output <name> ...` (session only) |
| `hyprctl setcursor THEME SIZE` | edit `cursor {}` |

`niri msg output` changes are **session-only**: they are never written to the
config file and are forgotten if that output's config section later changes.
This is the closest thing niri has to `hyprctl eval` for outputs.

```sh
# Turn off / on.
niri msg output DP-2 off
niri msg output DP-2 on

# Mode, scale, transform, position.
niri msg output DP-2 mode 2560x1440@144
niri msg output DP-2 mode auto
niri msg output DP-2 scale 1.5
niri msg output DP-2 transform 90
niri msg output DP-2 position set 2560 0
niri msg output DP-2 position auto

# Variable refresh rate.
niri msg output DP-2 vrr on
niri msg output DP-2 vrr on --on-demand
niri msg output DP-2 vrr off
```

Because runtime output changes are not persisted, the equisdots
`restore-monitors.sh` reconciler is unnecessary in niri if you write the layout
into `output` sections: niri re-reads the file and reapplies the saved layout on
every reload and on hotplug. If you still rely on a connector-name-independent
identity, use the manufacturer/model/serial output name so the layout survives
`DP-5` -> `DP-3` renames without a daemon.
