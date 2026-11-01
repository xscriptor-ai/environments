# Proposed ARM snippets

These snippets are proposals. None of them has been applied to the build system. Review them before copying anything into `x/`, `scripts/` or `x-repo/`.

## Architecture-aware `profiledef.sh`

```bash
#!/usr/bin/env bash
# shellcheck disable=SC2034

: "${X_ARCH:=$(uname -m)}"

iso_name="x"
iso_label="x_$(date --date="@${SOURCE_DATE_EPOCH:-$(date +%s)}" +%Y%m)"
iso_publisher="Xscriptor <https://xscriptor.io/x>"
iso_application="X Live/Rescue DVD"
iso_version="$(date --date="@${SOURCE_DATE_EPOCH:-$(date +%s)}" +%Y.%m.%d)"
install_dir="arch"
airootfs_image_type="squashfs"
bootstrap_tarball_compression=('zstd' '-c' '-T0' '--auto-threads=logical' '--long' '-19')

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

file_permissions=(
  ["/etc/shadow"]="0:0:400"
  ["/root"]="0:0:750"
  ["/root/.automated_script.sh"]="0:0:755"
  ["/root/.gnupg"]="0:0:700"
  ["/usr/local/bin/choose-mirror"]="0:0:755"
  ["/usr/local/bin/Installation_guide"]="0:0:755"
  ["/usr/local/bin/livecd-sound"]="0:0:755"
  ["/usr/local/bin/x-repo-key"]="0:0:755"
  ["/usr/local/bin/xinstall"]="0:0:755"
)
```

## Host `pacman.aarch64.conf`

This is for the build host. The live environment uses `[x]` with `SigLevel = Required`.

```ini
[options]
HoldPkg     = pacman glibc
Architecture = aarch64
ParallelDownloads = 5
SigLevel    = Required DatabaseOptional
LocalFileSigLevel = Optional

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

## Live `pacman.conf`

```ini
[options]
HoldPkg     = pacman glibc
Architecture = aarch64
ParallelDownloads = 5
SigLevel    = Required DatabaseOptional
LocalFileSigLevel = Optional

[x]
SigLevel = Required
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

## ALARM mirrorlist

```ini
Server = http://mirror.archlinuxarm.org/$arch/$repo

# Optional country mirror:
# Server = http://de.mirror.archlinuxarm.org/$arch/$repo
# Server = http://fr.mirror.archlinuxarm.org/$arch/$repo
```

## `packages.aarch64`

Base: 143 x86_64 entries minus the 10 non-applicable packages, `amd-ucode` and `linux`, plus `linux-aarch64`, `linux-aarch64-headers`, `archlinuxarm-keyring` and `pacman-mirrorlist`. Total: 135.

The four X packages `x-release`, `x-dev`, `xfetch-bin` and `xtop-git` remain in the list. They must be published in `[x]/aarch64` before the manifest works as-is. If `xfetch` or `opencode` has no ARM build, remove or comment them.

```text
alsa-utils
arch-install-scripts
b43-fwcutter
base
bcachefs-tools
bind
bolt
brltty
btrfs-progs
clonezilla
cloud-init
cryptsetup
darkhttpd
ddrescue
dhcpcd
diffutils
dmidecode
dmraid
dnsmasq
dosfstools
e2fsprogs
efibootmgr
espeakup
ethtool
exfatprogs
f2fs-tools
fatresize
foot-terminfo
fsarchiver
gpart
gpm
gptfdisk
grml-zsh-config
grub
hdparm
irssi
iw
iwd
jfsutils
kitty-terminfo
ldns
less
lftp
libfido2
libusb-compat
linux-atm
linux-aarch64
linux-aarch64-headers
archlinuxarm-keyring
pacman-mirrorlist
linux-firmware
linux-firmware-marvell
livecd-sounds
lsscsi
lvm2
lynx
man-db
man-pages
mc
mdadm
meld
mkinitcpio
mkinitcpio-archiso
mkinitcpio-nfs-utils
mmc-utils
modemmanager
mtools
nano
nbd
ndisc6
networkmanager
nfs-utils
nilfs-utils
nmap
noto-fonts
noto-fonts-cjk
noto-fonts-emoji
noto-fonts-extra
ntfs-3g
nvme-cli
open-iscsi
openconnect
openpgp-card-tools
openssh
openvpn
partclone
parted
partimage
pcsclite
ppp
pptpclient
pv
qemu-guest-agent
rsync
rxvt-unicode-terminfo
screen
sdparm
sequoia-sq
sg3_utils
smartmontools
sof-firmware
squashfs-tools
sudo
systemd-resolvconf
tcpdump
terminus-font
testdisk
tmux
tpm2-tools
tpm2-tss
ttf-bitstream-vera
ttf-dejavu
ttf-liberation
ttf-opensans
udftools
usb_modeswitch
usbmuxd
usbutils
vim
vpnc
wireless-regdb
wireless_tools
wpa_supplicant
wvdial
xdg-utils
xfsprogs
xl2tpd
zsh

## X
x-release
x-dev

## X tools
xfetch-bin
xtop-git

## Installer (text)
gum
```

## Installer excerpts

### Architecture detection

```bash
ARCH="$(uname -m)"
case "$ARCH" in
  x86_64)  BOOT_TARGET="x86_64-efi"; PKGLIST_ARCH="x86_64" ;;
  aarch64) BOOT_TARGET="arm64-efi";  PKGLIST_ARCH="aarch64" ;;
  *) echo "installer: unsupported architecture '$ARCH'" >&2; exit 1 ;;
esac
```

### Kernel default

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

### Keyring

```bash
pacman-key --init
if [[ "$ARCH" == aarch64 ]]; then
  pacman-key --populate archlinuxarm
else
  pacman-key --populate archlinux
fi
LIVE_KEY=/etc/pacman.d/x-repo.pub
```

### systemd-boot names

```bash
if [[ "$ARCH" == aarch64 ]]; then
  SB_EFI="systemd-bootaa64.efi"
  SB_FALLBACK="BOOTAA64.EFI"
else
  SB_EFI="systemd-bootx64.efi"
  SB_FALLBACK="BOOTX64.EFI"
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

### Kernel symlinks

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

## Kernel helper functions

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
```

## QEMU launcher

```bash
#!/usr/bin/env bash
set -euo pipefail

ISO="${1:?usage: $0 <iso> [disk.qcow2]}"
DISK="${2:-/tmp/x-aarch64.qcow2}"
VARS="$(mktemp /tmp/AAVMF_VARS.XXXXXX.fd)"
EFI="${X_QEMU_EFI:-/usr/share/edk2/aarch64/QEMU_EFI.fd}"
VARS_SRC="${X_QEMU_VARS:-/usr/share/edk2/aarch64/QEMU_VARS.fd}"

[[ -f "$EFI" ]] || { echo "missing $EFI; install edk2-aarch64" >&2; exit 1; }
[[ -f "$VARS_SRC" ]] || { echo "missing $VARS_SRC" >&2; exit 1; }
[[ -f "$ISO" ]] || { echo "missing ISO $ISO" >&2; exit 1; }

cp "$VARS_SRC" "$VARS"
[[ -f "$DISK" ]] || qemu-img create -f qcow2 "$DISK" 32G

exec qemu-system-aarch64 \
  -M virt \
  -cpu "${X_QEMU_CPU:-max}" \
  -smp "${X_QEMU_SMP:-4}" \
  -m "${X_QEMU_RAM:-4096}" \
  -drive if=pflash,format=raw,readonly=on,file="$EFI" \
  -drive if=pflash,format=raw,file="$VARS" \
  -drive if=none,id=cdrom,media=cdrom,readonly=on,file="$ISO" \
  -device virtio-scsi-pci \
  -device scsi-cd,drive=cdrom \
  -drive if=virtio,format=qcow2,file="$DISK" \
  -netdev user,id=n0 \
  -device virtio-net-pci,netdev=n0 \
  -nographic
```

## CI skeleton

```yaml
name: build-aarch64

on:
  workflow_dispatch:
  push:
    branches: [main]
    paths:
      - 'x/**'
      - 'scripts/**'
      - '.github/workflows/build-aarch64.yml'

permissions:
  contents: read

jobs:
  iso:
    runs-on: [self-hosted, linux, arm64, arch]
    steps:
      - uses: actions/checkout@v4

      - name: Verify ALARM host
        run: |
          uname -m | grep -qx aarch64
          pacman -Q archlinuxarm-keyring grub systemd mkinitcpio-archiso
          command -v mkarchiso

      - name: Build
        run: |
          cd x
          sudo pacman-key --init
          sudo pacman-key --populate archlinuxarm
          sudo env X_ARCH=aarch64 ./xbuild.sh

      - name: Verify
        run: |
          ISO="$(ls -t x/out/*-aarch64.iso | head -1)"
          xorriso -report_el_torito as_mkisofs "$ISO" | grep -i BOOTAA64

      - name: E2E
        run: |
          ISO="$(ls -t x/out/*-aarch64.iso | head -1)"
          python3 x/tests/e2e-autoinstall.py \
            --arch aarch64 --mode uefi --iso "$ISO" \
            --profile core --encryption no --timeout 5400
```

## Release schema

```json
{
  "latest_by_arch": {
    "x86_64": "2026.10.18",
    "aarch64": "2026.11.01"
  },
  "releases": [
    {
      "version": "2026.11.01",
      "arch": "aarch64",
      "name": "x-2026.11.01-aarch64.iso",
      "url": "https://sourceforge.net/projects/equislinux/files/iso/x-2026.11.01-aarch64.iso/download",
      "sig": "https://sourceforge.net/projects/equislinux/files/iso/x-2026.11.01-aarch64.iso.sig/download",
      "sha256": "<sha256>"
    }
  ]
}
```

## `x-repo` build script diff

```diff
-REPO_DIR="public/repo/x86_64"
-XPM_DIR="public/x/x86_64"
+ARCH="${X_ARCH:-$(uname -m)}"
+case "$ARCH" in
+  x86_64|aarch64|armv7h) ;;
+  *) echo "build-packages: unsupported arch '$ARCH'" >&2; exit 1 ;;
+esac
+REPO_DIR="public/repo/$ARCH"
+XPM_DIR="public/x/$ARCH"
+mkdir -p "$REPO_DIR" "$XPM_DIR"
```

```diff
-if [[ "$BUILD" == "1" ]]; then
-    build_pkgbuild x-release
-    build_pkgbuild x-dev
-    build_pkgbuild opencode-bin
-    build_pkgbuild xfetch
-    build_pkgbuild xtop
+if [[ "$BUILD" == "1" ]]; then
+    build_pkgbuild x-release
+    build_pkgbuild x-dev
+    if [[ "$ARCH" == "x86_64" ]]; then
+        build_pkgbuild opencode-bin
+        build_pkgbuild xfetch
+    fi
+    build_pkgbuild xtop
 else
```

```diff
-echo "Commit public/repo/x86_64/ and push, then run the deploy workflow."
+echo "Commit public/repo/$ARCH/ and public/x/$ARCH/, then run the deploy workflow."
```

## Web docs registration

Add the ARM pages to the `x` section in `web/lib/docs.ts`:

```ts
files: [
  'index',
  'building',
  'installer',
  'vm-testing',
  'project-layout',
  'arm',
  'arm-alarm',
  'arm-audit',
  'arm-packages',
  'arm-archiso',
  'arm-installer',
  'arm-generations',
  'arm-tooling',
  'arm-testing',
  'arm-devices',
  'arm-roadmap',
  'arm-references',
  'arm-snippets',
],
```

## Safety notes

- Do not apply these snippets without reviewing [ARM packages](arm-packages.md) and [Roadmap and risks](arm-roadmap.md).
- Do not set `SigLevel = DatabaseRequired` for ALARM.
- Do not assume `vmlinuz-*` or `pkgbase` on ARM.
- Do not remove `bios.syslinux` from the x86_64 profile; make the profile architecture-aware.
- Do not commit or push without explicit approval.

## References

- [ARM references](arm-references.md) for sources and verification commands.
- [Implementation plan](arm-implementation.md) for the PR sequence.
- [archiso port](arm-archiso.md), [Installer](arm-installer.md), [Generations](arm-generations.md), [Tooling and repository](arm-tooling.md).
- archiso: https://github.com/archlinux/archiso.
- ALARM: https://archlinuxarm.org/about.
