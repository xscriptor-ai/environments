---
name: hyprland-tools
description: Hyprland ecosystem tools reference — hyprlock, hypridle, hyprpaper, hyprpicker, hyprsunset, xdg-desktop-portal-hyprland, hyprpm/plugins, screenshots and Qt tooling versions. Use when configuring lock/idle/wallpaper/capture stacks or plugin management.
---

# Hyprland Ecosystem Tools (November 2026)

Verified **2026-11-01** against official sources: hyprwm GitHub releases, Arch `extra` package metadata, wiki.hypr.land hypr-ecosystem pages. Independent C++ releases under hyprwm, plus community tools. Verify installed versions before writing configs (`hyprlock --version`, package manager) — syntax drifts between minors.

## Latest versions (verify locally)

hyprlock 0.9.x (0.9.6) · hypridle 0.1.x (0.1.8; command values use Lua dispatch syntax, and listeners gained `condition_cmd`/`condition_retry`) · hyprpaper 0.8.x (0.8.4; recursive dirs, shuffle slideshow, status object) · hyprpicker 0.4.x (0.4.7) · hyprsunset 0.4.x (0.4.0) · xdg-desktop-portal-hyprland 1.4.x (1.4.1) · hyprshot 1.3.0 (community, extra) · cliphist 0.7.0 (extra) · hyprutils 0.14.x (0.14.3) · aquamarine 0.15.x (0.15.1) · hyprlang 0.6.x (maintenance; not a runtime config provider in 0.57+) · hyprtoolkit 0.6.0 · Quickshell 0.3.x (0.3.2) · Lua 5.5.1. Official first-party apps: hyprlauncher 0.1.7, hyprpolkitagent 0.2.0, hyprsysteminfo 0.2.0, hyprshutdown 0.1.1, hyprpwcenter 0.1.2, hyprland-guiutils 0.2.2 (safe mode needs guiutils), hyprland-qt-support 0.1.0.

## Session start (0.53+)

Start via `start-hyprland` (crash recovery + safe mode), not the bare `Hyprland` binary. `start-hyprland -- -h` forwards flags; `-- --safe-mode` for debugging. Bare launch shows a watchdog warning (`misc.disable_watchdog_warning`). Related flags on the Hyprland binary: `--locked[-cmd <cmd>]` (start with a locker), `--config FILE`, `--verify-config`, `--systeminfo`.

## Core trio wiring (Lua config)

```lua
hl.on("hyprland.start", function()
  hl.dispatch(hl.dsp.exec_cmd("hyprpaper"))
  hl.dispatch(hl.dsp.exec_cmd("hypridle"))
end)
hl.bind("SUPER + L", hl.dsp.exec_cmd("hyprlock"))
```
hypridle listeners. **On 0.57, `hyprctl dispatch` expects a Lua expression**, so legacy `hyprctl dispatch dpms off` no longer works; use the `hl.dsp.*` form (the wiki example does):
```
general {
    lock_cmd = pidof hyprlock || hyprlock
    before_sleep_cmd = loginctl lock-session
    after_sleep_cmd = hyprctl dispatch 'hl.dsp.dpms({ action = "enable" })'
}
listener { timeout = 300  on-timeout = hyprctl dispatch 'hl.dsp.dpms({ action = "disable" })'
                          on-resume  = hyprctl dispatch 'hl.dsp.dpms({ action = "enable" })' }
listener { timeout = 330  on-timeout = hyprlock }
```
`condition_cmd` (run via `/bin/sh -c`; exit 0 fires `on-timeout`) and `condition_retry` (re-check every N seconds while idle) are available for conditional timeouts.

## 0.57 compatibility notes

- `hyprctl keyword` is gone; scripts and daemons must use `hyprctl eval 'hl.config(...)'`.
- `hyprctl dispatch '<legacy dispatcher>'` fails with a hint; pass `'hl.dsp.*'`.
- `hyprctl deprecated-config` lists options currently set with a deprecation notice.
- Out-of-range values are config errors; generated configs must clamp (e.g. `decoration.shadow.render_power` 1..4).

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
