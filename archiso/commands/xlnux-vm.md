---
description: Build the X Linux ISO and run the QEMU end-to-end installer validation
agent: xlnux-installer
---

Build and validate the X Linux ISO end-to-end, current as of October 2026.

1. Build (from `/home/x/Documents/repos/equislinux/x`):
   ```bash
   sudo ./xbuild.sh
   ```
   Verify `out/x-YYYY.MM.DD-x86_64.iso` + `.sha256` exist and the log has no pacstrap/mkarchiso errors (the `x: missing required signature` line in the pkglist step is benign).
2. Preferred: harness from `x/`:
   ```bash
   python3 tests/e2e-autoinstall.py --mode uefi
   python3 tests/e2e-autoinstall.py --mode bios --profile full --hyprland
   # options: --bootloader systemd-boot --kernel linux-lts --multikernel --encryption yes --agents
   ```
   It builds cidata, boots the ISO with `xauto=1`, installs and reboots automatically.
3. Assertions (harness + serial):
   - install rc=0; `/var/lib/x/current` and boot entry `0001`; `x gen status`/`verify` clean;
   - installing a package creates newer generations; **the newest is the default**; reboot lands in it; no `db.lck`;
   - bootloader entries + `x-rescue` present (and both kernels with `--multikernel`).
4. Manual alternative: `x/vm.sh --seed` with `xauto=1` appended to the kernel cmdline; inspect via `x/vm.sh --boot disk`.
5. When touching storage/boot: run the LUKS (`--encryption yes`), dualboot and systemd-boot variants.
6. Report: build log tail, QEMU command, serial excerpts, `x gen` outputs, failures with root cause, and remaining blockers.

$ARGUMENTS
