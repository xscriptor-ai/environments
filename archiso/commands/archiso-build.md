---
description: Build an archiso profile and run static validation plus checksum generation
agent: archiso-build
---

Build an Arch ISO from a profile and validate the artifacts, current as of October 2026 (archiso 91).

1. Locate the profile (argument or `profiles/*`). Confirm `profiledef.sh` has valid bootmodes (`bios.syslinux`, `uefi.systemd-boot`, `uefi.grub`) and `install_dir` `[a-z0-9]` ≤30.
2. Build:
   ```sh
   mkarchiso -v -r -w /tmp/archiso-work -o out -m "iso" <profile>
   ```
   Add `netboot`/`bootstrap` modes if requested. As root, prefer running as a regular user (archiso v89+ supports `unshare`).
3. Static validation:
   ```sh
   xorriso -indev out/*.iso -report_el_torito plain
   unsquashfs -l /tmp/archiso-work/iso/*/x86_64/airootfs.sfs | head -50
   mcopy -i /tmp/archiso-work/efiboot.img ::/loader/entries/ -   # when systemd-boot
   ```
4. Generate checksums: `sha256sum` + `b2sum` into `out/sha256sums.txt` / `out/b2sums.txt`.
5. If signing keys are available: `gpg --detach-sign --local-user <key> out/*.iso` and sign the checksums.
6. Report: ISO path, size, kernel version, package count (`grep -c . <profile>/packages.x86_64` plus custom repo), validation output, and next step (`/archiso-test`).

$ARGUMENTS
