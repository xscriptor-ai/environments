# Arch on WSL2 — setup reference (October 2026)

Sources: ArchWiki "Install Arch Linux on WSL", archlinux-wsl project, Microsoft WSL docs, yuk7/ArchWSL. Verified October 2026 (WSL 3.0.x, WSLg 1.0.71+, archlinux-wsl monthly, ArchWSL 26.10.14.0).

## Install paths

| Method | How | Notes |
|---|---|---|
| Official automated | `wsl --install archlinux` | Official image via `archlinux-wsl` project; WSL 2 only |
| Official manual | Download `.wsl` image → `wsl --install --from-file <img>.wsl [--name <name>]` | Monthly builds; ideal for pinning |
| Community (legacy) | `yuk7/ArchWSL` zip/appx/online | Useful on older Windows; rootfs managed via `Arch.exe` |
| From rootfs tarball | `wsl --import <name> <dir> archlinux.tar.gz` | Roll your own; bootstrap with `pacstrap`/`arch-bootstrap` |

Update WSL/WSLg from Windows: `wsl --update` (stable) / `--pre-release`. The Store WSL is the default and bundles WSLg; don't install the old optional component/MSI packages.

## First-boot checklist (official image)

```bash
# inside the new distro (initial user is root):
passwd                         # give root a password or people get locked out
useradd -m -G wheel -s /bin/bash you && passwd you
EDITOR=nano visudo             # uncomment %wheel ALL=(ALL:ALL) ALL  (or NOPASSWD)
pacman-key --init && pacman-key --populate archlinux
pacman -Syu base-devel 2>/dev/null || pacman -Syu
# editor/locale sugar:
pacman -S nano vim git sudo
```
`/etc/wsl.conf` essentials:
```ini
[boot]
systemd=true                   # REQUIRED for XDG_RUNTIME_DIR=/run/user/*, portals, user services

[user]
default=you

[interop]
enabled=true                   # run Windows .exe from Linux; disable for isolation

[automount]
options="metadata,umask=22,fmask=11"   # optional; fix permissions on /mnt/c
```
Apply with `wsl --shutdown` (Windows) + relaunch. `wsl --manage archlinux --set-default-user you` on WSL ≥ 2.4.10.

Known systemd notes:
- Multiple WSL distros with systemd + same UID for their default users conflict — give each default user a distinct UID.
- `loginctl enable-linger you` fixes flaky user-session startups ("Failed to start the systemd user session for ...").
- The archlinux-wsl image masks: `console-getty`, `systemd-firstboot`, `systemd-networkd`, `systemd-networkd-wait-online`, `systemd-resolved`, `systemd-tmpfiles-clean`, `systemd-tmpfiles-setup*`, `tmp.mount`. Unmask only with intent.
- Disable `systemd-networkd-wait-online` if Docker/systemd units stall waiting for it.

## Graphics stack

```bash
pacman -S mesa vulkan-icd-loader vulkan-dzn        # d3d12 Gallium GL + dzn Vulkan
export GALLIUM_DRIVER=d3d12
export LIBVA_DRIVER_NAME=d3d12                     # VA-API video accel
# verify:
glxinfo -B | grep -E "renderer|OpenGL"
vulkaninfo --summary | grep -E "deviceName|driverName"
vainfo --display drm --device /dev/dri/renderD128 2>/dev/null | head
```
- Adapter selection on multi-GPU Windows hosts: `MESA_D3D12_DEFAULT_ADAPTER_NAME=NVIDIA|AMD|Intel`.
- If `/dev/dri/renderD128` is missing (dxgkrnl regressions — e.g. WSL 2.5.1 era issue #12702): `sudo modprobe vgem` provides a virtual render node for llvmpipe; otherwise update WSL (`wsl --update`).
- `nvidia-smi`/CUDA working does NOT imply OpenGL is accelerated; always check `glxinfo -B`.
- WSLg exposes Wayland (`/mnt/wslg/wayland-0`, `WAYLAND_DISPLAY`, `DISPLAY=:0`) and PulseAudio (`/mnt/wslg/PulseServer`) for GUI apps; it's a Weston-based compositor — fine for Gtk/Qt apps, not a KMS compositor for Hyprland nesting.

## Files, devices, interop

| Topic | Command/notes |
|---|---|
| Disk passthrough | Windows: `wsl --mount <DeviceID> --bare`; inside: `lsblk`, mount manually |
| USB passthrough | Windows: `winget install usbipd`; `usbipd bind --busid X`, `usbipd attach --wsl --busid X`; inside `lsusb` |
| Open URLs in Windows browser | `pacman -S xdg-utils` (needed by CLIs with auth flows) |
| SSH agent from Windows | `wsl2-ssh-agent` (AUR) + eval in rc |
| Windows Hello sudo | `wsl-hello-sudo-bin` (AUR) + PAM edit |
| Locale override | `ln -sf /etc/locale.conf /etc/default/locale`, then set normally |
| Lean GTK4 installs | `xdg-desktop-portal-gtk-dummy` (AUR) avoids pipewire/polkit/fuse pull-ins; sets `ADW_DISABLE_PORTAL=1` |
| Performance | keep work on ext4 (`~`), not `/mnt/c` (9p/DrvFs); watch `wsl.conf` automount options |

## Container caveats (if testing tooling)

- rootless podman/docker: remount `mount --make-rshared /` (persist via the ArchWiki service), or reinstall `shadow` for newuidmap caps.
- `docker.socket` stalls → disable `systemd-networkd-wait-online.service`.

## Verification snapshot (paste into bug reports)

```bash
uname -r; cat /etc/os-release | head -2
wsl.exe --version 2>/dev/null || powershell.exe -c "wsl --version"
ls -l /dev/dxg /dev/dri 2>&1
glxinfo -B 2>/dev/null | grep -E "renderer|OpenGL version"
echo "$XDG_RUNTIME_DIR"; systemctl --user is-system-running || true
```
