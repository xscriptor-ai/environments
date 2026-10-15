# Symptom playbooks (Hyprland live debugging)

Format: **first commands → what to look for → next step**. Commands assume a TTY unless stated. Always start from Phase 0 facts (skill SKILL.md).

## "Hyprland won't start / immediately exits"

1. Run from TTY: `start-hyprland` (or `Hyprland --safe-mode` to skip config/plugins). Watch stdout.
2. `Hyprland --verify-config` — if it reports Lua errors, fix config first (skill `hyprland-lua`).
3. Log: `cat $XDG_RUNTIME_DIR/hypr/$(ls -t $XDG_RUNTIME_DIR/hypr | head -1)/hyprland.log | tail -100`. Look for `[backend failed to start]`, `Monitor ... NO PREFERRED MODE`, driver lines in ERROR.
4. `ls /dev/dri/` — no nodes? Driver/KMS problem (or WSL: see skill `arch-wsl-headless`). `drm_info` for connector state.
5. Crash at launch: `coredumpctl info` → `coredumpctl debug Hyprland` → `bt -full`.
6. Session-manager launch failing (DM/UWSM): test from a plain TTY with `dbus-run-session start-hyprland` to separate session plumbing from compositor.

## "Black screen / no outputs after update"

- `hyprctl monitors -j` — outputs at all? If "no outputs": `ls /sys/class/drm/*/status | xargs -I{} sh -c 'echo {} $(cat {})'`.
- Multi-GPU laptops: force primary with `AQ_DRM_DEVICES=/dev/dri/card1:card0` (order matters; first = primary renderer).
- External monitor blank: `AQ_NO_MODIFIERS=1`; check `dmesg | grep -i -E "amdgpu|i915|nvidia"` for link training errors.
- NVIDIA: verify kernel modeset; add the historical env trio only when diagnosing; check `nvidia-smi` works while the compositor is up.
- Headless/vGPU machines: `AQ_NO_KMS_REQUIREMENT=1` is required to start with render-only nodes; Hyprland then creates `HEADLESS-0`.

## "It freezes / hangs"

- Determine scope: whole input? one window? rendering only?
  - Input dead but SSH works → compositor thread stuck: get a stack! `sudo gdb -p $(pgrep -x Hyprland) -batch -ex "thread apply all bt"` won't work on the live GPU thread reliably; prefer coredump after SIGABRT via `kill -ABRT`, or perf to find the hot loop.
  - One window unresponsive → app issue: check `misc.enable_anr_dialog` (ANR dialog) and kill it.
- Executing something in a bind that blocks (clipboard tools, sleeps, `io.popen`) will freeze input — audit recent bind changes (skill `hyprland-lua`).
- NFS/mount or network FS in config requires → filesystem hangs stall config reload.

## "Crashes repeatedly (crash loop)"

1. `start-hyprland` auto-restarts but backs off if crashes <10s apart; check wrapper output.
2. Safe mode: `start-hyprland -- --safe-mode`. Sane? Then it's config/plugins: disable all plugins (`hyprpm disable` each), bisect config files.
3. Plugin ABI: `hyprctl version` commit vs plugin build — must match exactly.
4. coredump backtrace (Phase 2) — if it points into a driver, collect `dmesg` + `drm` debug log; that goes to the driver vendor AND upstream.
5. After a Hyprland update on Arch, libs (aquamarine/hyprutils/hyprlang) must all come from the same rebuild — `pacman -Syu`, no partial upgrades.

## "Tearing / stutter / bad frame pacing"

1. `debug.overlay` on → read frame times; disable blur/shadow/animations to compare.
2. Tearing: `general.allow_tearing=true` + per-window `immediate` rule; verify VRR state per monitor (`hyprctl monitors -j` → `vrr`).
3. VRR flicker on OLED: constrain VRR range in monitor settings or disable for desktop.
4. Intel iGPU stutter on battery: TLP min-freq notes (skill `hyprland` extras/performance); also `render_unfocused_fps`.
5. Change one knob per test: `new_render_scheduling`, `commit_timing_enabled`, `use_shader_blur_blend`, `blur.variant`.

## "Input does nothing / wrong device / wrong keysym"

1. `libinput debug-events --show-keycodes` — events at libinput level? No → kernel/udev/firmware issue (`evtest`, `dmesg`).
2. Yes at libinput but not in Hyprland → check per-device overrides (`hl.device`, `hyprctl devices`), then keyboard layout config (`input.kb_*`) and `hyprctl switchxkblayout`.
3. Wrong key for binds: `wev` gives the keysym; bind with `SUPER + <keysym>` or `code:<n>`.
4. Touchpad gestures ignored: `wayland-info` → check gesture protocol; per-device `hl.device` can shadow global gesture config only if you set it there.
5. Keys "stuck" after unlock: check `input:follow_mouse`, `binds:pass_mouse_when_bound`, and whether a submap is active (`hyprctl submap`).

## "Screen sharing / screenshots fail"

1. `systemctl --user status xdg-desktop-portal xdg-desktop-portal-hyprland` — both running, backend chosen (`journalctl --user -u xdg-desktop-portal | grep -i backend`).
2. Kill conflicting backends (`-gnome`, `-kde`, `-wlr` if installed by accident).
3. `ecosystem.enforce_permissions` → Permission Manager prompt on first capture; pre-allow with `hl.permission("/usr/(bin|local/bin)/grim", "screencopy", "allow")` and for the portal binary.
4. Manual test: `grim -l 1 /tmp/t.png` (then `file /tmp/t.png`). OBS: choose "Screen Capture (PipeWire)"; picker app is Qt-based (hyprland-share-picker).
5. Wayland vs XWayland app: `QT_QPA_PLATFORM=wayland`, `GDK_BACKEND=wayland`, `SDL_VIDEODRIVER=wayland` (only if the app misdetects).

## "Clipboard empty / broken"

- `wl-paste --watch echo ok` + `wl-copy` round trip; if fine at protocol level, check your clipboard manager (cliphist store watcher, `wl-clip-persist` for X11 apps).
- After crash/restart, clipboard state is lost by design (compositor restart); persist with `wl-clip-persist` if needed.

## "Suspend/resume or DPMS oddities"

- `journalctl -b | grep -i -E "suspend|resume"` and check for stuck DRM state; `hyprctl monitors` after resume; monitor firmware quirks often need `AQ_NO_ATOMIC` or driver knobs — collect `dmesg` right after resume.
- hypridle: verify listeners and `hyprctl dispatch force_idle` behavior; idle inhibitors (video playback) may keep screens on (`wayland-info` lists `zwp_idle_inhibit_manager_v1`).
- Lock on resume: hyprlock + PAM — test `loginctl lock-session` and check `journalctl --user -u hyprlock`.

## "Everything is slow only after login (not in TTY)"

- `systemd-analyze --user blame`, `systemctl --user list-units --state=failed`.
- Portal/graphical-session target problems: `systemctl --user status hyprland-session.target graphical-session.target` (auto-integrated since 0.55-era; remove old manual systemctl commands from config).
- `HYPRLAND_NO_SD_TARGET=1` to isolate session-target interactions.
