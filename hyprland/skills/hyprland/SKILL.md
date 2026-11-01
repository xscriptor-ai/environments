---
name: hyprland
description: Deep up-to-date Hyprland reference (v0.57.x, Lua-only config since 0.57; Lua era since 0.55). Use when writing/porting hyprland.lua configs, binds, dispatchers, window/workspace/layer rules, animations, monitors, or driving hyprctl/IPC. Covers legacy hyprlang for <= 0.56.x only (removed in 0.57).
---

# Hyprland Reference (November 2026)

Current stable: **v0.57.0** (2026-10-28). Version line continues 0.x — there is NO 1.0. Verified **2026-11-01** against official sources: hyprwm releases, Hyprland **v0.57.0** sources (`src/config/values/ConfigValues.cpp`, `src/ipc/s1/Commands.cpp`, generated Lua stubs), and wiki.hypr.land (`main`). Docs are versioned at **https://wiki.hypr.land/** (per-release snapshots via the version selector, e.g. `/0.57.0/`). Prefer the tag artifacts for defaults/ranges/API names; the `main` wiki may describe unreleased work.

## Critical change: Lua only on 0.57+, hyprlang removed

- File: `~/.config/hypr/hyprland.lua`. Since **0.55** Lua is the default; since **0.56.1** a `.conf` shows a deprecation notice; since **0.57.0** the legacy hyprlang loader is **removed** (`config: remove legacy config support`). A `.conf` passed to 0.57 is parsed as Lua and fails (`attempt to call a nil value (global 'general')`).
- Version detection: `hyprctl version`.
  - `< 0.55`: write hyprlang `.conf`.
  - `0.55`–`0.56.x`: Lua is the target; the legacy loader still exists (deprecated, do not use for new work).
  - `>= 0.57`: Lua only.
- Hyprland embeds **Lua 5.5** (Lua 5.5.1 in current Arch packages); deep reference + full API: skill `hyprland-lua`.
- Reload: auto on save; `hyprctl reload`; `hyprctl reload full-reset` recreates the whole Lua config context (it no longer switches providers). `hyprctl keyword` is **not registered** on 0.57 — use `hyprctl eval 'hl.config({...})'`.
- Verify configs without a session (SSH/WSL/CI): **`Hyprland --verify-config`** — exits non-zero on errors. On 0.57 it also fails on **out-of-range config values**. Also `Hyprland --systeminfo`, `--version-json`.
- Launch the session with **`start-hyprland`** (recommended since 0.53: crash recovery + safe mode; `start-hyprland -- -h` shows flags, `-- --safe-mode` for debugging). Starting the bare `Hyprland` binary triggers a watchdog warning (`misc.disable_watchdog_warning` silences it); safe mode expects hyprland-guiutils installed.
- Always verify claims against the wiki pages before generating long configs: paths are lowercase-nested under `configuring/core/*` and `configuring/layouts/*`.

## Lua API cheat sheet

```lua
hl.config({ general = { gaps_in = 5, gaps_out = 20 } })      -- or dotted: hl.config({ ["decoration.blur"] = { enabled = true } })
hl.monitor({ output = "DP-1", mode = "2560x1440@165", position = "0x0", scale = 1 })
hl.env("QT_QPA_PLATFORM", "wayland;xcb")
hl.device({ name = "logitech-g502", sensitivity = -0.5 })
hl.permission("/usr/(bin|local/bin)/grim", "screencopy", "allow")   -- pre-authorize (restart required)
hl.bind("SUPER + RETURN", hl.dsp.exec_cmd("kitty"), { description = "terminal" })
hl.unbind("SUPER + TAB")
hl.define_submap("resize", function() hl.bind("h", function() hl.dispatch(hl.dsp.layout("togglesplit")) end) hl.bind("escape", hl.dsp.submap("reset")) end)
hl.gesture({ fingers = 3, direction = "horizontal", action = "workspace" })
hl.curve("snappy", { type = "spring", mass = 1, stiffness = 120, damping = 14 })
hl.animation({ leaf = "workspaces", enabled = true, speed = 8, curve = "snappy" })
hl.window_rule({ match = { class = "^(kitty)$" }, float = true })
hl.workspace_rule({ workspace = "2", persistent = true, monitor = "DP-1" })
hl.layer_rule({ match = { namespace = "^(waybar)$" }, blur = true })
hl.on("hyprland.start", function() hl.dispatch(hl.dsp.exec_cmd("waybar")) end)

-- runtime scripting (v0.57.x):
hl.timer(function() print("tick") end, { timeout = 1000, type = "repeat" })   -- :set_enabled()/:set_timeout()
hl.notification.create({ text = "hello", timeout = 3000, icon = "ok" })       -- icon: none/ok/warning/err/info/question/confused
hl.get_active_window()                                                        -- queries: windows/config/workspaces/monitors/devices/layers
hl.get_devices()                                                              -- 0.57: keyboards/pointers/tablets/touch/switch details
hl.get_config("general.gaps_in")                                              -- expanded value (css_gaps -> table)

-- 0.57 additions:
hl.dsp.exec_cmd("kitty", { float = true, move = { 0, 0 } })                   -- per-launch window-rule effects (PID-based)
hl.dsp.reload_config()                                                        -- same as hyprctl reload
hl.on("window.update_state", function(w, changes)                             -- float/pin state deltas; nil = unchanged
  print(w.title, changes.float, changes.pin)
end)

-- custom Lua layout (activate with layout = "lua:name"):
hl.layout.register("columns", { recalculate = function(ctx)
  for i, target in ipairs(ctx.targets) do target:place(ctx:column(i, #ctx.targets)) end
end })
```

Runtime: `hyprctl eval 'hl.config({...})'`, `hyprctl eval 'hl.dispatch(hl.dsp.*)'`, `hyprctl dispatch 'hl.dsp.*'` (0.57: a Lua expression, not a legacy dispatcher string), `hyprctl repl` (interactive REPL, 0.56+), `hyprctl repl '<expr>'`. Full dispatcher/bind-flag/event/query catalog: skill `hyprland-lua`.

## New in 0.57 (config authors must know)

- **Blur variants**: `decoration.blur.variant` accepts `kawase` (default), `frost`, `ripple`, `drops`, `water`, `fluid_jar`, `prism`, `heat_shimmer`, `acrylic`, `aurora`, `haze`. Each has its own dotted option group; variants can be animated and are GPU-expensive. `decoration.blur.proportional` (bool) ties blur strength to pixel opacity.
- **Window wobble**: `decoration.wobble.{enabled,mesh,stiffness,damping,mass,intensity,value_epsilon,velocity_epsilon}`; disable per window with the `no_wobble` rule.
- **`layers` category**: `layers.allow_new_top_layers_over_existing_fullscreen`, `layers.layers_hog_keyboard_focus` (replaces deprecated `misc.layers_hog_keyboard_focus`).
- **Ranges are enforced** in Lua configs (min/max forwarded to Lua values): out-of-range values are config errors. Example: `decoration.shadow.render_power` is `1..4`; `5` is rejected and the option keeps its default (`3`).
- **Changed ranges**: `decoration.rounding` max 100 (was 20), `decoration.shadow.scale` 0.05..2, input/touchpad `scroll_factor` max 100, `binds.workspace_back_and_forth` int 0..2, `misc.exit_window_retains_fullscreen` int 0..3.
- **New rules**: `no_glow`, `no_wobble`, `no_xdg_drags`, `active_border`, `inactive_border`; workspace rule `no_wobble`.
- **New events**: `config.unload`, `window.bell`, `window.minimize`, `window.update_state`, `workspace.created_early`.
- **Lua API**: `hl.get_devices()`, `hl.get_monitors({ all = true })`, `hl.dsp.exec_cmd(cmd, rules?)`, `hl.dsp.reload_config()`, richer window/monitor/device objects, `HL.WindowStateUpdate`.

## Legacy hyprlang (only <= 0.56.x; removed in 0.57)

```conf
general { gaps_in = 5 col.active_border = rgba(ffffffff) rgba(888888ff) 45deg }
monitor = DP-1, 2560x1440@165, 0x0, 1
exec-once = waybar
bind = SUPER, Q, killactive
windowrule = float, class:^(kitty)$
windowrule { name = x match:class = ^(foo)$ float }
```
hyprctl option paths used colons (`general:border_size`); touchpad options were hyphenated (`tap-to-click`) in 0.54, underscores in the Lua era. `windowrulev2` never exists — removed by 0.54. On 0.57 this syntax does not load at all.

## References (read as needed)

- `references/config-options.md` — condensed current option catalog with defaults, ranges, deprecations and the 0.57 additions.
- `references/ipc.md` — hyprctl commands (0.57 set), IPC sockets, socket2 event catalog, removed commands.
- `references/rules-animations.md` — rules catalogs and animation tree details.
- `references/scripts-and-tooling.md` — router for Bash/Python glue: language decision table, cross-language escaping cookbook, compositor-citizenship checklist (dedicated skills: `hyprland-bash`, `hyprland-python`).

Sibling skills: `hyprland-lua` (full Lua 5.5 + hl API + custom layouts), `hyprland-bash` (the .sh scripts), `hyprland-python` (.py tooling), `quickshell` (shells), `hyprland-live-debug` (live debugging), `arch-wsl-headless` (WSL/headless testing), `hyprland-tools` (ecosystem daemons), `hyprland-qml` (shell landscape).
