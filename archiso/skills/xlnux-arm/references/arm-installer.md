# Installing X on aarch64

Goal: make the X text installer partition, install, configure and boot an aarch64 system with Arch Linux ARM packages, GRUB `arm64-efi` or systemd-boot `AA64`.

Files involved:

- `x/airootfs/root/x-installer/install.sh`
- `x/airootfs/root/x-installer/configurator.sh`
- `x/airootfs/root/x-installer/packages.x86_64` (to be split)
- `x/airootfs/root/x-installer/ui.sh`
- `x/grub/grub.cfg`
- `scripts/install/helpers/xkernel.sh`
- `scripts/install/helpers/xgen.sh`

## The core mismatch

X assumes the Arch x86_64 kernel layout:

```text
/boot/vmlinuz-linux
/boot/vmlinuz-linux-lts
/boot/initramfs-linux.img
/boot/initramfs-linux-lts.img
/usr/lib/modules/<kver>/pkgbase   # contains "linux"
```

ALARM does not follow that layout:

| Kernel | Image | Initramfs | `pkgbase` |
|---|---|---|---|
| `linux-aarch64` | `/boot/Image`, `/boot/Image.gz` | `/boot/initramfs-linux.img` | Missing |
| `linux-rpi` | `/boot/kernel8.img` | `/boot/initramfs-linux.img` | `linux-rpi` |
| `linux-rpi-16k` | `/boot/kernel8.img` | `/boot/initramfs-linux.img` | `linux-rpi-16k` |
| `linux-aarch64-chromebook` | `/boot/Image` (likely) | `/boot/initramfs-linux.img` | Not verified |

Verified with the ALARM packages:

```bash
tar -tf linux-aarch64-7.2.11-1-aarch64.pkg.tar.xz | grep -E '^boot/|mkinitcpio.d|pkgbase'
# boot/Image
# boot/Image.gz
# boot/dtbs/...
# etc/mkinitcpio.d/linux-aarch64.preset
# no pkgbase

tar -xOf linux-aarch64-7.2.11-1-aarch64.pkg.tar.xz etc/mkinitcpio.d/linux-aarch64.preset
# ALL_kver="7.2.11-1-aarch64-ARCH"
# default_image="/boot/initramfs-linux.img"

tar -tf linux-rpi-6.18.58-1-aarch64.pkg.tar.xz | grep -E '^boot/[^/]+$'
# boot/kernel8.img
# boot/config.txt
# boot/cmdline.txt
# boot/*.dtb
```

Consequences:

- The installer cannot use `KERNEL=linux` on ARM.
- It cannot derive `/boot/vmlinuz-$KERNEL` or `initramfs-$KERNEL.img`.
- `xgen` and `xkernel` cannot detect an installed `linux-aarch64` through `pkgbase`.

## Kernel mapping

Add an architecture-aware kernel map to `scripts/install/helpers/xkernel.sh`:

```bash
xkernel_pkgbase_for_pkg() {
    case "$1" in
        linux-aarch64)            echo "linux-aarch64" ;;
        linux-aarch64-chromebook) echo "linux-aarch64-chromebook" ;;
        linux-rpi)                echo "linux-rpi" ;;
        linux-rpi-16k)            echo "linux-rpi-16k" ;;
        linux)                    echo "linux" ;;
        linux-lts)                echo "linux-lts" ;;
        linux-zen)                echo "linux-zen" ;;
        linux-hardened)           echo "linux-hardened" ;;
        linux-rt)                 echo "linux-rt" ;;
        linux-rt-lts)             echo "linux-rt-lts" ;;
        *) return 1 ;;
    esac
}

xkernel_image_name() {
    local pkgbase="${1:-$(xkernel_running_pkgbase)}"
    case "$(uname -m):$pkgbase" in
        aarch64:linux-aarch64|aarch64:linux-aarch64-chromebook) echo "Image" ;;
        aarch64:linux-rpi|aarch64:linux-rpi-16k)                echo "kernel8.img" ;;
        armv7h:linux-rpi)                                       echo "kernel7.img" ;;
        *)                                                      echo "vmlinuz-$pkgbase" ;;
    esac
}

xkernel_initramfs_name() {
    local pkgbase="${1:-$(xkernel_running_pkgbase)}"
    case "$(uname -m):$pkgbase" in
        aarch64:linux-aarch64|aarch64:linux-aarch64-chromebook) echo "initramfs-linux.img" ;;
        aarch64:linux-rpi|aarch64:linux-rpi-16k)                echo "initramfs-linux.img" ;;
        *)                                                      echo "initramfs-$pkgbase.img" ;;
    esac
}

xkernel_known() {
    printf '%s\n' "${X_KERNEL_KNOWN:-linux linux-lts linux-zen linux-hardened linux-rt linux-rt-lts linux-aarch64 linux-aarch64-chromebook linux-rpi linux-rpi-16k}"
}
```

## `pkgbase` fallback

`linux-aarch64` does not ship `/usr/lib/modules/<kver>/pkgbase`. Add a fallback:

```bash
xkernel_pkgbase_of_release() {
    local rel="$1" p
    p="$(cat "$(xkernel_modules_dir)/$rel/pkgbase" 2>/dev/null || true)"
    [[ -n "$p" ]] && { printf '%s\n' "$p"; return 0; }

    if command -v pacman >/dev/null 2>&1; then
        for f in /boot/Image /boot/kernel8.img /boot/kernel7.img; do
            [[ -e "$f" ]] || continue
            p="$(pacman -Qoq "$f" 2>/dev/null | head -1 || true)"
            [[ -n "$p" ]] && { printf '%s\n' "$p"; return 0; }
        done
    fi

    case "$rel" in
        *-aarch64-ARCH) echo "linux-aarch64" ;;
        *-rpi)          echo "linux-rpi" ;;
        *)              return 1 ;;
    esac
}

xkernel_release_of_pkgbase() {
    local k="$1" m rel
    for m in "$(xkernel_modules_dir)"/*/; do
        [[ -d "$m" ]] || continue
        rel="$(basename "$m")"
        [[ "$(xkernel_pkgbase_of_release "$rel")" == "$k" ]] && { printf '%s\n' "$rel"; return 0; }
    done
    return 1
}

xkernel_running_pkgbase() {
    local rel="${X_KERNEL_RUNNING_RELEASE:-$(uname -r 2>/dev/null || true)}"
    xkernel_pkgbase_of_release "$rel"
}
```

`pacman -Qoq /boot/Image` returns the package that owns the file. This is the most reliable fallback on ALARM.

## Installer changes

### Architecture detection

At the start of `install.sh`:

```bash
ARCH="$(uname -m)"
case "$ARCH" in
    x86_64)  BOOT_TARGET="x86_64-efi"; PKGLIST_ARCH="x86_64" ;;
    aarch64) BOOT_TARGET="arm64-efi";  PKGLIST_ARCH="aarch64" ;;
    *) echo "installer: unsupported architecture '$ARCH'" >&2; exit 1 ;;
esac
```

### Kernel default and validation

Replace the current `KERNEL=linux` default and the x86-only list:

```bash
KERNEL="$(jget kernel)"
if [[ -z "$KERNEL" ]]; then
    [[ "$ARCH" == aarch64 ]] && KERNEL="linux-aarch64" || KERNEL="linux"
fi

case "$ARCH:$KERNEL" in
    x86_64:linux|x86_64:linux-lts|x86_64:linux-zen|x86_64:linux-hardened|x86_64:linux-rt|x86_64:linux-rt-lts) ;;
    aarch64:linux-aarch64|aarch64:linux-aarch64-chromebook|aarch64:linux-rpi|aarch64:linux-rpi-16k) ;;
    *) echo "installer: unsupported kernel '$KERNEL' for $ARCH" >&2; exit 1 ;;
esac
```

### Manifest

```bash
PKGLIST="${X_PKGLIST:-/root/x-installer/packages.$PKGLIST_ARCH}"
```

### Base package set

Current:

```bash
EXTRA="base base-devel $KERNEL $KERNEL-headers linux-firmware sudo networkmanager openssh git jq x-release btrfs-progs xfetch-bin xtop-git"
```

Proposed:

```bash
if [[ "$ARCH" == aarch64 ]]; then
    EXTRA="base base-devel $KERNEL $KERNEL-headers linux-firmware sudo networkmanager openssh git jq x-release btrfs-progs"
else
    EXTRA="base base-devel $KERNEL $KERNEL-headers linux-firmware sudo networkmanager openssh git jq x-release btrfs-progs xfetch-bin xtop-git"
fi
```

Add `xfetch-bin` and `xtop-git` only if they are published for aarch64. The current `$KERNEL-headers` rule happens to work for `linux-aarch64` and `linux-rpi` because their split header package names match. Make the mapping explicit anyway, so a future kernel package with a different split name does not break the installer.

### Keyrings

Live:

```bash
pacman-key --init
if [[ "$ARCH" == aarch64 ]]; then
    pacman-key --populate archlinuxarm
else
    pacman-key --populate archlinux
fi
LIVE_KEY=/etc/pacman.d/x-repo.pub
# add and locally sign the X key as today
```

Target:

```bash
pacman-key --gpgdir "$GPGDIR" --init
if [[ "$ARCH" == aarch64 ]]; then
    pacman-key --gpgdir "$GPGDIR" --populate archlinuxarm
else
    pacman-key --gpgdir "$GPGDIR" --populate archlinux
fi
pacman-key --gpgdir "$GPGDIR" --add "$LIVE_KEY"
pacman-key --gpgdir "$GPGDIR" --lsign-key "$X_KEY_FPR"
```

### X repository URL

```ini
Server = https://equislinux.github.io/x-repo/repo/$arch
```

Pacman substitutes `$arch` from `Architecture`. This avoids an architecture conditional in the installer.

### systemd-boot

Linux aarch64 systemd ships `systemd-bootaa64.efi`. The fallback path is `BOOTAA64.EFI`.

```bash
if [[ "$BOOT" == "systemd-boot" ]]; then
    if [[ "$ARCH" == aarch64 ]]; then
        SB_EFI="systemd-bootaa64.efi"
        SB_FALLBACK="BOOTAA64.EFI"
    else
        SB_EFI="systemd-bootx64.efi"
        SB_FALLBACK="BOOTX64.EFI"
    fi

    if [[ "$MODE" == "dualboot" && -f "$MNT/boot/EFI/BOOT/$SB_FALLBACK" ]]; then
        saved_fallback="$(mktemp)"
        cp -a "$MNT/boot/EFI/BOOT/$SB_FALLBACK" "$saved_fallback"
    fi

    arch-chroot "$MNT" bootctl --esp-path=/boot install >/dev/null

    if [[ "$MODE" == "dualboot" && -n "${saved_fallback:-}" ]]; then
        cp -a "$saved_fallback" "$MNT/boot/EFI/BOOT/$SB_FALLBACK"
    fi
    if [[ ! -f "$MNT/boot/EFI/BOOT/$SB_FALLBACK" ]]; then
        mkdir -p "$MNT/boot/EFI/BOOT"
        cp "$MNT/boot/EFI/systemd/$SB_EFI" "$MNT/boot/EFI/BOOT/$SB_FALLBACK"
    fi
fi
```

### GRUB

```bash
if [[ "$ARCH" == aarch64 ]]; then
    arch-chroot "$MNT" grub-install --target=arm64-efi --efi-directory=/boot --bootloader-id=x --recheck
    if [[ "$MODE" == "wipe" ]]; then
        arch-chroot "$MNT" grub-install --target=arm64-efi --efi-directory=/boot --removable --recheck
    fi
else
    arch-chroot "$MNT" grub-install --target=x86_64-efi --efi-directory=/boot --bootloader-id=x --recheck
    if [[ "$MODE" == "wipe" ]]; then
        arch-chroot "$MNT" grub-install --target=x86_64-efi --efi-directory=/boot --removable --recheck
    fi
    arch-chroot "$MNT" grub-install --target=i386-pc --boot-directory=/boot "$DISK"
fi
arch-chroot "$MNT" grub-mkconfig -o /boot/grub/grub.cfg
```

`--removable` writes `EFI/BOOT/BOOTAA64.EFI`, which helps firmware that ignores NVRAM entries.

### efibootmgr paths

```bash
if [[ "$ARCH" == aarch64 ]]; then
    SB_PATH='\EFI\systemd\systemd-bootaa64.efi'
    GRUB_PATH='\EFI\x\grubaa64.efi'
else
    SB_PATH='\EFI\systemd\systemd-bootx64.efi'
    GRUB_PATH='\EFI\x\grubx64.efi'
fi
```

`efibootmgr` works on ARM (`18-4` in ALARM). If it fails, the removable fallback still allows boot.

### Kernel symlinks

To keep the current `xgen`, `x-kernel`, GRUB and systemd-boot logic working with minimal changes, create compatibility symlinks in the target:

```bash
if [[ "$ARCH" == aarch64 ]]; then
    case "$KERNEL" in
        linux-aarch64|linux-aarch64-chromebook)
            ln -sf Image "/boot/vmlinuz-$KERNEL"
            ln -sf initramfs-linux.img "/boot/initramfs-$KERNEL.img"
            ;;
        linux-rpi|linux-rpi-16k)
            ln -sf kernel8.img "/boot/vmlinuz-$KERNEL"
            ln -sf initramfs-linux.img "/boot/initramfs-$KERNEL.img"
            ;;
    esac
fi
```

This is a compatibility layer, not the long-term design. Document it and remove the symlinks in `x kernel remove`.

### mkinitcpio

The installer already runs `mkinitcpio -P` when encryption is used. The current `HOOKS` do not include `microcode`, which is correct for ARM:

```bash
HOOKS=(base udev autodetect modconf keyboard keymap consolefont block encrypt filesystems)
```

If `sd-encrypt` is used, adjust the hooks accordingly.

### Raspberry Pi

Raspberry Pi does not use the UEFI installer path. A separate flow is required:

- Partition FAT (boot) plus ext4 or btrfs (root).
- `pacstrap` or extract the ALARM rootfs.
- Copy `config.txt`, `cmdline.txt`, `kernel8.img`, `initramfs-linux.img`, DTBs and overlays to the FAT partition.
- Use `root=PARTUUID=...` rather than `mmcblk0p2`.
- Do not install GRUB or systemd-boot in firmware mode.
- Or use `uboot-raspberrypi` + `boot.scr` + `Image`.

Do not mix this flow into the UEFI installer. Treat it as a separate image builder.

## Boot entry examples

### GRUB `grub.cfg`

```grub
menuentry 'X Linux' {
    linux /vmlinuz-linux-aarch64 root=UUID=<uuid> rw
    initrd /initramfs-linux-aarch64.img
}
```

or, using the ALARM names directly:

```grub
menuentry 'X Linux' {
    linux /Image root=UUID=<uuid> rw
    initrd /initramfs-linux.img
}
```

### systemd-boot `loader/entries/x.conf`

```ini
title   X Linux
linux   /vmlinuz-linux-aarch64
initrd  /initramfs-linux-aarch64.img
options root=UUID=<uuid> rw
```

or:

```ini
title   X Linux
linux   /Image
initrd  /initramfs-linux.img
options root=UUID=<uuid> rw
```

The UAPI Boot Loader Specification defines these keys and the `architecture` key. On ARM the EFI architecture identifier is `AA64`. Boot loaders ignore entries whose `architecture` does not match.

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `X_ARCH` | `uname -m` | Force the build/install architecture |
| `X_PKGLIST` | `packages.$arch` | Package manifest |
| `X_BOOTLOADER` | `grub` or `systemd-boot` | Force the bootloader |
| `X_KERNEL` | `linux-aarch64` on ARM | Kernel package |
| `X_ESP` | auto | ESP override |
| `X_RPI_MODE` | `0` | Separate Raspberry Pi flow |

## Verification

```bash
# Inside the installed target
uname -m                                  # aarch64
uname -r                                  # 7.2.11-1-aarch64-ARCH
ls -l /boot/Image /boot/initramfs-linux.img
ls -l /boot/EFI/BOOT/BOOTAA64.EFI
efibootmgr -v

# GRUB
grep -R "arm64-efi\|Image\|vmlinuz" /boot/grub/grub.cfg

# systemd-boot
find /boot/loader/entries -type f -maxdepth 1 -print -exec cat {} \;
```

## Risks

1. `linux-aarch64` has no `pkgbase`; tools that rely on it fail silently.
2. `linux-rpi` conflicts with `uboot-raspberrypi`; choose one boot flow.
3. `grub-install --target=arm64-efi` needs the aarch64 GRUB package and its modules.
4. `systemd-bootaa64.efi` and `BOOTAA64.EFI` are not interchangeable with the x64 names.
5. `linux-aarch64` and `linux-rpi` both use `/boot/initramfs-linux.img`; multi-kernel ARM needs custom presets.
6. Raspberry Pi firmware mode does not read `/loader/entries` or GRUB menus; generations need U-Boot or kernel file rewriting.
7. Some ARM firmware ignores NVRAM boot entries; keep `--removable` fallbacks.
8. `efibootmgr` is available but may be restricted by firmware.

## References

- `x/airootfs/root/x-installer/install.sh`
- ALARM `linux-aarch64`, `linux-rpi`, `grub`, `systemd` package pages
- UAPI Boot Loader Specification: https://uapi-group.org/specifications/specs/boot_loader_specification/
- U-Boot `booti` and distro boot documentation: https://docs.u-boot.org/en/latest/usage/cmd/booti.html and https://docs.u-boot.org/en/latest/develop/distro.html
