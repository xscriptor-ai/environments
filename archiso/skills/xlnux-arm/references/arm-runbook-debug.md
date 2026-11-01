# Runbook: debug an aarch64 boot or install failure

Purpose: diagnose why an ARM ISO, installed system or generation does not boot, using serial console, firmware tools, QEMU debug options and the X logs.

## First response

Collect these before changing anything:

```bash
# Host
uname -m
qemu-system-aarch64 --version
pacman -Q edk2-aarch64 qemu-system-aarch64 grub systemd mkinitcpio

# Artefact
sha256sum out/x-*-aarch64.iso
xorriso -report_el_torito as_mkisofs out/x-*-aarch64.iso

# QEMU logs
ls -l /tmp/qemu-*.log /tmp/*serial*.log 2>/dev/null
```

Inside the live or installed system:

```bash
uname -a
cat /proc/cmdline
lsblk -f
blkid
efibootmgr -v
bootctl status 2>/dev/null || true
journalctl -b -p err
dmesg | tail -100
```

## Boot chain map

```text
UEFI firmware
  -> EFI/BOOT/BOOTAA64.EFI or NVRAM entry
    -> GRUB arm64-efi or systemd-boot AA64
      -> Image (kernel)
        -> initramfs-linux.img
          -> root filesystem
            -> systemd
              -> X services and x-scripts
```

A failure at any stage has different symptoms. Identify the last visible stage before changing configuration.

## Stage 1: firmware does not see the ISO

Symptoms:

- No boot menu.
- Firmware shell appears.
- "No bootable device".

Checks:

```bash
# ISO has an EFI boot image
xorriso -report_el_torito as_mkisofs out/x-*-aarch64.iso | grep -i -A2 efi

# ISO contains the fallback loader
bsdtar -tf out/x-*-aarch64.iso | grep EFI/BOOT/BOOTAA64.EFI
```

Fixes:

- Rebuild with `bootmodes=('uefi.grub')` and aarch64 GRUB.
- Ensure the ISO is written correctly to USB (not extracted).
- Use the firmware boot menu and select the USB device explicitly.
- Disable Secure Boot for v1 or enroll keys.
- Try the removable path `\EFI\BOOT\BOOTAA64.EFI`.

## Stage 2: GRUB does not appear

Symptoms:

- Firmware entry exists but boot returns to firmware.
- GRUB rescue prompt.
- "unknown filesystem".

Checks:

```bash
# From the live ISO
ls /boot/EFI/BOOT/BOOTAA64.EFI
ls /boot/EFI/x/grubaa64.efi
ls /boot/grub/
```

Fixes:

- Reinstall GRUB `arm64-efi`.
- Check the ESP is FAT and mounted at `/boot`.
- Check the `--bootloader-id` path.
- Use `--removable` as a fallback.
- Verify the NVRAM entry with `efibootmgr`.

GRUB rescue commands:

```grub
ls
set root=(hd0,gpt2)
set prefix=(hd0,gpt2)/boot/grub
insmod normal
normal
```

If `linux` or `initrd` modules are missing, reinstall `grub` and rerun `grub-install`.

## Stage 3: kernel does not start

Symptoms:

- GRUB loads but the screen goes black.
- "error: bad shim signature" (Secure Boot).
- "error: you need to load the kernel first".
- No serial output.

Checks:

- Kernel path in the entry: `/Image` or `/vmlinuz-linux-aarch64`.
- Initramfs path.
- `console=ttyAMA0` for QEMU.
- Kernel architecture: aarch64 Image, not x86 bzImage.

Fixes:

- Use `/Image` from `linux-aarch64`.
- Ensure the initramfs exists.
- Add `console=ttyAMA0,115200 earlycon=pl011,0x9000000` for QEMU.
- Remove x86-only kernel parameters.
- Ensure the firmware is not enforcing Secure Boot.

## Stage 4: kernel panic or root not found

Symptoms:

- "VFS: Unable to mount root fs".
- "No filesystem could mount root".
- "Kernel panic - not syncing".
- Drops to an initramfs shell.

Checks:

```bash
cat /proc/cmdline
blkid
ls /dev/disk/by-uuid
```

Fixes:

- Use `root=UUID=...` or `PARTUUID=...` correctly.
- Add `rootflags=subvol=@` for btrfs.
- Add `rootwait` for SD/USB devices.
- Rebuild the initramfs with the correct hooks:
  ```bash
  mkinitcpio -P
  ```
- Include `btrfs` in `MODULES` if the root is btrfs and not autodetected.
- For LUKS, verify `cryptdevice=` and `root=/dev/mapper/...`.

## Stage 5: systemd does not reach the target

Symptoms:

- Boot reaches initramfs then hangs.
- Emergency mode.
- Failed units.

Checks:

```bash
journalctl -b -p err
systemctl --failed
systemctl status systemd-remount-fs
mount -a
cat /etc/fstab
```

Fixes:

- Fix `/etc/fstab` UUIDs.
- Ensure `/boot` is mounted if the bootloader needs it.
- Check the ESP is not mounted read-only.
- Check `x-keyring.service` and `pacman-init.service` on the live ISO.
- Check `NetworkManager` if the install needs the network.

## Stage 6: X services or generations fail

Checks:

```bash
x gen status
x gen list
x gen verify
x kernel list
journalctl -u 'x-*' -b
ls -l /boot/loader/entries /boot/grub/custom.cfg 2>/dev/null
```

Fixes:

- Regenerate boot entries: `x gen boot`.
- Re-apply the kernel map.
- Recreate the generation: `x gen new --label "recovery"`.
- Restore a previous generation: `x gen rollback <id>`.

## QEMU debug

### Serial console

```bash
-serial mon:stdio
```

or with `-nographic`, the serial console is multiplexed with the monitor.

### QEMU trace

```bash
-d guest_errors,unimp -D /tmp/qemu-debug.log
```

### Stop at start and attach GDB

```bash
-S -s
```

Then:

```bash
gdb-multiarch
target remote :1234
```

### Firmware verbose

Use the firmware menu or the UEFI shell to inspect boot options:

```text
bcfg boot dump
fs0:
ls
\EFI\BOOT\BOOTAA64.EFI
```

### Disk inspection

```bash
qemu-img info /tmp/x-aarch64.qcow2
qemu-nbd --connect=/dev/nbd0 /tmp/x-aarch64.qcow2
lsblk -f /dev/nbd0
mount /dev/nbd0p2 /mnt
```

Use `qemu-nbd` with care; unmount and disconnect when done.

## Recovery from the live ISO

```bash
# Identify the target
lsblk -f

# Mount the root subvolume
mount -o subvol=@,noatime /dev/vda2 /mnt
mount /dev/vda1 /mnt/boot

# Chroot
arch-chroot /mnt

# Reinstall the bootloader
grub-install --target=arm64-efi --efi-directory=/boot --bootloader-id=x --recheck
grub-mkconfig -o /boot/grub/grub.cfg

# Or systemd-boot
bootctl --esp-path=/boot install

# Rebuild initramfs
mkinitcpio -P
```

## Raspberry Pi serial debug

- Enable the serial console in `config.txt`:
  ```ini
  enable_uart=1
  ```
- Connect a 3.3V USB-to-serial adapter to GPIO 14/15.
- Use `console=serial0,115200` in `cmdline.txt`.
- Check the firmware files on the FAT partition.
- Check `config.txt` for the correct kernel name (`kernel8.img` for aarch64).

## Log collection for a bug report

```bash
mkdir -p /tmp/x-arm-report
cp /proc/cmdline /tmp/x-arm-report/
uname -a > /tmp/x-arm-report/uname.txt
lsblk -f > /tmp/x-arm-report/lsblk.txt
blkid > /tmp/x-arm-report/blkid.txt
efibootmgr -v > /tmp/x-arm-report/efibootmgr.txt 2>&1 || true
bootctl status > /tmp/x-arm-report/bootctl.txt 2>&1 || true
journalctl -b > /tmp/x-arm-report/journal.txt
dmesg > /tmp/x-arm-report/dmesg.txt
x gen status > /tmp/x-arm-report/x-gen.txt 2>&1 || true
tar -czf /tmp/x-arm-report.tar.gz -C /tmp x-arm-report
```

Remove secrets (passwords, keys, tokens) before sharing.

## Common root causes

| Cause | Evidence | Fix |
|---|---|---|
| x86_64 GRUB on the build host | `grub-mkstandalone` cannot find `arm64-efi` | Build on aarch64 |
| Wrong EFI fallback name | No `BOOTAA64.EFI` | Use `BOOTAA64.EFI`, not `BOOTX64.EFI` |
| Kernel name mismatch | GRUB points to `vmlinuz-linux`, kernel is `Image` | Symlink or update the entry |
| No serial console | QEMU shows nothing | `console=ttyAMA0` |
| Wrong root UUID | VFS panic | Fix `root=` |
| Missing btrfs subvol | root not found | Add `rootflags=subvol=@` |
| Secure Boot enabled | shim signature error | Disable or enroll |
| Missing firmware | Device not detected | Install `linux-firmware` and vendor splits |
| Wrong DTB on SBC | No display/network | Use the board DTB and U-Boot |
| No `pkgbase` | `x kernel` cannot detect the kernel | Use the fallback |

## References

- [Installer](arm-installer.md)
- [Generations](arm-generations.md)
- [Testing and CI](arm-testing.md)
- [QEMU virt](https://www.qemu.org/docs/master/system/arm/virt.html)
- [U-Boot booti](https://docs.u-boot.org/en/latest/usage/cmd/booti.html)
- [UAPI Boot Loader Specification](https://uapi-group.org/specifications/specs/boot_loader_specification/)
- `arm-references.md` for ALARM sources
