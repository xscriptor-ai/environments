# hyprctl + IPC reference (0.55/0.56)

## hyprctl info
`version` · `monitors [-j]` · `workspaces` · `activeworkspace` · `workspacerules` · `clients` · `activewindow` · `layers` · `devices` · `decorations` · `animations` · `binds` · `submap` · `cursorpos` · `instances` · `layouts` · `locked` · `splash` · `configerrors` · `rollinglog [-f]` · `getoption <dotted.path>` (e.g. `general.border_size`; legacy colon form in hyprlang era) · `getprop <window> <prop>` · `descriptions -j` (all options JSON) · `notify <icon> <ms> <color> msg` (icon -1/0..5, prefix `fontsize:N`) · `dismissnotify [n]`

## hyprctl control
`reload` · `reload full-reset` · `dispatch '<hl.dsp.*>'` (e.g. `hyprctl dispatch 'hl.dsp.window.close()'`) · `eval '<lua>'` · `repl` (interactive Lua REPL, 0.56+) · `switchxkblayout <dev|current|all> next|prev|<id>` · `setcursor <theme> <size>` · `setprop <window> <prop> <value>` · `seterror [disable] [color] msg` · `kill` (xkill mode) · `output create|remove|add|destroy`
Flags: `-j` JSON · `-i <instance>` · `-r` · `--batch "a ; b"` (escape `;` in Lua strings)

## Sockets
`$XDG_RUNTIME_DIR/hypr/$HYPRLAND_INSTANCE_SIGNATURE/`
- `.socket.sock` — requests `[flags]/command args` (e.g. `-j/clients`); synchronous, 5 s timeout; open/close fast.
- `.socket2.sock` — events `EVENT>>DATA\n`.

```bash
socat -U - UNIX-CONNECT:"$XDG_RUNTIME_DIR/hypr/$HYPRLAND_INSTANCE_SIGNATURE/.socket2.sock"
```

## socket2 events (current)
`workspace [name]` · `workspacev2 [id,name]` · `focusedmon [mon,ws]` · `focusedmonv2 [mon,wsid]` · `activewindow [class,title]` · `activewindowv2 [addr]` · `fullscreen [0/1]` · `monitorremoved/v2` · `monitoradded/v2 [id,name,desc]` · `createworkspace/v2` · `destroyworkspace/v2` · `moveworkspace/v2` · `renameworkspace [id,newname]` · `activespecial/v2` · `activelayout [kbd,layout]` · `openwindow [addr,ws,class,title]` · `closewindow [addr]` · `kill [addr]` · `movewindow/v2` · `openlayer/closelayer [ns]` · `submap [name]` · `changefloatingmode [addr,0/1]` · `urgent [addr]` · `screencast [state,owner]` · `screencastv2 [state,owner,name]` · `windowtitle/v2` · `togglegroup [0/1,addrs]` · `moveintogroup` · `moveoutofgroup` · `ignoregrouplock [0/1]` · `lockgroups [0/1]` · `configreloaded` · `pin [addr,state]` · `minimized [addr,0/1]` · `bell [addr]`
NOT events (do not emit): trayicon*, groupopen, screenresize, lockactivegroup.

## hl.on Lua events (in-config, 0.55+)
`hyprland.start/shutdown` · `window.{bell,open,open_early,close,destroy,kill,active,urgent,title,class,pin,fullscreen,update_rules,move_to_workspace,minimize}` · `layer.{opened,closed}` · `monitor.{added,removed,focused,layout_changed}` · `workspace.{active,special_active,created,removed,move_to_monitor}` · `config.{reloaded,unload,props_refreshed}` · `keybinds.submap` · `screenshare.state` · `input.keyboard.key`

## Future
hyprwire + hyprtavern (new wire protocol + session bus) are early-stage upstream — legacy sockets remain the interface today.
