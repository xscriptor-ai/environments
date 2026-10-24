# Runbook: install X on aarch64

Purpose: install X on a UEFI aarch64 machine (QEMU `virt` or real hardware), verify the boot chain, and recover a broken installation.

This runbook assumes the ARM ISO from [Build the ISO](arm-runbook-build.md) and the installer changes from [Installer](arm-installer.md).

## Supported target for v1

- aarch64.
- UEFI firmware.
- GPT disk.
- ESP mounted at `/boot`.
- btrfs root with the X subvolumes, or ext4 for a minimal test.
- GRUB `arm64-efi` or systemd-boot `AA64`.

Not supported in v1: BIOS, Raspberry Pi firmware boot, generic SBC U-Boot, Apple Silicon.

## Disk layouts

### Simple test layout (QEMU)

| Partition | Size | Type | Mount |
|---|---:|---|---|
| 1 | 512 MiB | EFI System | `/boot` |
| 2 | rest | Linux filesystem | `/` |

### X default layout

| Partition | Size | Type | Mount |
|---|---:|---|---|
| 1 | 512 MiB to 1 GiB | EFI System | `/boot` |
| 2 | rest | Linux filesystem | `/` |

Inside the root partition, X creates btrfs subvolumes:

| Subvolume | Mount |
|---|---|
| `@` | `/` |
| `@home` | `/home` |
| `@snapshots` | `/.snapshots` |
| `@xstate` | `/var/lib/x` |

### Encrypted layout

| Partition | Size | Type | Mount |
|---|---:|---|---|
| 1 | 512 MiB to 1 GiB | EFI System | `/boot` |
| 2 | rest | LUKS2 -> btrfs | `/` |

The ESP stays unencrypted. The initramfs must include `encrypt` or `sd-encrypt`.

## Boot the ISO

### QEMU

Use the launcher from [Testing and CI](arm-testing.md). For an interactive install:

```bash
qemu-system-aarch64 -M virt -cpu max -smp 4 -m 4096 \
  -drive if=pflash,format=raw,readonly=on,file=/usr/share/edk2/aarch64/QEMU_EFI.fd \
  -drive if=pflash,format=raw,file=/tmp/AAVMF_VARS.fd \
  -drive if=none,id=cdrom,media=cdrom,readonly=on,file=out/x-*-aarch64.iso \
  -device virtio-scsi-pci -device scsi-cd,drive=cdrom \
  -drive if=virtio,format=qcow2,file=/tmp/x-aarch64.qcow2 \
  -netdev user,id=n0 -device virtio-net-pci,netdev=n0 \
  -nographic
```

### Real hardware

1. Write the ISO to a USB device.
2. Boot with UEFI enabled.
3. Select the USB device from the firmware boot menu.
4. Ensure serial console or physical keyboard/display is available.
5. If Secure Boot is enabled, disable it for v1 or enroll the required keys.

## Installer flow

1. Select the disk.
2. Select the mode: wipe or dualboot.
3. Select the profile: core or full.
4. Select the kernel: `linux-aarch64` on generic aarch64.
5. Select the bootloader: GRUB or systemd-boot.
6. Select encryption: none or LUKS.
7. Confirm and start.

The installer should:

- Partition GPT.
- Create and format the ESP.
- Create btrfs subvolumes.
- Run `pacstrap` with `pacman.aarch64.conf`.
- Populate `archlinuxarm` and the X key.
- Configure locale, timezone, keyboard, user, sudo.
- Provision with `x-scripts`.
- Install GRUB `arm64-efi` or systemd-boot `AA64`.
- Create generation `0001`.

## Manual install fallback

Use this if the installer fails and you need to recover or validate the target.

```bash
# 1) Partition
sgdisk -Z /dev/vda
sgdisk -n 1:0:+512M -t 1:ef00 -c 1:ESP /dev/vda
sgdisk -n 2:0:0 -t 2:8300 -c 2:root /dev/vda

# 2) Filesystems
mkfs.fat -F32 /dev/vda1
mkfs.btrfs -f /dev/vda2

# 3) Subvolumes
mount /dev/vda2 /mnt
btrfs subvolume create /mnt/@
btrfs subvolume create /mnt/@home
btrfs subvolume create /mnt/@snapshots
btrfs subvolume create /mnt/@xstate
umount /mnt

mount -o subvol=@,noatime /dev/vda2 /mnt
mkdir -p /mnt/{home,.snapshots,var/lib/x,boot}
mount -o subvol=@home,noatime /dev/vda2 /mnt/home
mount -o subvol=@snapshots,noatime /dev/vda2 /mnt/.snapshots
mount -o subvol=@xstate,noatime /dev/vda2 /mnt/var/lib/x
mount /dev/vda1 /mnt/boot

# 4) Keyrings
pacman-key --init
pacman-key --populate archlinuxarm
pacman-key --add /etc/pacman.d/x-repo.pub
pacman-key --lsign-key <X_KEY_FPR>

# 5) Base system
pacstrap -C /etc/pacman.conf /mnt \
  base base-devel linux-aarch64 linux-aarch64-headers linux-firmware \
  grub efibootmgr sudo networkmanager openssh git jq btrfs-progs \
  x-release x-scripts xpm xpkg

# 6) fstab
genfstab -U /mnt >> /mnt/etc/fstab

# 7) chroot
arch-chroot /mnt
```

Inside the chroot:

```bash
# Keyrings
pacman-key --init
pacman-key --populate archlinuxarm
pacman-key --add /etc/pacman.d/x-repo.pub
pacman-key --lsign-key <X_KEY_FPR>

# Locale, timezone, hostname
ln -sf /usr/share/zoneinfo/UTC /etc/localtime
hwclock --systohc
echo "en_US.UTF-8 UTF-8" >> /etc/locale.gen
locale-gen
echo x-aarch64 > /etc/hostname

# User
useradd -m -G wheel -s /usr/bin/zsh x
passwd x
sed -i 's/^# %wheel ALL=(ALL:ALL) ALL/%wheel ALL=(ALL:ALL) ALL/' /etc/sudoers

# initramfs
mkinitcpio -P

# GRUB
grub-install --target=arm64-efi --efi-directory=/boot --bootloader-id=x --recheck
grub-install --target=arm64-efi --efi-directory=/boot --removable --recheck
grub-mkconfig -o /boot/grub/grub.cfg

# Provisioning
x setup
runuser -u x -- env X_HYPRLAND=0 X_HW_AUTO=0 x setup --user
```

Exit, unmount, reboot.

## Verify the boot chain

Inside the installed system:

```bash
uname -m                                  # aarch64
uname -r                                  # 7.x.y-...-aarch64-ARCH
ls -l /boot/Image /boot/initramfs-linux.img
ls -l /boot/EFI/BOOT/BOOTAA64.EFI
ls -l /boot/EFI/x/grubaa64.efi
efibootmgr -v
```

Expected:

- Firmware entry `X Linux` points to `\EFI\x\grubaa64.efi` or the systemd-boot path.
- `BOOTAA64.EFI` exists as the removable fallback.
- GRUB menu shows X and the generation entries.
- `systemctl --failed` is empty or only expected units.

## systemd-boot variant

```bash
bootctl --esp-path=/boot install
ls -l /boot/EFI/systemd/systemd-bootaa64.efi
ls -l /boot/EFI/BOOT/BOOTAA64.EFI
bootctl status
```

Entries live in `/boot/loader/entries/`. `x gen` writes `x-gen-<id>.conf` there.

## Encryption

For LUKS2:

```bash
cryptsetup luksFormat /dev/vda2
cryptsetup open /dev/vda2 cryptroot
mkfs.btrfs /dev/mapper/cryptroot
# mount and create subvolumes as usual
```

`mkinitcpio.conf`:

```ini
HOOKS=(base udev autodetect modconf keyboard keymap consolefont block encrypt filesystems)
```

or, with systemd hooks:

```ini
HOOKS=(base systemd autodetect modconf keyboard sd-vconsole block sd-encrypt filesystems)
```

Add `cryptdevice=UUID=...:cryptroot root=/dev/mapper/cryptroot` to the kernel command line.

## Dualboot

- Reuse the existing ESP, never format it.
- Do not overwrite `EFI/Microsoft/**`.
- Install GRUB with `--bootloader-id=x` and a unique directory.
- Preserve the existing `EFI/BOOT/BOOTAA64.EFI` if another OS owns it.
- Enable `os-prober` only if the distribution allows it.
- Verify the firmware boot order after installation.

## Post-install checks

```bash
# Packages
pacman -Q linux-aarch64 grub efibootmgr archlinuxarm-keyring x-release x-scripts

# Repository
grep -A2 '^\[x\]' /etc/pacman.conf
pacman -Sy

# Generations
x gen status
x gen list

# Boot entries
ls /boot/loader/entries 2>/dev/null || true
grep -A5 x-gen /boot/grub/custom.cfg 2>/dev/null || true

# Network
nmcli device status
ping -c1 mirror.archlinuxarm.org
```

## Recovery

### Boot fails, GRUB prompt appears

```grub
ls
set root=(hd0,gpt2)
linux /boot/Image root=/dev/vda2 rw
initrd /boot/initramfs-linux.img
boot
```

If btrfs subvolumes are used, add `rootflags=subvol=@`.

### Boot fails, firmware shell appears

```text
fs0:
\EFI\BOOT\BOOTAA64.EFI
```

or select the X entry with `bcfg boot dump`.

### Reinstall the bootloader from the live ISO

```bash
mount -o subvol=@,noatime /dev/vda2 /mnt
mount /dev/vda1 /mnt/boot
arch-chroot /mnt
grub-install --target=arm64-efi --efi-directory=/boot --bootloader-id=x --recheck
grub-mkconfig -o /boot/grub/grub.cfg
```

### Kernel or initramfs missing

```bash
mount -o subvol=@,noatime /dev/vda2 /mnt
mount /dev/vda1 /mnt/boot
arch-chroot /mnt mkinitcpio -P
```

### Roll back a generation

```bash
x gen list
x gen rollback <id>
reboot
```

If the boot menu is broken, boot the live ISO and use `x gen` with `X_GEN_ROOT=/mnt`.

## Acceptance

- [ ] Firmware finds X.
- [ ] GRUB or systemd-boot menu appears.
- [ ] Kernel boots with the expected cmdline.
- [ ] Root filesystem mounts.
- [ ] `uname -m` is aarch64.
- [ ] `x gen status` is healthy.
- [ ] `x gen rollback` works.
- [ ] Network is up.
- [ ] `pacman -Sy` works against `[x]/aarch64`.

## References

- [Installer](arm-installer.md)
- [Generations](arm-generations.md)
- [QEMU testing](arm-testing.md)
- [Debug runbook](arm-runbook-debug.md)
- [Checklists](arm-checklists.md)
- `arm-references.md` for ALARM and bootloader sources
