# Porting archiso to aarch64

Goal: build a UEFI-bootable `x-<date>-aarch64.iso` with the X live environment and installer, using Arch Linux ARM as the package base.

Verified against archiso 91-1, the upstream archiso source, and the ALARM aarch64 repositories on 2026-10-24.

## What archiso already supports

Upstream `mkarchiso` has explicit aarch64 branches:

```bash
readonly -A uefi_arch=(
    ['x86_64']='X64'
    ['aarch64']='AA64'
    ['loongarch64']='LOONGARCH64'
)
...
case "$arch" in
    'aarch64') grub_target='arm64-efi' ;;
    *) grub_target="${arch}-efi" ;;
esac
```

The upstream `releng` profile already carries aarch64 parameters:

```bash
bootmodes=('bios.syslinux'
           'uefi.systemd-boot')
airootfs_image_tool_options=('-comp' 'xz' '-Xbcj' 'x86,arm64' '-b' '1M' '-Xdict-size' '1M')
kernel_params_aarch64="clk_ignore_unused pd_ignore_unused arm64.nopauth"
```

`docs/README.profile.rst` documents:

- `arch`: defaults to `uname -m` and can be fixed in `profiledef.sh`.
- `bootmodes`: `bios.syslinux`, `uefi.grub`, `uefi.systemd-boot`.
- `uefi.grub` maps aarch64 to `arm64-efi`.
- `uefi.systemd-boot` copies `systemd-bootaa64.efi` and creates `BOOTAA64.EFI`.
- `kernel_params_<arch>` allows architecture-specific kernel parameters.

The ISO filesystem and El Torito code are architecture-independent; `xorriso` runs on the host.

## What is missing

- There is no `mkarchiso -a aarch64` option. The architecture comes from `profiledef.sh` (`arch=`) or `uname -m`.
- `archiso` is not packaged in ALARM. `mkinitcpio-archiso` is available, but the `mkarchiso` tool is not.
- `bios.syslinux` is x86-only and cannot be used on ARM.
- `memtest86+`, `refind` and `edk2-shell` are not available in ALARM and are x86-oriented.
- A host x86_64 `grub` package only ships `i386-efi`, `i386-pc` and `x86_64-efi`; it cannot produce `arm64-efi` images.

The port is viable. The work is in the X profile, packages, kernel layout and installer, not in `mkarchiso` itself.

## Build strategies

### Native aarch64 (recommended)

Host: ALARM aarch64 on physical hardware, a VM, a container on ARM, or an ARM runner.

Advantages: `pacstrap`, `mkinitcpio`, `grub-mkstandalone`, `systemd-boot`, `mksquashfs` and `xorriso` run natively. No binfmt.

Packages:

```bash
pacman -S --needed \
  arch-install-scripts dosfstools e2fsprogs findutils grub gzip \
  libarchive libisoburn mtools openssl pacman sed squashfs-tools \
  mkinitcpio-archiso python
```

Install archiso from source:

```bash
git clone https://github.com/archlinux/archiso.git
cd archiso
sudo make install
# or package it locally and publish it in [x]/aarch64
```

### Cross-build from x86_64 (experiments only)

Packages:

```bash
pacman -S --needed qemu-user-static qemu-user-static-binfmt \
  qemu-system-aarch64 edk2-aarch64 \
  aarch64-linux-gnu-gcc aarch64-linux-gnu-binutils \
  aarch64-linux-gnu-glibc aarch64-linux-gnu-linux-api-headers
```

Requirements and caveats:

- You need an ALARM aarch64 rootfs or a privileged container and binfmt.
- `mkarchiso` performs `mount`, `mknod`, `chroot` and loop operations; a container without privileges will fail.
- `grub-mkstandalone -O arm64-efi` needs the `arm64-efi` modules from the aarch64 `grub` package.
- TCG is slow; a full ISO build can take hours.
- Do not use this as the release path. Use it for experiments or smoke tests.

### GitHub Actions ARM runner

GitHub documents hosted Linux arm64 runners:

| Label | vCPU | RAM | Disk |
|---|---|---:|---:|
| `ubuntu-24.04-arm` | 4 | 16 GB | 14 GB |
| `ubuntu-22.04-arm` | 4 | 16 GB | 14 GB |
| `ubuntu-26.04-arm` | 4 | 16 GB | 14 GB |

`ubuntu-24.04-arm` is Ubuntu, not Arch. For a real archiso build, use a self-hosted Arch Linux ARM runner or a privileged ALARM container. The hosted ARM runner is useful for checks, Rust tests and a container-based build.

## Profile changes

### Architecture-aware `profiledef.sh`

Proposed:

```bash
: "${X_ARCH:=$(uname -m)}"

case "$X_ARCH" in
  x86_64)
    arch="x86_64"
    packages_file="packages.x86_64"
    pacman_conf="pacman.conf"
    bootmodes=('bios.syslinux' 'uefi.grub')
    airootfs_image_tool_options=('-comp' 'xz' '-Xbcj' 'x86' '-b' '1M' '-Xdict-size' '1M')
    ;;
  aarch64)
    arch="aarch64"
    packages_file="packages.aarch64"
    pacman_conf="pacman.aarch64.conf"
    bootmodes=('uefi.grub')
    airootfs_image_tool_options=('-comp' 'xz' '-Xbcj' 'arm64' '-b' '1M' '-Xdict-size' '1M')
    ;;
  *)
    echo "profiledef: unsupported architecture '$X_ARCH'" >&2
    exit 1
    ;;
esac
```

Notes:

- `mkarchiso` reads `arch`, `packages_file` and `pacman_conf` from the profile.
- Keep `iso_name="x"` and `install_dir="arch"`; `mkarchiso` appends `-<arch>.iso`.
- `uefi.grub` and `uefi.systemd-boot` are mutually exclusive in archiso 91. Choose one.
- If systemd-boot is preferred, use `bootmodes=('uefi.systemd-boot')` and keep `systemd` in the airootfs (it is in `base`).

### Build scripts

`x/xbuild.sh` and `x/x.sh` must use `work/$arch` instead of `work/x86_64`:

```bash
ARCH="${X_ARCH:-$(uname -m)}"
WORK="work/$ARCH"

for mp in "$WORK/airootfs/proc" "$WORK/airootfs/sys" "$WORK/airootfs/dev" "$WORK/airootfs/run"; do
  mountpoint -q "$mp" && sudo umount -l "$mp" || true
done
mountpoint -q "$WORK/airootfs" && sudo umount -Rl "$WORK/airootfs" || true

sudo rm -rf work out
sudo env X_ARCH="$ARCH" mkarchiso -v -w ./work -o ./out .
```

Do not pass `-C pacman.conf` unconditionally; let `mkarchiso` use the `pacman_conf` selected by the profile.

### pacman configuration

Use two files to avoid mixing x86_64 and ALARM repositories:

- `x/pacman.conf` for x86_64.
- `x/pacman.aarch64.conf` for aarch64.

Host/build `pacman.aarch64.conf`:

```ini
[options]
Architecture = aarch64
SigLevel = Required DatabaseOptional
LocalFileSigLevel = Optional
ParallelDownloads = 5

[x]
SigLevel = Never
Server = https://equislinux.github.io/x-repo/repo/$arch

[core]
Include = /etc/pacman.d/mirrorlist
[extra]
Include = /etc/pacman.d/mirrorlist
[alarm]
Include = /etc/pacman.d/mirrorlist
[aur]
Include = /etc/pacman.d/mirrorlist
```

Live `x/airootfs/etc/pacman.conf` for ARM must use `SigLevel = Required` for `[x]`, because `x-keyring.service` imports and locally signs the project key at boot.

The host and live `/etc/pacman.d/mirrorlist` must be the ALARM mirrorlist:

```ini
Server = http://mirror.archlinuxarm.org/$arch/$repo
```

### Manifests

- `packages.aarch64`: see [ARM packages](arm-packages.md).
- `bootstrap_packages.aarch64`: can be identical to x86_64 (`arch-install-scripts`, `base`).
- `x/airootfs/root/x-installer/packages.aarch64`: same content as `packages.aarch64`.
- `x-scripts-*.pkg.tar.zst` is `any` and can be reused.

### mkinitcpio in the live environment

Current:

```ini
HOOKS=(base udev microcode modconf kms memdisk archiso archiso_loop_mnt archiso_pxe_common archiso_pxe_nbd archiso_pxe_http archiso_pxe_nfs block filesystems keyboard)
COMPRESSION="xz"
COMPRESSION_OPTIONS=(-9e)
```

On ARM:

- Remove `microcode`; ARM does not use x86 microcode.
- Keep the `archiso` hooks; they are generic.
- Keep `kms`; Mesa/DRM drivers handle ARM display hardware.
- `xz` works; `zstd` is faster if preferred.

### Kernel and initramfs in the live environment

If the live manifest installs `linux-aarch64`, the airootfs contains:

```text
/boot/Image
/boot/Image.gz
/boot/dtbs/
/boot/initramfs-linux.img
```

There is no `/boot/vmlinuz-linux`. Two options:

Option A, symlink for compatibility:

```bash
ln -sf Image /boot/vmlinuz-linux-aarch64
ln -sf initramfs-linux.img /boot/initramfs-linux-aarch64.img
# optionally also:
ln -sf Image /boot/vmlinuz-linux
```

Option B, native kernel map:

- Add `xkernel_image_name` and `xkernel_initramfs_name` helpers and make `xgen` use them.
- This is the long-term solution; see [Generations](arm-generations.md).

For the live ISO, Option A is sufficient and keeps the existing GRUB menu working.

## Boot configuration

### GRUB `uefi.grub` (default)

`mkarchiso` creates `EFI/BOOT/BOOTAA64.EFI` with `grub-mkstandalone -O arm64-efi`. The profile `grub/grub.cfg` is processed with `%ARCH%` = `aarch64`.

Current X menu paths:

```grub
set linux_path=/%INSTALL_DIR%/boot/%ARCH%/vmlinuz-linux
set initrd_path=/%INSTALL_DIR%/boot/%ARCH%/initramfs-linux.img
```

For ALARM, either:

- create `/boot/vmlinuz-linux` as a symlink to `Image`, or
- change the paths to `/Image` and `/initramfs-linux.img`.

Remove the Memtest86+ and UEFI shell entries on ARM. The loopback config already has an `arm64` branch for the shell, but `edk2-shell` is not available in ALARM.

### systemd-boot `uefi.systemd-boot`

`mkarchiso` copies `systemd-bootaa64.efi` and creates `EFI/BOOT/BOOTAA64.EFI`. A live entry looks like:

```ini
title   x Linux install medium
linux   /arch/boot/aarch64/Image
initrd  /arch/boot/aarch64/initramfs-linux.img
options archisobasedir=arch archisosearchuuid=...
```

Systemd-boot loads PE images. `/boot/Image` from ALARM is an EFI-stub PE image, so it works. If a symlink is used, point the `linux` line at the real image or at the symlink consistently.

### Direct EFI-stub boot

Copying `/boot/Image` to `EFI/BOOT/BOOTAA64.EFI` can boot without a bootloader. This is useful for a minimal rescue image, but it loses the menu, kernel selection and kernel parameters. Not recommended for X.

### Kernel parameters

- Upstream releng aarch64: `clk_ignore_unused pd_ignore_unused arm64.nopauth`.
- QEMU `virt`: `console=ttyAMA0,115200 earlycon=pl011,0x9000000`.
- Raspberry Pi: `console=serial0,115200 console=tty1 root=/dev/mmcblk0p2 rw rootwait`.
- X currently passes `console=ttyS0` in the autoinstall menu. On ARM, use `console=ttyAMA0`.

## ISO layout

`mkarchiso` produces:

```text
out/x-<date>-aarch64.iso
|-- EFI/BOOT/BOOTAA64.EFI
|-- arch/
|   |-- boot/aarch64/Image (or vmlinuz-linux)
|   |-- boot/aarch64/initramfs-linux.img
|   `-- aarch64/airootfs.sfs
|-- boot/grub/...
`-- [BOOT]/...
```

Verify the El Torito EFI entry:

```bash
xorriso -report_el_torito as_mkisofs out/x-*-aarch64.iso
```

The output must show an EFI entry with `BOOTAA64.EFI`.

## Squashfs compression

Current:

```bash
'-comp' 'xz' '-Xbcj' 'x86' '-b' '1M' '-Xdict-size' '1M'
```

ARM:

```bash
'-comp' 'xz' '-Xbcj' 'arm64' '-b' '1M' '-Xdict-size' '1M'
```

`mksquashfs 4.7` accepts `arm64` (verified locally). If EROFS is used instead of squashfs, there is no BCJ filter; the current profile uses squashfs.

## Live menu cleanup

| Current item | ARM action |
|---|---|
| `syslinux/` | Exclude from the aarch64 profile |
| `bios.syslinux` | Exclude |
| `memtest86+` / `memtest86+-efi` | Remove package and menu entries |
| `refind` | Remove |
| `edk2-shell` | Remove; drop `EFI/Shell_Full.efi` / `shellaa64.efi` |
| `intel-ucode` / `amd-ucode` | Remove |
| `reflector` | Remove; use the ALARM mirrorlist |
| `hyperv`, `open-vm-tools`, `virtualbox-guest-utils-nox` | Remove |
| `grub` | Keep |
| `efibootmgr` | Keep |
| `systemd` | Keep; required for systemd-boot |
| `linux-firmware` | Keep; add splits as needed |
| `linux-firmware-marvell` | Keep |
| `firmware-raspberrypi` | Raspberry Pi only |

`choose-mirror` in the live environment uses `reflector`, which is not available on ARM. Use a static ALARM mirrorlist and disable the helper.

## archiso version notes

- `customize_airootfs.sh` is deprecated; use pacman hooks in `airootfs/etc/pacman.d/hooks/` marked with `# remove from airootfs!`.
- `mkarchiso` can run rootless via `unshare` since v89; v91 warns when run with `sudo`. Loop mounts in a container still require privileges.
- `-r` deletes the work directory; `-m` selects `iso`, `netboot` or `bootstrap`.
- `SOURCE_DATE_EPOCH` anchors reproducibility.
- Valid boot modes in v91 are `bios.syslinux`, `uefi.systemd-boot` and `uefi.grub`; granular names are deprecated.

## Build checklist

```bash
# 0) Host
uname -m                                # aarch64
pacman -Q archlinuxarm-keyring grub systemd mkinitcpio-archiso
command -v mkarchiso

# 1) Profile
cd x
export X_ARCH=aarch64
bash -n profiledef.sh
grep -E 'arch=|packages_file=|bootmodes=' profiledef.sh

# 2) Keyring
sudo pacman-key --init
sudo pacman-key --populate archlinuxarm

# 3) Build
sudo env X_ARCH=aarch64 ./xbuild.sh
ls -lh out/*aarch64.iso

# 4) Verify
xorriso -report_el_torito as_mkisofs out/x-*-aarch64.iso | grep -i -A2 efi

# 5) QEMU
qemu-system-aarch64 -M virt -cpu max -smp 4 -m 4096 \
  -drive if=pflash,format=raw,readonly=on,file=/usr/share/edk2/aarch64/QEMU_EFI.fd \
  -drive if=pflash,format=raw,file=/tmp/AAVMF_VARS.fd \
  -drive if=none,id=cdrom,media=cdrom,readonly=on,file=out/x-*-aarch64.iso \
  -device virtio-scsi-pci -device scsi-cd,drive=cdrom \
  -drive if=virtio,format=qcow2,file=/tmp/x-aarch64.qcow2 \
  -netdev user,id=n0 -device virtio-net-pci,netdev=n0 \
  -nographic
```

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `syslinux: target not found` | `bios.syslinux` or `syslinux` in the manifest | Remove the boot mode and package |
| `grub-mkstandalone: cannot find module ...` | x86_64 `grub` on the build host | Build on aarch64 or install aarch64 GRUB |
| `pacman: target not found: linux` | Manifest uses `linux` | Use `linux-aarch64` |
| `pacman: target not found: intel-ucode` | x86-only package | Remove |
| `failed to install packages: reflector` | Not available in ALARM | Remove; use the ALARM mirrorlist |
| `pacstrap` fails to resolve packages | `pacman.conf` uses x86_64 repositories | Use `pacman.aarch64.conf` |
| `EFI/BOOT/BOOTX64.EFI not found` | x86 fallback name | Use `BOOTAA64.EFI` |
| GRUB `linux` command cannot find `vmlinuz-linux` | Real image is `Image` | Symlink or update the path |
| `initramfs-linux.img not found` | The preset generated a different name | Inspect the airootfs `/boot` |
| `mksquashfs` uses `-Xbcj x86` | x86 filter on ARM | Use `arm64` |

## References

- https://github.com/archlinux/archiso
- https://gitlab.archlinux.org/archlinux/archiso
- `archiso/mkarchiso` aarch64 branches
- `configs/releng/profiledef.sh`
- `docs/README.profile.rst`
- https://archlinuxarm.org/platforms/armv8/generic
- https://archlinuxarm.org/about/package-signing
