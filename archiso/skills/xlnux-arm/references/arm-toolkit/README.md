# ARM toolkit

Reference scripts for the ARM port. They are intentionally small and conservative. Review them before running; they do not modify repositories or the build system.

| Script | Purpose |
|---|---|
| `check-alarm.sh` | Download the ALARM aarch64 databases and verify package names and versions |
| `check-elf.sh` | Verify that a package or directory contains only AArch64 ELF binaries |
| `check-kernel-layout.sh` | Inspect the `linux-aarch64` or `linux-rpi` package boot layout |
| `verify-iso.sh` | Verify the EFI entry and required files in an aarch64 ISO |
| `qemu-aarch64.sh` | Boot an aarch64 ISO in QEMU `virt` with edk2 |
| `collect-logs.sh` | Collect host or target logs for a bug report |

## Requirements

- `bash`
- `curl`
- `bsdtar`
- `python3` (for `check-alarm.sh`)
- `xorriso` (for `verify-iso.sh`)
- `qemu-system-aarch64`, `qemu-img`, `edk2-aarch64` (for `qemu-aarch64.sh`)

## Examples

```bash
# Packages
./check-alarm.sh aarch64 linux-aarch64 linux-rpi grub systemd archlinuxarm-keyring

# ELF architecture
./check-elf.sh x-repo/public/repo/aarch64/x-release-*.pkg.tar.zst

# Kernel layout
./check-kernel-layout.sh /tmp/linux-aarch64-7.2.11-1-aarch64.pkg.tar.xz

# ISO
./verify-iso.sh x/out/x-2026.11.01-aarch64.iso

# QEMU
./qemu-aarch64.sh x/out/x-2026.11.01-aarch64.iso /tmp/x-aarch64.qcow2

# Logs
./collect-logs.sh
```

## Safety

- The scripts write to `/tmp` by default.
- They do not commit, push, install or modify the X repositories.
- `qemu-aarch64.sh` creates a qcow2 disk if it does not exist.
- `collect-logs.sh` can include sensitive data; review the archive before sharing.

## References

- `../arm-references.md`
- `../arm-runbook-build.md`
- `../arm-runbook-debug.md`
