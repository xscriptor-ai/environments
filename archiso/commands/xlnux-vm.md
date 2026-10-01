---
description: Build the X Linux ISO and run the QEMU end-to-end installer validation (xauto=1)
agent: xlnux-installer
---

Build and validate the X Linux ISO end-to-end, current as of October 2026.

1. Build (from `/home/x/Documents/repos/xlnux/x`):
   ```bash
   sudo ./xbuild.sh
   ```
   Verify `out/x-YYYY.MM.DD-x86_64.iso` exists and the log has no pacstrap/mkarchiso errors.
2. VM unattended install (KVM/OVMF as needed):
   ```bash
   x/vm.sh --seed            # uses ./x-install.json -> cidata; add xauto=1 in the boot menu
   ```
   In the boot menu append `xauto=1` to the kernel cmdline (grub/syslinux). Watch the serial/console.
3. Assertions after install + reboot (`x/vm.sh --boot disk`):
   - installer completed without warnings (especially no "first generation could not be created");
   - `x gen list` shows `0001`; `x gen status` sane; `x gen verify` clean;
   - `x gen new --label test` + `x gen rollback 0001` + reboot round-trip;
   - GRUB entries and (if chosen) systemd-boot entries exist; `x-rescue` present.
4. If the bundled payload lacks `x gen` (known issue P0): rebuild `x-scripts` (bump pkgrel), replace `airootfs/root/x-installer/packages/`, re-run.
5. Test the other bootloader and the LUKS variant once the baseline passes.
6. Report: build log tail, VM command, serial excerpts, `x gen` outputs, failures with root cause, and remaining blockers.

$ARGUMENTS
