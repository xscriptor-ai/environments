# Generations and kernels on aarch64

Goal: keep the btrfs generation model working when the kernel is `linux-aarch64` (image `/boot/Image`) or `linux-rpi` (image `/boot/kernel8.img`).

Files involved:

- `scripts/install/helpers/xkernel.sh`
- `scripts/install/helpers/xgen.sh`
- `scripts/bin/x-gen-*.sh`
- `scripts/bin/x-kernel-*.sh`
- `scripts/test/generations-*.sh`
- `scripts/test/kernel.sh`

## What already works

The generation engine is architecture-independent:

- btrfs snapshots of `@`, `@home`, `@snapshots`, `@xstate`.
- `manifest.json` with packages, services, migrations, kernel release and kernel files.
- Shared kernel copies on the ESP keyed by content hash.
- Retention, pinning, diff, rollback, export/import.
- pacman hooks.

The problems are kernel discovery, kernel naming and boot entry paths.

## Current assumptions

`xgen_capture_kernel` (`xgen.sh:259-320`) globs:

```bash
"$X_GEN_ROOT"/boot/vmlinuz-* "$X_GEN_ROOT"/boot/initramfs-*.img
```

`xgen_pick_pair` (`xgen.sh:303-313`) derives the initramfs from the `vmlinuz-` suffix:

```bash
k="$(find "$dir" -maxdepth 1 -name 'vmlinuz-*' ...)"
name="${k##*/vmlinuz-}"
i="$dir/initramfs-$name.img"
```

`xkernel.sh` assumes:

- Known kernels are `linux`, `linux-lts`, `linux-zen`, `linux-hardened`, `linux-rt`, `linux-rt-lts`.
- `/usr/lib/modules/<release>/pkgbase` exists.

ALARM breaks all three assumptions for `linux-aarch64`.

## Kernel map

Use the helpers from [Installer](arm-installer.md):

```bash
xkernel_image_name <pkgbase>       # Image, kernel8.img, kernel7.img, vmlinuz-...
xkernel_initramfs_name <pkgbase>   # initramfs-linux.img or initramfs-<pkgbase>.img
xkernel_pkgbase_of_release <rel>   # pkgbase or fallback via pacman -Qoq
xkernel_installed_pkgbases
```

Mapping:

| Kernel | Image | Initramfs |
|---|---|---|
| `linux` | `vmlinuz-linux` | `initramfs-linux.img` |
| `linux-lts` | `vmlinuz-linux-lts` | `initramfs-linux-lts.img` |
| `linux-aarch64` | `Image` | `initramfs-linux.img` |
| `linux-aarch64-chromebook` | `Image` | `initramfs-linux.img` |
| `linux-rpi` | `kernel8.img` | `initramfs-linux.img` |
| `linux-rpi-16k` | `kernel8.img` | `initramfs-linux.img` |

## Capturing kernels

Replace the glob with an explicit list:

```bash
xgen_kernel_files() {
    local root="$1" pkgbase img initrd
    for pkgbase in $(xkernel_installed_pkgbases); do
        img="$(xkernel_image_name "$pkgbase")"
        initrd="$(xkernel_initramfs_name "$pkgbase")"
        [[ -f "$root/boot/$img" ]] && printf '%s\n' "$root/boot/$img"
        [[ -f "$root/boot/$initrd" ]] && printf '%s\n' "$root/boot/$initrd"
    done

    # Fallback for legacy or unknown kernels
    find "$root/boot" -maxdepth 1 -type f \
        \( -name 'vmlinuz-*' -o -name 'Image' -o -name 'Image.gz' \
           -o -name 'kernel8.img' -o -name 'kernel7.img' \) -print 2>/dev/null
    find "$root/boot" -maxdepth 1 -type f -name 'initramfs-*.img' -print 2>/dev/null
}
```

Deduplicate the output before copying.

## Pairing kernel and initramfs

Use the map, not the filename suffix:

```bash
xgen_pick_pair_for() { # dir pkgbase
    local dir="$1" pkgbase="$2" img initrd
    img="$(xkernel_image_name "$pkgbase")"
    initrd="$(xkernel_initramfs_name "$pkgbase")"
    [[ -f "$dir/$img" && -f "$dir/$initrd" ]] || return 1
    printf '%s|%s\n' "$img" "$initrd"
}
```

Keep the legacy suffix-based fallback for x86_64 and for old generations.

## `kernels.tsv`

`xgen_capture_kernel` writes `kernels.tsv` with:

```text
<pkgbase>\t<release>\t<image>\t<initramfs>
```

On ARM it should look like:

```text
linux-aarch64	7.2.11-1-aarch64-ARCH	Image	initramfs-linux.img
linux-rpi	6.18.58-1-rpi	kernel8.img	initramfs-linux.img
```

`xgen_boot_sync` already consumes this file. The only change is how it is populated.

## Boot entries

### systemd-boot

The current writer produces:

```ini
title   X Linux (gen 0001, install)
linux   /vmlinuz-linux
initrd  /initramfs-linux.img
options ...
```

On ARM:

```ini
title   X Linux (gen 0001, install)
linux   /Image
initrd  /initramfs-linux.img
options ...
```

For Raspberry Pi with U-Boot and extlinux, the equivalent entry is:

```ini
label x
    linux /Image
    initrd /initramfs-linux.img
    append root=PARTUUID=... rw rootwait console=serial0,115200
```

Systemd-boot loads PE images. `/boot/Image` from ALARM is an EFI-stub PE image, so it works. If the symlink compatibility layer is used, point the entry at the symlink or the real image consistently.

### GRUB

The current writer produces:

```grub
menuentry "X Linux (gen 0001, install)" {
    linux /vmlinuz-linux <cmdline>
    initrd /initramfs-linux.img
}
```

On ARM:

```grub
menuentry "X Linux (gen 0001, install)" {
    linux /Image <cmdline>
    initrd /initramfs-linux.img
}
```

### Boot Loader Specification

The UAPI specification defines `architecture` identifiers such as `AA64`. If X writes entries for multiple architectures on a shared ESP, add:

```ini
architecture aa64
```

The boot loader hides entries whose architecture does not match.

## Command line

`xgen_cmdline_for_gen` reads `/proc/cmdline` and `/etc/default/grub`. On Raspberry Pi, the command line is in `/boot/cmdline.txt`:

```bash
if [[ -f "$X_GEN_ROOT/boot/cmdline.txt" ]]; then
    tr -d '\n' < "$X_GEN_ROOT/boot/cmdline.txt"
fi
```

On generic aarch64, the cmdline is in the bootloader entry or `/etc/kernel/cmdline` (if UKI is used), not in `cmdline.txt`.

## Multi-kernel on ARM

Problem: `linux-aarch64` and `linux-rpi` both use `/boot/initramfs-linux.img`. They cannot coexist without a collision.

Options:

1. **One kernel per ARM system in v1.** Generic aarch64 uses `linux-aarch64`; Raspberry Pi uses `linux-rpi`. Disable multi-kernel ARM.
2. **Custom presets.** Set `default_image="/boot/initramfs-linux-aarch64.img"` and `"/boot/initramfs-linux-rpi.img"`, then teach `xgen` those names. More work, but keeps the multi-kernel feature.
3. **Rename after mkinitcpio.** Move `initramfs-linux.img` to a per-kernel name and update boot entries. Fragile; not recommended.

Recommendation: option 1 for v1, option 2 if multi-kernel parity is required.

## `xkernel_boot_style`

`xkernel_boot_style` detects `loader/entries` (systemd-boot) or `grub/grub.cfg` (GRUB). On a Raspberry Pi firmware boot there is neither, so it returns `unknown`.

If RPi is supported later, add a `rpi-cmdline` style or skip `xkernel_boot_style` for that platform.

## `x kernel` commands

`bin/x-kernel-install.sh` currently installs `$kernel` and `$kernel-headers`. On ARM:

- `linux-aarch64` headers are `linux-aarch64-headers`.
- `linux-rpi` headers are `linux-rpi-headers`.
- `linux-rpi-16k` headers are `linux-rpi-16k-headers`.
- `linux` is not a valid target on aarch64.

Add validation:

```bash
if [[ "$(uname -m)" == "aarch64" && "$KERNEL" == "linux" ]]; then
    echo "x kernel: 'linux' is x86_64-only; use linux-aarch64 or linux-rpi on aarch64" >&2
    exit 1
fi
```

`bin/x-kernel-remove.sh` uses `xkernel_check_removable`, which depends on `xkernel_release_of_pkgbase` and `xkernel_installed_pkgbases`. The fallback above fixes both.

## Tests

Add ARM fixtures to `scripts/test/`:

- A fake root with `/boot/Image`, `/boot/initramfs-linux.img`, and a module directory without `pkgbase`.
- A fake root with `/boot/kernel8.img`, `/boot/initramfs-linux.img`, and `pkgbase=linux-rpi`.
- Assertions for `xkernel_image_name`, `xkernel_initramfs_name`, `xkernel_pkgbase_of_release` and `xgen_pick_pair_for`.
- Boot entry assertions for `linux /Image` and `linux /kernel8.img`.

Run the existing suite on aarch64 as well as x86_64. The tests are Bash and do not require btrfs unless the btrfs suite is selected.

## Migration for existing installations

There are no existing ARM installations yet. If an experimental ARM system exists, the migration is:

1. Create compatibility symlinks (`vmlinuz-*`, `initramfs-*.img`).
2. Run `x gen new --label "post-arm-kernel-map"`.
3. Verify the new entry boots.
4. Remove the symlinks only after the native map is in place.

## Checklist

- [ ] `xkernel_known` includes ARM kernels.
- [ ] `xkernel_release_of_pkgbase` falls back to `pacman -Qoq`.
- [ ] `xgen_capture_kernel` finds `Image` and `kernel8.img`.
- [ ] `xgen_pick_pair` uses the map.
- [ ] `kernels.tsv` contains real names.
- [ ] systemd-boot entries use `/Image` or `/kernel8.img`.
- [ ] GRUB entries use `/Image` or `/kernel8.img`.
- [ ] `x kernel list/install/remove` work on aarch64.
- [ ] ARM fixtures pass on x86_64 and aarch64.
- [ ] Multi-kernel is either disabled or uses custom presets.

## References

- `scripts/install/helpers/xgen.sh:259-320, 303-313, 628-880`
- `scripts/install/helpers/xkernel.sh:14, 36-42`
- `scripts/test/generations-*.sh`, `scripts/test/kernel.sh`
- ALARM `linux-aarch64` and `linux-rpi` package layouts
- UAPI Boot Loader Specification: https://uapi-group.org/specifications/specs/boot_loader_specification/
