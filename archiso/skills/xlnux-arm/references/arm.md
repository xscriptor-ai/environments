# ARM support for X Linux

Status: research and implementation plan. No ARM build, repository, ISO or CI exists yet.
Verified: 2026-10-24 against the `equislinux` repositories, Arch Linux ARM (ALARM), archiso 91-1 and the local Arch x86_64 host.

This section documents what it would take to support ARM in X Linux, what already exists in the Arch ecosystem, and which parts of X must become architecture-aware. It is intentionally separate from the x86_64 build documentation: nothing here is implemented, and every change is proposed for review.

> Scope of this draft: **aarch64 with UEFI**. `armv7h`, Raspberry Pi, generic SBCs, Apple Silicon (Asahi), WSL on ARM64 and Secure Boot are analysed but excluded from v1.

## Executive summary

X Linux is currently x86_64-only from end to end:

- `x/profiledef.sh` fixes `arch="x86_64"`, `packages_file="packages.x86_64"` and the boot modes `bios.syslinux` + `uefi.grub`.
- `x/install.sh` defaults to the `linux` kernel and installs GRUB `x86_64-efi` / `i386-pc`, systemd-boot `systemd-bootx64.efi` and `BOOTX64.EFI`.
- `x-repo` publishes only `public/repo/x86_64` and `public/x/x86_64`.
- The X binaries `xfetch-bin`, `xtop-git` and `opencode-bin` are `arch=('x86_64')`.
- CI only verifies x86_64 artefacts.
- `xgen` and `xkernel` assume `/boot/vmlinuz-*` and `initramfs-<pkgbase>.img`.
- Releases and the website only list `x-*-x86_64.iso`.

There is no ARM documentation in `x/`, `wiki/`, `web/`, `x-repo/`, `wsl/` or `ops/`. The only ARM-aware code is `xpkg`'s architecture validator, which accepts `aarch64` and `armv7h` as metadata values; it does not build, test or publish ARM packages by itself.

The correct upstream base is **Arch Linux ARM**, not Arch Linux x86_64. ALARM provides `aarch64` and `armv7h` repositories, signed packages, rootfs tarballs, kernels, GRUB `arm64-efi`, systemd-boot `AA64`, U-Boot and `devtools-alarm`. ALARM does **not** publish ISOs and does **not** package `archiso`; X must build and package the ISO itself.

## Key numbers

| Item | Value |
|---|---:|
| Packages in `x/packages.x86_64` | 143 |
| Packages available in ALARM `aarch64` | 128 |
| Packages missing from ALARM `aarch64` | 15 |
| x86-only or non-applicable packages to remove | 10 |
| X packages that must be rebuilt for ARM | 4 (`x-release`, `x-dev`, `xfetch-bin`, `xtop-git`) |
| ALARM `aarch64` package counts | 313 `core`, 12,993 `extra`, 75 `alarm`, 12 `aur` |
| Rootfs `ArchLinuxARM-aarch64-latest.tar.gz` | 829,367,415 bytes, 2026-08-05 |
| `linux-aarch64` in the repository snapshot | 7.2.11-1 |
| `linux-rpi` current package page | 6.18.58-1 |
| `grub` aarch64 | 2:2.16-1 |
| `systemd` aarch64 | 262.1-1 |
| `mkinitcpio` | 42.2-1 |
| `devtools-alarm` | 1:1.5.0-1 |
| `arch-install-scripts` | 31-2 |

The package matrix is in [ARM packages](arm-packages.md). The full source list is in [ARM references](arm-references.md).

## Recommended v1 architecture

| Layer | Choice |
|---|---|
| Architecture | `aarch64` (ARMv8-A) |
| Base distribution | Arch Linux ARM |
| Firmware / boot | UEFI only |
| Bootloader | GRUB `arm64-efi` by default; systemd-boot `AA64` as an option |
| Kernel | `linux-aarch64` for generic aarch64 |
| Compression | `mksquashfs -Xbcj arm64` |
| Repository | `public/repo/aarch64` and `public/x/aarch64` |
| Keyring | `archlinuxarm-keyring` + the existing X repository key |
| Build | native aarch64 host, VM or ARM runner |
| CI | ARM runner plus QEMU `virt` with `edk2-aarch64` |
| Installer | GRUB `arm64-efi`, `BOOTAA64.EFI`, `systemd-bootaa64.efi` |
| Generations | kernel map for `/boot/Image`, `kernel8.img` and `pkgbase` fallback |

Out of scope for v1:

- `armv7h` (32-bit userland, U-Boot, no UEFI ISO).
- Raspberry Pi images (firmware/U-Boot, `config.txt`, `kernel8.img`).
- Generic SBC images (board-specific U-Boot and DTBs).
- Apple Silicon / Asahi (separate platform stack).
- WSL on Windows ARM64 (separate rootfs product).
- Secure Boot (no shim or key enrollment in v1).

## Why ALARM and not another ARM distribution

ALARM is a port of Arch, not a derivative. Packages are rebuilt from the Arch upstream with minimal changes, which matches X's model as an Arch-based distribution. Manjaro ARM and EndeavourOS ARM are derivatives built on ALARM; they are useful references but would add another layer of packaging and policy. Armbian is Debian/Ubuntu-based. Arch Linux 32 is x86-only.

ALARM also provides the pieces X needs: `core`, `extra`, `alarm`, `aur`, signed packages, `archlinuxarm-keyring`, `pacman-mirrorlist`, `linux-aarch64`, `grub`, `systemd`, `uboot-tools` and `devtools-alarm`.

## What "support" means

Compiling a kernel or producing an ISO is not enough. X can claim ARM support only when all of the following are true:

1. A signed `x-<version>-aarch64.iso` is published.
2. The UEFI installer completes on QEMU `virt` and on at least one real UEFI ARM system.
3. `[x]/aarch64` is signed, consumable by `pacman`, and documented.
4. `xpm` works with `x/aarch64`.
5. `x gen` and `x kernel` work with ALARM kernel layouts.
6. CI builds and tests ARM on every relevant change.
7. English documentation is published together with the x86_64 docs.
8. Limitations (RPi, SBC, Asahi, Secure Boot) are explicit.

Until then, the correct label is "experimental", not "supported".

## How to use this arsenal

| Role | Read first | Then |
|---|---|---|
| Architect / decision maker | This page, [Roadmap and risks](arm-roadmap.md) | [ALARM reference](arm-alarm.md), [Hardware matrix](arm-hardware-matrix.md) |
| Implementer | [Implementation plan](arm-implementation.md) | [Audit](arm-audit.md), [archiso port](arm-archiso.md), [Installer](arm-installer.md), [Generations](arm-generations.md) |
| Package maintainer | [Packages](arm-packages.md), [Package verification](arm-package-verification.md) | [Tooling and repository](arm-tooling.md) |
| Release manager | [Release runbook](arm-runbook-release.md) | [Checklists](arm-checklists.md), [Security](arm-security.md) |
| Tester | [Test plan](arm-test-plan.md), [Testing and CI](arm-testing.md) | [Hardware matrix](arm-hardware-matrix.md), [Debug runbook](arm-runbook-debug.md) |
| Support / debugger | [Debug runbook](arm-runbook-debug.md) | [FAQ](arm-faq.md), [Install runbook](arm-runbook-install.md) |
| AI agent | Skill `xlnux-arm` in the archiso environment pack | This page and the canonical docs |

## Document map

### Orientation

| Document | Contents |
|---|---|
| [ARM support](arm.md) | Overview, scope, decisions, numbers, reading guide |
| [FAQ](arm-faq.md) | Short answers to common questions |
| [Roadmap and risks](arm-roadmap.md) | Phases, acceptance criteria, ADRs, risks, open questions |

### Upstream and analysis

| Document | Contents |
|---|---|
| [Arch Linux ARM](arm-alarm.md) | Repositories, mirrors, signing, tarballs, kernels, bootloaders, build tooling |
| [Current audit](arm-audit.md) | Repo-by-repo x86_64 hardcodes with file and line references |
| [Packages](arm-packages.md) | Full 143-package matrix, removals, replacements and additions |
| [Package verification](arm-package-verification.md) | Availability, buildability, ELF checks and evidence records |
| [Hardware matrix](arm-hardware-matrix.md) | Supported platforms, firmware quirks, validation tiers |

### Implementation

| Document | Contents |
|---|---|
| [Implementation plan](arm-implementation.md) | PR sequence, exact files, tests, acceptance and rollback |
| [archiso port](arm-archiso.md) | Profile changes, UEFI boot modes, GRUB/systemd-boot, squashfs, build strategies |
| [Installer](arm-installer.md) | `install.sh`, keyrings, ESP, bootloader targets and firmware paths |
| [Generations](arm-generations.md) | `xgen`, `xkernel`, kernel discovery, boot entries and multi-kernel limits |
| [Tooling and repository](arm-tooling.md) | `xpkg`, `xpm`, `x-repo`, multi-architecture layout and publishing |
| [Proposed snippets](arm-snippets.md) | Unapplied profile, pacman, package list, installer, QEMU and CI examples |

### Operations

| Document | Contents |
|---|---|
| [Build runbook](arm-runbook-build.md) | Native build, verification, artefacts, troubleshooting |
| [Install runbook](arm-runbook-install.md) | Disk layouts, installer flow, manual fallback, recovery |
| [Release runbook](arm-runbook-release.md) | Signing, repository publication, SourceForge, metadata, rollback |
| [Debug runbook](arm-runbook-debug.md) | Firmware, GRUB, kernel, initramfs, systemd, QEMU debug, recovery |
| [Checklists](arm-checklists.md) | Decision, build, install, release, security and hardware checklists |

### Quality and governance

| Document | Contents |
|---|---|
| [Testing and CI](arm-testing.md) | QEMU `virt`, `edk2-aarch64`, e2e harness changes, ARM runners |
| [Test plan](arm-test-plan.md) | Test levels, IDs, matrix, evidence and exit criteria |
| [Security](arm-security.md) | Trust chain, keys, supply chain, Secure Boot, incident response |
| [Devices and platforms](arm-devices.md) | `armv7h`, Raspberry Pi, U-Boot, SBCs, Asahi, WSL |
| [References](arm-references.md) | Numbered bibliography, versions, verification commands, citation map |

## Repository convention

All paths in this section are relative to the `equislinux` workspace:

- `x/`, `scripts/`, `xpkg/`, `xpm/`, `x-repo/`, `wiki/`, `web/`, `wsl/`, `ops/`.
- The ARM reference set lives in `references/` inside the `xlnux-arm` skill pack. The X project may mirror it later; until then, this pack is the source of truth.

## Verification baseline

The claims in this section were checked with the following sources and commands. See [ARM references](arm-references.md) for the full list.

```bash
# ALARM repository databases
for r in core extra alarm aur; do
  curl -fsSL "http://mirror.archlinuxarm.org/aarch64/$r/$r.db.tar.gz" -o "/tmp/$r.db.tar.gz"
done

# Kernel layout
curl -fsSL http://mirror.archlinuxarm.org/aarch64/core/linux-aarch64-7.2.11-1-aarch64.pkg.tar.xz \
  | tar -tf - | grep -E '^boot/|mkinitcpio.d|pkgbase'

# GRUB and systemd-boot targets
curl -fsSL 'http://mirror.archlinuxarm.org/aarch64/core/grub-2%3A2.16-1-aarch64.pkg.tar.xz' \
  | tar -tf - | grep arm64-efi
curl -fsSL http://mirror.archlinuxarm.org/aarch64/core/systemd-262.1-1-aarch64.pkg.tar.xz \
  | tar -tf - | grep systemd-bootaa64
```

## Constraints

- No commits or pushes were made while producing this documentation.
- The `equislinux` worktrees are clean; only the documentation files described here are added for review.
- Nothing in this section changes x86_64 behaviour until the proposed changes are implemented and tested.

## References

- Central bibliography and source-to-claim map: [ARM references](arm-references.md).
- ALARM: https://archlinuxarm.org/about, https://archlinuxarm.org/about/package-signing, https://archlinuxarm.org/about/downloads.
- archiso: https://github.com/archlinux/archiso.
- QEMU ARM virt: https://www.qemu.org/docs/master/system/arm/virt.html.
- U-Boot: https://docs.u-boot.org/en/latest/usage/cmd/booti.html, https://docs.u-boot.org/en/latest/develop/distro.html.
- UAPI Boot Loader Specification: https://uapi-group.org/specifications/specs/boot_loader_specification/.
- GitHub-hosted ARM runners: https://docs.github.com/en/actions/reference/runners/github-hosted-runners.
