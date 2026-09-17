# Ecosystem tools notes (2026)

## hyprlock
- Config `~/.config/hypr/hyprlock.conf`. Sections: `background` (color/path/blur/...), `input-field`, `label` (+ `shadow`, `shape`); `monitor =` selects output, `all` = one lock on focused? (verify per version). `$VAR` interpolation; font_family; transition_speed/angle for fade/rotate.
- 0.9.x: dmabuf rendering, 10-bit flip fixes, PAM/fprintd fixes.
- Launch: bind `hl.bind("SUPER + L", hl.dsp.exec_cmd("hyprlock"))` (Lua era) or hypridle timeout.
- PAM: ensure `auth include system-auth` in the lock PAM config and the user in the right group; DBus lock integration via `loginctl lock-session`.
- Do not screenshot-bypass (locks hide on capture by design).

## hypridle
- Config `~/.config/hypr/hypridle.conf`; command values in Lua syntax for recent releases (0.1.8 changelog). D-Bus GetActive/ActiveChanged implemented; per-listener `condition_cmd`.
- Typical listeners: DPMS off/resume; hyprlock after 5 min; suspend after 1 h. Wayland idle inhibitors stop timeouts (video playback).
- Force: `hyprctl dispatch force_idle` / dispatcher `force_idle`.

## hyprpaper
- `~/.config/hypr/hyprpaper.conf`: `preload = path`; `wallpaper = monitor,path`; `ipc = on`. 0.8.x: recursive wallpaper dirs, shuffle slideshow, status object protocol. Control via the hyprpaper process IPC (check wiki page for current command names).

## hyprpicker / hyprsunset
- hyprpicker: click-to-hex, `-a` auto-copy, `-r` raw RGB, `-f` freeze screen (used with screenshot flows); scroll-zoom added recently.
- hyprsunset: color-temperature overlay, e.g. `hyprsunset -t 4000`; toggle with binds; GPU shader.

## Screenshots / recording
- hyprshot 1.3.0 (community): `hyprshot -m region|output|window [-s|-z|-f|-o dir]`; deps grim, slurp, jq, wl-clipboard; optdep hyprpicker.
- Recording: wf-recorder (direct wlr-screencopy) or OBS + xdg-desktop-portal-hyprland.
- Clipboard: cliphist 0.7.0: `cliphist store` via wl-paste watcher, `cliphist list`, pick with fuzzel/rofi/wofi or an in-shell QML UI; images supported.

## Portals
- xdg-desktop-portal-hyprland v1.4.1 (2026-07): ScreenCast/ScreenShot (wlr-screencopy), GlobalShortcuts, FileChooser, Clipboard. Must run with `xdg-desktop-portal`; disable conflicting gnome/kde portal backends.

## hyprpm
- In-tree (standalone repo removed). `hyprpm update/add <repo>/enable/disable/remove/list/reload`. sudo for sensitive ops. Nix integration since 0.54. ABI locked to `hyprctl version`. Official plugins: hyprwm/hyprland-plugins (rolling).

## Version pinning advice
Always record versions used in any guide: hyprlock 0.9.x, hypridle 0.1.x, hyprpaper 0.8.x, portal 1.4.x, Quickshell 0.3.x, Wayle 0.7.x. Config syntax drift between minors is real (hypridle commands; hyprlock labels).
