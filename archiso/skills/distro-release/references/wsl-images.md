# WSL images and rootfs for Arch-based distros (2026)

## Official Arch WSL

- `wsl --install archlinux` (Store) downloads from `https://fastly.mirror.pkgbuild.com/wsl/latest`.
- The official image is a minimal Arch rootfs with `/etc/wsl.conf` defaults; use it as a reference for conventions (no kernel, no firmware).

## Building an importable rootfs

```sh
pacstrap -K -c "$WORK" base bash sudo pacman-contrib git zsh tzdata
# optional identity/config
cp templates/wsl.conf "$WORK/etc/wsl.conf"
arch-chroot "$WORK" locale-gen
arch-chroot "$WORK" pacman-key --populate archlinux
find "$WORK/var/cache/pacman/pkg" -mindepth 1 -delete
tar -C "$WORK" --numeric-owner --no-acls --no-xattrs --no-selinux \
    --one-file-system -cf - . | gzip -9n > x-wsl-rootfs.tar.gz
sha256sum x-wsl-rootfs.tar.gz > x-wsl-rootfs.tar.gz.sha256
```

- Do **not** include `linux`/`linux-firmware` (WSL uses the host kernel), NetworkManager/openssh unless needed.
- Strip package caches; initialize the keyring at build time; do not bake a machine-id.
- `tar` options matter: numeric owners, no xattrs/ACLs/SELinux, single filesystem.

## Import (Windows)

```powershell
wsl --import <name> <dir> <rootfs.tar.gz> --version 2
wsl --set-default <name>
```

- Requirements: Store WSL (≥ 0.67.6 era) on Windows 11 / Server 2022+ for systemd; reject inbox WSL with an update message.
- Never overwrite `%UserProfile%\.wslconfig`; offer a template (`[wsl2] guiApplications=false`, `[experimental] autoMemoryReclaim=dropCache`, `sparseVhd=true`).
- WSL 2 Store builds accept tar streams directly; the "decompress to .tar first" advice is obsolete for older releases only.

## `/etc/wsl.conf` (the only config for imported distros)

```ini
[boot]
systemd=true
[user]
default=<user>        # imported distros have no launcher; this is the only default-user switch
[interop]
enabled=true
appendWindowsPath=true
[network]
generateHosts=true
generateResolvConf=true
[time]
useWindowsTimezone=true
```

- Changing `default=` requires `wsl --terminate <name>` before it takes effect.
- Interop/PATH entries (`/mnt/c/...`) should never be stripped by provisioning scripts.

## Provisioning pattern (two stages)

1. **Root stage**: locale/locale-gen, `vconsole.conf`, timezone (`windows-time` = no-op), create wheel user, sudoers drop-in, pin `[user] default`, install base tools.
2. **User stage** (after terminate/relaunch): rc-file block (marker-delimited and idempotent), XDG dirs, PATH, EDITOR, folders.
- Make every step idempotent and dry-run-capable (`X_DRY=1`), and forward env vars across `sudo` (a common bug: only some `X_*` vars survive elevation).

## Distro-specific notes

- System-level features that need btrfs (snapshots, generations) should detect the WSL environment and degrade to no-op/off; home-level versioning (copy-based) does work.
- Document which features are unavailable (kernel selection, hibernation, firmware, bootsplash).
- Add the WSL repos to docs indexes and keep one canonical WSL guide (retire divergent in-repo copies).
- CI: run shell smoke tests for build/provision scripts on Linux; `install.ps1` needs a manual Windows checklist (or Pester tests on a Windows runner).

## Checklist

- [ ] Rootfs tar reproducible-ish (fixed order, numeric owners, no caches)
- [ ] `wsl.conf` with systemd + default user pinned after provisioning
- [ ] No machine-id baked; keyring populated
- [ ] host `.wslconfig` never clobbered; guidance printed
- [ ] Terminate/relaunch instructions documented
- [ ] Minimum WSL/Windows version stated and enforced in the importer
- [ ] Smoke tests + a real Windows import test (at least once, documented)
