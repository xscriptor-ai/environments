# hyprctl + IPC reference (0.57)

Verified 2026-11-01 against Hyprland **v0.57.0** `src/ipc/s1/Commands.cpp` and `hyprctl --help`. The Lua config change did not change the socket transport; it did change the accepted command syntax.

## hyprctl info
`version` · `monitors [-j]` (`monitors all` includes inactive) · `workspaces` · `activeworkspace` · `workspacerules` · `clients` · `activewindow` · `layers` · `devices` · `decorations <window_regex>` · `animations` · `binds` · `submap` · `cursorpos` · `instances` · `layouts` · `locked` · `splash` · `status` · `configerrors` · `deprecated-config` (options currently set that carry a deprecation notice; `all good!` when clean) · `rollinglog [-f]` · `getoption <dotted.path>` (e.g. `general.border_size`; colon form is legacy) · `getprop <window> <prop>` · `descriptions -j` (all options as JSON) · `notify <icon> <ms> <color> msg` (icon -1/0..5, prefix `fontsize:N`) · `dismissnotify [n]` · `globalshortcuts` · `systeminfo`

## hyprctl control (0.57)
- `reload` · `reload config-only` (skip monitor reload) · `reload full-reset` (recreate the Lua config context and flush value caches; no longer switches providers).
- `dispatch '<lua>'` — **shorthand for `hl.dispatch(<lua>)`**. Use `hyprctl dispatch 'hl.dsp.window.close()'`; a bare legacy dispatcher (`killactive`) logs a note and fails.
- `eval '<lua>'` · `repl [code]` (interactive Lua REPL since 0.56; one-shot prints the `tostring()` result).
- `setprop <window> <prop> <value>` · `setcursor <theme> <size>` · `seterror [disable] [color] msg` · `switchxkblayout <dev|current|all> next|prev|<id>` · `kill` (xkill mode) · `output create|remove [backend] (name)` — backends: `wayland` (nested output), `headless` (virtual output), `auto`.
- **Removed:** `keyword` is not registered on 0.57 (legacy config provider removed). Do not emit `hyprctl keyword`; use `eval 'hl.config({...})'`.
- Flags: `-j` JSON · `-i <instance>` · `-r` refresh state · `--batch "a ; b"` (escape `;` inside Lua strings) · `-q`.

## Sockets
`$XDG_RUNTIME_DIR/hypr/$HYPRLAND_INSTANCE_SIGNATURE/`
- `.socket.sock` — requests `[flags]/command args` (e.g. `-j/clients`); synchronous with a ~5 s cap; open/close fast.
- `.socket2.sock` — events `EVENT>>DATA\n`.

```bash
socat -U - UNIX-CONNECT:"$XDG_RUNTIME_DIR/hypr/$HYPRLAND_INSTANCE_SIGNATURE/.socket2.sock"
```

## socket2 events (current)
`workspace [name]` · `workspacev2 [id,name]` · `changeworkspaceid` (0.57) · `focusedmon [mon,ws]` · `focusedmonv2 [mon,wsid]` · `activewindow [class,title]` · `activewindowv2 [addr]` · `fullscreen [0/1]` · `monitorremoved/v2` · `monitoradded/v2 [id,name,desc]` · `createworkspace/v2` · `destroyworkspace/v2` · `moveworkspace/v2` · `renameworkspace [id,newname]` · `activespecial/v2` · `activelayout [kbd,layout]` · `openwindow [addr,ws,class,title]` · `closewindow [addr]` · `kill [addr]` · `movewindow/v2` · `openlayer/closelayer [ns]` · `submap [name]` · `changefloatingmode [addr,0/1]` · `urgent [addr]` · `minimized [addr,0/1]` · `bell [addr]` · `screencast [state,owner]` · `screencastv2 [state,owner,name]` · `windowtitle/v2` · `togglegroup [0/1,addrs]` · `moveintogroup` · `moveoutofgroup` · `ignoregrouplock [0/1]` · `lockgroups [0/1]` · `configreloaded` · `pin [addr,state]`

NOT events (do not emit): `trayicon*`, `groupopen`, `screenresize`, `lockactivegroup`.

## hl.on Lua events (in-config)
`hyprland.start/shutdown` · `window.{bell,open,open_early,close,destroy,kill,active,urgent,title,class,pin,fullscreen,update_rules,move_to_workspace,minimize,update_state}` · `layer.{opened,closed}` · `monitor.{added,removed,focused,layout_changed}` · `workspace.{active,special_active,created,created_early,removed,move_to_monitor}` · `config.{reloaded,unload,props_refreshed}` · `keybinds.submap` · `screenshare.state` · `input.keyboard.key`

0.57 notes: `workspace.created_early` fires before activation and `workspace.created` after; `window.open_early` fires before rules, `window.open` after; `window.update_state` delivers `{ float?, pin? }` deltas (nil = unchanged); `config.unload` fires before the Lua state is torn down on reload/shutdown — use it to flush state.

## Future
hyprwire + hyprtavern (new wire protocol + session bus) are early-stage upstream — the UNIX sockets remain the interface today.
