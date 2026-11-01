# ARM FAQ

Short answers to the questions that come up when planning the ARM port.

## Does X support ARM today?

No. X Linux is x86_64-only. There is no ARM ISO, repository, binary or CI job. This section is the plan to change that.

## Why not use Arch Linux x86_64 packages?

ARM cannot execute x86_64 binaries. The base must be Arch Linux ARM, which rebuilds the Arch packages for `aarch64` and `armv7h`.

## Why Arch Linux ARM and not Manjaro ARM or EndeavourOS ARM?

ALARM is the official Arch port and matches X's model: upstream packages, minimal changes, Arch tooling. Manjaro ARM and EndeavourOS ARM are derivatives built on ALARM; they add their own layers and policy.

## Why is there no ARM ISO from ALARM?

ALARM ships rootfs tarballs and board images, not ISOs. Board boot is too diverse for a single ISO. X must build its own ISO.

## Why is `archiso` not in ALARM?

The ALARM build infrastructure does not package it. The upstream `archiso` scripts already support aarch64, so X can install them from source or package them locally.

## Why is there no `linux` package?

ALARM's generic kernel is `linux-aarch64`. It provides the virtual `linux` dependency, but there is no package named `linux`. The installer must use `linux-aarch64` explicitly.

## Why does `linux-aarch64` not have a `pkgbase` file?

The ALARM package does not install `/usr/lib/modules/<release>/pkgbase`. X must fall back to `pacman -Qoq /boot/Image` or a release-name heuristic.

## Why is the kernel called `Image`?

The AArch64 Linux kernel builds an `Image` (and `Image.gz`). It is not `vmlinuz-*`. Some ARM systems boot it directly through the EFI stub; others use GRUB, systemd-boot or U-Boot.

## Why do we need symlinks?

X's existing generation and boot code expects `vmlinuz-<pkgbase>` and `initramfs-<pkgbase>.img`. Symlinks provide compatibility for v1. The long-term fix is a native kernel map.

## Why UEFI only?

ARM has no BIOS. SBCs use firmware or U-Boot, which are board-specific. Servers and QEMU use UEFI. A single ISO can reasonably target UEFI; SBC support is a separate image product.

## Why not support Raspberry Pi in v1?

Raspberry Pi does not boot an ISO. It needs a FAT boot partition, `config.txt`, `cmdline.txt`, `kernel8.img`, DTBs and firmware. That is a separate image builder and hardware test matrix.

## Why not support armv7h?

It is a second userland, toolchain and boot path with lower demand. It is deferred until aarch64 is stable and there is hardware to test.

## Why not support Apple Silicon?

Asahi is a separate platform stack: m1n1, U-Boot, a custom kernel and drivers, and community repositories. It is not official ALARM and carries a high risk of breaking the machine.

## Why not support WSL ARM in v1?

WSL on Windows ARM64 needs an aarch64 rootfs and a separate validation path. It shares packaging work but not the ISO/installer work.

## What about Secure Boot?

archiso does not sign or enroll Secure Boot. ARM Secure Boot is not universal. v1 documents that it is unsupported; a future version can use a shim or custom keys.

## Can I cross-build the ISO on x86_64?

Yes, with binfmt and an ALARM aarch64 rootfs, but it is slow and fragile. Native ARM is the supported path.

## How long does the build take?

Native 8-core ARM: roughly 15-40 minutes for the ISO. TCG cross-build: hours. Install in QEMU KVM: minutes.

## Will Hyprland work on ARM?

It depends on the GPU and Mesa driver. Raspberry Pi and some SBCs have working acceleration; servers usually do not. v1 should support `core` broadly and `full` only on tested hardware.

## Is the ARM repository separate from x86_64?

Yes: `public/repo/aarch64` and `public/x/aarch64`. The signing key can be shared. `$arch` resolves the correct path.

## Will the x86_64 build break?

No, if every change is conditional. The implementation plan requires x86_64 tests to stay green after each PR.

## How do I verify an ALARM package?

Download the package and its `.sig`, import the ALARM keyring, and run `gpg --verify`. The databases are not signed, but every package is.

## How do I know a package is really ARM?

```bash
file /path/to/binary
readelf -h /path/to/binary | grep Machine
```

Expected: `AArch64`. For packages marked `any`, audit for unexpected binaries.

## What is the first thing to implement?

The architecture-aware profile and manifests (PR-02), then the multi-architecture repository (PR-03). The installer depends on both.

## What is the biggest risk?

The kernel and boot layout mismatch: `Image`, `initramfs-linux.img`, no `pkgbase`, and two kernels sharing the same initramfs name. It touches the installer, generations and boot entries.

## What is the second biggest risk?

The lack of a native ARM runner for CI. Without it, ARM builds are slow and unreliable.

## How can I contribute?

Pick a phase from [Implementation plan](arm-implementation.md), open an issue with the phase ID, and keep the x86_64 tests green. Do not mix platforms in one PR.

## References

- [ARM overview](arm.md)
- [Implementation plan](arm-implementation.md)
- [ALARM reference](arm-alarm.md)
- [Package matrix](arm-packages.md)
- `arm-references.md` for primary sources
