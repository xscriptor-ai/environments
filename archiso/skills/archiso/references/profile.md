# archiso profile anatomy (v91)

## Tree

```
profile/
├── airootfs/                     # copied to work/<arch>/airootfs BEFORE pacstrap
├── efiboot/loader/               # systemd-boot: loader.conf + entries/*.conf
├── syslinux/                     # BIOS configs (*.cfg)
├── grub/                         # grub.cfg, loopback.cfg
├── packages.x86_64               # pkgs for iso/netboot (fallback: packages)
├── bootstrap_packages.x86_64     # pkgs for bootstrap mode (fallback: bootstrap_packages)
├── pacman.conf                   # BUILD-TIME pacman config only
└── profiledef.sh                 # required
```

`mkinitcpio` and `mkinitcpio-archiso` are mandatory packages for live images.

## profiledef.sh (all fields, v91)

| Variable | Default | Notes |
|---|---|---|
| `iso_name` | `mkarchiso` | filename `<iso_name>-<iso_version>-<arch>.iso` |
| `iso_label` | `MKARCHISO` | xorriso volume ID; keep short/uppercase (no validation upstream; XORRISO limit 32 chars) |
| `iso_publisher` | `mkarchiso` | |
| `iso_application` | `mkarchiso iso` | |
| `iso_version` | `""` | releng uses `date +%Y.%m.%d` (SOURCE_DATE_EPOCH-aware) |
| `install_dir` | `mkarchiso` | validated `[a-z0-9]`, ≤30 (v89) |
| `buildmodes` | `iso` | `bootstrap`, `iso`, `netboot` |
| `bootmodes` | required for iso | `bios.syslinux`, `uefi.systemd-boot`, `uefi.grub` |
| `arch` | `uname -m` (v87) | resolves `packages.${arch}` |
| `packages` | `packages.${arch}` fallback `packages` | plain list, `#`/blank ignored |
| `bootstrap_packages` | `bootstrap_packages.${arch}` fallback | |
| `pacman_conf` | profile `pacman.conf` (else host `/etc/pacman.conf`) | |
| `airootfs_image_type` | `squashfs` | `squashfs`, `ext4+squashfs`, `erofs` |
| `airootfs_image_tool_options` | empty array | mksquashfs/mkfs.erofs options |
| `bootstrap_tarball_compression` | uncompressed tar | e.g. `(zstd -c -T0 --long -19)` |
| `file_permissions` | — | `["/path"]="uid:gid:mode"`, trailing `/` recursive |
| `kernel_params_<arch>` | optional v91 | substituted via `%KERNEL_PARAMS%` |

## airootfs behavior

- Contents copied **before** package installation; package files overwrite yours unless backup files.
- Permissions normalized to 644 files / 755 dirs, root-owned; fix with `file_permissions` (releng: `/etc/shadow` 0:0:400, `/root` 0:0:750, scripts 0:0:755).
- `/etc/passwd|shadow|gshadow` are honored; home dirs get ownership fixed; `/etc/skel` copied to created users.
- Customize via pacman hooks:

```ini
# airootfs/etc/pacman.d/hooks/20-user.hook
# remove from airootfs!
[Trigger]
Operation = Install
Type = Package
Target = base
[Action]
Description = Creating live user
When = PostTransaction
Depends = shadow
Exec = /usr/bin/useradd -u 1000 -G wheel -p '' -s /usr/bin/zsh -m midistro
```

The releng profile ships `zzzz99-remove-custom-hooks-from-airootfs.hook` which deletes any hook containing `remove from airootfs` after build.

## pacman.conf semantics

- Build-time file only. mkarchiso sanitizes: forces `HookDir`, strips `RootDir`/`LogFile`/`DBPath`; `CacheDir` honored only if non-default and different from host.
- Custom repo recipe:

```ini
[mi-repo]
SigLevel = Required DatabaseOptional
Server = file:///srv/repo
```

Place **above** official repos; mkarchiso must be able to read `/srv/repo` (use `/tmp` if in doubt). Live-environment repo requires `airootfs/etc/pacman.conf` plus keyring files in `airootfs/usr/share/pacman/keyrings/<name>.gpg` + `<name>-trusted` (`FPR:4:`).

- releng: `ParallelDownloads=5`, `DownloadUser` commented (v82), core+extra, multilib commented, example custom repo commented.

## Kernel and multiple kernels

- Add kernel packages; mkarchiso includes all `boot/vmlinuz-*` + `boot/initramfs-*.img` in ISO and (for systemd-boot) the ESP.
- Profile mkinitcpio config: `airootfs/etc/mkinitcpio.conf.d/archiso.conf` (v91 dropped the `linux.preset` override).
- releng uses busybox hooks (`udev`, `archiso*`, `memdisk`) — deliberately different from modern default systemd hooks.

## Users, units, locale

- Users via hooks (above) or by editing passwd/shadow.
- Enable units by manual symlinks (`multi-user.target.wants/`, `display-manager.service`).
- Autologin root on tty1: `airootfs/etc/systemd/system/getty@tty1.service.d/autologin.conf`; serial variant for ttyS0.
- Keymap: `airootfs/etc/vconsole.conf`. Locales: `airootfs/etc/locale.gen` + `locale.conf` (glibc trigger runs `locale-gen`).
- Distribution name: edit `airootfs/etc/os-release` (+ `/usr/lib` copy) and boot menu titles.

## Work dir and outputs

```
<work>/build_date
<work>/iso.pacman.conf
<work>/<arch>/airootfs/          # pacstrap target
<work>/<arch>/boot/              # extracted kernel/initramfs
<work>/iso/                      # ISO9660 tree (${install_dir})
<work>/efiboot.img               # FAT ESP image
<work>/loader/                   # processed systemd-boot tree
<work>/grub/
```

Clean an interrupted workdir only after `findmnt -R work`:

```sh
unshare --map-auto --map-root-user -- rm -rf work
```

## Reproducibility

- `SOURCE_DATE_EPOCH` (env or `work/build_date`) drives `%ARCHISO_UUID%` (ISO9660 mtime), `clock-epoch`, ext4 seed, xorriso timestamps, `date` in shipped profiledef.
- Upstream does not guarantee bit-identical ISOs; treat as experimental. Combine with pinned packages/ALA snapshot.
- CI metrics upstream: ISO size, package count, El Torito EFI image size, initramfs sizes.
