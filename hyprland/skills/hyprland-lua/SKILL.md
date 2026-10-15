---
name: hyprland-lua
description: Complete Hyprland Lua config reference (Lua 5.5, Hyprland 0.55+/v0.56.x). Covers the full hl.* API (config, monitors, binds, dispatchers, rules, events, timers, notifications, queries, permissions), bind flags, custom Lua layouts (hl.layout.register), require/module semantics, LuaLS stubs, and debugging with repl/eval/--verify-config. Use when writing, migrating, reviewing or debugging hyprland.lua, or when a config misbehaves at reload time.
---

# Hyprland Lua config (Lua 5.5 era, October 2026)

Since Hyprland **0.55** the config language is Lua; hyprlang `.conf` is deprecated (notice since 0.56.1, legacy docs pinned to the 0.54 wiki). File: `~/.config/hypr/hyprland.lua` (also `$XDG_CONFIG_HOME/hypr/`; `HYPRLAND_CONFIG` overrides). Hyprland embeds **Lua 5.5** (CMake requires `lua>=5.5 <5.6`), so the language level is *not* 5.1/LuaJIT — `global` declarations, named vararg tables, read-only for-loop vars and `table.create` are available.

- Check the target first: `hyprctl version`. `< 0.55` → hyprlang `.conf` (skill `hyprland` covers legacy). `>= 0.55` → this skill.
- Verified **2026-10-15** against official sources: Hyprland **v0.56.2 tag** (CMake `lua>=5.5`, `meta/generateLuaStubs.py`, `hl.timer`/`hl.get_config`/queries in the v0.56.2 tree), wiki.hypr.land (lua-utilities, events, binds/flags/submaps, dispatchers, custom-layouts, environment-variables), lua.org 5.5 manual/news.
- Verify config changes without a session: `Hyprland --verify-config` (prints errors, exits; perfect over SSH/WSL/CI).
- Runtime probing: `hyprctl repl` (interactive Lua), `hyprctl repl '<expr>'`, `hyprctl eval '<code>'`, `hyprctl dispatch 'hl.dsp...'`.
- Stubs for editors: `/usr/share/hypr/stubs/hl.meta.lua` (installed by Hyprland, generated from source). Example config: `/usr/share/hypr/hyprland.lua`.
- Anything not inline here has depth in `references/`: `hl-api.md` (full API/dispatchers/events), `lua-55.md` (language + stubs/LSP setup), `debugging.md` (workflows, error semantics, tests).

## Minimal complete config

```lua
hl.monitor({ output = "", mode = "preferred", position = "auto", scale = "auto" })

hl.env("XCURSOR_SIZE", "24")

hl.config({
  general = { gaps_in = 5, gaps_out = 20, border_size = 2, layout = "dwindle" },
  decoration = { rounding = 10, blur = { enabled = true } },
  input = { kb_layout = "us", follow_mouse = 1, sensitivity = 0 },
})

hl.bind("SUPER + RETURN", hl.dsp.exec_cmd("kitty"))
hl.bind("SUPER + Q",       hl.dsp.window.close())
hl.bind("SUPER + 1",       hl.dsp.focus({ workspace = "1" }))
hl.bind("SUPER + SHIFT + 1", hl.dsp.window.move({ workspace = "1" }))
hl.bind("SUPER + L",       hl.dsp.exec_cmd("hyprlock"))

hl.on("hyprland.start", function()
  hl.exec_cmd("waybar")
  hl.exec_cmd("hyprpaper")
end)
```

## How loading works (know this cold)

- Split configs with `require("monitors")` (relative file or module), `require("./lua/monitors")`, or wildcard requires (`require("wildcard/*")` heuristics exist — see tests `hyprtester/lua-require/`). Each require runs in its own scope; a broken file only aborts itself — guard optional files with `pcall`.
- Errors: syntax errors block the whole reload (config stays on the last good state); runtime errors abort that file; type errors continue but raise a config popup. After any edit: check `hyprctl configerrors`, or run `Hyprland --verify-config` before restarting.
- Reload is automatic on save; `hyprctl reload` forces; `hyprctl reload full-reset` recreates the whole config context (only way to switch Lua <-> hyprlang).
- Infinite loops are killed by watchdog guards; if you lose all binds, emergency binds appear (SUPER+Q terminal, SUPER+R launcher, SUPER+M exit) — use them to recover.
- Lua callbacks run on the compositor event loop: never block inside `hl.bind` handlers (no `io.popen`, sleeps, clipboard tools). Launch commands through `hl.dsp.exec_cmd(...)`, which is async (`hl.exec_cmd()` too).

## API map (full catalog in references/hl-api.md)

Directives: `hl.config{}` · `hl.monitor{}` · `hl.device{}` · `hl.env(k,v)` · `hl.permission(path, type, action)` · `hl.bind(keys, dsp|fn, flags?)` · `hl.unbind(keys)` · `hl.curve{}` · `hl.animation{}` · `hl.gesture{}` · `hl.on(event, fn)` · `hl.timer(fn, {timeout, type})` · `hl.notification.create{...}` · `hl.dispatch(dsp)` · `hl.exec_cmd(cmd)`.
Rules: `hl.window_rule{}` · `hl.workspace_rule{}` · `hl.layer_rule{}`.
Queries: `hl.get_config` · `hl.get_active_window/windows/window(sel)/last_window` · `hl.get_workspaces/workspace(sel)/active_workspace/active_special_workspace/workspace_windows(ws)` · `hl.get_monitors/get_monitor/active_monitor/monitor_at/monitor_at_cursor` · `hl.get_cursor_pos` · `hl.get_layers` · `hl.get_devices` · `hl.get_current_submap` · `hl.get_loaded_plugins` · `hl.is_key_down(key)` · `hl.version()` · `hl.exec_scheduled_prop_refresh_immediately()`.
Dispatchers `hl.dsp.*`: general (`exec_cmd`, `exec_raw`, `focus`, `submap`, `dpms`, `force_idle`, `global`, `layout`, `pass`, `send_shortcut`, `send_key_state`, `event`, `reload_config`, `exit`, `no_op`, ...) · `hl.dsp.window.*` (close, kill, float, fullscreen(_state), move, swap, resize, pin, pseudo, center, cycle_next, drag, set_prop, signal, tag, ...) · `hl.dsp.workspace.*` · `hl.dsp.group.*` · `hl.dsp.cursor.*`. There is also shorthand `hl.focus.workspace("e+1")` for focus dispatchers.

## Bind flags (full list)

`hl.bind(keys, dispatcher_or_fn, { flag = value })` supports: `locked`, `release`, `click`, `drag`, `long_press`, `repeating`, `non_consuming`, `auto_consuming` (consume only if dispatcher returns ok), `mouse`, `transparent`, `ignore_mods`, `description`, `dont_inhibit`, `submap_universal`, `device`, `allow_input_capture`.

```lua
hl.bind("XF86AudioRaiseVolume", hl.dsp.exec_cmd("wpctl set-volume @DEFAULT_AUDIO_SINK@ 5%+"),
        { repeating = true })
hl.bind("XF86AudioMute", hl.dsp.exec_cmd("wpctl set-mute @DEFAULT_AUDIO_SINK@ toggle"),
        { locked = true })
hl.bind("SUPER + Q", hl.dsp.exec_cmd("kitty"), { description = "terminal" })
```
Conditional values inside dispatchers resolve **at config load**; wrap in a function for per-press evaluation. `auto_consuming` + `return { ok = false }` lets keys fall through to the focused app.

## Custom layouts (Lua-only feature)

```lua
hl.layout.register("columns", {
  recalculate = function(ctx)
    local n = #ctx.targets
    for i, target in ipairs(ctx.targets) do
      target:place(ctx:column(i, n))        -- :place() applies gaps/pseudo/reserved space
    end
  end,
  layout_msg = function(ctx, msg)           -- optional: handle `layoutmsg` messages
    if msg == "x" then return true end
    return "usage: ..."                      -- string = error shown to the user
  end,
})
-- activate:  hl.config({ general = { layout = "lua:columns" } })  or workspace_rule
```
`ctx`: `.area`, `.targets`, `:grid_cell(i, cols)`, `:column(i, n)`, `:row(...)`, `:split(area, side, ratio)`. `target`: `.window` (may be nil; groups expose the main window), `.index`, `.box`, `:place(box)`, `:set_box(box)` (manual only as a last resort). Ready-made examples: `example/layouts/{columns,grid,spiral,manual}.lua` in the Hyprland repo.

## Migration cheatsheet (hyprlang → Lua)

| hyprlang (≤ 0.54) | Lua (0.55+) |
|---|---|
| `general { gaps_in = 5 }` | `hl.config({ general = { gaps_in = 5 } })` or `["general.gaps_in"]` |
| `monitor = DP-1, 2560x1440@165, 0x0, 1` | `hl.monitor({ output = "DP-1", mode = "2560x1440@165", position = "0x0", scale = 1 })` |
| `env = QT_QPA_PLATFORM,wayland` | `hl.env("QT_QPA_PLATFORM", "wayland")` |
| `exec-once = waybar` | `hl.on("hyprland.start", function() hl.exec_cmd("waybar") end)` |
| `bind = SUPER, Q, killactive` | `hl.bind("SUPER + Q", hl.dsp.window.close())` |
| `windowrule = float, class:^(kitty)$` | `hl.window_rule({ match = { class = "^(kitty)$" }, float = true })` |
| `workspace = 2, monitor:DP-1` | `hl.workspace_rule({ workspace = "2", monitor = "DP-1" })` |
| `blurls = waybar` | `hl.layer_rule({ match = { namespace = "^(waybar)$" }, blur = true })` |
| `bezier = ...` / `animation = ...` | `hl.curve("name", {...})` / `hl.animation({ leaf = "...", ... })` |
| `bindm = SUPER, mouse:272, movewindow` | `hl.bind("SUPER + mouse:272", hl.dsp.window.drag(), { mouse = true })` |

Colors are strings (`"#RRGGBBAA"`, `"rgba(...)"`, `0xAARRGGBB` still parses); gradients accept `{ colors = {...}, angle = 45 }` or `"0x... 0x... 45deg"`. Regexes are RE2 with `negative:` prefix. hyprctl paths now use dots (`general.border_size`).

## Debugging quick sheet (details: references/debugging.md)

```bash
Hyprland --verify-config                     # parse/execute config, report errors, don't run
hyprctl configerrors                         # errors since last load
hyprctl repl 'hl.get_active_window().class'  # one-shot eval with tostring()
hyprctl eval 'hl.config({ ["general.gaps_in"] = 0 })'   # runtime option change
hyprctl reload && hyprctl notifications 2>/dev/null || true
tail -f "$XDG_RUNTIME_DIR/hypr/$(ls -t "$XDG_RUNTIME_DIR/hypr" | head -n1)/hyprland.log"
```
Gotchas: `hl.get_config("general.gaps_in")` returns the *expanded* table (`{top,left,right,bottom}`); workspace-rule/prop changes take effect after a **prop refresh** (next event boundary, or call `hl.exec_scheduled_prop_refresh_immediately()` deliberately); guard test scripts with `hl.version()` when supporting 0.55–0.56 mixes.
