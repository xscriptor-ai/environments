# Arch Linux ARM reference

Verified: 2026-10-24 from `archlinuxarm.org`, `mirror.archlinuxarm.org`, `os.archlinuxarm.org` and `github.com/archlinuxarm`.

This page describes the upstream that an ARM port of X should use. It covers repositories, mirrors, signing, rootfs delivery, kernels, bootloaders, build tooling and the differences from Arch Linux x86_64.

## What ALARM is

Arch Linux ARM (ALARM) started in 2009 as a port of Arch Linux to ARM. It is a port, not a derivative: upstream packages are rebuilt with the minimal changes required to compile and run on ARM, then published in ALARM repositories.

History relevant to the current state:

- 2009: PlugApps / ARMv5.
- 2011: ARMv7 hard-float, renamed Arch Linux ARM.
- 2012: ARMv6 hard-float.
- 2015: ARMv8 AArch64.
- 2022: ARMv5 and ARMv6 discontinued; ARMv7 moved to NEON, Marvell SoCs without NEON were dropped.

Current active architectures:

| Architecture | pacman name | Notes |
|---|---|---|
| ARMv8-A 64-bit | `aarch64` | Main target for X v1 |
| ARMv7-A hard-float NEON | `armv7h` | 32-bit userland; out of scope for v1 |

The names above are the values used by `pacman` in `Architecture =` and in the `$arch` substitution in repository URLs.

## Repositories

### Names and contents

| Repository | Contents | Arch x86_64 equivalent |
|---|---|---|
| `core` | Base packages and ALARM kernels | `core` |
| `extra` | The rest of the official repository, rebuilt | `extra` |
| `alarm` | ALARM-specific packages: U-Boot, Raspberry Pi firmware, board kernels, tools | Does not exist |
| `aur` | Selected AUR packages precompiled by ALARM | Does not exist |
| `community` | Obsolete, last updated 2023-05-20. Do not use. | Removed |

There is no `multilib` on ARM. The mirror listing for `aarch64` contains `alarm/`, `aur/`, `community/`, `core/`, `extra/` and `sync`; `community/` is a legacy directory.

### Package counts and freshness

Snapshot taken from the `aarch64` databases on 2026-10-24:

| Repository | Packages | Database last modified |
|---|---:|---|
| `core` | 313 | 2026-10-22 10:49:49 UTC |
| `extra` | 12,993 | 2026-10-22 23:41:31 UTC |
| `alarm` | 75 | 2026-10-17 12:08:25 UTC |
| `aur` | 12 | 2026-10-11 17:11:41 UTC |

The package pages themselves can be newer than the mirror database. For example, the mirror snapshot used for this audit contains `linux-rpi 6.18.57-1`, while the package page showed `linux-rpi 6.18.58-1` built on 2026-10-24. Always re-query before pinning versions.

### URLs

Canonical mirror with GeoIP and load balancing:

```ini
Server = http://mirror.archlinuxarm.org/$arch/$repo
```

Most mirrors also answer over HTTPS, but the official mirrorlist uses HTTP. Test HTTPS before hardcoding it in a profile.

Directory layout:

```text
http://mirror.archlinuxarm.org/
|-- aarch64/
|   |-- core/
|   |-- extra/
|   |-- alarm/
|   |-- aur/
|   `-- sync
|-- armv7h/
|   |-- core/
|   |-- extra/
|   |-- alarm/
|   |-- aur/
|   `-- sync
`-- os/
```

`os/` contains rootfs tarballs, not packages.

### `pacman.conf`

The `pacman.conf` shipped by ALARM (`core/pacman/pacman.conf`) is:

```ini
[options]
Architecture = @CARCH@
CheckSpace
ParallelDownloads = 5
DownloadUser = alpm
SigLevel = Required DatabaseOptional
LocalFileSigLevel = Optional

[core]
Include = /etc/pacman.d/mirrorlist

[extra]
Include = /etc/pacman.d/mirrorlist

[alarm]
Include = /etc/pacman.d/mirrorlist

[aur]
Include = /etc/pacman.d/mirrorlist
```

`@CARCH@` is replaced at build time with `aarch64` or `armv7h`.

Consequences for X:

- `[core]` and `[extra]` must resolve to ALARM mirrors, not Arch x86_64 mirrors.
- `[alarm]` and `[aur]` must be present.
- `[x]` must use `$arch` or an explicit `aarch64` path.
- `SigLevel = Required DatabaseOptional` is correct because ALARM package databases are not signed, while packages are.
- `DatabaseRequired` would fail on ALARM.

### Mirrorlist

The `pacman-mirrorlist-20260411-2` package installs:

```ini
#
# Arch Linux ARM repository mirrorlist
# Generated on 2026-04-11
#
Server = http://mirror.archlinuxarm.org/$arch/$repo

# Mirrors by country
# Server = http://de.mirror.archlinuxarm.org/$arch/$repo
# Server = http://fr.mirror.archlinuxarm.org/$arch/$repo
# ...
```

`reflector` is not packaged in ALARM. The `choose-mirror` helper and `reflector.service` that X inherits from archiso do not work on ARM. Options:

- Use the static ALARM mirrorlist.
- Keep the GeoIP host and remove `reflector`.
- Generate a mirrorlist from the ALARM mirror list.

## Signing and keyring

ALARM signs every package in every repository and architecture with its build system key. The repository databases are not signed, by design, to limit private-key exposure. Mirrors are synchronised with rsync push from the ALARM master server.

| Key role | Key ID | Owner |
|---|---|---|
| Master signing | `02922214DE8981D14DC2ACABBC704E86B823CD25` | Kevin Mihelich |
| Master signing | `9D22B7BB678DC056B1F7723CB55C5315DCD9EE1A` | Jason Plum |
| Master signing | `69DD6C8FD314223E14362848BF7EEF7A9C6B5765` | Mike Brown |
| Package signing | `68B3537F39A313B3E574D06777193F152BDBE6A6` | Arch Linux ARM Build System |

Keyring package: `archlinuxarm-keyring 20240419-2` (`core`, `any`, installed size 3.1 KiB). It installs:

```text
/usr/share/pacman/keyrings/archlinuxarm.gpg
/usr/share/pacman/keyrings/archlinuxarm-trusted
/usr/share/pacman/keyrings/archlinuxarm-revoked
```

Its install script runs `pacman-key --populate archlinuxarm` on install and upgrade.

Bootstrap sequence on an ALARM system:

```bash
pacman-key --init
pacman-key --populate archlinuxarm
# or, when several keyrings are installed:
pacman-key --populate
```

For X, the target and live environments need both keyrings:

```bash
pacman-key --populate archlinuxarm
pacman-key --add /etc/pacman.d/x-repo.pub
pacman-key --lsign-key "$X_KEY_FPR"
```

Do not use `pacman-key --populate archlinux` as the only call on ARM. It installs x86_64 packager keys that do not sign ALARM packages. Keeping the `archlinux` keyring is harmless for `any` packages, but it is not sufficient for ALARM.

`pacman-init.service` in the X live environment runs `pacman-key --populate` without arguments. If `archlinuxarm-keyring` is installed in the airootfs, that call populates ALARM keys as well. `x-keyring.service` then adds the X repository key. This works, but the installer should still populate `archlinuxarm` explicitly for clarity and for targets that do not use the live keyring.

## Delivery model: tarballs, not ISOs

ALARM does not publish installation ISOs. It publishes compressed rootfs tarballs and lets the user partition the disk and install a bootloader.

Available variants on the downloads page (22, each with `.md5` and `.sig`):

```text
ArchLinuxARM-aarch64-latest.tar.gz
ArchLinuxARM-aarch64-chromebook-latest.tar.gz
ArchLinuxARM-armv7-latest.tar.gz
ArchLinuxARM-armv7-chromebook-latest.tar.gz
ArchLinuxARM-rpi-aarch64-latest.tar.gz
ArchLinuxARM-rpi-armv7-latest.tar.gz
ArchLinuxARM-am33x-latest.tar.gz
ArchLinuxARM-dragonboard410c-latest.tar.gz
ArchLinuxARM-gru-latest.tar.gz
ArchLinuxARM-imx6-cubox-latest.tar.gz
ArchLinuxARM-oak-latest.tar.gz
ArchLinuxARM-odroid-c1-latest.tar.gz
ArchLinuxARM-odroid-c2-latest.tar.gz
ArchLinuxARM-odroid-latest.tar.gz
ArchLinuxARM-odroid-x-latest.tar.gz
ArchLinuxARM-odroid-xu3-latest.tar.gz
ArchLinuxARM-odroid-xu-latest.tar.gz
ArchLinuxARM-usbarmory-latest.tar.gz
ArchLinuxARM-usbarmory-mkii-latest.tar.gz
ArchLinuxARM-utilite-latest.tar.gz
ArchLinuxARM-veyron-latest.tar.gz
ArchLinuxARM-zedboard-latest.tar.gz
```

Sizes verified with HEAD requests:

| Artefact | Bytes | Last modified |
|---|---:|---|
| `ArchLinuxARM-aarch64-latest.tar.gz` | 829,367,415 | 2026-08-05 12:41:36 UTC |
| `ArchLinuxARM-rpi-aarch64-latest.tar.gz` | 850,215,189 | 2026-08-05 12:55:04 UTC |
| `ArchLinuxARM-rpi-armv7-latest.tar.gz` | 758,521,281 | 2026-08-05 14:16:42 UTC |

The generic aarch64 rootfs contains:

- The `base` group, kernel firmware and utilities, `openssh`, `haveged`.
- `root` / `root` as root; user `alarm` / `alarm`.
- `sshd` and `haveged` enabled.
- `systemd-networkd` DHCP for `eth0` and `en*`.
- `systemd-resolved` and `systemd-timesyncd`.
- `linux-aarch64` with `/boot/Image`, `/boot/Image.gz` and `/boot/dtbs`.
- `pacman-key --init && pacman-key --populate archlinuxarm` after first boot.

Extract with bsdtar to preserve extended attributes and ACLs:

```bash
bsdtar -xpf ArchLinuxARM-aarch64-latest.tar.gz -C /mnt
```

Implications for X:

- There is no ARM ISO from ALARM to download. X must build its own with archiso, or publish a disk image for SBCs.
- The ALARM tarball is a useful base for a chroot or VM, but the X installer uses `pacstrap` from the live environment. For ARM, the live environment needs an ALARM `pacman.conf`, and `pacstrap` then works the same way.
- For Raspberry Pi, the official flow is FAT boot partition plus ext4 root, extract the tarball, move `/boot/*` to the FAT partition, adjust `/etc/fstab` for `mmcblk1`, and boot. X would need a separate image flow.

## Kernels

### `linux-aarch64` (generic)

Package page facts:

- Version: `7.2.11-1`.
- Repository: `core`.
- Architecture: `aarch64`.
- Description: "The Linux Kernel and modules - AArch64 multi-platform".
- Split packages: `linux-aarch64-chromebook`, `linux-aarch64-headers`.
- Provides: `linux=7.2.11`, `KSMBD-MODULE`, `WIREGUARD-MODULE`.
- Conflicts: `linux`.
- Installed size: 376 MiB.
- Build date: 2026-10-17.

Files installed by the package (verified by extracting it):

```text
/boot/Image              # EFI-stub PE image
/boot/Image.gz
/boot/dtbs/<vendor>/*.dtb
/etc/mkinitcpio.d/linux-aarch64.preset
/usr/lib/modules/<kver>/...
```

It does **not** install `/boot/vmlinuz-linux-aarch64` and does **not** install a `pkgbase` file under `/usr/lib/modules/<kver>/`. The mkinitcpio preset is:

```ini
ALL_kver="7.2.11-1-aarch64-ARCH"
PRESETS=('default')
default_image="/boot/initramfs-linux.img"
```

The `linux-aarch64` package provides the virtual `linux` dependency for other packages, but there is no package named `linux` in the ALARM repositories. The installer must use `linux-aarch64` explicitly.

### `linux-aarch64-chromebook`

Variant for ARM Chromebooks (depthcharge/vboot). It is part of the `linux-aarch64` split package set and is not a v1 target.

### `linux-rpi` and `linux-rpi-16k`

Package page facts for `linux-rpi`:

- Version: `6.18.58-1` (mirror snapshot used for the audit had `6.18.57-1`).
- Repository: `core`.
- Architecture: `aarch64` and `armv7h`.
- Split package: `linux-rpi-headers`.
- Description: "Linux kernel and modules (RPi Foundation fork)".
- Provides: `linux=6.18.58`, `KSMBD-MODULE`, `WIREGUARD-MODULE`, `raspberrypi-overlays`.
- Conflicts: `linux`, `linux-rpi-16k`, `uboot-raspberrypi`.
- Dependencies: `firmware-raspberrypi`, `kmod`, `mkinitcpio`, `raspberrypi-bootloader`.
- Installed size: 49 MiB.
- Build date: 2026-10-24.

`linux-rpi-16k` is the 16K-page variant used by Raspberry Pi 5.

The package installs, among other files:

```text
/boot/kernel8.img
/boot/config.txt
/boot/cmdline.txt
/boot/*.dtb
/etc/mkinitcpio.d/linux-rpi.preset
/usr/lib/modules/6.18.58-1-rpi/pkgbase
```

`pkgbase` contains `linux-rpi`. The preset uses `/boot/initramfs-linux.img`.

Important conflict: `linux-rpi` conflicts with `uboot-raspberrypi`. Choose either the vendor firmware boot flow (kernel + config.txt) or the U-Boot flow, not both in the same installation.

### Legacy and board kernels

`linux-espressobin`, `linux-odroid-c2`, `linux-odroid-n2`, `linux-gru`, `linux-oak` and similar packages are board-specific kernels with old versions. They are not part of the v1 plan.

## Bootloaders and firmware

| Package | aarch64 version | Use |
|---|---|---|
| `grub` | `2:2.16-1` | UEFI `arm64-efi`; contains `usr/lib/grub/arm64-efi/*` |
| `systemd` | `262.1-1` | `systemd-bootaa64.efi`, `bootctl`, `linuxaa64.efi.stub` |
| `uboot-tools` | `2026.07-2` | `mkimage`, `boot.scr` generation |
| `uboot-raspberrypi` | `2025.01-2` | U-Boot for Raspberry Pi (`aarch64` and `armv7h`) |
| `uboot-rock64` | `2020.07-1` | Rockchip |
| `uboot-odroid-*` | various | ODROID boards |
| `uboot-pine64` | `2018.03-1` | Pine64 |
| `raspberrypi-bootloader` | `20261015-1` | VideoCore firmware |
| `raspberrypi-overlays` | `20260611-2` | Device tree overlays |
| `firmware-raspberrypi` | `20260311-1` | Wi-Fi and Bluetooth firmware |
| `raspberry-pi5-c0-armstub` | `1:2.14.11-1` | Raspberry Pi 5 mainline boot |
| `raspberry-pi5-d0-armstub` | `1:2.14.11-1` | Raspberry Pi 5 mainline boot |
| `efibootmgr` | `18-4` | UEFI boot entries |

`grub 2:2.16-1` installed size is 60 MiB and contains the full `arm64-efi` module tree. `systemd 262.1-1` installed size is 49 MiB and contains `systemd-bootaa64.efi` and `linuxaa64.efi.stub`.

### Generic aarch64

- UEFI firmware can boot `/boot/Image` directly when it is placed on the ESP as a PE image.
- GRUB `arm64-efi` works on ARM servers and QEMU `virt` with `edk2-aarch64`.
- systemd-boot `AA64` works on UEFI ARM; the fallback path is `\EFI\BOOT\BOOTAA64.EFI`.
- ARM has no BIOS/CSM; `bios.syslinux` does not apply.

### Raspberry Pi

- ARMv7: VideoCore firmware (`bootcode.bin`, `start.elf`) plus `kernel7.img` and `config.txt`.
- AArch64: `kernel8.img`, `config.txt`, `cmdline.txt`; the VideoCore firmware loads the kernel from FAT.
- Mainline/U-Boot: `uboot-raspberrypi` plus `boot.scr` and `Image`/`kernel8.img`.
- `config.txt` is required for the initramfs and graphics overlays.
- The default console is `serial0,115200` on GPIO 14/15 and `tty1`.

## Build tooling

### `devtools` and `devtools-alarm`

- `devtools 1:1.5.3-1` (`extra`, `any`).
- `devtools-alarm 1:1.5.0-1` (`alarm`, `any`), with ARM-specific patches:
  - `0001-makechrootpkg-cache-dir.patch`
  - `0002-arch-nspawn-keep-mirrorlist.patch`
  - `0003-makechrootpkg-distcc.patch`
  - `0004-arch-nspawn-arm-fix.patch`
  - `0005-makechrootpkg-no-default-logging.patch`
  - `0006-archbuild-no-setarch.patch`
  - `0007-makechrootpkg-don-t-delete-MAKEFLAGS-and-PACKAGER.patch`
  - `0008-makechrootpkg-gotmpdir.patch`

Use `devtools-alarm`, not plain `devtools`, for `pkgctl`/`makechrootpkg` on ARM. `devtools-alarm` conflicts with and provides `devtools`.

### `makepkg.conf`

ALARM adjusts:

```bash
CARCH="@CARCH@"
CHOST="@CHOST@"
CFLAGS="@CARCHFLAGS@-O2 -pipe -fstack-protector-strong -fno-plt -fexceptions ..."
CXXFLAGS="$CFLAGS -Wp,-D_GLIBCXX_ASSERTIONS"
LDFLAGS="-Wl,-O1 -Wl,--sort-common -Wl,--as-needed -Wl,-z,relro -Wl,-z,now ..."
BUILDENV=(!distcc color !ccache check !sign)
```

On a native aarch64 host, `CARCH=aarch64`. For cross-builds, use an `aarch64-linux-gnu-*` toolchain and a separate `makepkg.conf`.

### ALARM-specific PKGBUILD variables

| Variable | Meaning |
|---|---|
| `buildarch` | Bitmask: `1` = all, `4` = only `armv7h`, `8` = only `aarch64` |
| `highmem` | Requires a builder with more than 2 GB RAM |
| `noautobuild` | Mark the package as done and do not build it |

These variables belong to the ALARM build infrastructure, not the standard PKGBUILD format. X can ignore them in its own recipes, but should respect them when importing ALARM recipes.

### `archiso`

- Not present in the ALARM package databases (`core`, `extra`, `alarm`, `aur`).
- Not present in `archlinuxarm/PKGBUILDs` (search for `archiso` returned zero paths).
- `mkinitcpio-archiso 73-1` is present in `extra` and provides the initramfs hook.
- Upstream `archiso` is a set of Bash scripts and profiles. It can be installed with `make install` or packaged locally.
- Upstream dependencies: `arch-install-scripts`, `awk`, `dosfstools`, `e2fsprogs`, `erofs-utils` (optional), `findutils`, `grub`, `gzip`, `libarchive`, `libisoburn`, `mtools`, `openssl`, `pacman`, `sed`, `squashfs-tools`.

The port is feasible. The missing pieces are packaging archiso for ALARM and adapting the X profile.

## Arch x86_64 versus ALARM

| Aspect | Arch Linux x86_64 | Arch Linux ARM |
|---|---|---|
| Architectures | `x86_64`; i686 via Arch Linux 32 | `aarch64`, `armv7h` |
| Repositories | `core`, `extra`, `multilib` | `core`, `extra`, `alarm`, `aur` |
| Mirror | `geo.mirror.pkgbuild.com/$repo/os/$arch` | `mirror.archlinuxarm.org/$arch/$repo` |
| Signed databases | Yes | No; packages are signed |
| Keyring | `archlinux-keyring` | `archlinuxarm-keyring` |
| Delivery | Monthly ISO, netboot, bootstrap | Rootfs tarballs and board images |
| `archiso` | Official package | Not packaged |
| Default kernel | `linux` | `linux-aarch64` |
| Raspberry Pi kernel | Not applicable | `linux-rpi`, `linux-rpi-16k` |
| Bootloaders | GRUB, systemd-boot, syslinux, rEFInd | GRUB `arm64-efi`, systemd-boot `AA64`, U-Boot |
| BIOS | Yes | No |
| `multilib` | Yes | No |
| `reflector` | Yes | No |
| `memtest86+` | Yes | No |
| `syslinux` | Yes | No (x86-only) |
| `edk2-shell` | Yes | No |
| `intel-ucode` / `amd-ucode` | Yes | No / irrelevant |
| `virtualbox-guest-utils` | Yes | No |
| `hyperv` | Yes | No |
| `open-vm-tools` | Yes | No |

## Other ARM distributions and projects

| Project | What it is | Use for X |
|---|---|---|
| Arch Linux ARM | Official Arch port to ARM | Yes, recommended base |
| Manjaro ARM | ALARM derivative with its own tooling | Reference for SBC images; not a base |
| EndeavourOS ARM | ALARM derivative with an installer | Reference for installer UX; not a base |
| Armbian | Debian/Ubuntu for SBCs | No; not Arch |
| Arch Linux 32 | i686 port | No; not ARM |
| Asahi Linux | Apple Silicon platform stack | Not v1; see [Devices](arm-devices.md) |
| Buildroot/Yocto | Embedded build systems | No; not Arch |

There is no official "Arch Linux ARM ISO". Any ARM ISO for X is X's responsibility.

## Risks specific to ALARM

1. Unsigned databases: use `Required DatabaseOptional`, never `DatabaseRequired`.
2. `any` packages: they are shared with x86_64. A package marked `any` can still contain x86-only binaries. Audit `x-scripts`, `x-release` and `x-dev`.
3. Kernel layout: `linux-aarch64` has no `pkgbase` file and uses `/boot/Image`.
4. Kernel naming: `/boot/Image`, `/boot/kernel8.img`, `/boot/initramfs-linux.img`.
5. No `reflector`: use the ALARM mirrorlist.
6. No `archiso` package: maintain it from upstream.
7. SBC support: U-Boot and DTBs are board-specific. There is no universal SBC ISO.
8. Build performance: ARM builds are slower; use native ARM runners or cross-build only for experiments.
9. Graphics: Hyprland on ARM depends on Mesa, Panfrost, VC4 or other platform drivers. Not every SBC has working acceleration.
10. Branding: X must remain an independent derivative. Keep `ID_LIKE=arch`, not `ID=arch`.

## Verification commands

```bash
# Repository databases
for r in core extra alarm aur; do
  curl -fsSL "http://mirror.archlinuxarm.org/aarch64/$r/$r.db.tar.gz" -o "/tmp/$r.db.tar.gz"
done

# Package metadata
curl -fsSL http://mirror.archlinuxarm.org/aarch64/core/linux-aarch64-7.2.11-1-aarch64.pkg.tar.xz | tar -xOf - .PKGINFO | head -40

# Kernel layout
curl -fsSL http://mirror.archlinuxarm.org/aarch64/core/linux-aarch64-7.2.11-1-aarch64.pkg.tar.xz \
  | tar -tf - | grep -E '^boot/|mkinitcpio.d|pkgbase'

# GRUB and systemd-boot
curl -fsSL 'http://mirror.archlinuxarm.org/aarch64/core/grub-2%3A2.16-1-aarch64.pkg.tar.xz' \
  | tar -tf - | grep arm64-efi
curl -fsSL http://mirror.archlinuxarm.org/aarch64/core/systemd-262.1-1-aarch64.pkg.tar.xz \
  | tar -tf - | grep systemd-bootaa64

# Rootfs
curl -sIL http://os.archlinuxarm.org/os/ArchLinuxARM-aarch64-latest.tar.gz
```

## References

- https://archlinuxarm.org/about
- https://archlinuxarm.org/about/mirrors
- https://archlinuxarm.org/about/package-signing
- https://archlinuxarm.org/about/downloads
- https://archlinuxarm.org/platforms/armv8/generic
- https://archlinuxarm.org/platforms/armv8/broadcom/raspberry-pi-4
- https://archlinuxarm.org/packages/aarch64/linux-aarch64
- https://archlinuxarm.org/packages/aarch64/linux-rpi
- https://archlinuxarm.org/packages/aarch64/grub
- https://archlinuxarm.org/packages/aarch64/systemd
- https://archlinuxarm.org/packages/aarch64/archlinuxarm-keyring
- https://github.com/archlinuxarm/PKGBUILDs
- https://github.com/archlinuxarm/wiki
- https://github.com/archlinux/archiso
