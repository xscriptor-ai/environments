---
description: Diagnose an archiso build or boot failure with a systematic triage
agent: archiso-troubleshooting
---

Diagnose an Arch ISO build/boot problem, current as of October 2026 (archiso 91).

1. Gather: exact mkarchiso command + log tail; ISO checksum/size; QEMU/run_archiso command; firmware (BIOS/UEFI/Secure Boot); serial log; profile `profiledef.sh`, `packages.x86_64`, recent airootfs changes.
2. Triage in order: build → boot → userspace → install → installed system. Do not jump to conclusions.
3. Build failures checklist:
   - `install_dir` validation (`[a-z0-9]`, ≤30).
   - keyring/signature (`pacman -Sy archlinux-keyring`; lsign local repo keys).
   - local repo permissions (`chown :alpm -R`, `+x` dirs).
   - stale mount binds after interrupt (`findmnt -R work`) before cleaning with `unshare --map-auto --map-root-user -- rm -rf work`.
   - container builds need user namespaces/`--privileged` for some image types.
4. Boot failures checklist:
   - UEFI: inspect `work/efiboot.img` loader entries and kernel/initrd presence.
   - GRUB rescue: `%ARCHISO_UUID%` vs real volume UUID, `/boot/<uuid>.uuid`.
   - BIOS: syslinux/isohybrid issues (frozen 6.04-pre3).
   - kernel panic: `archisosearchuuid` mismatch; netboot params.
   - black screen: missing KMS/GPU drivers/firmware.
   - CoW full: `cow_spacesize=4G`.
   - Secure Boot: expected failure unless shim/PreLoader/custom keys.
5. Installed-system failures: initramfs built in live env, fstab UUIDs, bootloader entries, ESP mounting.
6. Deliver: root cause, minimal fix, verification command, and which agent to escalate to.

$ARGUMENTS
