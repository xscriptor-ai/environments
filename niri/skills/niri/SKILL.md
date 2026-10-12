---
name: niri
description: Use when working with the niri scrollable-tiling Wayland compositor: config.kdl, binds, layout, window-rule, layer-rule, animations, niri msg, event-stream, outputs, xwayland, portals, or debugging a niri session. Entry point for all niri work; points to focused niri-* skills and references.
---

# Skill: niri

niri is a scrollable-tiling Wayland compositor written in Rust on top of
Smithay. Windows are arranged in columns on an infinite horizontal strip per
monitor; opening a window never resizes existing ones. Workspaces are dynamic
(GNOME-like), arranged vertically, and independent per monitor. It is not a
desktop environment: you supply a bar/shell, notification daemon, portals, and
Xwayland.

Baseline for this resource set: **niri 26.04** (2026-04-25). niri uses date
versioning (`25.01`, `25.05`, `26.04`), not semantic versioning.

## Core facts

- Config: `~/.config/niri/config.kdl` or `$XDG_CONFIG_HOME/niri/config.kdl`,
  falling back to `/etc/niri/config.kdl`. Override with `--config`/`-c`,
  `$NIRI_CONFIG`, or at runtime `niri msg action load-config-file --path`.
- KDL format (`https://kdl.dev`). Config is live-reloaded on save.
- Validate with `niri validate`. Unknown or malformed options fail parsing and
  raise a config notification.
- Split configs with `include "other.kdl"` (Since: 25.11).
- IPC: `niri msg`, `niri msg --json`, `niri msg action ...`,
  `niri msg event-stream`; socket path in `$NIRI_SOCKET`.
- Session: run `niri-session` (systemd) or from a display manager so that
  portals, screencasting, and xdg-desktop-autostart work.
- Xwayland: integrated via `xwayland-satellite >= 0.7` (Since: 25.08).
- Screencasting: `xdg-desktop-portal-gnome` + PipeWire.

## Minimal config shape

```kdl
input {
    keyboard { xkb { layout "us"; } numlock }
    touchpad { tap; natural-scroll }
}

output "eDP-1" {
    mode "1920x1080@120"
    scale 1.5
    position x=0 y=0
}

layout {
    gaps 16
    center-focused-column "never"
    default-column-width { proportion 0.5; }
    border { width 2; active-color "#7fc8ff"; inactive-color "#505050" }
    focus-ring { off }
    shadow { off }
}

spawn-at-startup "waybar"

window-rule {
    match app-id=r#"^firefox$"#
    open-floating true
}

binds {
    Mod+T { spawn "alacritty"; }
    Mod+D { spawn "fuzzel"; }
    Mod+Q { close-window; }
    Mod+Left  { focus-column-left; }
    Mod+Right { focus-column-right; }
    Mod+1 { focus-workspace 1; }
    Print { screenshot; }
    Mod+Shift+E { quit; }
}
```

## Operating loop

1. Edit `~/.config/niri/config.kdl`.
2. Save; the compositor hot-reloads. If nothing changes, run `niri validate` to
   see the parse error.
3. For runtime actions, use `niri msg action <name>` (same actions as binds).
4. For bar/widget integration, subscribe to `niri msg --json event-stream`
   instead of polling.

## Focused skills

- `niri-configuration` - KDL syntax, include, top-level options, misc.
- `niri-keybindings` - bind syntax, modifiers, properties, full action catalog.
- `niri-layout-rules` - layout, window-rule, layer-rule, floating, tabs.
- `niri-input-outputs` - input devices, outputs/monitors, gestures, switch events.
- `niri-workspaces` - dynamic and named workspaces, recent-windows.
- `niri-ipc` - niri msg, event stream, socket protocol, scripting.
- `niri-window-effects` - blur, xray, shadows, gradients, screencasting, animations.
- `niri-session-integration` - session, systemd, portals, xwayland, nvidia, packaging.
- `niri-troubleshooting` - FAQ, application issues, debug options, accessibility.

## References

- `references/quick-reference.md` - one-page command, action, and property index.
- `references/default-config-annotated.md` - annotated version of the upstream
  default config.
