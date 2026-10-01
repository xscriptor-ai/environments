# Live environment internals (releng v91)

## What's inside releng

- 129 packages: `base`, `linux`, `linux-firmware`, `mkinitcpio`+`mkinitcpio-archiso`, `archinstall`, `arch-install-scripts`, `cloud-init`, `openssh`, `iwd`, `reflector` (service **not** enabled since v87), `syslinux`, `grub`, `memtest86+`/`-efi`, `edk2-shell`, `sudo`, `zsh`, `grml-zsh-config`, `ntfsprogs`, `bcachefs-tools`, `xfsprogs`, `mmc-utils`, plus cloud/VM guest tools.
- Users: only `root` (empty password hash); no unprivileged live user.
- Autologin: `getty@tty1.service.d/autologin.conf` → `agetty --noreset --noclear --autologin root`.
- Enabled units: ModemManager, choose-mirror, hyperv daemons, iwd, livecd-talk, pacman-init, sshd, systemd-networkd, systemd-resolved, vboxservice, vmtoolsd, vmware-vmblock-fuse, cloud-init targets, pcscd.socket, timesyncd/time-wait-sync, livecd-alsa-unmuter.
- pacman: keyring populated at boot on tmpfs (`pacman-init.service` + `etc-pacman.d-gnupg.mount`); mirrors rewritten at boot only when `mirror=`/`archiso_http_srv=` is passed (`choose-mirror.service`).
- `uncomment-mirrors.hook` uncomments HTTPS mirrors during build (v87 only HTTPS uncommented).

## Boot params (from mkinitcpio-archiso docs)

```
archisosearchuuid=<uuid>      # locate live medium (replaced archisodevice in v77)
cow_spacesize=4G              # tmpfs for writes (default 256M)
cow_label=COW / cow_device=... / cow_flags=subvol
cow_directory=/persistent_LABEL/x86_64   # default when a cow device is set
cow_persistent=P|N            # dm-snapshot only
copytoram=auto
checksum=y                    # verify airootfs.sha512
cms_verify=y                  # CMS verification for netboot/rootfs
archiso_http_srv=http://...   # netboot rootfs source
```

Persistence:
- Overlayfs/dmsnapshot: with a `cow_*` device the live root changes persist to `cow_directory`; `cow_persistent` only affects dm-snapshot.
- Ventoy: `vtoycow` label + `/ventoy/ventoy.json` `persistence` plugin; tested-list is old, validate yourself.
- Remount CoW at runtime: `mount -o remount,size=4G /run/archiso/cowspace`.

## Customization recipes

- **SSH install media**: `airootfs/root/.ssh/authorized_keys` + `file_permissions` (`/root` 0:0:750, `.ssh` 0:0:700, `authorized_keys` 0:0:600); sshd enabled by default; cloud-init also supported since 2021.02.
- **Auto-connect Wi-Fi (iwd)**: `airootfs/var/lib/iwd/<SSID>.psk` with permissions `0:0:700` on the dir; network config per `iwd.network(5)`.
- **Users at build time**: pacman hook (see profile.md).
- **Live-only files**: put them in airootfs; installed-system defaults go in `/etc/skel` or Calamares modules.
- **Welcome/launcher**: autostart `.desktop` or a systemd user unit in the live session.

## Environment checklist before shipping

1. Boot UEFI + BIOS: login prompt, no `systemctl --failed`.
2. Network: iwd/NetworkManager works; DNS resolved.
3. Installer launches (archinstall or Calamares) with privileges.
4. `cow_spacesize` adequate for expected live usage.
5. Serial console: add `console=ttyS0` + `serial-getty@ttyS0` autologin if headless installs are supported.
6. Time: timezone/clock sane (timesyncd); `timedatectl`.
7. Locale/keymap match the target audience.
8. No baked credentials on public ISOs.
9. `journalctl -b -p err` clean after boot.
10. Language/tools: shell (zsh/grml config), `sudo` policy, `fastfetch` branding (optional).

## Historical gotchas

- v84: `/${install_dir}/grubenv` undeprecated; v83 removed the `pacstrap` dir early and stopped hiding pacstrap errors; v80 EROFS empty UUID; v81 cloud-init unit names; v79 removed `gnu-netcat`.
- `choose-mirror.service` only rewrites the live mirrorlist when boot params ask; otherwise the baked mirrorlist is used.
- `reflector` is installed but its service is not enabled by default since v87; enable manually for auto-mirror selection.
