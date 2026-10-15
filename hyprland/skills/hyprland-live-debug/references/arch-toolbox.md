# The Arch debugging toolbox (install & verify)

Everything below is packaged in Arch repos (extra). Install in one go:

```bash
sudo pacman -S --needed gdb debuginfod systemd-coredump \
  strace ltrace perf bpftrace sysstat lsof \
  drm_info libva-utils vulkan-tools mesa-utils eglinfo wayland-utils \
  wev wlr-randr libinput evtest wl-clipboard grim slurp \
  intel-gpu-tools radeontop nvtop 2>/dev/null
# optional desktop: hotspot (perf UI), gammastep, wavemon ...
```

## Core loop tools

| Tool | What it answers | Notes |
|---|---|---|
| `hyprctl` | runtime state, config, dispatchers | `-j` for JSON; `--batch "a ; b"` reduces sync overhead; `rollinglog -f` |
| `Hyprland --verify-config` | "does my config even parse/execute?" | No session needed; non-zero exit on errors — CI-friendly |
| `start-hyprland` / `Hyprland --safe-mode` | "is it my config/plugins or the compositor?" | Safe mode skips customizations; wrapper adds crash recovery |
| `journalctl --user -b` | session service context | `-t Hyprland`, `-u xdg-desktop-portal-hyprland` |
| `coredumpctl` | post-crash backtraces | needs `systemd-coredump`; `debug` pulls symbols; `list/info/debug` |
| `debuginfod` | auto-download debug symbols | export `DEBUGINFOD_URLS="https://debuginfod.archlinux.org"` (usually preset) |
| `gdb` | manual `bt -full`, `info threads` | `set logging enabled` before dumping |

## Kernel / GPU

| Tool | Use |
|---|---|
| `dmesg -w`, `journalctl -k` | driver errors: amdgpu, i915/xe, nvidia, drm |
| `drm_info` | DRM state per card: connectors, modes, planes (great for "no outputs") |
| `vulkaninfo --summary` | Vulkan availability/renderer |
| `glxinfo -B`, `eglinfo` | GL/EGL renderer (is it llvmpipe or hardware?) |
| `intel_gpu_top` / `radeontop` / `nvtop` | GPU utilization and engine load |
| `perf`, `bpftrace` | CPU flamegraphs, syscall latency (`perf top -p $(pgrep -x Hyprland)`) |
| `hotspot` | GUI for perf.data |
| `/sys/module/drm/parameters/debug` | verbose DRM kernel logging: `0x19F` on, `0` off |

## Input

| Tool | Use |
|---|---|
| `libinput debug-events --show-keycodes` | raw events from all devices — proves hardware/udev works |
| `libinput record` | capture device stream for bug reports (`libinput replay`) |
| `evtest` | raw evdev per device |
| `wev` | what a Wayland client receives (keysyms for `hl.bind`) |
| `hyprctl devices -j` | how Hyprland sees devices (names for `hl.device`) |

## Wayland protocol / clients

| Tool | Use |
|---|---|
| `wayland-info` | protocols/versions exported by the compositor |
| `WAYLAND_DEBUG=1 cmd` | per-client protocol trace (noisy; filter by grep) |
| `wlr-randr` | per-output modes/positions/scale from the client side |
| `wl-paste` / `wl-copy` | clipboard round-trip tests |
| `grim` / `slurp` | screencopy smoke tests (subject to Permission Manager) |
| `wev`, `wlrctl` | misc utilities |

## Session/system services

- `systemctl --user list-units 'xdg-desktop-portal*'` — portal backend health; restart stale units with `systemctl --user restart xdg-desktop-portal xdg-desktop-portal-hyprland`.
- `systemd-analyze --user blame` — slow session startup.
- `uwsm status` (if used) — session manager state.
- `loginctl show-session $XDG_SESSION_ID` — seat/session type sanity.
- `busctl --user monitor org.freedesktop.portal.Desktop` — portal request forensics.

## Arch-specific recovery

- Rolling update broke it? Check the package log date: `grep "upgraded hyprland" /var/log/pacman.log | tail`; downgrade temporarily: `sudo pacman -U /var/cache/pacman/pkg/hyprland-<old>.pkg.tar.zst` (or `downgrade` from AUR) and hold it in `IgnorePkg` while reporting upstream.
- Compare against Arch package: `pacman -Qi hyprland aquamarine hyprutils hyprlang` — version mismatches between the compositor and its libs are a classic crash source (`hyprpm` ABI too).
- Config language check: `hyprctl version` says `>= 0.55` but you have `hyprland.conf`? Migrate (skill `hyprland-lua`) — 0.56.1+ shows a deprecation notice.
- Missing GPU firmware/kernel: `sudo dmesg | grep -i firmware`.

## Installation gotchas

- `sudo pacman -S --needed` keeps re-runs idempotent.
- `nvtop`/`radeontop` are optional per vendor; skip failures.
- `systemd-coredump` replaces `coredumpctl` availability on systemd distros; without it you only get the Hyprland crash report `.txt`.
- `debuginfod` is configured in `/etc/profile.d/debuginfod.sh` on Arch — new shells pick it up automatically.
