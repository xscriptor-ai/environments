# archiso bootmodes (v91)

## Valid modes

| Mode | Firmware | Profile files | Notes |
|---|---|---|---|
| `bios.syslinux` | BIOS (El Torito + isohybrid MBR) | `syslinux/*.cfg` | skipped on non-x86 (v90); needs `syslinux` pkg |
| `uefi.systemd-boot` | UEFI x64 + IA32 mixed | `efiboot/loader/loader.conf` + entries | preferred; kernel/initrd copied into ESP |
| `uefi.grub` | UEFI (+IA32 mixed if available) | `grub/grub.cfg` | embedded search + `grub-mkstandalone --disable-shim-lock --sbat` |

- UEFI modes mutually exclusive; `bios.*` combinable.
- Deprecated remaps (v86): `bios.syslinux.{eltorito,mbr}` → `bios.syslinux`; `uefi-x64|uefi-ia32.systemd-boot.{esp,eltorito}` → `uefi.systemd-boot`; same for grub.
- Multi-arch UEFI since v87 (aarch64/riscv64/loongarch64); no cross-building.

## Templates

- `%ARCHISO_LABEL%`, `%INSTALL_DIR%`, `%ARCH%`, `%KERNEL_PARAMS%`.
- GRUB: `%ARCHISO_UUID%`, `%ARCHISO_SEARCH_FILENAME%`.
- `%ARCH%` valid in syslinux `.cfg` and systemd-boot entries (not `loader.conf`).

## syslinux (BIOS)

- All `syslinux/*.cfg` templated to `iso/boot/syslinux/`; `.c32`, `isolinux.bin`, `isohdpfx.bin`, `memdisk` copied from package.
- El Torito options: `-eltorito-boot boot/syslinux/isolinux.bin -no-emul-boot -boot-load-size 4 -boot-info-table -isohybrid-mbr .../isohdpfx.bin --mbr-force-bootable -partition_offset 16`.
- memtest86+ `.bin` → `/boot/memtest86+/memtest`.
- Upstream syslinux is frozen (6.03, 2014); Arch ships a 6.04-pre3 snapshot. No proper Secure Boot support. Increasingly legacy-only.

## systemd-boot (UEFI, recommended)

- `loader.conf` + templated `entries/*.conf` → `iso/loader`; `systemd-bootx64.efi` → `EFI/BOOT/BOOTX64.EFI` (+ `BOOTIA32.EFI`).
- Kernel, initramfs, microcode, `memtest86+.efi` and the loader tree are copied into `efiboot.img` (systemd-boot reads only its own ESP).
- Foreign-architecture entries skipped; IA32 kept.
- releng entries: `01-archiso-linux.conf`, `02-archiso-speech-linux.conf`, `03-archiso-memtest86+x64.conf`; `loader.conf` timeout 15.

Example entry:

```ini
title   Midistro Linux
linux   /vmlinuz-linux
initrd  /initramfs-linux.img
options archisosearchuuid=%ARCHISO_UUID% cow_spacesize=4G quiet
```

## GRUB (UEFI)

- `grub/*.cfg` templated to `work/grub`; embedded `grub-embed.cfg` searches by `%ARCHISO_SEARCH_FILENAME%` (`/boot/<iso_uuid>.uuid`) then `configfile /boot/grub/grub.cfg`.
- `grub-mkstandalone` builds BOOTX64.EFI/BOOTIA32.EFI; UEFI shell + x64 memtest copied.
- Built with `--disable-shim-lock` so custom Secure Boot signing is possible.
- GRUB is the only mainstream loader able to unlock encrypted `/boot` (`GRUB_ENABLE_CRYPTODISK=y`) and chainload UKIs.

## ESP image

- `mkfs.fat`, label `ARCHISO_EFI`, size = FAT payload + 8 MiB, rounded to MiB, FAT32 when ≥36 MiB (v78).
- Attached as partition 2 (type GUID `C12A7328-...`) via `-append_partition`; booted with `-eltorito-alt-boot -e --interval:appended_partition_2:all:: -no-emul-boot`; GPT hybrid options depend on BIOS mode.

## CoW / persistence boot params (mkinitcpio-archiso)

| Param | Meaning |
|---|---|
| `cow_spacesize=4G` | tmpfs size for live writes (default 256M) |
| `cow_label` / `cow_device` / `cow_flags` | backing device for persistent overlay (btrfs subvols) |
| `cow_directory` | default `/persistent_${archisolabel}/${arch}` |
| `cow_persistent=P\|N` | dm-snapshot only; ignored by overlayfs |
| `copytoram=auto` | copy medium to RAM |
| `archisosearchuuid=UUID` | locate medium (since v77; replaced `archisodevice`) |
| `checksum=y` | verify `airootfs.sha512` |
| `cms_verify=y` | CMS signature verification (netboot/rootfs) |

## Netboot artifacts (`-m netboot`)

- Tree under `out/<install_dir>/`: kernel, initramfs, `airootfs.sfs`, `airootfs.sha512`, `pkglist.<arch>.txt`.
- PXE configs from `syslinux/`/`grub/` variants; archiso supports `archiso_http_srv=`, `archiso_pxe_nbd`, `archiso_pxe_http`, `archiso_pxe_nfs`.
- Optional signing: `-g` PGP rootfs, `-c cert key ca` CMS netboot/iPXE (CA embedded in iPXE binaries).
- Official Arch netboot: https://archlinux.org/releng/netboot/ (always latest).

## Testing

```sh
run_archiso -i out/*.iso        # UEFI (default since v86)
run_archiso -b -i out/*.iso     # BIOS
run_archiso -s -i out/*.iso     # Secure Boot test (test-only; not real SB support)
```

Secure Boot for production ISOs is *not* provided by archiso (see `distro-boot` skill, secureboot.md).
