---
name: niri-configuration
description: Use when writing, editing, validating, or debugging the niri Wayland compositor config.kdl. Covers KDL syntax (comments, flags, sections), include, niri validate, and the live-reload workflow, plus top-level options such as environment, cursor, screenshot-path, spawn-at-startup, prefer-no-csd, overview, xwayland-satellite, clipboard, hotkey-overlay, config-notification, and blur.
---

# Skill: niri-configuration

Orientation for the niri compositor configuration file: where it lives, how KDL
is parsed, how to split it, and every option that sits at the top level (outside
`input`, `output`, `binds`, and the other dedicated sections).

Baseline: **niri 26.04** (2026-04-25). niri uses date versioning (`25.01`,
`25.05`, `26.04`), not semantic versioning.

## Where the config loads from

Precedence, highest first:

1. `--config` / `-c <path>` passed to the `niri` binary.
2. `$NIRI_CONFIG`.
3. `$XDG_CONFIG_HOME/niri/config.kdl` (usually `~/.config/niri/config.kdl`).
4. `/etc/niri/config.kdl`.

If no file exists at (3)/(4), niri writes the embedded default config to
`$XDG_CONFIG_HOME/niri/config.kdl`. `--config` always wins over `$NIRI_CONFIG`;
an empty `$NIRI_CONFIG` is ignored and the default location is used. A
`--config`/`$NIRI_CONFIG` path that does not exist means no config is loaded.

The config is **live-reloaded**: edit and save, and key binds, output settings,
window rules, and the rest apply immediately. For the one documented exception
see `prefer-no-csd` below.

## KDL syntax essentials

- Comments start with `//`. Prefix a node with `/-` to comment out the whole
  node (including its children).
- Flags enable a toggle by their presence; omit or comment them out to disable.
- Most sections may appear **once**. Repeating `input {}` is a parse error.
- Sections keyed by name (`output "eDP-1"`, `workspace "web"`, `window-rule`,
  `layer-rule`) may repeat; the same key/name twice is an error.

```kdl
// A normal comment.
/-output "eDP-1" {
    // This whole node is ignored.
    off
}

input {
    focus-follows-mouse   // flag: enabled by presence
    // focus-follows-mouse // flag: disabled
}
```

## Defaults and breaking-change policy

Omitting a section leaves its options at their defaults, with one important
exception: `binds {}` is **not** filled with defaults, so never delete it unless
you intend to have no key binds.

niri does not intentionally break existing configs across releases; a config
from v0.1.0 still parses on later versions. Exceptions are made only for parsing
bugs (for example, duplicate binds to the same key became a hard error). These
guarantees apply to releases, not to arbitrary commits between releases.

## Validate and reload workflow

```bash
niri validate          # parse the config and print errors
niri validate -c /path/to/config.kdl
niri msg action load-config-file --path /path/to/config.kdl
```

1. Edit `~/.config/niri/config.kdl`.
2. Save; niri hot-reloads. Invalid config raises a "Failed to parse the config
   file" notification and keeps the previous config running.
3. If nothing changes, run `niri validate` to see the parse error.

## Top-level options at a glance

```kdl
spawn-at-startup "waybar"
spawn-sh-at-startup "qs -c ~/source/qs/MyAwesomeShell"   // Since: 25.08

prefer-no-csd

screenshot-path "~/Pictures/Screenshots/Screenshot from %Y-%m-%d %H-%M-%S.png"

environment {
    QT_QPA_PLATFORM "wayland"
    DISPLAY null
}

cursor {
    xcursor-theme "breeze_cursors"
    xcursor-size 48
    hide-when-typing                 // Since: 0.1.10
    hide-after-inactive-ms 1000      // Since: 0.1.10
}

overview {                           // Since: 25.05
    zoom 0.5
    backdrop-color "#262626"
    workspace-shadow {
        offset x=0 y=10
        softness 40
        spread 10
        color "#00000050"
    }
}

xwayland-satellite {                 // Since: 25.08
    // off
    path "xwayland-satellite"
}

clipboard {                          // Since: 25.02
    disable-primary
}

hotkey-overlay {
    skip-at-startup
    hide-not-bound                   // Since: 25.08
}

config-notification {                // Since: 25.08
    disable-failed
}

blur {                               // Since: 26.04
    // off
    passes 3
    offset 3
    noise 0.02
    saturation 1.5
}
```

## Section index

Top-level sections, each with its own documentation page or reference:

| Section | Repeatable | Reference |
| --- | --- | --- |
| `input {}` | no | `niri-input-outputs` |
| `output "NAME" {}` | per output name | `niri-input-outputs` |
| `binds {}` | no | `niri-keybindings` |
| `switch-events {}` | no | `niri-input-outputs` |
| `layout {}` | no | `niri-layout-rules` |
| `workspace "name" {}` | per workspace name | `niri-workspaces` |
| `window-rule {}` | yes | `niri-layout-rules` |
| `layer-rule {}` | yes | `niri-layout-rules` |
| `animations {}` | no | `niri-window-effects` |
| `gestures {}` | no | `niri-input-outputs` |
| `recent-windows {}` | no | `niri-workspaces` |
| `debug {}` | no | `niri-troubleshooting` |
| `include "file.kdl"` | yes | this skill, `references/kdl-and-include.md` |

The remaining sections (`input`, `output`, `binds`, `switch-events`, `layout`,
`workspace`, `window-rule`, `layer-rule`, `animations`, `gestures`,
`recent-windows`, `debug`) are covered by their dedicated skills. The options in
the "at a glance" block above have no dedicated section and are documented here.

## References

- `references/kdl-and-include.md` - KDL syntax details and the full `include`
  semantics (ordering, path resolution, merging), with a modular-config example.
- `references/top-level-options.md` - every top-level option with exact KDL and
  defaults.
- `references/miscellaneous.md` - operational, copy-paste guide for autostart,
  environment, cursor, screenshots, overview, clipboard, and blur.
- `../niri/references/default-config-annotated.md` - annotated walkthrough of
  the upstream default config.
