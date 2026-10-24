# ARM references and verification

Verified: 2026-10-24.

This page lists primary sources, checked versions, verification commands and the glossary used in the ARM section.

## Primary sources

### Arch Linux ARM

| Topic | URL |
|---|---|
| About, history, architectures | https://archlinuxarm.org/about |
| Mirrors | https://archlinuxarm.org/about/mirrors |
| Package signing | https://archlinuxarm.org/about/package-signing |
| Downloads and tarballs | https://archlinuxarm.org/about/downloads |
| Generic AArch64 | https://archlinuxarm.org/platforms/armv8/generic |
| Raspberry Pi 4 | https://archlinuxarm.org/platforms/armv8/broadcom/raspberry-pi-4 |
| Packages | https://archlinuxarm.org/packages |
| Forum | https://archlinuxarm.org/forum |
| Wiki | https://archlinuxarm.org/wiki |
| PKGBUILDs | https://github.com/archlinuxarm/PKGBUILDs |
| Wiki repository | https://github.com/archlinuxarm/wiki |
| Keyring | https://github.com/archlinuxarm/archlinuxarm-keyring |
| Mirror root | http://mirror.archlinuxarm.org/ |
| Rootfs | http://os.archlinuxarm.org/os/ |

Package pages used:

- https://archlinuxarm.org/packages/aarch64/linux-aarch64
- https://archlinuxarm.org/packages/aarch64/linux-rpi
- https://archlinuxarm.org/packages/aarch64/grub
- https://archlinuxarm.org/packages/aarch64/systemd
- https://archlinuxarm.org/packages/aarch64/archlinuxarm-keyring
- https://archlinuxarm.org/packages/aarch64/uboot-raspberrypi

### Arch Linux and archiso

| Topic | URL |
|---|---|
| archiso (GitLab) | https://gitlab.archlinux.org/archlinux/archiso |
| archiso (GitHub mirror) | https://github.com/archlinux/archiso |
| `mkarchiso` | https://github.com/archlinux/archiso/blob/master/archiso/mkarchiso |
| `README.profile.rst` | https://github.com/archlinux/archiso/blob/master/docs/README.profile.rst |
| releng profile | https://github.com/archlinux/archiso/blob/master/configs/releng/profiledef.sh |
| Arch Wiki archiso | https://wiki.archlinux.org/title/Archiso |
| Arch packages | https://archlinux.org/packages/ |
| devtools | https://gitlab.archlinux.org/archlinux/devtools |

### Boot and platform specifications

| Topic | URL |
|---|---|
| UAPI Boot Loader Specification | https://uapi-group.org/specifications/specs/boot_loader_specification/ |
| UAPI Unified Kernel Image | https://uapi-group.org/specifications/specs/unified_kernel_image/ |
| U-Boot `booti` | https://docs.u-boot.org/en/latest/usage/cmd/booti.html |
| U-Boot distro boot | https://docs.u-boot.org/en/latest/develop/distro.html |
| QEMU `virt` machine | https://www.qemu.org/docs/master/system/arm/virt.html |
| QEMU ARM target | https://www.qemu.org/docs/master/system/target-arm.html |
| edk2 | https://github.com/tianocore/edk2 |

### CI

| Topic | URL |
|---|---|
| GitHub-hosted runners | https://docs.github.com/en/actions/reference/runners/github-hosted-runners |
| ARM64 runner labels | `ubuntu-24.04-arm`, `ubuntu-22.04-arm`, `ubuntu-26.04-arm` (4 vCPU, 16 GB RAM, 14 GB disk) |

### Asahi and WSL

| Topic | URL |
|---|---|
| Asahi documentation | https://asahilinux.org/docs/ |
| Asahi feature support | https://asahilinux.org/docs/platform/feature-support/overview/ |
| U-Boot on Asahi | https://asahilinux.org/docs/sw/u-boot/ |
| Fedora Asahi Remix | https://docs.fedoraproject.org/en-US/fedora-asahi-remix/ |
| WSL documentation | https://learn.microsoft.com/en-us/windows/wsl/ |
| Arch WSL | https://github.com/yuk7/ArchWSL |

## Verified package versions

Mirror snapshot from 2026-10-24. Package pages can be newer.

| Package | Version | Key facts |
|---|---|---|
| `core/linux-aarch64` | `7.2.11-1` | Provides `linux=7.2.11`; conflicts `linux`; installed size 376 MiB; `/boot/Image`, `/boot/Image.gz`, `/boot/dtbs`; no `pkgbase`; preset uses `/boot/initramfs-linux.img` |
| `core/linux-aarch64-headers` | `7.2.11-1` | Split package |
| `core/linux-aarch64-rc` | `7.3.rc7-1` | Release candidate |
| `core/linux-rpi` | `6.18.58-1` (page) / `6.18.57-1` (mirror snapshot) | Provides `linux=6.18.58`; conflicts `linux`, `linux-rpi-16k`, `uboot-raspberrypi`; depends `firmware-raspberrypi`, `raspberrypi-bootloader`; installed size 49 MiB; `/boot/kernel8.img`, `config.txt`, `cmdline.txt`, `pkgbase=linux-rpi` |
| `core/linux-rpi-16k` | `6.18.57-1` | Raspberry Pi 5 16K pages |
| `core/grub` | `2:2.16-1` | `usr/lib/grub/arm64-efi/*`; installed size 60 MiB |
| `core/systemd` | `262.1-1` | `systemd-bootaa64.efi`, `bootctl`, `linuxaa64.efi.stub`; installed size 49 MiB |
| `core/mkinitcpio` | `42.2-1` | - |
| `core/pacman` | `7.1.0.r9.g54d9411-3` | - |
| `core/base` | `3-3` | - |
| `core/archlinuxarm-keyring` | `20240419-2` | Installed size 3.1 KiB |
| `core/efibootmgr` | `18-4` | - |
| `extra/devtools` | `1:1.5.3-1` | - |
| `alarm/devtools-alarm` | `1:1.5.0-1` | ARM patches |
| `extra/arch-install-scripts` | `31-2` | - |
| `extra/mkinitcpio-archiso` | `73-1` | archiso initramfs hook |
| `extra/qemu-guest-agent` | `11.1.2-1` | - |
| `extra/uboot-tools` | `2026.07-2` | `mkimage` |
| `alarm/uboot-raspberrypi` | `2025.01-2` | U-Boot for Raspberry Pi; installed size 1.5 MiB |
| `alarm/raspberrypi-bootloader` | `20261015-1` | VideoCore firmware |
| `alarm/raspberrypi-overlays` | `20260611-2` | Device tree overlays |
| `alarm/firmware-raspberrypi` | `20260311-1` | Wi-Fi/Bluetooth firmware |
| `alarm/raspberry-pi5-c0-armstub` | `1:2.14.11-1` | Raspberry Pi 5 |
| `alarm/raspberry-pi5-d0-armstub` | `1:2.14.11-1` | Raspberry Pi 5 |

## Verified package counts

| Repository | Packages | Database last modified |
|---|---:|---|
| `core` | 313 | 2026-10-22 10:49:49 UTC |
| `extra` | 12,993 | 2026-10-22 23:41:31 UTC |
| `alarm` | 75 | 2026-10-17 12:08:25 UTC |
| `aur` | 12 | 2026-10-11 17:11:41 UTC |

`community` is obsolete (last modified 2023-05-20) and is not used.

## Verified rootfs sizes

| Artefact | Bytes | Last modified |
|---|---:|---|
| `ArchLinuxARM-aarch64-latest.tar.gz` | 829,367,415 | 2026-08-05 12:41:36 UTC |
| `ArchLinuxARM-rpi-aarch64-latest.tar.gz` | 850,215,189 | 2026-08-05 12:55:04 UTC |
| `ArchLinuxARM-rpi-armv7-latest.tar.gz` | 758,521,281 | 2026-08-05 14:16:42 UTC |

## Verification commands

### Repositories

```bash
mkdir -p /tmp/alarmdb && cd /tmp/alarmdb
for r in core extra alarm aur; do
  curl -fsSL "http://mirror.archlinuxarm.org/aarch64/$r/$r.db.tar.gz" -o "$r.db.tar.gz"
  mkdir -p "$r" && tar -xzf "$r.db.tar.gz" -C "$r"
done
```

### Package metadata

```bash
# Extract desc directly from the database directory
sed -n '1,40p' /tmp/alarmdb/core/linux-aarch64-7.2.11-1/desc

# Or inspect a downloaded package
curl -fsSL http://mirror.archlinuxarm.org/aarch64/core/linux-aarch64-7.2.11-1-aarch64.pkg.tar.xz \
  | tar -tf - | grep -E '^boot/|mkinitcpio.d|pkgbase'
```

### GRUB and systemd-boot

```bash
curl -fsSL 'http://mirror.archlinuxarm.org/aarch64/core/grub-2%3A2.16-1-aarch64.pkg.tar.xz' \
  | tar -tf - | grep arm64-efi
curl -fsSL http://mirror.archlinuxarm.org/aarch64/core/systemd-262.1-1-aarch64.pkg.tar.xz \
  | tar -tf - | grep -E 'systemd-bootaa64|bootctl|linuxaa64'
```

### Keyring

```bash
curl -fsSL http://mirror.archlinuxarm.org/aarch64/core/archlinuxarm-keyring-20240419-2-any.pkg.tar.xz \
  | tar -xOf - usr/share/pacman/keyrings/archlinuxarm-trusted
```

### Rootfs

```bash
curl -sIL http://os.archlinuxarm.org/os/ArchLinuxARM-aarch64-latest.tar.gz \
  | grep -iE 'HTTP/|content-length|last-modified'
curl -fsSL http://os.archlinuxarm.org/os/ArchLinuxARM-aarch64-latest.tar.gz.md5
```

### Archiso

```bash
curl -fsSL https://raw.githubusercontent.com/archlinux/archiso/master/archiso/mkarchiso \
  | grep -nE 'aarch64|uefi_arch|grub_target'
curl -fsSL https://raw.githubusercontent.com/archlinux/archiso/master/configs/releng/profiledef.sh
curl -fsSL https://raw.githubusercontent.com/archlinux/archiso/master/docs/README.profile.rst \
  | grep -nE 'arch|bootmode|kernel_params'
```

### Host

```bash
uname -m
pacman -Q archiso grub systemd mkinitcpio
mkarchiso -h | head -40
ls /usr/lib/grub/
pacman -Ql edk2-aarch64 2>/dev/null | grep '\.fd$'
command -v qemu-system-aarch64
```

### QEMU firmware

```bash
pacman -Ql edk2-aarch64 | grep -E '\.fd$'
# /usr/share/edk2/aarch64/QEMU_EFI.fd
# /usr/share/edk2/aarch64/QEMU_VARS.fd
# /usr/share/AAVMF/AAVMF_CODE.fd
# /usr/share/AAVMF/AAVMF_VARS.fd
```

## X source references

| File | Line | Content |
|---|---:|---|
| `x/profiledef.sh` | 11-14 | `bootmodes`, `packages_file`, `arch` |
| `x/profiledef.sh` | 17 | `-Xbcj x86` |
| `x/xbuild.sh` | 11-18 | `work/x86_64` |
| `x/x.sh` | 2 | `work/x86_64` |
| `x/pacman.conf` | 84 | `repo/x86_64` |
| `x/airootfs/etc/pacman.conf` | 83 | `repo/x86_64` |
| `x/airootfs/root/x-installer/install.sh` | 39 | `KERNEL=linux` |
| `x/airootfs/root/x-installer/install.sh` | 46-47 | x86 kernels |
| `x/airootfs/root/x-installer/install.sh` | 88 | `packages.x86_64` |
| `x/airootfs/root/x-installer/install.sh` | 207 | `EXTRA` |
| `x/airootfs/root/x-installer/install.sh` | 251, 271 | `populate archlinux` |
| `x/airootfs/root/x-installer/install.sh` | 312 | `repo/x86_64` |
| `x/airootfs/root/x-installer/install.sh` | 390-408 | `systemd-bootx64` / `BOOTX64` |
| `x/airootfs/root/x-installer/install.sh` | 418 | `vmlinuz-$KERNEL` |
| `x/airootfs/root/x-installer/install.sh` | 428-431 | `x86_64-efi` / `i386-pc` |
| `x/airootfs/root/x-installer/install.sh` | 445-450 | `systemd-bootx64` / `grubx64` |
| `scripts/install/helpers/xkernel.sh` | 14 | Known kernels |
| `scripts/install/helpers/xkernel.sh` | 36-42 | `pkgbase` |
| `scripts/install/helpers/xgen.sh` | 259-320 | `vmlinuz-*` |
| `scripts/install/helpers/xgen.sh` | 628-880 | Boot entries |
| `xpkg/crates/xpkg-core/src/recipe/validate.rs` | 37 | Valid architectures |
| `xpm/crates/xpm/src/main.rs` | 119-128 | `std::env::consts::ARCH` |
| `x-repo/build-packages.sh` | 30-31 | `repo/x86_64` / `x/x86_64` |
| `x-repo/.github/workflows/build.yml` | 37-38 | x86_64 verification |
| `wsl/build-rootfs.sh` | 202-208 | `populate archlinux` |
| `ops/docs/requirements.md` | 10 | "Arch Linux x86_64" |

## Numbered bibliography

Use these identifiers in reviews and PR descriptions.

| ID | Source |
|---|---|
| S1 | Arch Linux ARM, About: https://archlinuxarm.org/about |
| S2 | Arch Linux ARM, Mirrors: https://archlinuxarm.org/about/mirrors |
| S3 | Arch Linux ARM, Package signing: https://archlinuxarm.org/about/package-signing |
| S4 | Arch Linux ARM, Downloads: https://archlinuxarm.org/about/downloads |
| S5 | Arch Linux ARM, Generic AArch64: https://archlinuxarm.org/platforms/armv8/generic |
| S6 | Arch Linux ARM, Raspberry Pi 4: https://archlinuxarm.org/platforms/armv8/broadcom/raspberry-pi-4 |
| S7 | Arch Linux ARM, package search: https://archlinuxarm.org/packages |
| S8 | ALARM `linux-aarch64` package page: https://archlinuxarm.org/packages/aarch64/linux-aarch64 |
| S9 | ALARM `linux-rpi` package page: https://archlinuxarm.org/packages/aarch64/linux-rpi |
| S10 | ALARM `grub` package page: https://archlinuxarm.org/packages/aarch64/grub |
| S11 | ALARM `systemd` package page: https://archlinuxarm.org/packages/aarch64/systemd |
| S12 | ALARM `archlinuxarm-keyring` package page: https://archlinuxarm.org/packages/aarch64/archlinuxarm-keyring |
| S13 | ALARM `uboot-raspberrypi` package page: https://archlinuxarm.org/packages/aarch64/uboot-raspberrypi |
| S14 | ALARM PKGBUILDs: https://github.com/archlinuxarm/PKGBUILDs |
| S15 | ALARM wiki repository: https://github.com/archlinuxarm/wiki |
| S16 | ALARM keyring repository: https://github.com/archlinuxarm/archlinuxarm-keyring |
| S17 | ALARM mirror root: http://mirror.archlinuxarm.org/ |
| S18 | ALARM rootfs: http://os.archlinuxarm.org/os/ |
| S19 | archiso: https://github.com/archlinux/archiso |
| S20 | archiso GitLab: https://gitlab.archlinux.org/archlinux/archiso |
| S21 | `mkarchiso`: https://github.com/archlinux/archiso/blob/master/archiso/mkarchiso |
| S22 | archiso profile docs: https://github.com/archlinux/archiso/blob/master/docs/README.profile.rst |
| S23 | archiso releng profile: https://github.com/archlinux/archiso/blob/master/configs/releng/profiledef.sh |
| S24 | UAPI Boot Loader Specification: https://uapi-group.org/specifications/specs/boot_loader_specification/ |
| S25 | UAPI Unified Kernel Image: https://uapi-group.org/specifications/specs/unified_kernel_image/ |
| S26 | U-Boot `booti`: https://docs.u-boot.org/en/latest/usage/cmd/booti.html |
| S27 | U-Boot distro boot: https://docs.u-boot.org/en/latest/develop/distro.html |
| S28 | QEMU `virt`: https://www.qemu.org/docs/master/system/arm/virt.html |
| S29 | QEMU ARM target: https://www.qemu.org/docs/master/system/target-arm.html |
| S30 | edk2: https://github.com/tianocore/edk2 |
| S31 | GitHub-hosted runners: https://docs.github.com/en/actions/reference/runners/github-hosted-runners |
| S32 | Asahi documentation: https://asahilinux.org/docs/ |
| S33 | Asahi feature support: https://asahilinux.org/docs/platform/feature-support/overview/ |
| S34 | Fedora Asahi Remix: https://docs.fedoraproject.org/en-US/fedora-asahi-remix/ |
| S35 | WSL documentation: https://learn.microsoft.com/en-us/windows/wsl/ |
| S36 | X repository documentation: `x-repo/docs/en/` |
| S37 | X wiki: `wiki/x/en/` |
| S38 | X web portal: `web/content/en/x/` |

## Source-to-claim map

| Claim | Sources | Verification |
|---|---|---|
| ALARM supports aarch64 and armv7h; ARMv5/6 were dropped | S1 | Page text |
| Mirror URL is `mirror.archlinuxarm.org/$arch/$repo` | S2, S17 | `curl` the mirror |
| ALARM databases are unsigned, packages are signed | S3 | Page text; `gpg --verify` |
| Build key ID `68B3537F...` | S3 | Page text |
| Rootfs tarballs and sizes | S4, S18 | `curl -sIL` |
| `linux-aarch64` uses `/boot/Image` and has no `pkgbase` | S8, S14 | Extract the package |
| `linux-rpi` uses `/boot/kernel8.img` and `pkgbase=linux-rpi` | S9, S14 | Extract the package |
| `linux-rpi` conflicts with `uboot-raspberrypi` | S9 | Package page |
| GRUB provides `arm64-efi` | S10 | Extract the package |
| systemd provides `systemd-bootaa64.efi` | S11 | Extract the package |
| `archlinuxarm-keyring` populates `archlinuxarm` | S12, S16 | Package install script |
| `archiso` is not in ALARM | S7, S14 | Search packages and PKGBUILDs |
| `mkarchiso` has aarch64 branches | S19, S21 | Source inspection |
| releng has `kernel_params_aarch64` and BCJ `x86,arm64` | S23 | Source inspection |
| systemd-boot fallback is `BOOTAA64.EFI` | S11, S24 | Package contents; spec |
| U-Boot `booti` boots `Image` | S26 | Documentation |
| U-Boot distro boot uses `extlinux.conf` | S27 | Documentation |
| QEMU `virt` default CPU is `cortex-a15`; specify a 64-bit CPU | S28 | Documentation |
| `edk2-aarch64` provides `QEMU_EFI.fd` and `QEMU_VARS.fd` | S30 | `pacman -Ql edk2-aarch64` |
| GitHub hosted ARM runners are 4 vCPU/16 GB/14 GB | S31 | Documentation |
| Asahi is not official ALARM | S32, S33, S34 | Documentation |
| WSL on ARM64 needs an aarch64 rootfs | S35 | Documentation |

## Version pinning and refresh

The documentation is pinned to **2026-10-24**. ALARM is rolling; refresh before implementation and before every release.

Refresh procedure:

1. Download the four ALARM databases for `aarch64`.
2. Record the `Last-Modified` headers.
3. Re-run the package matrix script.
4. Check the package pages for `linux-aarch64`, `linux-rpi`, `grub`, `systemd`, `archlinuxarm-keyring` and `uboot-raspberrypi`.
5. Check the Arch repositories for `qemu-system-aarch64` and `edk2-aarch64`.
6. Check the archiso upstream for changes to `uefi_arch`, `grub_target` and boot modes.
7. Update this page, `arm-alarm.md`, `arm-packages.md` and any changed claim.
8. Commit only after review.

Known snapshot discrepancy:

- Mirror snapshot 2026-10-22: `linux-rpi 6.18.57-1`.
- Package page 2026-10-24: `linux-rpi 6.18.58-1`.

The docs record both and tell implementers to re-query. Do not silently update one without the other.

## Per-page reference index

| Page | Primary sources |
|---|---|
| `arm.md` | S1, S3, S4, S8, S19, S24, S28 |
| `arm-alarm.md` | S1-S18, S20-S23 |
| `arm-audit.md` | S36-S38, X source tree |
| `arm-packages.md` | S7-S14, X manifest |
| `arm-package-verification.md` | S3, S7, S14, S36 |
| `arm-archiso.md` | S19-S23, S28 |
| `arm-installer.md` | S8, S9, S10, S11, S24, S26, S27 |
| `arm-generations.md` | S8, S9, S24, S26 |
| `arm-tooling.md` | S3, S7, S14, S36 |
| `arm-testing.md` | S28, S29, S30, S31 |
| `arm-test-plan.md` | S19, S24, S28, S31 |
| `arm-devices.md` | S5, S6, S9, S13, S26, S27, S32-S35 |
| `arm-hardware-matrix.md` | S5, S6, S28, S32 |
| `arm-security.md` | S3, S12, S16, S24, S30 |
| `arm-runbook-build.md` | S19-S23, S28 |
| `arm-runbook-install.md` | S8, S9, S10, S11, S24 |
| `arm-runbook-release.md` | S3, S36 |
| `arm-runbook-debug.md` | S24, S26, S28, S30 |
| `arm-implementation.md` | S1-S38 as needed |
| `arm-roadmap.md` | S1, S19, S24, S28 |
| `arm-checklists.md` | S1-S38 as needed |
| `arm-faq.md` | S1-S38 as needed |
| `arm-snippets.md` | S19-S31 as needed |
| `arm-references.md` | This page |

## URL health check

```bash
urls=(
  https://archlinuxarm.org/about
  https://archlinuxarm.org/about/mirrors
  https://archlinuxarm.org/about/package-signing
  https://archlinuxarm.org/about/downloads
  https://archlinuxarm.org/platforms/armv8/generic
  https://github.com/archlinux/archiso
  https://uapi-group.org/specifications/specs/boot_loader_specification/
  https://docs.u-boot.org/en/latest/usage/cmd/booti.html
  https://www.qemu.org/docs/master/system/arm/virt.html
  https://docs.github.com/en/actions/reference/runners/github-hosted-runners
)
for u in "${urls[@]}"; do
  code="$(curl -s -o /dev/null -w '%{http_code}' -L --max-time 30 "$u")"
  printf '%s %s
' "$code" "$u"
done
```

Expected: `200`. A `403` can be anti-bot protection; retry with a browser or use the raw source repository.

## Evidence bundle

For each release, archive:

- ISO SHA-256 and signature.
- Repository `x.db` and signature.
- Package list with versions and signatures.
- ALARM database snapshot dates.
- Package page versions for `linux-aarch64`, `linux-rpi`, `grub`, `systemd`.
- QEMU and edk2 versions.
- Build log.
- QEMU e2e log.
- Hardware validation record.
- Documentation commit hash.
- Known limitations.

## Glossary

| Term | Meaning |
|---|---|
| ALARM | Arch Linux ARM, the official Arch port to ARM |
| aarch64 | ARMv8-A 64-bit; pacman and Rust architecture name |
| armv7h | ARMv7-A hard-float NEON; pacman architecture name |
| AA64 | UEFI architecture identifier for aarch64 (`BOOTAA64.EFI`) |
| arm64-efi | GRUB target for aarch64 |
| EFI stub | Kernel with a PE/COFF header that firmware can load |
| DTB | Device Tree Blob; describes hardware to Linux |
| U-Boot | Bootloader for SBCs and ARM boards |
| ESP | EFI System Partition (FAT) |
| XBOOTLDR | Extended Boot Loader Partition |
| UKI | Unified Kernel Image (kernel + initramfs + cmdline in a PE file) |
| archiso | Arch tooling to build ISOs |
| mkinitcpio | Arch initramfs generator |
| devtools-alarm | devtools with ALARM patches |
| m1n1 | Boot payload for Apple Silicon |
| Asahi | Linux project for Apple Silicon |
| TCG | QEMU software emulation (no KVM) |
| pflash | QEMU persistent firmware flash drive |
| cidata | Cloud-init style data image used by the X autoinstall harness |

## Documentation location

The ARM reference set lives in `references/` inside the `xlnux-arm` skill pack. The skill entry point is `../SKILL.md`.

The X project may later mirror these pages into `x/docs/en/`, `wiki/x/en/` and `web/content/en/x/`. Until that happens, this skill pack is the source of truth. If a mirror is added, update `web/lib/docs.ts` and keep the copies identical.
