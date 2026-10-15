# Debugging hyprland.lua (workflows & error semantics)

## The fast loop

```bash
Hyprland --verify-config                            # run config headless, report, exit (also fine over SSH/WSL)
hyprctl configerrors                                # what failed in the running instance, if any
hyprctl reload                                      # force reload after an edit
hyprctl repl                                        # interactive; Ctrl+D exits
hyprctl repl 'hl.get_active_window().class'
hyprctl repl 'for i, w in pairs(hl.get_windows()) do print(i, w.class, w.title) end'
```

- `--verify-config` executes the whole config (including `hl.on` registrations? no — it parses/evaluates the config context and prints errors; side-effect-free enough for CI, and the recommended gate before reloading a live session).
- On a live session, always finish with `hyprctl configerrors`; a silent reload failure is usually a syntax error earlier in the file.

## Error semantics (what happens when it goes wrong)

| Failure | Behavior |
|---|---|
| Lua syntax error | Whole reload blocked; previous config keeps running. Error goes to log + configerrors. |
| Runtime error in a file | That file aborts; the rest of the config keeps running. |
| Type error in `hl.*` arguments | Config continues (with those lines skipped); an error popup/entry appears. |
| Infinite loop in config | Watchdog guard kills the execution; reported in log. |
| Blocking call in a bind | Input freezes until it returns — no watchdog rescue; avoid `os.execute`/`io.popen`/sleeps. |
| All binds lost / broken reload | Emergency binds appear: SUPER+Q (terminal), SUPER+R (launcher), SUPER+M (exit); recover from there. |

`hyprctl repl` exceptions are returned to you directly ("ok" or the error), which makes it a good REPL to bisect a failing expression: paste suspicious lines from your config one at a time.

## Common mistakes checklist

1. **Nil indexing** — `hl.get_active_window()` can return `nil` (empty workspace); both window and workspace queries may be nil in edge cases. Code defensively: `local w = hl.get_active_window(); if w then ... end`.
2. **Load-time vs call-time** — `hl.dsp.exec_cmd("foot", { float = not w.active })` evaluates at load. Wrap the whole dispatcher construction in a bind function.
3. **require paths** — relative to the config file; `require("lua.monitors")` (module style) vs `require("./lua/monitors.lua")`; parents; wildcards. A failed `require` aborts the calling file — use `pcall(require, "...")` for optional parts.
4. **Scope leaks between files** — `local` at file top-level is private; make shared values a module table (`return M`) or a `global` (5.5).
5. **Rules order** — `hl.window_rule` evaluation is top-to-bottom, last match wins; named rules can be toggled at runtime.
6. **Prop refresh timing** — reads right after `hl.workspace_rule`/`hl.config` in the same function see the old value.
7. **hyprctl dotted paths** — `hl.get_config("input.touchpad.tap_to_click")` (underscores in the Lua era; the 0.54 hyphenated names are gone).
8. **Env timing** — `hl.env()` after startup still affects spawned apps, but not the running session/portal; set critical env before launch or in the session wrapper.

## Interactive recipes

```lua
-- dump focused monitor layout
local m = hl.get_active_monitor(); print(m.name, m.position.x, m.position.y)

-- temporary gaps tweak (no file edit)
hyprctl eval 'hl.config({ ["general.gaps_in"] = 0 })'

-- inspect rule matches while debugging
hyprctl repl 'hl.get_active_window()'        -- prints HL.Window object; use fields
```

`hyprctl dispatch 'hl.dsp...'` == `hyprctl eval 'hl.dispatch(hl.dsp...)'`; use it to test dispatcher syntax without touching keybinds.

## Testing the config in CI / headless

- `Hyprland --verify-config` exits non-zero on config errors — perfect for git hooks/CI (`hyprland --verify-config` also works in WSL; skill `arch-wsl-headless`).
- `Hyprland --systeminfo` and `hyprctl descriptions -j` give machine-readable introspection for bug reports.
- Full behavioral tests live in-repo: `hyprtester` (Lua-driven). Developers: `make test` or
  `./build/hyprtester/hyprtester -c hyprtester/test.lua -b ./build/Hyprland -p hyprtester/plugin/hyprtestplugin.so` — individual tests by name, e.g. `hyprtester dwindleSplit focusMaster`.
- Unit tests for pure Lua logic (rules helpers, layout math): run them with a standalone `lua5.5` binary; keep `hl.*` calls in thin wrappers so the logic stays testable.

## Recovering a broken session

1. `SUPER+M` emergency exit (if binds died) or `hyprctl dispatch exit` from a TTY to another instance... if the session is unusable: switch to a TTY, `pkill Hyprland` (or `systemctl --user` if session-managed), fix the file, relaunch with `start-hyprland`.
2. Safe mode via the wrapper: `start-hyprland -- --safe-mode` (no plugins/customizations) or plain `Hyprland --safe-mode`; then bisect config files by commenting requires.
3. Keep a known-good `hyprland.lua` + `hyprland.lua.bak` pair; `hyprctl reload full-reset` only when you truly need a fresh context (e.g. switching config language).
