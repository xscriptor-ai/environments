# Initramfs and Unified Kernel Images (2026)

## mkinitcpio 42

- Config keys `MODULES`, `BINARIES`, `FILES`, `HOOKS`, `COMPRESSION`, `COMPRESSION_OPTIONS`, `MODULES_DECOMPRESS`; drop-ins `/etc/mkinitcpio.conf.d/`; presets `/etc/mkinitcpio.d/*.preset`.
- Preset keys: `PRESETS`, `ALL_kver`, `<preset>_{kver,config,image,uki,cmdline,splash,kerneldest,options}`.
- Default hooks (2026): `base systemd autodetect microcode modconf kms keyboard sd-vconsole block filesystems fsck`.
- v38: `microcode` hook replaces external ucode images; systemd/udev/encrypt/sd-encrypt/lvm2/mdadm_udev hooks moved in-tree.
- v39: early uncompressed CPIO (microcode), `getarg`, UKI via `ukify`, `MODULES_DECOMPRESS` covers firmware, `add_file_early`.
- v40: systemd hooks default; fallback image off; `sd-verity`, `sd-volatile`, `sd-encrypt-opensc`; UKIs not written executable; zstd.
- v41: `--include` files/dirs; `--cmdline <dir>`; dropped `keymap` from defaults.
- v42: busybox mounts root at `/sysroot`; `/etc/crypttab.initramfs` deprecated for `x-initrd.attach`; `systemd-pcrosseparator` (PCR changes!); 42.1 auto-creates `ESP/EFI/Linux`, PCR 15 measurement; 42.2 NvPCR services.

Commands:

```sh
mkinitcpio -P                    # all presets
mkinitcpio -p linux              # one preset
lsinitcpio /boot/initramfs-linux.img
mkinitcpio --cmdline /etc/cmdline.d   # v41+
```

archiso releng overrides with busybox hooks in `airootfs/etc/mkinitcpio.conf.d/archiso.conf`:

```
HOOKS=(base udev microcode modconf kms memdisk archiso archiso_loop_mnt
       archiso_pxe_common archiso_pxe_nbd archiso_pxe_http archiso_pxe_nfs
       block filesystems keyboard)
COMPRESSION="xz"
COMPRESSION_OPTIONS=(-9e)
```

## dracut / booster

- dracut 111 (OOD in Arch): `dracut -f --regenerate-all`; `--uefi`/`uefi=yes`; `--add resume`; embeds microcode; `dracut-ukify` (AUR) for signed UKIs. Choose only if you need its modularity.
- booster 0.13: fast tiny init, zstd; `modules_force_load` for early KMS; **no microcode embedding** (ship separate `intel-ucode.img`/`amd-ucode.img`); supports systemd-style TPM2/FIDO2 LUKS bindings.

## Microcode

- mkinitcpio `microcode` hook prepends early CPIO; no `initrd=/intel-ucode.img` needed.
- booster requires separate image; dracut embeds automatically.

## Unified Kernel Images

Single PE binary: kernel + initrd + cmdline + (optional) splash + (optional) PCR policy/signature. Layout: `esp/EFI/Linux/<name>.efi` (systemd-boot autodiscovers) or fallback `EFI/BOOT/BOOTX64.EFI`.

mkinitcpio preset:

```ini
ALL_config="/etc/mkinitcpio.conf"
ALL_kver="/boot/vmlinuz-linux"
PRESETS=('default')
default_uki="/efi/EFI/Linux/midistro-linux.efi"
default_options="--splash /usr/share/systemd/bootctl/splash-arch.bmp"
```

- Cmdline from `/etc/kernel/cmdline` or `/etc/cmdline.d/*.conf`; `ukify` used unless `--no-ukify`.
- 42.1 auto-creates `ESP/EFI/Linux`; post-hooks in `/etc/initcpio/post/` sign (sbctl ships one).
- Manual: `ukify build --linux=... --initrd=... --cmdline=...`; `ukify genkey`; `systemd-sbsign`.
- systemd 262: NvPCRs need all `/usr/lib/nvpcr/*.nvpcr` inside the UKI + a **signed initrd-phase PCR policy**; only `ukify` can do this (`[PCRSignature:all]`, `SignInitrdPCRs=yes`).
- Embedded `.cmdline` wins; under Secure Boot, bootloader/editor overrides are ignored.
- Boot paths: systemd-boot auto (`EFI/Linux/*.efi`); rEFInd auto (ignores `refind_linux.conf` opts for UKIs); Limine explicit `protocol: efi`; GRUB chainload; `efibootmgr --create --loader '\EFI\Linux\...'`.
- archiso: **no x86_64 UKI bootmode**; build one by adding a preset into airootfs and entries pointing to `/EFI/Linux/*.efi`. AArch64 gets `stubble`/DTB fusion (v91).

## ESP sizing and hibernation

- ESP ≥1 GiB; 4 GiB if stacking several kernels/snapshots (`limine-snapper-sync` recommends >4 GiB).
- Hibernation: needs swap ≥ RAM image; systemd initramfs needs no extra hook; busybox needs `resume` after `udev`/`encrypt`/`lvm2`; swapfile needs `resume_offset` (ext4 `filefrag`, btrfs `btrfs inspect-internal map-swapfile -r`); UEFI systemd-sleep sets `HibernateLocation`; zram cannot hibernate; `linux-hardened`/lockdown forbids it.
