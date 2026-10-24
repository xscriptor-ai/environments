# ARM devices and platforms

This page covers the ARM targets that are not a generic UEFI aarch64 machine: ARMv7, Raspberry Pi, generic SBCs, Apple Silicon (Asahi) and WSL on Windows ARM64.

## Scope decision

| Platform | Architecture | Boot | v1 | Notes |
|---|---|---|---|---|
| ARM server (Ampere, Graviton, Neoverse) | aarch64 | UEFI | Yes | Main v1 target |
| QEMU `virt` with edk2 | aarch64 | UEFI | Yes | CI target |
| Raspberry Pi 4/5 | aarch64 | firmware or U-Boot | No, v2 | Separate image flow |
| Raspberry Pi 3/2/Zero 2 | aarch64/armv7h | firmware or U-Boot | No, v2/v3 | Vendor kernel or mainline |
| Generic SBC (Rockchip, Allwinner, Amlogic, etc.) | aarch64/armv7h | U-Boot | No, v3 | Board-specific DTBs |
| Apple Silicon (Asahi) | aarch64 | m1n1 + U-Boot | No | Separate platform stack |
| Windows 11 ARM64 + WSL2 | aarch64 | WSL | No | Separate rootfs product |

v1 deliberately targets UEFI only. SBCs do not use an ISO and require board-specific boot configuration.

## ARMv7 (`armv7h`)

### Differences from aarch64

| Aspect | `armv7h` | `aarch64` |
|---|---|---|
| ISA | ARMv7-A + NEON, 32-bit | ARMv8-A, 64-bit |
| ALARM kernel | `linux-rpi` and board kernels | `linux-aarch64`, `linux-rpi` |
| UEFI | Rare | Common on servers and QEMU |
| Boot | U-Boot plus extlinux or boot.scr; Raspberry Pi firmware | UEFI (GRUB/systemd-boot) or U-Boot |
| archiso ISO | Not practical | Yes, UEFI |
| Repo | `armv7h/{core,extra,alarm,aur}` | `aarch64/{core,extra,alarm,aur}` |
| `pacman` arch | `armv7h` | `aarch64` |
| Rust `std::env::consts::ARCH` | `arm` | `aarch64` |
| X v1 | No | Yes |

### Tooling changes for armv7h

`xpm` must normalise `arm` to `armv7h`:

```rust
fn pacman_arch() -> String {
    match std::env::consts::ARCH {
        "arm" => "armv7h".to_string(),
        other => other.to_string(),
    }
}
```

`xpkg` needs `CARCH=armv7h` and the ALARM `CHOST`/toolchain. `x-repo` needs `public/repo/armv7h` and `public/x/armv7h`. The installer would need U-Boot/extlinux, no GRUB `arm64-efi` and no systemd-boot. This is a separate project.

### Why armv7h is out of v1

- Two userlands, two toolchains, two boot paths.
- Most new hardware is aarch64.
- SBC support is board-specific regardless of architecture.
- The value is lower than a clean aarch64/UEFI port.

## Raspberry Pi

### Models

| Model | SoC | ARMv7 | AArch64 | Notes |
|---|---|---|---|---|
| Raspberry Pi 2 | BCM2836/2837 | Yes | Yes on 2837 | ARMv7 is the official path |
| Raspberry Pi 3 | BCM2837 | Yes | Yes | `linux-aarch64` or `linux-rpi` |
| Raspberry Pi 4 | BCM2711 | Yes | Yes | USB 3, Gigabit Ethernet, 3A supply recommended |
| Raspberry Pi 5 | BCM2712 | No | Yes | `linux-rpi-16k` or `linux-aarch64` plus armstub |
| Raspberry Pi Zero 2 | BCM2710 | Yes | Yes | Limited resources |

### Official ALARM flow

Raspberry Pi 4, ARMv7:

```bash
fdisk /dev/sdX
# create a FAT32 boot partition (1G) and an ext4 root partition
mkfs.vfat /dev/sdX1
mkfs.ext4 /dev/sdX2
mkdir boot root
mount /dev/sdX1 boot
mount /dev/sdX2 root
wget http://os.archlinuxarm.org/os/ArchLinuxARM-rpi-armv7-latest.tar.gz
bsdtar -xpf ArchLinuxARM-rpi-armv7-latest.tar.gz -C root
mv root/boot/* boot
umount boot root
```

AArch64:

```bash
wget http://os.archlinuxarm.org/os/ArchLinuxARM-rpi-aarch64-latest.tar.gz
# same partitioning and extraction
sed -i 's/mmcblk0/mmcblk1/g' root/etc/fstab
```

The `mmcblk0` to `mmcblk1` change reflects how Raspberry Pi 4 enumerates the SD card.

### Firmware boot

The VideoCore firmware loads from the FAT partition:

```text
bootcode.bin
start.elf
fixup.dat
config.txt
cmdline.txt
kernel8.img
initramfs-linux.img
*.dtb
overlays/
```

`config.txt` from `linux-rpi` contains:

```ini
initramfs initramfs-linux.img followkernel
camera_auto_detect=1
display_auto_detect=1
dtoverlay=vc4-kms-v3d
max_framebuffers=2
disable_fw_kms_setup=1
disable_overscan=1
```

`cmdline.txt`:

```text
root=/dev/mmcblk0p2 rw rootwait console=serial0,115200 console=tty1 fsck.repair=yes
```

For X:

- Copy `config.txt`, `cmdline.txt`, `kernel8.img`, `initramfs-linux.img`, DTBs and overlays to the FAT partition.
- Prefer `root=PARTUUID=...` over `mmcblk0p2`.
- Do not install GRUB or systemd-boot in firmware mode.
- Generations require either rewriting `kernel8.img`/`initramfs-linux.img` or using U-Boot with a menu.

### U-Boot boot

Package: `uboot-raspberrypi 2025.01-2` (`alarm`, `aarch64` and `armv7h`).

`linux-rpi` conflicts with `uboot-raspberrypi`. Choose one:

- Vendor firmware: `linux-rpi` + `raspberrypi-bootloader` + `config.txt`.
- Mainline/U-Boot: `linux-aarch64` or `linux-rpi` without the conflicting vendor package, plus `uboot-raspberrypi`.

Example `extlinux.conf`:

```ini
DEFAULT x
LABEL x
  LINUX /Image
  INITRD /initramfs-linux.img
  APPEND root=PARTUUID=... rw rootwait console=serial0,115200
```

Example `boot.cmd`:

```text
setenv bootargs 'root=PARTUUID=... rw rootwait console=serial0,115200'
load mmc 0:1 ${kernel_addr_r} Image
load mmc 0:1 ${ramdisk_addr_r} initramfs-linux.img
booti ${kernel_addr_r} ${ramdisk_addr_r}:${filesize} ${fdt_addr_r}
```

U-Boot `booti` boots a Linux kernel in flat or compressed `Image` format. The `initrd`, size and `fdt` arguments are optional but required for a useful boot. `extlinux.conf` is the portable configuration format; `boot.scr` is U-Boot-specific.

### Raspberry Pi 5

- Requires `linux-rpi-16k` or `linux-aarch64` plus `raspberry-pi5-c0-armstub` or `raspberry-pi5-d0-armstub`.
- The armstub is required for the mainline kernel on Raspberry Pi 5.
- `config.txt` and `cmdline.txt` still apply.
- Not a v1 target.

### Why Raspberry Pi is not an ISO

- The firmware expects a FAT boot partition with specific files.
- There is no standard UEFI firmware on the board by default.
- `config.txt` and DTBs are board-specific.
- Generations and rollback need a bootloader menu or kernel file rewriting.

Recommended v2: a separate `x-rpi-image.sh` that creates a `.img` or writes to an SD card.

## Generic SBCs

### ALARM platform coverage

ARMv7 platforms include AllWinner, Amlogic, Broadcom, Freescale, Marvell, Rockchip, Samsung, TI and Xilinx boards. ARMv8 platforms include AllWinner, Amlogic, ARM, Broadcom, Marvell, MediaTek, Qualcomm and Rockchip boards, plus Generic.

### Boot flow

- U-Boot on SPI, eMMC or SD.
- `extlinux/extlinux.conf` or `boot.scr`.
- Kernel plus a board-specific DTB from `/boot/dtbs/<vendor>/<board>.dtb`.
- Root filesystem on ext4 or btrfs.

### U-Boot packages in ALARM

```text
uboot-dragonboard410c
uboot-espressobin
uboot-macchiatobin
uboot-odroid-c2
uboot-odroid-c2-mainline
uboot-odroid-m1
uboot-odroid-n2
uboot-pine64
uboot-raspberrypi
uboot-rock64
uboot-tools
```

### Why SBCs are v3

- One image per board or a board detection layer.
- U-Boot and DTB selection are board-specific.
- No universal ISO.
- Testing requires real hardware.

## Apple Silicon (Asahi)

Asahi Linux targets Macs with M-series SoCs. It is not an official ALARM platform and it is not a standard UEFI boot.

Boot chain:

```text
iBoot -> m1n1 -> U-Boot -> GRUB/systemd-boot -> Asahi kernel -> userspace
```

Reasons to exclude it from v1:

1. It is not official ALARM; packages come from community repositories and AUR.
2. It requires a platform-specific kernel with AGX/DPC and other drivers.
3. The boot chain uses m1n1 and U-Boot, not a normal ESP UEFI flow.
4. Breaking the boot of a Mac is expensive.
5. Each SoC generation needs new work.

Asahi's reference distribution is Fedora Asahi Remix. Arch Linux ARM on Apple Silicon is community-supported, not an official ALARM target.

## WSL on Windows ARM64

Windows 11 ARM64 supports WSL2 and can run aarch64 distributions. The current X WSL rootfs is x86_64.

To support WSL ARM:

1. Build an aarch64 rootfs with `pacstrap` on an ARM host, or with binfmt.
2. Use `pacman.aarch64.conf` and `archlinuxarm-keyring`.
3. Keep the WSL kernel provided by Windows; do not install a kernel in the rootfs.
4. Adjust `wsl-scripts` for aarch64 packages and paths.
5. Validate on Windows 11 ARM64 or a VM.

WSL ARM is a separate product and is not part of v1.

## Graphics and desktop support

| Platform | Driver | Hyprland | Notes |
|---|---|---|---|
| ARM servers without GPU | None | No | Console/SSH only |
| QEMU `virt` | virtio-gpu | Limited | No real acceleration |
| Raspberry Pi 4/5 | VC4/V3D (Mesa) | Yes, with limits | `dtoverlay=vc4-kms-v3d` |
| Rockchip | Panfrost | Varies | Depends on SoC |
| Apple Silicon | Asahi AGX | Only Asahi | Not official ALARM |
| Qualcomm Snapdragon | Freedreno | Varies | X13s and similar |
| NVIDIA ARM | Nouveau/proprietary | Varies | Not a focus |

A generic ARM ISO cannot guarantee a working Hyprland desktop. For v1, prioritize the console/installer and `core` profile; treat `full` as hardware-specific.

## Secure Boot

- archiso does not sign or enroll Secure Boot, on any architecture.
- ARM UEFI Secure Boot exists on some servers and boards, but it is not universal.
- It requires a Microsoft-signed shim or custom keys (`sbctl`) and an enrollment flow.
- Not part of v1.

## Risks by platform

- Raspberry Pi: firmware blobs, DTB names, power supply quality, SD corruption, no generic rollback.
- SBCs: board-specific U-Boot, DTB and peripherals; testing requires hardware.
- armv7h: separate userland and toolchain; lower demand.
- Asahi: high risk, separate kernel and boot chain.
- WSL ARM: separate rootfs and Windows validation.
- Graphics: acceleration varies; do not promise a desktop experience without hardware validation.

## Recommendation

- v1: aarch64 UEFI (servers, QEMU, UEFI boards).
- v2: Raspberry Pi 4/5 image with firmware or U-Boot.
- v3: generic SBCs and armv7h if there is demand and hardware.
- Never advertise a "universal ARM ISO" for SBCs.

## References

- https://archlinuxarm.org/platforms/armv8/generic
- https://archlinuxarm.org/platforms/armv8/broadcom/raspberry-pi-4
- https://archlinuxarm.org/packages/aarch64/linux-rpi
- https://archlinuxarm.org/packages/aarch64/uboot-raspberrypi
- https://docs.u-boot.org/en/latest/usage/cmd/booti.html
- https://docs.u-boot.org/en/latest/develop/distro.html
- https://asahilinux.org/docs/
- https://learn.microsoft.com/en-us/windows/wsl/
