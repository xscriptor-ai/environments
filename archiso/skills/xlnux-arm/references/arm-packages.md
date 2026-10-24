# ARM package matrix

Verified: 2026-10-24.

This page compares the 143 packages in `x/packages.x86_64` (and the identical `x/airootfs/root/x-installer/packages.x86_64`) with the Arch Linux ARM `aarch64` repositories.

Source data:

- X manifest: `x/packages.x86_64`.
- ARM data: `core`, `extra`, `alarm` and `aur` databases from `mirror.archlinuxarm.org/aarch64`, plus package pages.
- Comparison by exact `%NAME%`, not by directory prefix. This avoids false positives such as `linux` matching `linux-api-headers`.

## Summary

| Metric | Value |
|---|---:|
| Packages in the manifest | 143 |
| Available in ALARM aarch64 | 128 |
| Missing | 15 |
| Missing but non-applicable or unmaintained | 10 |
| Missing X packages that must be rebuilt | 4 |
| Missing generic kernel name | 1 |
| Native aarch64 packages | 104 |
| Architecture-independent (`any`) packages | 24 |

The 128 available packages include `amd-ucode` (present as `any`, but useless on ARM and removed by the proposed manifest) and do not include the four X packages that must be built and published: `x-release`, `x-dev`, `xfetch-bin` and `xtop-git`.

## Missing packages and actions

| Package | Why it is missing | Action |
|---|---|---|
| `linux` | ALARM has no package named `linux`; the generic kernel is `linux-aarch64` | Use `linux-aarch64`; `linux-rpi` or `linux-rpi-16k` for Raspberry Pi |
| `intel-ucode` | x86 Intel microcode | Remove |
| `syslinux` | x86 BIOS bootloader | Remove; ARM is UEFI-only |
| `memtest86+` | x86 BIOS binary | Remove |
| `memtest86+-efi` | x86 UEFI binary | Remove |
| `refind` | x86 bootloader | Use GRUB `arm64-efi` or systemd-boot `AA64` |
| `edk2-shell` | x86 UEFI shell | Remove the UEFI shell entry |
| `hyperv` | x86 Hyper-V guest package | Remove |
| `open-vm-tools` | VMware guest tools, not packaged in ALARM | Remove, or build from source if needed |
| `virtualbox-guest-utils-nox` | VirtualBox does not support ARM guests | Remove |
| `reflector` | Not packaged in ALARM | Use the static ALARM mirrorlist or GeoIP |
| `x-release` | X package (`any`) | Rebuild and publish in `[x]/aarch64` |
| `x-dev` | X package (`any`) | Rebuild; audit `nvidia.sh`, `qemu.sh`, `xfetch` and `xtop` |
| `xfetch-bin` | X package with an x86_64 binary | Publish an aarch64 binary or build from source |
| `xtop-git` | X package with `arch=('x86_64')` | Build for aarch64 with Cargo |

`amd-ucode` exists in ALARM as `core:any`, but it is AMD x86 microcode. Remove it from the ARM manifest.

## Full matrix

Status values:

- `Available`: present in ALARM aarch64 with the package name shown.
- `Caveat`: present but not useful or not appropriate for ARM.
- `Missing`: not present in the four ALARM repositories.

| # | Package | ALARM aarch64 | Repository / arch | Action |
|---:|---|---|---|---|
| 1 | `alsa-utils` | Available | extra/aarch64 | - |
| 2 | `amd-ucode` | Caveat | core/any | Remove; x86 AMD microcode |
| 3 | `arch-install-scripts` | Available | extra/any | - |
| 4 | `b43-fwcutter` | Available | core/aarch64 | - |
| 5 | `base` | Available | core/any | - |
| 6 | `bcachefs-tools` | Available | extra/aarch64 | - |
| 7 | `bind` | Available | extra/aarch64 | - |
| 8 | `bolt` | Available | extra/aarch64 | - |
| 9 | `brltty` | Available | extra/aarch64 | - |
| 10 | `btrfs-progs` | Available | core/aarch64 | - |
| 11 | `cantarell-fonts` | Available | extra/any | - |
| 12 | `clonezilla` | Available | extra/aarch64 | - |
| 13 | `cloud-init` | Available | extra/any | - |
| 14 | `cryptsetup` | Available | core/aarch64 | - |
| 15 | `darkhttpd` | Available | extra/aarch64 | - |
| 16 | `ddrescue` | Available | extra/aarch64 | - |
| 17 | `dhcpcd` | Available | extra/aarch64 | - |
| 18 | `diffutils` | Available | core/aarch64 | - |
| 19 | `dmidecode` | Available | extra/aarch64 | - |
| 20 | `dmraid` | Available | core/aarch64 | - |
| 21 | `dnsmasq` | Available | extra/aarch64 | - |
| 22 | `dosfstools` | Available | core/aarch64 | - |
| 23 | `e2fsprogs` | Available | core/aarch64 | - |
| 24 | `edk2-shell` | Missing | - | Remove; no UEFI shell entry on ARM |
| 25 | `efibootmgr` | Available | core/aarch64 | - |
| 26 | `espeakup` | Available | extra/aarch64 | - |
| 27 | `ethtool` | Available | extra/aarch64 | - |
| 28 | `exfatprogs` | Available | extra/aarch64 | - |
| 29 | `f2fs-tools` | Available | extra/aarch64 | - |
| 30 | `fatresize` | Available | extra/aarch64 | - |
| 31 | `firefox` | Available | extra/aarch64 | - |
| 32 | `foot-terminfo` | Available | extra/aarch64 | - |
| 33 | `fsarchiver` | Available | extra/aarch64 | - |
| 34 | `gpart` | Available | extra/aarch64 | - |
| 35 | `gpm` | Available | core/aarch64 | - |
| 36 | `gptfdisk` | Available | extra/aarch64 | - |
| 37 | `grml-zsh-config` | Available | extra/any | - |
| 38 | `grub` | Available | core/aarch64 | Use `--target=arm64-efi` |
| 39 | `gum` | Available | extra/aarch64 | - |
| 40 | `hdparm` | Available | core/aarch64 | - |
| 41 | `hyperv` | Missing | - | Remove; not applicable to ARM |
| 42 | `intel-ucode` | Missing | - | Remove; x86 Intel microcode |
| 43 | `irssi` | Available | extra/aarch64 | - |
| 44 | `iw` | Available | core/aarch64 | - |
| 45 | `iwd` | Available | extra/aarch64 | - |
| 46 | `jfsutils` | Available | core/aarch64 | - |
| 47 | `kitty-terminfo` | Available | extra/aarch64 | - |
| 48 | `ldns` | Available | core/aarch64 | - |
| 49 | `less` | Available | core/aarch64 | - |
| 50 | `lftp` | Available | extra/aarch64 | - |
| 51 | `libfido2` | Available | extra/aarch64 | - |
| 52 | `libusb-compat` | Available | extra/aarch64 | - |
| 53 | `linux` | Missing | - | Use `linux-aarch64` or `linux-rpi` |
| 54 | `linux-atm` | Available | extra/aarch64 | - |
| 55 | `linux-firmware` | Available | core/any | Meta-package; consider firmware splits |
| 56 | `linux-firmware-marvell` | Available | core/any | - |
| 57 | `livecd-sounds` | Available | extra/any | - |
| 58 | `lsscsi` | Available | extra/aarch64 | - |
| 59 | `lvm2` | Available | core/aarch64 | - |
| 60 | `lynx` | Available | extra/aarch64 | - |
| 61 | `man-db` | Available | core/aarch64 | - |
| 62 | `man-pages` | Available | core/any | - |
| 63 | `mc` | Available | extra/aarch64 | - |
| 64 | `mdadm` | Available | core/aarch64 | - |
| 65 | `meld` | Available | extra/any | - |
| 66 | `memtest86+` | Missing | - | Remove; x86-only |
| 67 | `memtest86+-efi` | Missing | - | Remove; x86-only |
| 68 | `mkinitcpio` | Available | core/any | - |
| 69 | `mkinitcpio-archiso` | Available | extra/any | Required for the live environment |
| 70 | `mkinitcpio-nfs-utils` | Available | core/aarch64 | - |
| 71 | `mmc-utils` | Available | extra/aarch64 | Useful on SBCs |
| 72 | `modemmanager` | Available | extra/aarch64 | - |
| 73 | `mtools` | Available | extra/aarch64 | Required for the FAT ESP |
| 74 | `nano` | Available | core/aarch64 | - |
| 75 | `nbd` | Available | extra/aarch64 | - |
| 76 | `ndisc6` | Available | extra/aarch64 | - |
| 77 | `networkmanager` | Available | extra/aarch64 | - |
| 78 | `nfs-utils` | Available | core/aarch64 | - |
| 79 | `nilfs-utils` | Available | core/aarch64 | - |
| 80 | `nmap` | Available | extra/aarch64 | - |
| 81 | `noto-fonts` | Available | extra/any | - |
| 82 | `noto-fonts-cjk` | Available | extra/any | - |
| 83 | `noto-fonts-emoji` | Available | extra/any | - |
| 84 | `noto-fonts-extra` | Available | extra/any | - |
| 85 | `ntfs-3g` | Available | extra/aarch64 | - |
| 86 | `nvme-cli` | Available | extra/aarch64 | - |
| 87 | `open-iscsi` | Available | extra/aarch64 | - |
| 88 | `open-vm-tools` | Missing | - | Remove, or build from source if needed |
| 89 | `openconnect` | Available | extra/aarch64 | - |
| 90 | `openpgp-card-tools` | Available | extra/aarch64 | - |
| 91 | `openssh` | Available | core/aarch64 | - |
| 92 | `openvpn` | Available | extra/aarch64 | - |
| 93 | `partclone` | Available | extra/aarch64 | - |
| 94 | `parted` | Available | extra/aarch64 | - |
| 95 | `partimage` | Available | extra/aarch64 | - |
| 96 | `pcsclite` | Available | extra/aarch64 | - |
| 97 | `ppp` | Available | core/aarch64 | - |
| 98 | `pptpclient` | Available | core/aarch64 | - |
| 99 | `pv` | Available | extra/aarch64 | - |
| 100 | `qemu-guest-agent` | Available | extra/aarch64 | - |
| 101 | `refind` | Missing | - | Use GRUB or systemd-boot |
| 102 | `reflector` | Missing | - | Use the ALARM mirrorlist; no reflector |
| 103 | `rsync` | Available | extra/aarch64 | - |
| 104 | `rxvt-unicode-terminfo` | Available | extra/aarch64 | - |
| 105 | `screen` | Available | extra/aarch64 | - |
| 106 | `sdparm` | Available | core/aarch64 | - |
| 107 | `sequoia-sq` | Available | extra/aarch64 | - |
| 108 | `sg3_utils` | Available | extra/aarch64 | - |
| 109 | `smartmontools` | Available | extra/aarch64 | - |
| 110 | `sof-firmware` | Available | extra/aarch64 | Intel audio DSP firmware; harmless |
| 111 | `squashfs-tools` | Available | extra/aarch64 | - |
| 112 | `sudo` | Available | core/aarch64 | - |
| 113 | `syslinux` | Missing | - | Remove; UEFI only on ARM |
| 114 | `systemd-resolvconf` | Available | core/aarch64 | - |
| 115 | `tcpdump` | Available | extra/aarch64 | - |
| 116 | `terminus-font` | Available | extra/any | - |
| 117 | `testdisk` | Available | extra/aarch64 | - |
| 118 | `tmux` | Available | extra/aarch64 | - |
| 119 | `tpm2-tools` | Available | extra/aarch64 | - |
| 120 | `tpm2-tss` | Available | core/aarch64 | - |
| 121 | `ttf-bitstream-vera` | Available | extra/any | - |
| 122 | `ttf-dejavu` | Available | extra/any | - |
| 123 | `ttf-liberation` | Available | extra/any | - |
| 124 | `ttf-opensans` | Available | extra/any | - |
| 125 | `udftools` | Available | extra/aarch64 | - |
| 126 | `usb_modeswitch` | Available | extra/aarch64 | - |
| 127 | `usbmuxd` | Available | extra/aarch64 | - |
| 128 | `usbutils` | Available | core/aarch64 | - |
| 129 | `vim` | Available | extra/aarch64 | - |
| 130 | `virtualbox-guest-utils-nox` | Missing | - | Remove; VirtualBox does not support ARM guests |
| 131 | `vpnc` | Available | extra/aarch64 | - |
| 132 | `wireless-regdb` | Available | core/any | - |
| 133 | `wireless_tools` | Available | extra/aarch64 | - |
| 134 | `wpa_supplicant` | Available | core/aarch64 | - |
| 135 | `wvdial` | Available | extra/aarch64 | - |
| 136 | `x-dev` | Missing | - | Rebuild for aarch64; audit helpers |
| 137 | `xdg-utils` | Available | extra/any | - |
| 138 | `xfetch-bin` | Missing | - | Publish an aarch64 binary or build from source |
| 139 | `xfsprogs` | Available | core/aarch64 | - |
| 140 | `xl2tpd` | Available | extra/aarch64 | - |
| 141 | `x-release` | Missing | - | Rebuild; `any` package |
| 142 | `xtop-git` | Missing | - | Build for aarch64 with Cargo |
| 143 | `zsh` | Available | extra/aarch64 | - |

## Packages to add

The ARM manifest needs these packages in addition to the 128 available entries:

| Package | Reason |
|---|---|
| `linux-aarch64` | Generic aarch64 kernel; replaces `linux` |
| `linux-aarch64-headers` | Kernel headers for module builds |
| `archlinuxarm-keyring` | ALARM signing keys |
| `pacman-mirrorlist` | ALARM mirrorlist |
| `firmware-raspberrypi` | Raspberry Pi Wi-Fi/Bluetooth (RPi only) |
| `raspberrypi-bootloader` | Raspberry Pi VideoCore firmware (RPi only) |
| `raspberrypi-overlays` | Raspberry Pi device tree overlays (RPi only) |
| `uboot-raspberrypi` | Raspberry Pi U-Boot flow (RPi only; conflicts with `linux-rpi`) |
| `raspberry-pi5-c0-armstub` | Raspberry Pi 5 mainline boot (RPi 5 only) |
| `raspberry-pi5-d0-armstub` | Raspberry Pi 5 mainline boot (RPi 5 only) |
| `uboot-tools` | `mkimage` for SBC U-Boot scripts |
| `linux-firmware-broadcom` | Broadcom firmware split (optional) |
| `linux-firmware-mediatek` | MediaTek firmware split (optional) |
| `linux-firmware-marvell` | Marvell firmware split (optional) |

Do not add `edk2-shell`, `syslinux`, `memtest86+`, `refind`, `intel-ucode`, `hyperv`, `virtualbox-guest-utils-nox` or `open-vm-tools`.

## Bootstrap and live manifests

`x/bootstrap_packages.x86_64` contains:

```text
arch-install-scripts
base
```

It is architecture-independent. `bootstrap_packages.aarch64` can be identical.

The live manifest `x/airootfs/root/x-installer/packages.x86_64` has the same 143 entries as `x/packages.x86_64`. It must be split into `packages.aarch64` with the same removals and additions.

## X-owned packages

| Package | Current `arch` | Works on ARM | Action |
|---|---|---|---|
| `x-release` | `any` | Yes; branding and GRUB hooks | Rebuild and publish in `repo/aarch64` |
| `x-dev` | `any` | Partly | Rebuild; audit `nvidia.sh`, `qemu.sh`, `xfetch`/`xtop` |
| `x-scripts` | `any` | Yes; pure Bash | Reuse the same artifact |
| `xpm` | `x86_64` in the repo | Yes when built on aarch64 | Publish an aarch64 binary in `[x]` |
| `xpkg` | `x86_64` in the repo | Yes when built on aarch64 | Publish an aarch64 binary in `[x]` |
| `xfetch-bin` | `x86_64` | Not with the current binary | Find an aarch64 release or compile |
| `xtop-git` | `x86_64` | Yes when compiled | Build with Cargo on aarch64 |
| `opencode-bin` | `x86_64` | Not with the current binary | Find a `linux-arm64` release or exclude |

`x-scripts` is the best case: one `any` artifact serves both architectures. The other X binaries need an architecture matrix.

## Firmware choices

`linux-firmware` is a meta-package. On ARM, the useful splits depend on the target:

- Generic servers and QEMU: `linux-firmware` plus the relevant vendor split.
- Raspberry Pi: `firmware-raspberrypi`, `linux-firmware-broadcom`.
- Marvell devices: `linux-firmware-marvell`.
- MediaTek devices: `linux-firmware-mediatek`.

Do not assume that every x86 firmware package has an ARM equivalent. `sof-firmware` is Intel audio DSP firmware; it is harmless but not useful on most ARM systems.

## Kernel header names

The installer currently derives headers as `$KERNEL-headers`. On ARM the names are:

| Kernel | Headers |
|---|---|
| `linux-aarch64` | `linux-aarch64-headers` |
| `linux-aarch64-chromebook` | `linux-aarch64-headers` (split package) |
| `linux-rpi` | `linux-rpi-headers` |
| `linux-rpi-16k` | `linux-rpi-16k-headers` |

The current `$KERNEL-headers` rule works for `linux-rpi` but not for `linux-aarch64` unless the installer uses the correct name.

## Regenerating the matrix

```bash
mkdir -p /tmp/alarmdb && cd /tmp/alarmdb
for r in core extra alarm aur; do
  curl -fsSL "http://mirror.archlinuxarm.org/aarch64/$r/$r.db.tar.gz" -o "$r.db.tar.gz"
  mkdir -p "$r" && tar -xzf "$r.db.tar.gz" -C "$r"
done

python3 - <<'PY'
import re
from pathlib import Path

manifest = Path("/path/to/equislinux/x/packages.x86_64").read_text().split()
have = {}
for repo in ("core", "extra", "alarm", "aur"):
    for desc in Path(repo).glob("*/desc"):
        text = desc.read_text()
        name = re.search(r"%NAME%\n(.+)", text)
        arch = re.search(r"%ARCH%\n(.+)", text)
        if name:
            have[name.group(1)] = (repo, arch.group(1) if arch else "?")

missing = [p for p in manifest if p not in have]
print(f"{len(manifest)} total, {len(manifest) - len(missing)} present, {len(missing)} missing")
for p in missing:
    print(p)
PY
```

## References

- https://archlinuxarm.org/packages
- https://archlinuxarm.org/packages/aarch64/linux-aarch64
- https://archlinuxarm.org/packages/aarch64/linux-rpi
- https://archlinuxarm.org/packages/aarch64/grub
- https://archlinuxarm.org/packages/aarch64/systemd
- https://archlinuxarm.org/packages/aarch64/archlinuxarm-keyring
