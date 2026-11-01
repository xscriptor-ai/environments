# ARM checklists

Purpose: short, copyable checklists for each phase. Use them in PR descriptions, release notes and incident reports.

## Decision checklist

- [ ] v1 target is aarch64.
- [ ] v1 firmware is UEFI.
- [ ] Default bootloader chosen (GRUB recommended).
- [ ] systemd-boot included or explicitly deferred.
- [ ] Build strategy chosen (native ARM recommended).
- [ ] Repository layout approved (`repo/<arch>`, `x/<arch>`).
- [ ] Signing key policy approved (shared key recommended).
- [ ] Release metadata schema approved.
- [ ] Out-of-scope list approved (armv7h, RPi, SBC, Asahi, WSL ARM, Secure Boot).
- [ ] Hardware access confirmed.

## Pre-flight checklist

- [ ] ARM host, VM or runner available.
- [ ] `uname -m` is aarch64 on the build host.
- [ ] `archlinuxarm-keyring` installed.
- [ ] `archiso` installed from source or packaged.
- [ ] aarch64 GRUB with `/usr/lib/grub/arm64-efi`.
- [ ] `mkinitcpio-archiso` installed.
- [ ] `qemu-system-aarch64` and `edk2-aarch64` on the test host.
- [ ] 25 GiB free disk.
- [ ] Network access to ALARM and the X repository.
- [ ] X repository public key available.

## Manifest checklist

- [ ] `packages.aarch64` exists.
- [ ] `bootstrap_packages.aarch64` exists.
- [ ] `x/airootfs/root/x-installer/packages.aarch64` exists.
- [ ] `linux-aarch64` and headers are present.
- [ ] `grub` and `efibootmgr` are present.
- [ ] `archlinuxarm-keyring` and `pacman-mirrorlist` are present.
- [ ] `syslinux`, `memtest86+`, `rEFInd`, `edk2-shell` are absent.
- [ ] `intel-ucode`, `amd-ucode` are absent.
- [ ] `reflector` is absent.
- [ ] `hyperv`, `open-vm-tools`, `virtualbox-guest-utils-nox` are absent.
- [ ] X packages are either published for ARM or removed.

## Profile checklist

- [ ] `arch="aarch64"`.
- [ ] `packages_file="packages.aarch64"`.
- [ ] `pacman_conf="pacman.aarch64.conf"`.
- [ ] `bootmodes=('uefi.grub')` or `('uefi.systemd-boot')`.
- [ ] `-Xbcj arm64`.
- [ ] `work/$ARCH` used by the build scripts.
- [ ] ALARM mirrorlist in the live environment.
- [ ] `[x]` uses `$arch`.
- [ ] `microcode` hook removed on ARM.
- [ ] `syslinux/` excluded from the ARM profile.

## Build checklist

- [ ] Clean `work/` and stale mounts.
- [ ] `SOURCE_DATE_EPOCH` set.
- [ ] `X_ARCH=aarch64`.
- [ ] Keyring populated.
- [ ] `mkarchiso` completes.
- [ ] ISO exists.
- [ ] SHA-256 recorded.
- [ ] Build log archived.
- [ ] Package versions recorded.

## ISO verification checklist

- [ ] `file` recognizes the ISO.
- [ ] `xorriso -report_el_torito` shows an EFI entry.
- [ ] `EFI/BOOT/BOOTAA64.EFI` exists.
- [ ] `arch/aarch64/airootfs.sfs` exists.
- [ ] `/boot/Image` exists in the squashfs.
- [ ] `initramfs-linux.img` exists.
- [ ] `uname -m` inside the live ISO is aarch64.
- [ ] Serial console works with `console=ttyAMA0`.

## Installation checklist

- [ ] ESP created or reused.
- [ ] ESP is FAT.
- [ ] GPT partition table.
- [ ] btrfs subvolumes or ext4 root.
- [ ] `pacstrap` uses the ARM config.
- [ ] `archlinuxarm` keyring populated.
- [ ] X key trusted.
- [ ] User and sudo configured.
- [ ] initramfs generated.
- [ ] GRUB `arm64-efi` or systemd-boot `AA64` installed.
- [ ] `BOOTAA64.EFI` fallback present.
- [ ] `efibootmgr` entry present.
- [ ] Generation `0001` created.

## Bootloader checklist

- [ ] `/boot` is the ESP.
- [ ] `BOOTAA64.EFI` exists.
- [ ] `grubaa64.efi` or `systemd-bootaa64.efi` exists.
- [ ] Kernel path points to `Image` or a valid symlink.
- [ ] Initramfs path is correct.
- [ ] `root=` UUID is correct.
- [ ] `rootflags=subvol=@` if btrfs.
- [ ] `console=ttyAMA0` for QEMU.
- [ ] Secure Boot state documented.

## Generation checklist

- [ ] `x gen status` healthy.
- [ ] `x gen list` shows the generations.
- [ ] `x gen new` creates a generation.
- [ ] Kernel and initramfs archived.
- [ ] Entry written to systemd-boot or GRUB.
- [ ] `x gen rollback` works.
- [ ] `x gen verify` passes.
- [ ] ESP has free space.
- [ ] Old kernels pruned or retained by policy.

## Repository checklist

- [ ] `public/repo/aarch64` exists.
- [ ] `public/x/aarch64` exists.
- [ ] `x.db` and `x.db.sig` exist.
- [ ] Every package has a `.sig`.
- [ ] `SHA256SUMS` regenerated.
- [ ] `history.json` has `arch=aarch64`.
- [ ] `x-scripts` is present.
- [ ] No x86-only binary is published.
- [ ] `xpm sync` works.
- [ ] `pacman -Sy` works on a clean ALARM target.

## Release checklist

- [ ] All test gates pass.
- [ ] x86_64 is still green.
- [ ] ISO signed.
- [ ] SHA-256 published.
- [ ] Repository signed.
- [ ] SourceForge upload complete.
- [ ] `releases.json` updated.
- [ ] Website updated.
- [ ] Documentation updated.
- [ ] Limitations documented.
- [ ] Announcement published.
- [ ] Post-release download verified.
- [ ] Rollback plan ready.

## Security checklist

- [ ] Private key offline.
- [ ] Revocation certificate separate.
- [ ] ALARM keyring populated.
- [ ] X key trusted in live and target.
- [ ] `SigLevel = Required` in the target.
- [ ] No secrets in git.
- [ ] `any` packages audited for x86 ELF.
- [ ] Cross-build outputs verified as AArch64.
- [ ] ISO signature verified.
- [ ] Secure Boot state documented.
- [ ] Live SSH state documented.

## Hardware bring-up checklist

- [ ] Firmware version recorded.
- [ ] Secure Boot state recorded.
- [ ] CPU and RAM recorded.
- [ ] Storage and network recorded.
- [ ] GPU and driver recorded.
- [ ] USB boot works.
- [ ] Installer completes.
- [ ] Target boots.
- [ ] Generations work.
- [ ] Network works.
- [ ] Update works.
- [ ] Suspend/resume, if applicable.
- [ ] Serial console, if applicable.

## Rollback checklist

- [ ] Stop the release.
- [ ] Restore `latest_by_arch`.
- [ ] Keep the previous ISO available.
- [ ] Restore the previous repository state if needed.
- [ ] Verify the previous ISO boots.
- [ ] Publish an incident note.
- [ ] Add a regression test.
- [ ] Rotate keys only if compromise is suspected.

## Sign-off template

```text
ARM release sign-off

Version:
Architecture: aarch64
ISO SHA-256:
ISO signature: verified
Repository: [x]/aarch64
Repository signature: verified
QEMU e2e: pass
Hardware: <machine>, <firmware>
Generations: pass
Rollback: pass
x86_64 regression: pass
Known limitations:
Approved by:
Date:
```

## References

- [Implementation plan](arm-implementation.md)
- [Build runbook](arm-runbook-build.md)
- [Install runbook](arm-runbook-install.md)
- [Release runbook](arm-runbook-release.md)
- [Test plan](arm-test-plan.md)
- [Security](arm-security.md)
