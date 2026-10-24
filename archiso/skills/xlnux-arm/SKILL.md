---
name: xlnux-arm
description: ARM support for X Linux (equislinux) and Arch Linux ARM. Use when auditing, planning, implementing, or debugging aarch64 support in the x archiso profile, install.sh, xgen/xkernel, xpkg/xpm, x-repo, CI, or release metadata. Covers the aarch64 UEFI ISO, GRUB arm64-efi, systemd-boot AA64, ALARM repositories and keys, kernel Image/pkgbase mismatches, Raspberry Pi/U-Boot limits, QEMU virt testing, and the exact x86_64 hardcodes that must become architecture-aware.
---

# X Linux ARM support

This skill is the working summary of the ARM research for X Linux. The full reference set lives in this skill:

- `references/arm.md` and the other `references/arm-*.md` pages.
- `references/arm-toolkit/` for the runnable reference scripts.
- The X source project is at `/home/xscriptor/Documents/repos/xscriptor/equislinux/`.

The pages are English-only while the port is under review.

## Current state

X Linux is x86_64-only today. There is no ARM build, repository, ISO, CI job or release. The only ARM-aware code is `xpkg`'s architecture validator, which accepts `aarch64` and `armv7h` as metadata values.

Verified on 2026-10-24:

- `x/profiledef.sh` fixes `arch="x86_64"`, `packages_file="packages.x86_64"`, `bios.syslinux` + `uefi.grub`, and `mksquashfs -Xbcj x86`.
- `install.sh` defaults to `linux`, installs GRUB `x86_64-efi`/`i386-pc`, `systemd-bootx64.efi` and `BOOTX64.EFI`.
- `x-repo` hardcodes `public/repo/x86_64` and `public/x/x86_64`.
- `xfetch-bin`, `xtop-git` and `opencode-bin` are `arch=('x86_64')`.
- CI only verifies x86_64 artefacts.
- `xgen` globs `/boot/vmlinuz-*`; `xkernel` requires `/usr/lib/modules/<rel>/pkgbase`.

## Recommended v1

- Architecture: `aarch64`.
- Base: Arch Linux ARM (`core`, `extra`, `alarm`, `aur`), not Arch x86_64.
- Firmware: UEFI only.
- Bootloader: GRUB `arm64-efi` by default; systemd-boot `AA64` optional.
- Kernel: `linux-aarch64` for generic aarch64; `linux-rpi` for Raspberry Pi (v2).
- Repository: `public/repo/aarch64` and `public/x/aarch64`.
- Build: native aarch64; cross-build with binfmt only for experiments.
- CI: ARM runner plus QEMU `virt` with `edk2-aarch64`.

Out of scope for v1: `armv7h`, Raspberry Pi, generic SBCs, Asahi, WSL ARM, Secure Boot.

## Key numbers

| Item | Value |
|---|---:|
| Packages in `x/packages.x86_64` | 143 |
| Available in ALARM aarch64 | 128 |
| Missing | 15 |
| Non-applicable or unmaintained | 10 |
| X packages to rebuild | 4 |
| Generic kernel name missing | 1 (`linux`) |

Missing packages: `linux`, `intel-ucode`, `syslinux`, `memtest86+`, `memtest86+-efi`, `refind`, `edk2-shell`, `hyperv`, `open-vm-tools`, `virtualbox-guest-utils-nox`, `reflector`, `x-release`, `x-dev`, `xfetch-bin`, `xtop-git`.

Replace `linux` with `linux-aarch64` and `linux-aarch64-headers`. Add `archlinuxarm-keyring` and `pacman-mirrorlist`. Remove `amd-ucode` as well.

## Critical ARM facts

- ALARM publishes tarballs, not ISOs.
- `archiso` is not packaged in ALARM. Install it from source or package it locally.
- `mkinitcpio-archiso` is available.
- `linux-aarch64` installs `/boot/Image`, `/boot/Image.gz`, `/boot/dtbs`, and a preset that generates `/boot/initramfs-linux.img`. It does not install `vmlinuz-*` and does not ship a `pkgbase` file.
- `linux-aarch64` provides `linux=7.2.11` and conflicts with `linux`, but there is no package named `linux`.
- `linux-rpi` installs `/boot/kernel8.img`, `config.txt`, `cmdline.txt`, and `pkgbase=linux-rpi`. It conflicts with `uboot-raspberrypi`.
- `grub 2:2.16-1` provides `usr/lib/grub/arm64-efi`.
- `systemd 262.1-1` provides `systemd-bootaa64.efi` and `BOOTAA64.EFI` fallback behavior.
- ALARM package databases are not signed; packages are. Use `SigLevel = Required DatabaseOptional`.
- `archlinuxarm-keyring` plus `pacman-key --populate archlinuxarm`.
- `reflector` is not available. Use the ALARM mirrorlist.
- `syslinux`, `memtest86+`, `rEFInd`, `edk2-shell`, `intel-ucode`, `hyperv`, `open-vm-tools` and `virtualbox-guest-utils-nox` are not available or not applicable.
- `xpm` uses `std::env::consts::ARCH`, which returns `arm` on ARMv7, not `armv7h`.

## Highest-value fixes

1. Make `profiledef.sh` architecture-aware: `arch`, `packages_file`, `pacman_conf`, `bootmodes`, `-Xbcj`.
2. Add `packages.aarch64` and `pacman.aarch64.conf`; use ALARM mirrors and `[x]/$arch`.
3. Use `linux-aarch64`, `archlinuxarm-keyring`, GRUB `arm64-efi`, `BOOTAA64.EFI`, `systemd-bootaa64.efi`.
4. Add the `pkgbase` fallback via `pacman -Qoq /boot/Image`.
5. Add `xkernel_image_name` and `xkernel_initramfs_name`; teach `xgen` about `Image` and `kernel8.img`.
6. Make `x-repo/build-packages.sh` and CI architecture-aware.
7. Add an ARM job and QEMU `virt` e2e with `console=ttyAMA0`.

## Verification commands

```bash
# ALARM databases
for r in core extra alarm aur; do
  curl -fsSL "http://mirror.archlinuxarm.org/aarch64/$r/$r.db.tar.gz" -o "/tmp/$r.db.tar.gz"
done

# Kernel layout
curl -fsSL http://mirror.archlinuxarm.org/aarch64/core/linux-aarch64-7.2.11-1-aarch64.pkg.tar.xz \
  | tar -tf - | grep -E '^boot/|mkinitcpio.d|pkgbase'

# GRUB and systemd-boot
curl -fsSL 'http://mirror.archlinuxarm.org/aarch64/core/grub-2%3A2.16-1-aarch64.pkg.tar.xz' \
  | tar -tf - | grep arm64-efi
curl -fsSL http://mirror.archlinuxarm.org/aarch64/core/systemd-262.1-1-aarch64.pkg.tar.xz \
  | tar -tf - | grep systemd-bootaa64

# QEMU
qemu-system-aarch64 -M virt -cpu max -smp 4 -m 4096 \
  -drive if=pflash,format=raw,readonly=on,file=/usr/share/edk2/aarch64/QEMU_EFI.fd \
  -drive if=pflash,format=raw,file=/tmp/AAVMF_VARS.fd \
  -drive if=none,id=cdrom,media=cdrom,readonly=on,file=out/x-*-aarch64.iso \
  -device virtio-scsi-pci -device scsi-cd,drive=cdrom \
  -drive if=virtio,format=qcow2,file=/tmp/x-aarch64.qcow2 \
  -netdev user,id=n0 -device virtio-net-pci,netdev=n0 \
  -nographic
```

## Pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| `target not found: linux` | ALARM has no package named `linux` | Use `linux-aarch64` |
| `target not found: syslinux/reflector/edk2-shell` | Not available or x86-only | Remove |
| `grub-mkstandalone` cannot find `arm64-efi` | x86_64 GRUB on the build host | Build on aarch64 or install ARM GRUB |
| ISO has no `BOOTAA64.EFI` | x86 profile | UEFI boot mode plus aarch64 profile |
| `xgen: no archived kernel` | Globs `vmlinuz-*` | Kernel map for `Image`/`kernel8.img` |
| `x kernel: not installed` | No `pkgbase` in `linux-aarch64` | Fallback via `pacman -Qoq /boot/Image` |
| `xpm` 404 on `x/arm` | Rust returns `arm` on ARMv7 | Normalise to `armv7h` |
| pacman database signature error | ALARM databases are unsigned | `Required DatabaseOptional` |
| Boot hangs with no serial output | `console=ttyS0` is x86 | `console=ttyAMA0` |
| Multi-kernel collision | Both ARM kernels use `initramfs-linux.img` | One kernel in v1; custom presets in v2 |

## Rules for agents

- Do not add `armv7h`, Raspberry Pi or Asahi to a v1 change unless explicitly requested.
- Do not remove `bios.syslinux` from the x86_64 profile; make the profile conditional.
- Do not set `SigLevel = DatabaseRequired` for ALARM.
- Do not assume `vmlinuz-*` or `pkgbase` on ARM.
- Do not commit or push without approval.
- Preserve x86_64 behavior in every change.
- Update the docs under `references/` together with the skill.

## Documentation map

The full arsenal lives in `references/`. Page names in the tables below are relative to `references/`. Runnable reference scripts live in `references/arm-toolkit/`.

### Orientation

| Page | Contents |
|---|---|
| `arm.md` | Overview, scope, decisions, numbers, reading guide |
| `arm-faq.md` | Short answers to common questions |
| `arm-roadmap.md` | Phases, acceptance criteria, ADRs, risks, open questions |

### Upstream and analysis

| Page | Contents |
|---|---|
| `arm-alarm.md` | ALARM repositories, mirrors, signing, tarballs, kernels, bootloaders |
| `arm-audit.md` | x86_64 hardcodes with file and line references |
| `arm-packages.md` | Full 143-package matrix |
| `arm-package-verification.md` | Availability, buildability, ELF checks, evidence records |
| `arm-hardware-matrix.md` | Supported platforms, firmware quirks, validation tiers |

### Implementation

| Page | Contents |
|---|---|
| `arm-implementation.md` | PR sequence, exact files, tests, acceptance, rollback |
| `arm-archiso.md` | Profile, UEFI boot modes, GRUB/systemd-boot, squashfs, build strategies |
| `arm-installer.md` | Installer, keyrings, ESP, bootloader targets, kernel names |
| `arm-generations.md` | `xgen`, `xkernel`, boot entries, multi-kernel limits |
| `arm-tooling.md` | `xpkg`, `xpm`, `x-repo`, multi-architecture publishing |
| `arm-snippets.md` | Proposed, unapplied snippets |

### Operations

| Page | Contents |
|---|---|
| `arm-runbook-build.md` | Native build, verification, artefacts, troubleshooting |
| `arm-runbook-install.md` | Disk layouts, installer flow, manual fallback, recovery |
| `arm-runbook-release.md` | Signing, publication, SourceForge, metadata, rollback |
| `arm-runbook-debug.md` | Firmware, GRUB, kernel, initramfs, systemd, QEMU debug |
| `arm-checklists.md` | Decision, build, install, release, security, hardware checklists |

### Quality and governance

| Page | Contents |
|---|---|
| `arm-testing.md` | QEMU `virt`, `edk2-aarch64`, e2e, ARM runners |
| `arm-test-plan.md` | Test levels, IDs, matrix, evidence, exit criteria |
| `arm-security.md` | Trust chain, keys, supply chain, Secure Boot, incidents |
| `arm-devices.md` | `armv7h`, Raspberry Pi, U-Boot, SBCs, Asahi, WSL |
| `arm-references.md` | Numbered bibliography, versions, citation map, commands |
| `arm-toolkit.md` | Reference scripts and usage |

## Quick answer

If asked whether X supports ARM:

> No. X Linux is x86_64-only today: the archiso profile, installer, `[x]` repository, binaries, CI and releases are hardcoded to x86_64. The base for a port is Arch Linux ARM. A v1 can target aarch64 with UEFI, GRUB `arm64-efi` or systemd-boot `AA64`, `linux-aarch64`, ALARM repositories and `[x]/aarch64`. archiso is not packaged in ALARM, but upstream archiso already has aarch64 branches. The full audit and plan are in `references/arm.md` and the other `references/arm-*.md` pages.
