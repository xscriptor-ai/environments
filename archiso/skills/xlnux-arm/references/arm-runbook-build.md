# Runbook: build the aarch64 ISO

Purpose: produce `x-<date>-aarch64.iso` on a native Arch Linux ARM host, verify it, and collect the artefacts needed for installation and release.

This runbook assumes the implementation phases that add `packages.aarch64`, `pacman.aarch64.conf` and the architecture-aware profile.

## Pre-flight

- [ ] Architecture is aarch64: `uname -m`.
- [ ] Arch Linux ARM is installed and up to date.
- [ ] `archlinuxarm-keyring` is installed and populated.
- [ ] `archiso` is installed from source or from a local package.
- [ ] `grub` is the aarch64 package with `arm64-efi`.
- [ ] `mkinitcpio-archiso` is installed.
- [ ] At least 25 GiB free for `work/` and `out/`.
- [ ] Network access to `mirror.archlinuxarm.org` and `equislinux.github.io`.
- [ ] The X project key public file is available (`x-repo.pub`).
- [ ] `SOURCE_DATE_EPOCH` is set for a reproducible build.

## Host preparation

```bash
sudo pacman -Syu --needed \
  arch-install-scripts dosfstools e2fsprogs findutils grub gzip \
  libarchive libisoburn mtools openssl pacman sed squashfs-tools \
  mkinitcpio-archiso python sudo git

# archiso from source
git clone https://github.com/archlinux/archiso.git /tmp/archiso
sudo make -C /tmp/archiso install

# Verify
mkarchiso -h >/dev/null
pacman -Q archlinuxarm-keyring grub systemd mkinitcpio-archiso
ls /usr/lib/grub/arm64-efi >/dev/null
```

If `/usr/lib/grub/arm64-efi` is missing, the host has the x86_64 GRUB package. Install the aarch64 GRUB package or build on an ARM host.

## Keyring

```bash
sudo pacman-key --init
sudo pacman-key --populate archlinuxarm

# X project key for the live environment
sudo pacman-key --add /path/to/x-repo.pub
sudo pacman-key --lsign-key <X_KEY_FPR>
```

The build host can use `SigLevel = Never` for `[x]` as today; the live and target environments use `Required`.

## Profile configuration

```bash
cd x
export X_ARCH=aarch64
export SOURCE_DATE_EPOCH="${SOURCE_DATE_EPOCH:-$(date +%s)}"

bash -n profiledef.sh
grep -E 'arch=|packages_file=|pacman_conf=|bootmodes=' profiledef.sh
```

Expected:

```text
arch="aarch64"
packages_file="packages.aarch64"
pacman_conf="pacman.aarch64.conf"
bootmodes=('uefi.grub')
```

Check the package list:

```bash
grep -E '^(linux|linux-aarch64|grub|efibootmgr|archlinuxarm-keyring|pacman-mirrorlist|syslinux|reflector)$' packages.aarch64
```

Expected: the ARM packages are present; the x86-only ones are absent.

## Clean state

```bash
sudo umount -Rl work/aarch64/airootfs 2>/dev/null || true
sudo rm -rf work out
```

Do not delete `out/` if you need previous artefacts for comparison; move them aside first.

## Build

```bash
sudo env X_ARCH=aarch64 SOURCE_DATE_EPOCH="$SOURCE_DATE_EPOCH" ./xbuild.sh
```

or directly:

```bash
sudo env X_ARCH=aarch64 SOURCE_DATE_EPOCH="$SOURCE_DATE_EPOCH" \
  mkarchiso -v -w ./work -o ./out .
```

Expected output:

```text
out/x-<date>-aarch64.iso
out/x-<date>-aarch64.iso.sha256   # if the release script is used
build-<timestamp>.log
```

Build time depends on CPU and network. Native 8-core ARM: 15-40 minutes. TCG cross-build: hours.

## Verification

### File and hash

```bash
ISO="$(ls -t out/*-aarch64.iso | head -1)"
ls -lh "$ISO"
sha256sum "$ISO" | tee "${ISO}.sha256"
file "$ISO"
```

### El Torito and EFI entry

```bash
xorriso -report_el_torito as_mkisofs "$ISO" | grep -i -A2 efi
```

Expected: an EFI entry that references `BOOTAA64.EFI`.

### ISO contents

```bash
bsdtar -tf "$ISO" | grep -E \
  'EFI/BOOT/BOOTAA64.EFI|arch/aarch64/airootfs.sfs|arch/boot/aarch64/(Image|vmlinuz)|arch/boot/aarch64/initramfs'
```

Expected:

```text
EFI/BOOT/BOOTAA64.EFI
arch/aarch64/airootfs.sfs
arch/boot/aarch64/Image
arch/boot/aarch64/initramfs-linux.img
```

### Squashfs sanity

```bash
mkdir -p /tmp/x-iso-root
bsdtar -xf "$ISO" -C /tmp/x-iso-root arch/aarch64/airootfs.sfs
unsquashfs -l /tmp/x-iso-root/arch/aarch64/airootfs.sfs | grep -E '^/usr/bin/pacman$|^/boot/Image$|^/usr/bin/x$'
```

### Kernel and initramfs

```bash
unsquashfs -ll /tmp/x-iso-root/arch/aarch64/airootfs.sfs /boot | sed -n '1,40p'
```

You should see `Image`, `Image.gz`, `initramfs-linux.img` and `vmlinuz-linux` only if the compatibility symlink is present.

## QEMU smoke test

```bash
cp /usr/share/edk2/aarch64/QEMU_VARS.fd /tmp/AAVMF_VARS.fd
qemu-img create -f qcow2 /tmp/x-aarch64.qcow2 32G

qemu-system-aarch64 \
  -M virt -cpu max -smp 4 -m 4096 \
  -drive if=pflash,format=raw,readonly=on,file=/usr/share/edk2/aarch64/QEMU_EFI.fd \
  -drive if=pflash,format=raw,file=/tmp/AAVMF_VARS.fd \
  -drive if=none,id=cdrom,media=cdrom,readonly=on,file="$ISO" \
  -device virtio-scsi-pci -device scsi-cd,drive=cdrom \
  -drive if=virtio,format=qcow2,file=/tmp/x-aarch64.qcow2 \
  -netdev user,id=n0 -device virtio-net-pci,netdev=n0 \
  -nographic
```

Expected:

- UEFI firmware output on the serial console.
- GRUB menu with the X entries.
- Linux boots and reaches the live prompt or the installer.
- `uname -m` inside the live environment is `aarch64`.

If no serial output appears, the kernel command line is missing `console=ttyAMA0`.

## Automated e2e

```bash
python3 x/tests/e2e-autoinstall.py \
  --arch aarch64 --mode uefi \
  --iso "$ISO" \
  --profile core --encryption no \
  --timeout 5400
```

Expected artifacts:

- Disk image.
- Serial log.
- QEMU log.
- Assertion output for generation `0001`.

## Reproducibility

- Fix `SOURCE_DATE_EPOCH`.
- Use the same ALARM mirror snapshot or package cache.
- Record package versions from `pacman -Q` inside the build root or from the ISO.
- Record the archiso version and the `mkarchiso` commit.
- Record the X commit for `x`, `scripts`, `x-repo` and `xpm`/`xpkg`.
- Compare two builds with `sha256sum`; do not expect bit-identical output if package timestamps differ.

## Artefact collection

```bash
mkdir -p artifacts/arm-$(date +%Y%m%d)
cp "$ISO" "${ISO}.sha256" artifacts/arm-$(date +%Y%m%d)/
cp build-*.log artifacts/arm-$(date +%Y%m%d)/
cp profiledef.sh packages.aarch64 pacman.aarch64.conf artifacts/arm-$(date +%Y%m%d)/
```

## Troubleshooting

| Symptom | Likely cause | Action |
|---|---|---|
| `syslinux: target not found` | ARM profile still has `bios.syslinux` or `syslinux` | Remove from profile and manifest |
| `grub-mkstandalone: cannot find module` | x86_64 GRUB host | Build on aarch64 or install aarch64 GRUB |
| `pacman: target not found: linux` | Manifest uses `linux` | Use `linux-aarch64` |
| `pacman: target not found: reflector` | ALARM does not package it | Remove |
| `pacstrap` cannot resolve packages | x86_64 `pacman.conf` | Use `pacman.aarch64.conf` |
| ISO has no `BOOTAA64.EFI` | Wrong boot mode or GRUB target | Use `uefi.grub` and aarch64 GRUB |
| No serial output in QEMU | Missing `console=ttyAMA0` | Add it to the menu and kernel cmdline |
| Build hangs at `mount` | Stale loop mount | `sudo umount -Rl work/aarch64/airootfs` |
| Out of space | `work/` and `out/` size | Free 25 GiB or move `out/` |
| Squashfs uses x86 BCJ | `-Xbcj x86` | Use `arm64` |

## Cleanup

```bash
sudo umount -Rl work 2>/dev/null || true
sudo rm -rf work
```

Keep `out/` until the artefact is signed and uploaded.

## References

- [archiso port](arm-archiso.md)
- [Testing and CI](arm-testing.md)
- [Checklists](arm-checklists.md)
- `arm-references.md` for archiso and ALARM sources
