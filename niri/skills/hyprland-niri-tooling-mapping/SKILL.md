---
name: hyprland-niri-tooling-mapping
description: Use when replacing Hyprland ecosystem tools under niri: hyprlock, hypridle, hyprpaper, hyprpicker, hyprshot, and xdg-desktop-portal-hyprland. Maps each to niri-native behavior or portable alternatives such as swayidle, swaylock, swaybg, awww, grim, wl-clipboard, and the GNOME/GTK portals, and covers niri-portals.conf, screencasting, the GDK_BACKEND warning, and replacing hyprpm/plugins and layouts.
---

# Skill: hyprland-niri-tooling-mapping

niri is a compositor, not a desktop suite. The Hyprland ecosystem tools either
have a niri-native replacement (`niri msg action screenshot`, `pick-color`), a
portable Wayland replacement (`swayidle`, `swaybg`, `grim`), or no replacement at
all (the plugin ABI). This skill maps each one.

Baseline: **niri 26.04** (2026-04-25). niri uses date versioning, not semver.

## Tool map

| Hyprland tool | niri-era replacement | Status |
| --- | --- | --- |
| `hyprlock` | Quickshell `WlSessionLock` (`ext-session-lock`) or `swaylock` | Portable; hyprlock may run but is Hyprland-oriented |
| `hypridle` | `swayidle` (systemd unit), commands become `niri msg action power-off-monitors` | Portable |
| `hyprpaper` | `swaybg`, or `awww` (swww fork) | Portable |
| `hyprpicker` | `niri msg pick-color` (or the screenshot UI) | Native |
| `hyprshot` | `grim` + `slurp`; or niri's built-in screenshot actions/UI | Native/portable |
| `xdg-desktop-portal-hyprland` | `xdg-desktop-portal-gnome` + `xdg-desktop-portal-gtk`, with `niri-portals.conf` | Required swap |
| `hyprpm` / Hyprland plugins | none (no plugin ABI) | Drop; use native features or custom shaders |
| `hyprctl` (misc) | `niri msg` | See the `hyprland-niri-ipc-mapping` skill |

## Rules that prevent breakage

1. **Remove `xdg-desktop-portal-hyprland`.** niri needs
   `xdg-desktop-portal-gnome` (screencasting) and `xdg-desktop-portal-gtk`
   (fallback), and a `niri-portals.conf` installed in the right place. Portals
   require running niri as a session (`niri-session` or a display manager), not
   as a bare compositor.
2. **Never set `GDK_BACKEND` globally.** It breaks the screencast portal. This is
   a documented niri warning.
3. **Screencasting is portal + PipeWire.** OBS/Firefox/Chromium/Electron use the
   portal; `wf-recorder`, `wl-mirror`, `wayvnc`, and `xdg-desktop-portal-wlr` use
   `wlr-screencopy` / `ext-image-copy-capture`, which niri also supports.
4. **Layer-shell tools keep working.** `swaybg`, `swayidle`, `wl-mirror`, and
   MPVPaper-style video wallpaper tools speak `wlr-layer-shell` and run on niri.
   Animated-wallpaper blur/xray caveats apply; see the wallpaper reference.
5. **There is no plugin ABI.** Anything that needed a Hyprland layout plugin is
   rebuilt on niri's native scrollable columns and tabs, or dropped.
6. **Keep the Quickshell shell as the only notification server.** Under Hyprland
   the equisdots shell provides notifications; keep it that way under niri. Do
   **not** install or run `mako`, `dunst`, or any other
   `org.freedesktop.Notifications` daemon. A second daemon wins the
   `org.freedesktop.Notifications` D-Bus name, and then notifications render with
   its default colours instead of the active theme/palette. If a `mako`/`dunst`
   process is already running, stop it.

## References

- `references/lock-idle.md` - screen locking (`WlSessionLock`, `swaylock`,
  hyprlock) and idle (`swayidle`, hypridle), with a `swayidle` systemd unit and
  the `niri msg action power-off-monitors` command.
- `references/wallpaper.md` - `hyprpaper`/`swww` to `swaybg`/`awww`, per-output
  wallpapers, and animated-wallpaper caveats with xray/blur.
- `references/picker-capture.md` - `hyprpicker` to `niri msg pick-color`,
  `grim`+`slurp`, niri's built-in screenshot actions/UI, `screenshot-path`, and
  screen recording via `wf-recorder` or OBS/portal.
- `references/portals.md` - swapping `xdg-desktop-portal-hyprland` for the
  GNOME/GTK portals, `niri-portals.conf`, screencasting requirements, the
  `GDK_BACKEND` warning, and the Secret portal (`oo7`/`gnome-keyring`).
- `references/plugins-layouts.md` - the `hyprpm` plugin model vs. niri's lack of a
  plugin ABI; replacing scrollable/monocle/hy3 plugins with native scrollable
  columns and tabs, and custom shaders as the main extension point.
