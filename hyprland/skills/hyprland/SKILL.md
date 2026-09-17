---
name: hyprland
description: Deep up-to-date Hyprland reference (v0.56.x, Lua config era since 0.55). Use when writing/porting hyprland.lua configs, binds, dispatchers, window/workspace/layer rules, animations, monitors, or driving hyprctl/IPC. Covers legacy hyprlang for <= 0.54.
---

# Hyprland Reference (September 2026)

Current stable: **v0.56.2** (2026-08-05). Version line continues 0.x — there is NO 1.0. Docs are versioned at **https://wiki.hypr.land/** (defaults "Latest git"; per-release snapshots via the version selector, e.g. `/0.56.0/`). Legacy hyprlang docs: pinned 0.54 wiki pages.

## Critical change: config is Lua since 0.55

- File: `~/.config/hypr/hyprland.lua`. hyprlang `.conf` is deprecated (deprecation notice shown since v0.56.1). Migration target: Lua API below.
- Version detection: `hyprctl version`. If `< 0.55` write hyprlang.
- Reload: auto on save; `hyprctl reload`; `hyprctl reload full-reset` recreates the whole config context.
- Always verify claims against the wiki pages before generating long configs: paths are lowercase-nested under `configuring/core/*` and `configuring/layouts/*`.

## Lua API cheat sheet

```lua
hl.config({ general = { gaps_in = 5, gaps_out = 20 } })      -- or dotted: hl.config({ ["decoration.blur"] = { enabled = true } })
hl.monitor({ output = "DP-1", mode = "2560x1440@165", position = "0x0", scale = 1 })
hl.env("QT_QPA_PLATFORM", "wayland;xcb")
hl.device({ name = "logitech-g502", sensitivity = -0.5 })
hl.bind("SUPER + RETURN", hl.dsp.exec_cmd("kitty"))
hl.unbind("SUPER + TAB")
hl.define_submap("resize", function() hl.bind("h", function() hl.dispatch(hl.dsp.layout("togglesplit")) end) hl.bind("escape", hl.dsp.submap("reset")) end)
hl.gesture({ fingers = 3, direction = "horizontal", action = "workspace" })
hl.curve("snappy", { type = "spring", mass = 1, stiffness = 120, damping = 14 })
hl.animation({ leaf = "workspaces", enabled = true, speed = 8, curve = "snappy" })
hl.window_rule({ match = { class = "^(kitty)$" }, float = true })
hl.workspace_rule({ workspace = "2", persistent = true, monitor = "DP-1" })
hl.layer_rule({ match = { namespace = "^(waybar)$" }, blur = true })
hl.on("hyprland.start", function() hl.dispatch(hl.dsp.exec_cmd("waybar")) end)
```

Runtime: `hyprctl eval 'hl.config({...})'`, `hyprctl eval 'hl.dispatch(hl.dsp.*)'`, `hyprctl dispatch 'hl.dsp.*'`, `hyprctl repl` (interactive REPL).

## Legacy hyprlang (only <= 0.54)

```conf
general { gaps_in = 5 col.active_border = rgba(ffffffff) rgba(888888ff) 45deg }
monitor = DP-1, 2560x1440@165, 0x0, 1
exec-once = waybar
bind = SUPER, Q, killactive
windowrule = float, class:^(kitty)$
windowrule { name = x match:class = ^(foo)$ float }
```
hyprctl option paths used colons (`general:border_size`); touchpad options were hyphenated (`tap-to-click`) in 0.54, underscores today. `windowrulev2` never exists — removed by 0.54.

## References (read as needed)

- `references/config-options.md` — condensed current option catalog with defaults.
- `references/ipc.md` — hyprctl commands, IPC sockets, socket2 event catalog.
- `references/rules-animations.md` — rules catalogs and animation tree details.
