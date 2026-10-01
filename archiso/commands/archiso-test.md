---
description: Boot a built ISO in headless QEMU (UEFI/BIOS) and assert it reaches userspace
agent: archiso-testing
---

Smoke-test an ISO in QEMU, headless and assertively, current as of October 2026.

1. Input: ISO path (out/*.iso). Ensure `qemu-desktop`/`qemu-base` and `edk2-ovmf` are installed.
2. UEFI run (default):
   ```sh
   cp /usr/share/edk2/x64/OVMF_VARS.4m.fd /tmp/vars.fd
   timeout 900 qemu-system-x86_64 -machine q35,smm=on -cpu max -smp 4 -m 3072 \
     -drive if=pflash,format=raw,unit=0,readonly=on,file=/usr/share/edk2/x64/OVMF_CODE.secboot.4m.fd \
     -drive if=pflash,format=raw,unit=1,file=/tmp/vars.fd \
     -drive file=<iso>,media=cdrom,readonly=on \
     -netdev user,id=n0,hostfwd=tcp::60022-:22 -device virtio-net,netdev=n0 \
     -display none -serial file:/tmp/serial.log -no-reboot
   ```
3. Assert: serial log reaches a login prompt or `Reached target`; if the ISO ships sshd + keys, `ssh -p 60022 root@localhost` and run `systemctl is-system-running`.
4. BIOS run with `run_archiso -b -i <iso>` when `bios.syslinux` is enabled; Secure Boot firmware check with `run_archiso -s`.
5. Optional: two-disk install test — boot ISO + blank target, drive Calamares/archinstall non-interactively, reboot target only, assert login.
6. Report: serial log tail, boot result per firmware, failures observed (kernel panic, initramfs drop, GRUB rescue, black screen).

$ARGUMENTS
