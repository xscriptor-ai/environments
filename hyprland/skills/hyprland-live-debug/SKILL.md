---
name: hyprland-live-debug
description: Live debugging on an Arch + Hyprland system — logs, crash reports, coredumpctl/gdb backtraces, safe mode, git bisect, ASan builds, DRM/GPU logs, Wayland trace, input/portal/screenshare diagnosis, and performance profiling. Use when a running Hyprland session misbehaves (crashes, freezes, black screens, input, sharing, tearing) and you need evidence-based debugging commands.
---

# Hyprland live debugging (Arch + Hyprland 0.56.x, October 2026)

Verified **2026-10-15** against official sources: wiki.hypr.land (Crashes and Bugs, Using hyprctl, contributing-and-debugging/tests), hyprwm release metadata, Aquamarine `docs/env.md` (main). Method, not folklore: reproduce → collect evidence → isolate one variable at a time → fix → verify. Everything below is current for v0.56.x; verify versions on the target (`hyprctl version`).

## Phase 0 — facts (30 seconds, always)

```bash
hyprctl version                # version/branch/commit/flags; < 0.55 means hyprlang config
hyprctl systeminfo 2>/dev/null; Hyprland --systeminfo   # machine-readable-ish report (binary, not hyprctl)
hyprctl configerrors           # config errors since load
hyprctl monitors -j | head -c 400                      # outputs alive?
journalctl --user -b -t Hyprland 2>/dev/null | tail -5 # if session-managed
ls /dev/dri/ && echo "drivers: $(lspci -k | grep -A2 -Ei 'vga|3d')"
```
Session start method matters: `start-hyprland` (crash recovery + safe mode, recommended since 0.53), DMs/UWSM, or plain `Hyprland` (watchdog warning). If it was NOT started via `start-hyprland`, say so in reports.

## Phase 1 — logs

```bash
# current instance (instance dir = $XDG_RUNTIME_DIR/hypr/<SIG>):
tail -n 300 "$XDG_RUNTIME_DIR/hypr/$HYPRLAND_INSTANCE_SIGNATURE/hyprland.log"
tail -f      "$XDG_RUNTIME_DIR/hypr/$HYPRLAND_INSTANCE_SIGNATURE/hyprland.log"

# last (crashed) session from a TTY:
cat "$XDG_RUNTIME_DIR/hypr/$(ls -t "$XDG_RUNTIME_DIR/hypr" | head -n1)/hyprland.log"
# previous session while a new one is running: ... head -n2 | tail -n1

hyprctl rollinglog -f          # in-memory ring buffer with follow
```
Log tools: `debug.disable_logs=false` enables file logging (`debug.enable_stdout_logs`, `debug.colored_stdout_logs`); `HYPRLAND_TRACE=1 AQ_TRACE=1` for very verbose (reproduce fast — huge files); `debug.gl_debugging` for GL errors; `debug.log_damage`, `debug.damage_blink` for render debugging; `debug.overlay` for the live perf overlay.

## Phase 2 — crashes

```bash
# crash report (attach to issues): $XDG_CACHE_HOME/hyprland/ or ~/.cache/hyprland/
ls -t ~/.cache/hyprland/hyprlandCrashReport*.txt | head
# stack trace (systemd + debug symbols):
coredumpctl list | grep -i hypr
coredumpctl info <PID>          # summary + metadata
coredumpctl debug Hyprland      # gdb attach to last crash; say yes to downloading symbols
# in gdb: set logging enabled ; bt -full
```
- `start-hyprland` provides crash recovery/safe mode — first try `start-hyprland -- --safe-mode` (no config/plugins) to prove the compositor is sane; then re-enable config.
- Reproduce from a TTY: `dbus-run-session start-hyprland` (or `Hyprland`) and watch stdout directly.
- Regression? Bisect (below). Memory corruption? ASan (below).

### Bisect (upstream regressions)
```bash
git clone --recursive https://github.com/hyprwm/Hyprland && cd Hyprland
git bisect start && git bisect good <good> && git bisect bad HEAD
git reset --hard --recurse-submodules && make all && ./build/Hyprland   # in TTY; repro; mark good/bad/skip
```

### ASan (deep memory debugging, TTY, no other instance)
```bash
git clone --recursive https://github.com/hyprwm/Hyprland && cd Hyprland
make asan                     # builds with AddressSanitizer
./build/Hyprland              # reproduce; attach asan.log.* from cwd, ~ or ./build
```

### DRM/kernel logs (glitches, black screens, driver issues)
```bash
echo 0x19F | sudo tee /sys/module/drm/parameters/debug   # verbose DRM logging
sudo dmesg -C && dmesg -w > ~/dmesg.log &                # then reproduce; Ctrl+C after
echo 0 | sudo tee /sys/module/drm/parameters/debug       # ALWAYS disable afterwards
```

## Phase 3 — configuration & logic bugs

- Config won't apply: `Hyprland --verify-config` (headless check; great over SSH/WSL), then `hyprctl configerrors`, then `hyprctl repl` to probe `hl.*` expressions one by one (skill `hyprland-lua` has the full error-semantics table).
- Rules not matching: evaluation is top-to-bottom, **last match wins**; test with `hyprctl getprop <window> <prop>` and `hyprctl clients -j`.
- Options seemingly ignored: per-device overrides beat globals (`hl.device`); per-workspace rules beat globals; prop refreshes are deferred to the event boundary.
- Binds: `hyprctl binds`, `hyprctl descriptions -j`, `wev` for keysym/keycode detection. Held/misbehaving keys → check flags (`release`, `repeating`, `non_consuming`, `auto_consuming`).
- Plugins: ABI must match `hyprctl version` exactly; disable all (`hyprpm disable` / remove) before blaming Hyprland, and test safe mode. `hyprpm list`, `hyprpm update`.

## Phase 4 — input, protocols, portals

```bash
libinput debug-events --show-keycodes      # raw input stream (does the device even deliver?)
libinput record /dev/input/eventX          # capture a device for bug reports
evtest /dev/input/eventX
wev                                        # Wayland events as seen by a client
wayland-info                               # protocols offered by the compositor
WAYLAND_DEBUG=1 app                        # per-client protocol trace (very noisy)
wl-paste --watch echo ok                   # clipboard smoke test (wl-clipboard)
```
Portals/screenshare: `systemctl --user list-units 'xdg-desktop-portal*'`; the Hyprland backend is `xdg-desktop-portal-hyprland` 1.4.x and the generic `xdg-desktop-portal` must run too; kill stale gnome/kde backends. If `ecosystem.enforce_permissions=true`, expect the compositor Permission Manager to prompt on first screencopy — pre-authorize with `hl.permission(...)`. Screen sharing diagnosis: `grim -l 1 /tmp/t.png` (manual capture), OBS should use the portal; check `journalctl --user -u xdg-desktop-portal*`.

## Phase 5 — GPU / rendering

- Aquamarine knobs: `AQ_DRM_DEVICES=/dev/dri/card1:card0` (force primary GPU), `AQ_NO_MODIFIERS=1` (works around some iGPU/USB-C blank-external-monitor cases), `AQ_FORCE_LINEAR_BLIT=0|1`, `AQ_MGPU_NO_EXPLICIT`, `AQ_NO_ATOMIC` (last resort), `AQ_NO_KMS_REQUIREMENT=1` (render-only/vGPU/headless), `AQ_TRACE=1` (verbose).
- NVIDIA: kernel modeset on, explicit sync era drivers; env trio commonly needed historically (`GBM_BACKEND=nvidia-drm`, `__GLX_VENDOR_LIBRARY_NAME=nvidia`, `LIBVA_DRIVER_NAME=nvidia`) — only add these while diagnosing an actual NVIDIA issue.
- Tools: `drm_info`, `intel_gpu_top`, `radeontop`, `nvtop`, `vulkaninfo`, `glxinfo -B`, `eglinfo`. Check `dmesg` for amdgpu/i915/nvidia errors.
- Tearing: `general.allow_tearing` + per-window `immediate` rule; VRR per monitor (`vrr -1..3`); `render.new_render_scheduling`, `commit_timing_enabled`, `debug.vfr` — change ONE knob at a time.
- Frame pacing/wobble: `debug.overlay` on, then toggle `decoration.blur`, shadows, animations; on laptops check TLP GPU freq notes (skill `hyprland` extras).

## Phase 6 — performance

- CPU: `perf top -p $(pgrep -x Hyprland)`, `perf record -g -p $(pgrep -x Hyprland)` then `hotspot`. `debug.overlay` for frame times; `render_unfocused_fps` for off-screen clients.
- Memory/leaks: `smem -t -k -P Hyprland`, watch RSS across workspace churn; GPU memory via `intel_gpu_top`/`nvidia-smi dmon`/`radeontop`.
- Worst-case reproduction matrix: many windows + blur + fullscreen video + screen share. Bisect effects vs scheduling options vs plugins.
- If it's the machine (thermal/throttle): `turbostat`, `sensors`, `journalctl -k | grep -i throttl`.

## Remote / headless live debugging (SSH into the box)

```bash
# from TTY/SSH, without any physical output:
export XDG_RUNTIME_DIR=/run/user/$UID
dbus-run-session -- start-hyprland            # headless output HEADLESS-0 is auto-created
# or attach to a running instance:
hyprctl --instance 0 monitors
hyprctl --instance 0 eval 'hl.exec_cmd("wayvnc 127.0.0.1 5900 -o HEADLESS-1 --gpu -f 60")'
# view from the other side: vncviewer localhost:5900
```
More headless recipes (and the WSL variant): skill `arch-wsl-headless`. Also useful: `hyprctl output create headless debug`, `grim -o HEADLESS-0 shot.png` (once screencopy passed permissions).

## Reporting upstream (make it actionable)

Attach: `hyprctl version`, the log excerpt (not the whole file), crash report `.txt` if any, `Hyprland --systeminfo`, GPU + driver + kernel (`uname -r`, `lspci -k`), exact repro steps, and whether the bug survives **safe mode / plugins disabled / default config**. Check the issue guidelines on the wiki (contributing-and-debugging/issue-guidelines) before posting; bisect results are gold.

## References in this skill

- `references/arch-toolbox.md` — install/verify the debugging toolbox on Arch (`pacman` commands, debuginfod, coredumpctl setup).
- `references/playbooks.md` — symptom → first commands, expected result, next step (won't start, black screen, freeze, tearing, input, share, clipboard, suspend).
