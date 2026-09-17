---
name: hyprland-tools
description: Hyprland ecosystem tools reference — hyprlock, hypridle, hyprpaper, hyprpicker, hyprsunset, xdg-desktop-portal-hyprland, hyprpm/plugins, screenshots and Qt tooling versions. Use when configuring lock/idle/wallpaper/capture stacks or plugin management.
---

# Hyprland Ecosystem Tools (September 2026)

Independent C++ releases under hyprwm, plus community tools. Verify installed versions before writing configs (`hyprlock --version`, package manager) — syntax drifts between minors.

## Latest versions (verify locally)

hyprlock 0.9.x (0.9.6) · hypridle 0.1.x (0.1.8; Lua-style command syntax in config) · hyprpaper 0.8.x (0.8.4; recursive dirs, shuffle slideshow, status object) · hyprpicker 0.4.x · xdg-desktop-portal-hyprland 1.4.x (1.4.1) · hyprsunset (rolling) · hyprshot 1.3.0 (community, extra) · cliphist 0.7.0 (extra) · hyprutils 0.14.x · hyprlang 0.6.x (maintenance mode) · Quickshell 0.3.x.

## Core trio wiring (Lua config)

```lua
hl.on("hyprland.start", function()
  hl.dispatch(hl.dsp.exec_cmd("hyprpaper"))
  hl.dispatch(hl.dsp.exec_cmd("hypridle"))
end)
hl.bind("SUPER + L", hl.dsp.exec_cmd("hyprlock"))
```
hypridle listeners (verify current syntax against wiki; Lua-era syntax for commands in newer releases):
```
listener { timeout = 300  on-timeout = hyprctl dispatch dpms off  on-resume = hyprctl dispatch dpms on }
listener { timeout = 330  on-timeout = hyprlock }
```

## Plugin management (hyprpm)

- hyprpm lives inside the Hyprland repo (standalone repo removed); sudo required for sensitive ops; Nix integration since 0.54.
- `hyprpm update|add <repo>|enable|disable|remove|list`; plugin ABI must match `hyprctl version` exactly.
- Official plugins: hyprwm/hyprland-plugins (rolling). Since 0.55 Monocle is a core layout; for layout-only ideas prefer Lua custom layouts.
- Docs: https://wiki.hypr.land/plugins/ (Using/Development/Guidelines/Advanced).

## Capture stack

- Screenshot: hyprshot (`-m region|output|window`, `-s` save, `-z` copy, `-f` freeze w/ hyprpicker) or raw grim+slurp.
- Recording: wf-recorder or OBS via xdg-desktop-portal-hyprland (permission prompts from the compositor Permission Manager; `ecosystem.enforce_permissions`).
- Clipboard: cliphist with wl-clipboard.

## References

- `references/ecosystem.md` — daemon config notes and pitfalls (PAM, DPMS, portal conflicts).
