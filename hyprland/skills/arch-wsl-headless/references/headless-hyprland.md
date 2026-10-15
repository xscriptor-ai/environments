# Headless Hyprland recipes (WSL + CI)

All recipes assume Arch + `hyprland` installed and systemd running (or an exported `XDG_RUNTIME_DIR`). Replace `$UID` and instance names as needed. These also work on any machine without a display (SSH boxes, CI runners with vgem/llvmpipe, Hyper-V guests).

## 0. Config gate (no compositor needed)

```bash
Hyprland --verify-config && echo "config OK"
# exits non-zero on syntax/runtime errors; run it on every config change, and in pre-commit/CI.
```

## 1. Environment matrix for a headless start

```bash
export XDG_RUNTIME_DIR=/run/user/$(id -u)          # MUST be /run/user/<uid> (Hyprland warns otherwise)
export AQ_NO_KMS_REQUIREMENT=1                     # allow render-only/no-KMS nodes (WSL, vGPU, headless boxes)
# optional:
# export AQ_DRM_DEVICES=/dev/dri/renderD128        # pick the render node explicitly
# export AQ_TRACE=1 HYPRLAND_TRACE=1               # verbose when debugging startup
# export GALLIUM_DRIVER=d3d12                      # WSL GPU path
# export LIBGL_ALWAYS_SOFTWARE=1                   # force llvmpipe when the driver is broken
```
Minimal test config (`~/.config/hypr/hyprland.lua`):
```lua
hl.monitor({ output = "HEADLESS-0", mode = "1920x1080@60", position = "0x0", scale = 1 })
hl.bind("SUPER + RETURN", hl.dsp.exec_cmd("true"))     -- no app needed
hl.on("hyprland.start", function() hl.notification.create({ text = "headless up", timeout = 2000 }) end)
```

## 2. Start & drive

```bash
dbus-run-session -- start-hyprland &                  # crash-recovery wrapper; use `Hyprland` if unavailable
sleep 3
hyprctl version && hyprctl monitors -j | head -20
hyprctl output create headless second                 # add virtual outputs at will
hyprctl dispatch 'hl.dsp.exec_cmd("foot")'            # dispatch tests
hyprctl repl                                          # interactive Lua against the live session
socat -U - UNIX-CONNECT:"$XDG_RUNTIME_DIR/hypr/$HYPRLAND_INSTANCE_SIGNATURE/.socket2.sock"  # event stream
```
Teardown: `hyprctl dispatch 'hl.dsp.exit()'` (or `start-hyprland` Ctrl+C / `pkill Hyprland`). Verify nothing lingers: `hyprctl instances`.

## 3. See it (VNC) and capture it (screencopy)

```bash
# viewer (input included):
wayvnc 127.0.0.1 5900 -o HEADLESS-0 --gpu -f 60 &
# from Windows: connect TigerVNC to localhost:5900 (WSL forwards localhost)
# one-shot capture:
grim -o HEADLESS-0 /tmp/shot.png && file /tmp/shot.png
```
- If capture is denied: `ecosystem.enforce_permissions` is on → add `hl.permission(".*grim.*", "screencopy", "allow")` (restart required) or accept the prompt.
- On llvmpipe, expect low fps and high CPU; that's the environment, not your config.

## 4. Quickshell smoke tests

```bash
pacman -S quickshell
QS_DISABLE_CRASH_HANDLER=1 qs -c mybar -n &     # no crash relaunch loops while iterating
sleep 2
qs list -a                                       # instance running?
qs log -t 100 | grep -iE "error|qml|binding"     # triage QML warnings
qs ipc show                                      # your IpcHandlers discovered?
qs ipc call mybar ping                           # health function you exposed
qs kill -i <id>                                  # clean shutdown
```
For QML debugging: `qs --debug 8080 --waitfordebug -c mybar` and attach a QML debugger.

## 5. hyprtester (upstream behavioral tests)

Only meaningful with a source checkout (debug build). On WSL it runs against headless outputs:
```bash
git clone --recursive https://github.com/hyprwm/Hyprland && cd Hyprland
make debug   # tests are built in Debug
./build/hyprtester/hyprtester -c hyprtester/test.lua -b ./build/Hyprland -p hyprtester/plugin/hyprtestplugin.so
# selected tests:  ./build/hyprtester/hyprtester dwindleSplit focusMasterPrevious ...
```
Heavy on llvmpipe; use for validating upstream changes, not for routine config testing.

## 6. Scripted CI pattern (single script)

```bash
#!/usr/bin/env bash
set -euo pipefail
export XDG_RUNTIME_DIR=${XDG_RUNTIME_DIR:-/run/user/$(id -u)}
export AQ_NO_KMS_REQUIREMENT=1
Hyprland --verify-config
dbus-run-session -- bash -c '
  set -e
  start-hyprland & sleep 3
  hyprctl monitors -j >/dev/null
  hyprctl eval "hl.config({ general = { gaps_in = 7 } })"
  [ "$(hyprctl getoption general.gaps_in -j | grep -o "\"int\": [0-9]*" | head -1)" = "\"int\": 7" ]
  qs -c ci -n & sleep 2
  qs ipc call ci ping
  hyprctl dispatch "hl.dsp.exit()" ; pkill -f "qs -c ci" || true
'
```
Notes: `hyprctl getoption` JSON shape may vary by version — assert on `hyprctl -j getoption` fields defensively. Always give the compositor a few seconds (llvmpipe startup is slow).

## 7. Troubleshooting headless starts

| Symptom | Cause → fix |
|---|---|
| "Bailing out, $XDG_RUNTIME_DIR is invalid" | export `XDG_RUNTIME_DIR=/run/user/$UID` (systemd) |
| "backend failed to start" | no DRM node at all → `modprobe vgem`, or fix GPU driver (WSL: `wsl --update`) |
| Starts but no monitors | `AQ_NO_KMS_REQUIREMENT=1` missing on render-only nodes; else `hyprctl output create headless` |
| Screencopy blocked | Permission Manager; pre-allow or accept prompt (needs a visible prompt consumer) |
| Wayvnc connects but black | GPU/llvmpipe frame delivery slow; try `--gpu` off, lower `-f`, or a real render node |
| Sockets not found | wrong instance: `HYPRLAND_INSTANCE_SIGNATURE` stale after crash; use `hyprctl instances` |
| Quickshell exits silently | `qs log -t 50`; remove `-n` duplicates; check `.qmlls.ini`/config path errors |
| Nested Hyprland on WSLg shows one frame | known aquamarine nested-output bug (#348) — use headless instead |

## 8. What WSL headless cannot validate

Real GPU effects/perf (blur variants, HDR/VRR, tearing), hotplug, suspend/resume, multi-seat, PAM lock flows end-to-end, and screenshare portals with hardware encoders. Verify those on hardware or a VM with vGPU before shipping changes to users.
