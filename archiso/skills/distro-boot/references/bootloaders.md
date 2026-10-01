# Bootloaders (2026)

## Comparison

| Loader | Firmware | FS | Secure Boot | UKI autodetect | Notes |
|---|---|---|---|---|---|
| GRUB 2.16 | BIOS+UEFI | many, LUKS/LVM/RAID | shim/preloader/custom | chainload only | only loader for encrypted `/boot` |
| systemd-boot | UEFI only | ESP/XBOOTLDR FAT | own keys or shim | yes (`EFI/Linux/*.efi`) | ships with systemd; simple config |
| Limine 12.9 | BIOS+UEFI | FAT12/16/32 + ISO9660 | own keys | explicit entries | snapshot boot via `limine-snapper-sync` |
| rEFInd 0.14.2 | UEFI only | + bundled read-only ext4/btrfs | self-sign/shim | detects UKIs | no ISO loopboot |
| syslinux | BIOS (+partial UEFI) | limited | no | no | upstream dead; only legacy BIOS ISOs |

## GRUB

- Config `/boot/grub/grub.cfg`; scripts in `/etc/grub.d/`, defaults `/etc/default/grub`; regenerate `grub-mkconfig -o /boot/grub/grub.cfg`.
- BIOS install: `grub-install --target=i386-pc /dev/sdX`; UEFI: `--target=x86_64-efi --efi-directory=/boot/efi --bootloader-id=...`; hybrid removable: `--removable`.
- `grub-mkstandalone` for ISOs with embedded config + `--sbat=/usr/share/grub/sbat.csv`; archiso builds with `--disable-shim-lock`.
- GRUB 2.06.r261+ forbids `insmod` under Secure Boot → embed all modules you need.
- Chainload UKI: `chainloader /EFI/Linux/arch-linux.efi`.
- Snapshots: `grub-btrfs` daemon + `snap-pac-grub`; overlayfs hook is busybox-only (incompatible with systemd initramfs).

## systemd-boot

- Install: `bootctl install` / `--esp-path`; entries in `esp/loader/entries/*.conf`; `loader.conf` for default/timeout/editor.
- Auto-detects `EFI/Linux/*.efi` (UKIs), Windows, `shellx64.efi`, `bootx64.efi`; UEFI variables store boot entry/timeout.
- Only reads its own ESP/XBOOTLDR → for ISOs, kernel/initrd must be copied into `efiboot.img` (archiso does this).
- UKI options in `.cmdline` are authoritative; under Secure Boot, boot-entry overrides are ignored.
- systemd 262 added read-only ESP handling for random seed/boot counting.

## Limine

- `limine-install`-style setup via `limine` package hooks; config `limine.conf`; boot files must live on FAT/ISO9660.
- Explicit entries: `protocol: efi`, `path: boot():/EFI/Linux/...`.
- Ecosystem (AUR): `limine-entry-tool`, `limine-mkinitcpio-hook`, `limine-dracut-support`, `limine-snapper-sync` (bootable btrfs snapshots).
- Can embed a BLAKE2B checksum of `limine.conf` in the EFI binary (`limine enroll-config`) before signing.

## rEFInd

- `refind-install`, themes via `refind.conf`; auto-detects kernels/UKIs and bootloaders.
- Cannot boot ISO files (no loopback driver); good graphical multi-boot menu.
- Secure Boot: self-sign (`--localkeys`), shim, or PreLoader+HashTool.

## syslinux

- Arch still packages a 6.04-pre3 snapshot in core and archiso uses `bios.syslinux` for legacy BIOS.
- No real Secure Boot; deprecated EFI handover; FS feature drift; cannot read outside its partition. Use only if BIOS support is a hard requirement.

## ISO boot specifics

- GRUB embed (archiso): `grub-embed.cfg` searches `%ARCHISO_SEARCH_FILENAME%` (`/boot/<iso_uuid>.uuid`) then loads `/boot/grub/grub.cfg`.
- systemd-boot entry template:

```ini
title   Midistro Linux
linux   /vmlinuz-linux
initrd  /initramfs-linux.img
options archisosearchuuid=%ARCHISO_UUID% cow_spacesize=4G quiet
```

- Memtest86+: syslinux `.bin`, systemd-boot `memtest86+.efi`, GRUB chainload; archiso copies it to ISO and ESP.
- `run_archiso` tests UEFI by default (`-b` BIOS, `-s` SB firmware); pflash pair `OVMF_CODE.secboot.4m.fd` + writable `OVMF_VARS.4m.fd`.
