# QEMU testing and static validation (2026)

## run_archiso (reference harness)

```sh
run_archiso -i out/midistro-*.iso      # UEFI default since v86
run_archiso -b -i out/*.iso            # BIOS
run_archiso -s -i out/*.iso            # Secure Boot firmware (test-only)
run_archiso -c seed.iso -i out/*.iso   # cloud-init seed
```

- UEFI uses pflash pair: `/usr/share/edk2/x64/OVMF_CODE.secboot.4m.fd` (ro) + writable copy of `OVMF_VARS.4m.fd`; `-machine q35,smm=on,usb=on`, `-cpu max`, `-smp 4`, `-m 3072`, `-no-reboot`, `-serial stdio`; host 60022 → guest 22.
- Arch's secboot OVMF has **no enrolled keys**; use Fedora's `edk2-ovmf-fedora` (AUR) for real Secure Boot tests.

## Headless CI recipe

```sh
cp /usr/share/edk2/x64/OVMF_VARS.4m.fd vars.fd
timeout 900 qemu-system-x86_64 -machine q35,smm=on -cpu max -smp 4 -m 3072 \
  -drive if=pflash,format=raw,unit=0,readonly=on,file=/usr/share/edk2/x64/OVMF_CODE.secboot.4m.fd \
  -drive if=pflash,format=raw,unit=1,file=vars.fd \
  -drive file=out/midistro.iso,media=cdrom,readonly=on \
  -netdev user,id=n0,hostfwd=tcp::60022-:22 -device virtio-net,netdev=n0 \
  -display none -serial file:serial.log -no-reboot &
```

Assertions:
- Serial: wait for login prompt / `Reached target` / sentinel service output.
- SSH: `ssh -p 60022 root@localhost` (needs a key baked or cloud-init).
- QEMU Guest Agent: `socat - unix-connect:/tmp/qga.sock` + JSON commands (arch-boxes uses `guest-network-get-interfaces` with `jq`).
- Screenshot: QEMU monitor `screendump`.

`-snapshot` guarantees the disk image stays immutable.

## Automated install test

1. Attach two disks: blank target qcow2 + ISO.
2. Feed install config (Calamares autoProceed or archinstall JSON via a seed ISO / baked file).
3. Wait for completion marker, power off, remove ISO, boot target.
4. Assert login + `systemctl is-system-running` + marker file.

arch-boxes CI pattern (cloud image):

```sh
genisoimage -output seed.iso -volid cidata -joliet -rock user-data meta-data
timeout 15m sh -c 'while ! sshpass -e ssh -o ConnectTimeout=2 -o StrictHostKeyChecking=no arch@localhost -p 2222 sudo true; do sleep 1; done'
echo '{"execute":"guest-network-get-interfaces"}' | socat -T0 -,ignoreeof unix-connect:/tmp/qga.sock | jq -e '.return | any(.name == "lo")'
```

## Tooling matrix

| Tool | Use |
|---|---|
| QEMU CLI / run_archiso | default, CI, headless |
| libvirt + virt-install | stateful local tests, snapshots (`--cdrom`, `--osinfo`, `--network user`) |
| Packer 1.16.1 + qemu plugin 1.1.7 | reproducible image builds, `cd_label=cidata`, `boot_command`, EFI options |
| arch-boxes QCOW2 | testing installed-system automation/cloud-init |
| openQA | only if you write `os-autoinst-distri-arch` (none exists) |

## Static validation (fast, pre-boot)

```sh
xorriso -indev out/midistro.iso -report_el_torito plain
isoinfo -d -i out/midistro.iso
unsquashfs -l work/iso/midistro/x86_64/airootfs.sfs | head
mcopy -i work/efiboot.img ::/loader/entries/01-*.conf -
bsdtar -tf work/efiboot.img | grep -E 'BOOTX64|EFI/Linux|vmlinuz'
sha256sum -c out/sha256sums.txt
gpg --verify out/midistro.iso.sig out/midistro.iso
```

Also: `pacman -Qqk` inside a chrooted rootfs, and metrics drift vs previous build.

## Matrix recommendations

- Firmware: UEFI x64 (+IA32 where supported) / BIOS (if enabled).
- Disk: virtio-blk + NVMe.
- RAM: 1 GiB minimum viability + 3 GiB normal.
- Install: unattended offline + optional netinstall.
- Secure Boot: own keys enrolled, signed UKI/loader.

## Pitfalls

1. No KVM → TCG 10-20x slower; set timeouts ≥15 min (Arch releng uses 2400 s builds).
2. `smm=on` requires q35.
3. Full serial logs need `console=ttyS0` + serial getty.
4. Screenshots alone are weak assertions — assert a command result.
5. OVMF vars file must be writable per run (copy it).
