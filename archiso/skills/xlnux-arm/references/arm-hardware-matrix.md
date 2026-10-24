# ARM hardware matrix

Purpose: define what v1 can realistically support, what needs testing, and what is explicitly out of scope.

## Support tiers

| Tier | Meaning | Support statement |
|---|---|---|
| Tier 0 | QEMU `virt` with edk2 | CI and development only; no hardware guarantee |
| Tier 1 | ARM server or UEFI board validated by the team | Supported for v1 |
| Tier 2 | UEFI ARM hardware that follows the standard | Best effort; community reports |
| Tier 3 | Raspberry Pi and SBC images | Separate product, v2/v3 |
| Tier 4 | Apple Silicon, WSL ARM, Secure Boot | Not supported |

## Platform matrix

| Platform | Arch | Firmware | Boot | Storage | Network | GPU | v1 | Test method |
|---|---|---|---|---|---|---|---|---|
| QEMU `virt` | aarch64 | edk2-aarch64 | UEFI | virtio-blk/scsi | virtio-net | virtio-gpu | Yes | QEMU e2e |
| Ampere Altra / ARM server | aarch64 | UEFI | GRUB/systemd-boot | NVMe/SATA | igb/ixgbe/mlx | optional | Yes | Real hardware |
| AWS Graviton | aarch64 | UEFI (cloud) | GRUB/systemd-boot | EBS/NVMe | ENA | none | Best effort | Cloud VM |
| Neoverse N1/N2 dev board | aarch64 | UEFI | GRUB/systemd-boot | NVMe/SATA | onboard | optional | Yes | Real hardware |
| Generic UEFI ARM board | aarch64 | UEFI | GRUB/systemd-boot | eMMC/SATA | onboard | optional | Best effort | Community |
| Raspberry Pi 4 | aarch64 | VideoCore + U-Boot | firmware/U-Boot | SD/USB | onboard | VC4/V3D | No, v2 | Real hardware |
| Raspberry Pi 5 | aarch64 | VideoCore + armstub | firmware/U-Boot | SD/NVMe | onboard | VC4/V3D | No, v2 | Real hardware |
| Rockchip SBC | aarch64/armv7h | U-Boot | extlinux/boot.scr | eMMC/SD | onboard | Panfrost | No, v3 | Real hardware |
| Allwinner SBC | aarch64/armv7h | U-Boot | extlinux/boot.scr | SD/eMMC | onboard | Lima/Panfrost | No, v3 | Real hardware |
| Apple Silicon | aarch64 | m1n1 + U-Boot | custom | NVMe | onboard | AGX | No | Not supported |
| Windows 11 ARM64 + WSL2 | aarch64 | WSL | WSL | virtual | virtual | virtual | No | Separate product |

## Minimum v1 validation set

To call v1 supported, validate at least:

1. QEMU `virt` with `edk2-aarch64` (CI, every release).
2. One ARM server or UEFI board with NVMe or SATA.
3. One UEFI board with a different firmware vendor, if available.
4. One installation with LUKS.
5. One dualboot or existing-ESP case.
6. One rollback after a package transaction.

## Firmware quirks

| Quirk | Impact | Mitigation |
|---|---|---|
| Firmware ignores NVRAM entries | System does not boot after install | `--removable` fallback and `BOOTAA64.EFI` |
| Firmware requires a specific fallback path | No boot | Copy loader to `EFI/BOOT/BOOTAA64.EFI` |
| Firmware resets boot order | Boots the wrong OS | Recreate the entry with `efibootmgr` |
| Firmware has no graphical menu | Hard to select the USB | Serial console or UEFI shell |
| Secure Boot enabled by default | ISO refuses to boot | Disable or enroll keys (v1 does not support SB) |
| ACPI vs device tree | Some devices missing | Use the firmware-provided ACPI or DTB |
| Broken `efibootmgr` | Cannot create entries | Use `--removable` |
| Firmware requires FAT16 | ESP creation fails with FAT32 | Use FAT32 first; FAT16 only if required |

## Storage

Supported for v1:

- NVMe.
- SATA/AHCI.
- virtio-blk.
- USB storage (slow, but useful for rescue).
- SD/eMMC on UEFI boards (if the firmware exposes it).

Considerations:

- Use `root=UUID=` or `PARTUUID=`.
- Add `rootwait` for removable or slow devices.
- btrfs needs `rootflags=subvol=@`.
- LUKS needs the correct initramfs hooks.
- The ESP should be at least 512 MiB; 1 GiB is comfortable for multiple kernels.

## Network

Supported for v1:

- virtio-net.
- Common server NICs with in-tree drivers.
- Wi-Fi only if the firmware exposes it and `linux-firmware` has the blobs.

Considerations:

- The live ISO needs `NetworkManager` or `iwd`.
- The installer needs network access for `pacstrap` unless the payload is offline.
- `x-scripts` may fetch the desktop stack online; document offline fallback.
- Test DHCP and static IP.

## GPU and desktop

| Platform | Driver | Hyprland | Notes |
|---|---|---|---|
| ARM server without GPU | None | No | Console/SSH only |
| QEMU `virt` | virtio-gpu | Limited | No acceleration |
| Ampere/Neoverse with BMC GPU | varies | No | Not a desktop target |
| Raspberry Pi 4/5 | VC4/V3D | Yes, with limits | v2 |
| Rockchip | Panfrost | Varies | v3 |
| Qualcomm | Freedreno | Varies | Not v1 |
| Apple Silicon | AGX | Only Asahi | Not supported |

A generic ARM ISO cannot promise a working desktop. For v1:

- Support `core` on all validated hardware.
- Support `full` only on hardware with a validated GPU stack.
- Document the tested GPU and driver versions.

## Memory and CPU

| Profile | Minimum | Recommended |
|---|---:|---:|
| Live installer | 2 GiB | 4 GiB |
| Installed core | 2 GiB | 4 GiB |
| Installed full (Hyprland) | 4 GiB | 8 GiB |
| Build host (ISO) | 8 GiB | 16 GiB |
| Build host disk | 25 GiB | 40 GiB |

CPU: any ARMv8-A with the required kernel features. Avoid pre-ARMv8 hardware.

## Validation checklist per machine

- [ ] Firmware version recorded.
- [ ] Secure Boot state recorded.
- [ ] CPU model and core count recorded.
- [ ] RAM recorded.
- [ ] Storage model and size recorded.
- [ ] Network device and driver recorded.
- [ ] GPU and driver recorded.
- [ ] ISO boots from USB.
- [ ] Installer completes.
- [ ] Reboot works.
- [ ] `x gen status` healthy.
- [ ] `x gen rollback` works.
- [ ] Network works.
- [ ] `pacman -Sy` works.
- [ ] `x update` works.
- [ ] Suspend/resume, if applicable.
- [ ] Serial console, if available.

## Procurement and access

Options for testing without buying hardware:

- Cloud ARM VMs (Graviton, Ampere).
- Employer or community lab access.
- Borrowed UEFI development boards.
- QEMU `virt` for functional tests.
- CI ARM runners for build and smoke tests.

Do not claim support for hardware that has not been tested.

## Out of scope

- 32-bit ARMv7 as a v1 target.
- Apple Silicon.
- Phones and tablets.
- Boards without mainline kernel support.
- Hardware with proprietary-only GPU stacks that cannot run a desktop.
- Secure Boot with Microsoft-signed shims in v1.

## References

- [Devices and platforms](arm-devices.md)
- [Testing and CI](arm-testing.md)
- [Test plan](arm-test-plan.md)
- [QEMU virt](https://www.qemu.org/docs/master/system/arm/virt.html)
- `arm-references.md` for ALARM platform pages
