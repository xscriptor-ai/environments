---
name: arch-wsl-headless
description: Arch Linux in WSL2 for headless Hyprland testing and debugging — official archlinux-wsl image, systemd, GPU via mesa d3d12 / vulkan-dzn, WSLg basics, AQ_NO_KMS_REQUIREMENT headless sessions, wayvnc viewing, Hyprland --verify-config in CI, Quickshell smoke tests, and the classic WSL pitfalls. Use when validating Hyprland/Quickshell configs inside WSL where there is no real display.
---

# Arch in WSL2 + headless Hyprland testing (October 2026)

Verified **2026-10-15** against official sources: ArchWiki (Install Arch Linux on WSL), microsoft/WSL and WSLg release metadata, Hyprland wiki (Virtual GPU, Using hyprctl), wslg/microsoft issue tracker.

Realistic scope: on WSL there is no KMS/output and (usually) no usable DRM card, so treat WSL as a **headless test rig**: validate configs, exercise `hyprctl`/IPC, run shells against a headless compositor and inspect them through VNC/screencopy. Do not expect a daily-driver desktop from WSL — for that, use a VM with a virtual GPU (skill `hyprland-live-debug`, virtual-gpu notes in the Hyprland wiki).

## Install Arch (official image, current method)

```powershell
# Windows (admin), WSL 2 required:
wsl --update
wsl --install archlinux                    # automated; or:  wsl --install --from-file <img>.wsl [--name myarch]
```
Alternatives: manual `.wsl` image from archlinux-wsl (monthly builds), or the community `yuk7/ArchWSL` (26.10.14.0, October 2026) via `Arch.exe`/appx. Then: `wsl -d archlinux`, create a user (root has no password!), `pacman-key --init && pacman-key --populate archlinux`, `pacman -Syu`.

Enable systemd (needed for `XDG_RUNTIME_DIR`, user services, portals):
```ini
# /etc/wsl.conf
[boot]
systemd=true
[user]
default=youruser
```
`wsl --shutdown` from Windows, relaunch. WSL ≥ 2.4.10 can also do `wsl --manage archlinux --set-default-user <user>`. Keep distinct UIDs across WSL distros when enabling systemd in several.

## GPU reality check (do this before blaming Hyprland)

```bash
ls -l /dev/dri /dev/dxg 2>&1      # renderD128/card0? dxg present?
glxinfo -B 2>/dev/null | head -5  # "D3D12 (...)" = GPU; "llvmpipe" = CPU
```
- `pacman -S mesa vulkan-icd-loader vulkan-dzn` and `export GALLIUM_DRIVER=d3d12 LIBVA_DRIVER_NAME=d3d12` (ArchWiki; `MESA_D3D12_DEFAULT_ADAPTER_NAME=NVIDIA|AMD|Intel` if the wrong adapter is picked).
- No `/dev/dri` render node (dxgkrnl regressions happen — e.g. WSL 2.5.1 broke `/dev/dri` detection): `sudo modprobe vgem` creates a virtual render node (software rendering via llvmpipe) — enough for headless Hyprland, slow for shells.
- Intel iGPU falling back to llvmpipe: `ln -s /usr/lib/libedit.so /usr/lib/libedit.so.2` (wslg#996).

## Headless Hyprland in 10 minutes

```bash
pacman -S hyprland
Hyprland --verify-config                                   # 0) config gate — works with NO display at all
export XDG_RUNTIME_DIR=/run/user/$UID                      # 1) must be /run/user/<uid> for Hyprland
dbus-run-session -- env AQ_NO_KMS_REQUIREMENT=1 start-hyprland   # 2) starts headless (HEADLESS-0 auto-created)
# in another WSL shell:
hyprctl monitors -j                                        # expect HEADLESS-0
hyprctl output create headless test                        # optional second virtual output
```
- `AQ_NO_KMS_REQUIREMENT=1` allows a render-only (no output) DRM node — the Wiki's "virtual GPU" path.
- View it: `wayvnc 127.0.0.1 5900 -o HEADLESS-0` and connect a VNC client from Windows (`localhost:5900` is forwarded). Wayvnc also injects input, so binds are testable.
- Screencopy without a viewer: `grim -o HEADLESS-0 /tmp/shot.png` (first capture may hit the Permission Manager if `ecosystem.enforce_permissions=true`; pre-allow via `hl.permission`).
- Everything IPC works exactly like on hardware: `hyprctl repl`, `hyprctl eval`, `qs ipc`, socket2 events over `socat`.

## What to test here (and what not to)

| Good in WSL headless | Bad in WSL headless |
|---|---|
| `hyprland.lua` syntax/logic (`--verify-config`, repl) | Real frame pacing, VRR/HDR, tearing |
| Bind/dispatcher behavior via wayvnc input | Multi-GPU/hotplug behavior |
| Quickshell layouts/panels (`qs -c`, `qs ipc`, `qs log`) | GPU-heavy blur/effects/perf numbers |
| hyprctl/IPC scripts, socket2 event consumers | Screencast portals/obs with hardware encoders |
| CI config gates and smoke tests | Suspend/DPMS, lockscreen PAM flows (test minimal) |
| Notification/tray daemons wiring (DBus) | Daily driving (no reliable session bus w/o systemd+nspawn) |

Quickshell note: run with `QS_DISABLE_CRASH_HANDLER=1` while iterating so a crash doesn't relaunch-loop, and read `qs log`. For panels that use `ScreencopyView`/`BackgroundEffect`, expect llvmpipe slowness.

## CI / scripted validation pattern

```bash
#!/usr/bin/env bash
set -euo pipefail
export XDG_RUNTIME_DIR=/run/user/$(id -u)
Hyprland --verify-config
dbus-run-session -- bash -c 'AQ_NO_KMS_REQUIREMENT=1 start-hyprland & sleep 3; hyprctl version; hyprctl monitors -j; hyprctl configerrors'
# Quickshell smoke test:
qs -c testbar -n & sleep 2; qs ipc call health ping; qs log -t 50 | grep -iE "error|binding loop" && exit 1 || true
```
- `--verify-config` is side-effect-free and exits non-zero on errors — use as the primary gate; a running headless instance covers IPC/dispatcher behavior.
- Keep one script that tears down (`hyprctl dispatch exit`, `pkill Hyprland`, `pkill quickshell`) so repeated runs stay clean.

## Pitfalls (all observed in the wild)

1. `XDG_RUNTIME_DIR` missing/unset: Hyprland bails ("$XDG_RUNTIME_DIR is invalid") — need systemd user session (`/run/user/UID`) or export manually; sockets live under `$XDG_RUNTIME_DIR/hypr/<SIG>`.
2. Starting Hyprland without a display without `AQ_NO_KMS_REQUIREMENT=1` on a no-KMS node → "backend failed to start".
3. WSLg's Weston is NOT a KMS compositor: nested Hyprland over WSLg (`WAYLAND_DISPLAY=/mnt/wslg/...`) can start but nested-output presentation is buggy upstream (aquamarine issue #348, opened Aug 2026) — prefer headless.
4. systemd user session flakiness: "Failed to start the systemd user session" — `loginctl enable-linger <user>`; the archlinux-wsl image masks `systemd-networkd*`, `systemd-resolved`, tmpfiles units by design.
5. Docker/podman in WSL: remount `/` rshared before containers (`ArchWiki WSL` troubleshooting); rootless podman needs `shadow` reinstalled.
6. File sharing: do repo work under the Linux FS (`~/...`), NOT `/mnt/c/...` (9p performance and file-watch events; Quickshell's watcher will be miserable on DrvFs).
7. GPU compute vs graphics: CUDA may work while OpenGL is llvmpipe — check the renderer, not the marketing.
8. Audio in headless (optional): WSLg's PulseAudio socket at `/mnt/wslg/PulseServer`; wire it only if testing PipeWire/PAM-related widgets.

## References

- `references/archwsl-setup.md` — full Arch-on-WSL setup: users, systemd knobs, locale, devices (usbipd, wsl --mount), interop, lean package tricks.
- `references/headless-hyprland.md` — detailed headless recipes: env matrix, wayvnc, screencopy, socket IPC tests, cleanup, and a troubleshooting table.
