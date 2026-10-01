---
name: distro-boot
description: Deep reference for the 2026 Arch boot stack in distro/ISO work: GRUB 2.16, systemd-boot (systemd 262), Limine 12.9, rEFInd, syslinux status, mkinitcpio 42, dracut/booster, Unified Kernel Images, Secure Boot (sbctl/shim/preloader), TPM2/PCRs, LUKS, snapper and hibernation. Use when configuring bootloaders or initramfs, building UKIs, signing boot artifacts, or debugging boot/TPM issues.
---

# Distro boot stack Reference (October 2026)

## Version board

| Component | Version |
|---|---|
| GRUB | 2:2.16-1 (2026-09-22); upstream at `gnu-grub.freedesktop.org` |
| systemd / systemd-boot / ukify | 262-1 (2026-09-22) |
| Limine | 12.9.1-1 (2026-09-27) |
| rEFInd | 0.14.2-3 |
| syslinux | 6.04.pre3 snapshot; upstream frozen at 6.03 (2014); BIOS only, no real SB |
| mkinitcpio | 42.1-1 (42.2 in testing) |
| dracut | 111-1 (flagged out-of-date since 2026-08-02) |
| booster | 0.13-1 |
| sbctl | 0.18-2 |
| linux-firmware | 20260916-1 (split since 2025-06-13) |

## Critical realities

- **systemd-boot** is the archiso releng default for UEFI; zero extra packages, autodetects UKIs in `EFI/Linux/`.
- **mkinitcpio 42 changed PCRs 0-7, 9, 12-14** (systemd-pcrosseparator): re-enroll TPM2 LUKS after upgrading (Arch news 2026-09-22).
- mkinitcpio default hooks are **systemd-based** since v40 and fallback initramfs generation is off for new installs. archiso releng still uses busybox hooks deliberately.
- NvPCRs require signed PCR policies **inside the UKI** (systemd 262); only `ukify` produces compliant UKIs today.
- `grub-btrfs-overlayfs` is busybox-only → incompatible with systemd initramfs; use Limine + `limine-snapper-sync` for bootable snapshots.
- Official Arch ISOs have no Secure Boot support; GRUB is built `--disable-shim-lock` so ISOs can be repacked/signed.
- `linux-firmware` is a meta-package; list subpackages explicitly.

## Reference files

- `references/bootloaders.md` — GRUB, systemd-boot, Limine, rEFInd, syslinux: features, install, menus, pitfalls.
- `references/initramfs-uki.md` — mkinitcpio/dracut/booster, hooks/presets, UKI creation with ukify, microcode, hibernation.
- `references/secureboot.md` — shim/PreLoader/sbctl matrix, signing workflow, PCR/TPM2 details, Ventoy CA.

## Primary sources

- `https://wiki.archlinux.org/title/Arch_boot_process`, `/GRUB`, `/Systemd-boot`, `/Limine`, `/REFInd`, `/Syslinux`
- `https://wiki.archlinux.org/title/Mkinitcpio`, `/Dracut`, `/Booster`, `/Unified_kernel_image`
- `https://wiki.archlinux.org/title/Secure_Boot`, `/Systemd-cryptenroll`, `/Trusted_Platform_Module`
- `https://github.com/Foxboron/sbctl`, `https://github.com/systemd/systemd/releases/tag/v262`
- `https://wiki.archlinux.org/title/Linux_firmware`, `/Snapper`, `/Btrfs`, `/Hibernation`, `/Zram`
