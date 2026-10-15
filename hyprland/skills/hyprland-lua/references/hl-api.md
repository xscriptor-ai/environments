# hl.* API catalog (Hyprland v0.56.x, verified Oct 2026)

Authoritative sources: wiki.hypr.land/configuring (Lua utilities, Dispatchers, Binds/Flags, Events, Notifications, Permissions), `meta/hl.meta.lua` stubs, and the source under `src/config/lua/`. When in doubt, the stubs and `hyprctl repl` are ground truth.

## Config directives

| Call | Notes |
|---|---|
| `hl.config(t)` | Nested table or dotted keys (`["general.gaps_in"] = 5`). Last write wins; also the live-edit path via `hyprctl eval`. |
| `hl.monitor(t)` | `output` (name, desc:, or `""` fallback), `mode` (`WxH@Hz`, `preferred`, `highres`, `highrr`, modeline), `position` (`0x0`, `auto*`), `scale` (number/`auto`), `transform 0-7`, `mirror`, `disabled`, `bitdepth`, HDR fields (`cm`, `sdr_eotf`), `vrr` (-1..3), `icc`, `reserved_area`. |
| `hl.env(k, v)` | Must run before session init for real env; later calls still set for spawned processes. `os.getenv` is available for composition. |
| `hl.device(t)` | Per-device overrides; `name` matches `hyprctl devices`. |
| `hl.permission(path_regex, type, action)` | Pre-authorize the Permission Manager: type `screencopy`/`plugin`/..., action `allow`/`deny`. Requires restart; check the Permissions wiki page. |
| `hl.bind(keys, dsp_or_fn, flags?)` | Keys: `SUPER + SHIFT + Q`, keysyms (`Alt_L`), keycodes (`code:28`), mouse buttons (`mouse:272` LMB / 273 RMB / 274 MMB), wheel (`mouse_up/down/left/right`). Returned object has `:unbind()`/`:remove()` and a `description` field. |
| `hl.unbind(keys)` | Case-sensitive, exact match; removes all earlier registrations of that key. |
| `hl.curve(name, { type = "bezier"/"spring", ... })` | Spring: `mass`, `stiffness`, `damping` (critical: `2*sqrt(k*m)`). |
| `hl.animation(t)` | `leaf`, `enabled`, `speed`, `curve`, `style`. Leaves: see skill `hyprland` (animation tree). |
| `hl.gesture(t)` | `fingers`, `direction` (`horizontal`, `pinch`, ...), `action` (`workspace`, `move`, `resize`, `special`, `close`, `fullscreen`, `float`, `cursor_zoom`, `scroll_move`, `unset`) or Lua `{start,update,finish}` / function. Fields: `mods`, `scale`, `disable_inhibit`. |
| `hl.window_rule(t)` | `match = { class=..., title=..., initial_class/title, content, focus, fullscreen, float, group, modal, pin, tag, workspace, xdg_tag, xwayland }` + static/dynamic effects; last match wins. Full catalog: skill `hyprland` → `references/rules-animations.md`. Named rules support runtime toggling. |
| `hl.workspace_rule(t)` | `workspace` selector, `monitor`, `persistent`, `default`, `default_name`, `layout`, `layout_opts`, `gaps_in/out/float_gaps`, `no_border/rounding/shadow`, `on_created_empty`, `animation`. |
| `hl.layer_rule(t)` | `match = { namespace = "^(waybar)$", ... }` + `above_lock`, `blur`, `blur_popups`, `ignore_alpha`, `dim_around`, `no_anim`, `no_screen_share`, `order`, `xray`, `animation`. |
| `hl.on(event, fn)` | Event subscription (catalog below); unlimited handlers. Careful with slow callbacks. |
| `hl.timer(fn, { timeout = ms, type = "repeat"/"oneshot" })` | Returns a timer object: `:set_enabled(bool)`, `:is_enabled()`, `:set_timeout(ms)`. Callbacks run on the event loop and are watchdog-guarded. |
| `hl.define_submap(name, [next_submap], fn)` | Define a submap; binds inside it are local; `hl.dsp.submap("name"/"reset")` switches. Optional second arg auto-forwards to another submap after a dispatch. Special bind key `catchall` catches any key (use to reset). Stuck? `hyprctl dispatch 'hl.dsp.submap("reset")'`. |
| `hl.notification.create({ text, timeout, icon, color })` | Icons: `-1`/`none`, `0 ok`, `1 warning`, `2 err`, `3 info`, `4 question`, `5 confused`; `hl.notification.get()` lists live notifications. |
| `hl.dispatch(dsp)` | Executes a dispatcher (needed inside functions/callbacks). |
| `hl.exec_cmd(cmd)` | Async exec (same as `hl.dsp.exec_cmd`); no `& disown` needed. |
| `hl.layout.register(name, { recalculate, layout_msg? })` | Custom layout, activated as `lua:name`. Details below. |

## Query (convenience) functions

```
hl.get_config("general.gaps_in")         -- expanded value (css_gaps -> table)
hl.get_active_window() / get_windows([filter]) / get_window(selector) / get_last_window()
hl.get_workspaces() / get_workspace(sel) / get_active_workspace() / get_active_special_workspace()
hl.get_workspace_windows(ws)
hl.get_monitors({ all = true }?) / get_monitor(sel) / get_active_monitor()
hl.get_monitor_at({ x, y }) / get_monitor_at_cursor()
hl.get_cursor_pos() / get_layers() / get_devices() / get_current_submap()
hl.get_loaded_plugins() / is_key_down(key|keycode) / version()
hl.exec_scheduled_prop_refresh_immediately()
```
Objects returned expose typed fields (check stubs/LSP): windows have `class`, `title`, `pid`, `active`, `fullscreen`, `fullscreen_handler`, `stable_id`, ...; monitors have `name`, `position {x,y}`, `activeWorkspace`, ...; workspaces have `id`, `name`, `windows`, ....

## Dispatcher catalog

**General** — `hl.dsp.`:
`dpms({ monitor?, action? })` (never direct in a bind; defer via `hl.timer`) · `event(str)` · `exec_cmd(cmd, { window-rule effects }?)` · `exec_raw(cmd)` (no `sh -c`) · `exit()` (prefer `hyprshutdown`) · `focus({ direction | monitor | workspace | window | urgent_or_last | last, on_current_monitor? })` · `force_idle(seconds)` · `force_renderer_reload()` · `global(str)` (D-Bus global shortcut) · `layout(msg)` · `no_op()` · `pass({ window? })` · `release_input_capture()` · `reload_config()` · `send_key_state({ window?, mods, key, state = "down"/"up" })` · `send_shortcut({ window?, mods, key })` · `submap(name)`.
Shorthand: `hl.focus.workspace("e+1")`.

**Window** — `hl.dsp.window.`:
`alter_zorder({ window?, mode = "top"/"bottom" })` · `center()` · `clear_tags()` · `close()` · `cycle_next({ next?, tiled?, floating? })` · `deny_from_group({ action? })` · `drag()` (mouse binds) · `float({ action? })` · `fullscreen({ action?, mode = "maximized"/"fullscreen", layout_aware? })` · `fullscreen_state({ action?, internal, client, layout_aware? })` (`-1` current, `0` none, `1` maximized, `2` fullscreen) · `kill()` (SIGKILL) · `move({ direction, group_aware? })` · `move({ workspace, follow? })` · `move({ monitor, follow? })` · `move({ x, y, relative? })` · `move({ into_group = dir })` · `move({ into_or_create_group = dir })` · `move({ out_of_group })` · `pin({ action? })` · `pseudo({ action? })` · `resize({ x, y, relative? })` · `resize({ keep_aspect_ratio? })` (mouse) · `set_prop({ prop, value })` (dynamic rule effects as string values) · `signal({ signal })` · `swap({ direction | target | next | prev })` · `tag({ tag })` · `toggle_swallow()`.
Common param defaults: `window = "activewindow"`, `action = "toggle"`.

**Workspace** — `hl.dsp.workspace.`:
`move({ workspace?, monitor })` · `rename({ workspace, name? })` · `swap_monitors({ monitor1, monitor2 })` · `toggle_special(name)` (no `special:` prefix here; other dispatchers DO need it: `move({ workspace = "special:magic" })`).

**Group** — `hl.dsp.group.`:
`toggle()` · `next()` / `prev()` · `active({ index })` · `move_window({ forward? })` · `lock({ all? | window?, action? })`.

**Cursor** — `hl.dsp.cursor.`:
`move({ x, y })` · `move_to_corner({ window?, corner = 0..3 })`.

## Events (hl.on)

`hyprland.start` · `hyprland.shutdown` · `config.props_refreshed` (bool: scheduled vs forced) · `config.reloaded` · `config.unload` (save state before reload/shutdown) · `keybinds.submap` (string) · `input.keyboard.key` (keycode, timestamp, 0/1/2 release/press/repeat) · `screenshare.state` (bool, type, name) · `monitor.added/removed/focused/layout_changed` · `workspace.active/created/removed/special_active/move_to_monitor` · `window.bell/class/close/destroy/fullscreen/kill/minimize/move_to_workspace/open/open_early/pin/title/update_rules/urgent/active` · `layer.opened/closed`.

## Prop refresh semantics

Setting `hl.config`, `hl.workspace_rule`, `hl.device`, etc. schedules a **prop refresh** executed at the end of the current event. Reads later in the same Lua function still see old values. To apply immediately: `hl.exec_scheduled_prop_refresh_immediately()` (use sparingly — it can cascade). `config.props_refreshed` tells you how many refreshes an event triggered.

## Custom layouts

`hl.layout.register(name, provider)` where provider = `{ recalculate = fn(ctx), layout_msg = fn(ctx, msg) -> true | string }`. Activate with `layout = "lua:" .. name` in `general.layout` or a workspace rule (`layout_opts` for per-layout settings you read yourself). `ctx.targets[i].window` may be nil (empty/group targets expose only the main window). Prefer `:place()` (applies gaps, pseudotiling, reserved space); `:set_box()` is for full manual control. `layout_msg` returning a string surfaces it as the error reply; returning `true` means handled.

## Notification, permission, notification-center integration

- Notification icons map to the hyprctl notify icon ids; the built-in notification system is what `hyprctl notify` and scripts use — Hyprland itself does not draw them; a daemon (your shell, SwayNC-ish) must consume/mirror them if you want visible popups. `hl.notification.get()` returns live ones.
- Permission manager: when `ecosystem.enforce_permissions = true`, screencopy/plugin tooling prompts unless `hl.permission(...)` pre-allows. Portal (`xdg-desktop-portal-hyprland`) and `grim` are the usual subjects.
