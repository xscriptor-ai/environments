# Testing and CI for aarch64

Goal: validate the ARM ISO, installer and generations without relying on physical hardware, and keep CI reproducible.

Base: `x/tests/e2e-autoinstall.py`, `x/vm.sh`, `ops/docs/requirements.md`, QEMU 11.1.2, edk2 202608.

## Host packages

On Arch Linux x86_64:

```bash
sudo pacman -S --needed \
  qemu-system-aarch64 \
  qemu-img \
  edk2-aarch64 \
  dosfstools \
  mtools \
  python
```

Verified in the Arch repositories on 2026-10-24:

| Package | Version | Purpose |
|---|---|---|
| `qemu-system-aarch64` | `11.1.2-1` | ARM64 system emulator |
| `edk2-aarch64` | `202608-1` | AAVMF UEFI firmware |
| `qemu-img` | part of QEMU | qcow2 disks |
| `dosfstools`, `mtools` | current | ESP and cidata FAT |

`qemu-system-aarch64` depends on `edk2-aarch64` in the Arch packaging, so installing the emulator pulls the firmware.

### Firmware paths

```bash
pacman -Ql edk2-aarch64 | grep -E '\.fd$'
```

Expected paths:

```text
/usr/share/edk2/aarch64/QEMU_EFI.fd
/usr/share/edk2/aarch64/QEMU_VARS.fd
```

`edk2-aarch64` also provides `/usr/share/AAVMF/AAVMF_CODE.fd` and `/usr/share/AAVMF/AAVMF_VARS.fd`. Use one pair consistently and pass the writable vars copy as pflash.

### KVM

- On an ARM host, `-enable-kvm` works and is fast.
- On x86_64, there is no aarch64 KVM. QEMU uses TCG, which is much slower.
- In x86_64 CI, use TCG only for short smoke tests. Use an ARM runner for full e2e.

## QEMU `virt`

The QEMU `virt` machine is the recommended generic ARM64 virtual platform. Key facts from the QEMU documentation:

- Default CPU is `cortex-a15` (32-bit). For an AArch64 guest, specify a CPU such as `cortex-a72`, `cortex-a76`, `neoverse-n1` or `max`.
- `max` is the best TCG emulation and the same as `host` under KVM. Migration between QEMU versions is not guaranteed with `max`.
- Graphics is not enabled by default. Use `virtio-gpu-pci`.
- The machine can provide ACPI or a device tree. Firmware and kernel decide which one they consume.
- `virt` is not a Raspberry Pi model. It cannot validate board-specific firmware, GPIO, Wi-Fi or GPU.

### Minimal UEFI command

```bash
ISO="out/x-2026.11.01-aarch64.iso"

qemu-system-aarch64 \
  -M virt \
  -cpu max \
  -smp 4 \
  -m 4096 \
  -bios /usr/share/edk2/aarch64/QEMU_EFI.fd \
  -drive if=none,id=cdrom,media=cdrom,readonly=on,file="$ISO" \
  -device virtio-scsi-pci -device scsi-cd,drive=cdrom \
  -drive if=virtio,format=qcow2,file=/tmp/x-aarch64.qcow2 \
  -netdev user,id=n0 -device virtio-net-pci,netdev=n0 \
  -nographic
```

`-bios` boots UEFI read-only; variables do not persist.

### Persistent UEFI variables

```bash
cp /usr/share/edk2/aarch64/QEMU_VARS.fd /tmp/AAVMF_VARS.fd

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

Persistent variables are useful for testing `efibootmgr` and boot order after installing to disk.

### Install then reboot from disk

1. Boot the ISO.
2. Install to `/dev/vda`.
3. Power off.
4. Boot without the CD:

```bash
qemu-system-aarch64 \
  -M virt -cpu max -smp 4 -m 4096 \
  -drive if=pflash,format=raw,readonly=on,file=/usr/share/edk2/aarch64/QEMU_EFI.fd \
  -drive if=pflash,format=raw,file=/tmp/AAVMF_VARS.fd \
  -drive if=virtio,format=qcow2,file=/tmp/x-aarch64.qcow2 \
  -netdev user,id=n0 -device virtio-net-pci,netdev=n0 \
  -nographic
```

If firmware does not find the entry, try `-boot order=c` or use the firmware menu. Keep the `BOOTAA64.EFI` fallback from the installer.

### Serial console

Use `-nographic` and add to the kernel command line:

```text
console=ttyAMA0,115200
```

The current X autoinstall entry uses `console=ttyS0`, which is x86. Replace it for ARM.

### Graphics

```bash
-display gtk
-device virtio-gpu-pci
```

Headless serial is the reliable path. `virtio-gpu-pci` is the recommended display device for `virt`.

## e2e harness changes

Current script:

```python
OVMF_CODE = Path("/usr/share/edk2/x64/OVMF_CODE.4m.fd")
OVMF_VARS = Path("/usr/share/edk2/x64/OVMF_VARS.4m.fd")
...
for tool in ("qemu-system-x86_64", "qemu-img", "mkfs.vfat", "mcopy"):
...
"qemu-system-x86_64",
...
ap.add_argument("--mode", choices=("bios", "uefi"), default="uefi")
```

Proposed platform profiles:

```python
PLATFORMS = {
    "x86_64": {
        "qemu": "qemu-system-x86_64",
        "machine": None,
        "cpu": "host",
        "firmware_code": Path("/usr/share/edk2/x64/OVMF_CODE.4m.fd"),
        "firmware_vars": Path("/usr/share/edk2/x64/OVMF_VARS.4m.fd"),
        "modes": ("bios", "uefi"),
        "console": "ttyS0",
    },
    "aarch64": {
        "qemu": "qemu-system-aarch64",
        "machine": "virt",
        "cpu": "max",
        "firmware_code": Path("/usr/share/edk2/aarch64/QEMU_EFI.fd"),
        "firmware_vars": Path("/usr/share/edk2/aarch64/QEMU_VARS.fd"),
        "modes": ("uefi",),
        "console": "ttyAMA0",
    },
}
```

Changes:

- Add `--arch {x86_64,aarch64}` (default `uname -m`).
- Restrict `--mode` to `uefi` for aarch64.
- Use `platform["qemu"]` instead of `qemu-system-x86_64`.
- Add `-M virt -cpu max` for aarch64.
- Use the aarch64 pflash pair.
- Pass `console=ttyAMA0,115200` in autoinstall.
- Increase TCG timeouts (for example, 3x).
- Keep KVM when running on ARM.

### Disk and buses

- Use `virtio-blk` (`/dev/vda`) and `virtio-scsi` for the CD.
- The installer uses `lsblk`, so it detects `vda`/`vdb`.
- Do not use QEMU Raspberry Pi models for full e2e; they do not emulate the platform well enough.

### cidata and autoinstall

The harness creates a FAT `cidata` image with `x-install.json`. The format is architecture-independent. Verify that the installer does not assume `sr0` or a fixed device name.

### Assertions

Existing assertions (`generation 0001`, default, running, rollback) are architecture-independent. Add:

- `uname -m` is `aarch64` inside the target.
- `/boot/Image` or the expected kernel symlink exists.
- `EFI/BOOT/BOOTAA64.EFI` exists.
- systemd-boot entry points to `/Image` or the symlink.
- GRUB config contains `arm64-efi` behavior if GRUB is used.

## CI

### Native ARM runner

GitHub documents hosted Linux arm64 runners:

| Label | vCPU | RAM | Disk |
|---|---|---:|---:|
| `ubuntu-24.04-arm` | 4 | 16 GB | 14 GB |
| `ubuntu-22.04-arm` | 4 | 16 GB | 14 GB |
| `ubuntu-26.04-arm` | 4 | 16 GB | 14 GB |

They are Ubuntu, not Arch. A real archiso build needs Arch Linux ARM, so the practical options are:

1. Self-hosted Arch Linux ARM runner with labels `[self-hosted, linux, arm64, arch]`.
2. Hosted ARM runner running a privileged ALARM container.
3. Hosted ARM runner for lint, Rust tests and container smoke tests only.

Example self-hosted job:

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

      - name: Build ISO
        run: |
          cd x
          sudo pacman-key --init
          sudo pacman-key --populate archlinuxarm
          sudo env X_ARCH=aarch64 ./xbuild.sh

      - name: Verify ISO layout
        run: |
          ISO="$(ls -t x/out/*-aarch64.iso | head -1)"
          xorriso -report_el_torito as_mkisofs "$ISO" | grep -i BOOTAA64
          bsdtar -tf "$ISO" | grep -E 'arch/aarch64/airootfs.sfs|EFI/BOOT/BOOTAA64.EFI'

      - name: E2E UEFI
        run: |
          ISO="$(ls -t x/out/*-aarch64.iso | head -1)"
          python3 x/tests/e2e-autoinstall.py \
            --arch aarch64 --mode uefi --iso "$ISO" \
            --profile core --encryption no --timeout 5400

      - uses: actions/upload-artifact@v4
        with:
          name: x-aarch64-iso
          path: |
            x/out/*-aarch64.iso
            x/out/*-aarch64.iso.sha256
          if-no-files-found: error
```

### Cross-build job

```yaml
jobs:
  iso-aarch64-cross:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Register binfmt
        run: docker run --privileged --rm tonistiigi/binfmt --install arm64
      - name: Build in ALARM container
        run: |
          docker run --rm --privileged --platform linux/arm64 \
            -v "$PWD:/work" -w /work \
            ghcr.io/equislinux/alarm-builder:latest \
            bash -lc 'cd x && X_ARCH=aarch64 ./xbuild.sh'
```

This requires an `alarm-builder` image with `archiso`, `grub`, `mkinitcpio-archiso` and the ALARM keyring. `--privileged` is needed for `mount` and loop devices. It is slow; use it only if no ARM runner is available.

### Recommended matrix

| Job | Runner | What it validates |
|---|---|---|
| `lint` | x86_64 | `shellcheck`, `bash -n`, Python compile, Cargo tests |
| `build-x86_64` | x86_64 | x86_64 ISO and BIOS/UEFI e2e |
| `build-aarch64` | ARM self-hosted or hosted ARM container | aarch64 ISO and UEFI e2e |
| `build-aarch64-cross` | x86_64 + binfmt | Build smoke only, not release |
| `repo-index` | x86_64 | `public/repo/{x86_64,aarch64}` and signatures |

## Test levels

### Host

```bash
bash -n x/profiledef.sh x/xbuild.sh x/x.sh
shellcheck x/xbuild.sh x/x.sh x/airootfs/root/x-installer/*.sh
cargo test --manifest-path xpkg/Cargo.toml
cargo test --manifest-path xpm/Cargo.toml
python3 -m py_compile x/tests/e2e-autoinstall.py
```

### ISO

```bash
test -f out/x-*-aarch64.iso
xorriso -report_el_torito as_mkisofs out/x-*-aarch64.iso | grep -i BOOTAA64
bsdtar -tf out/x-*-aarch64.iso | grep -E 'arch/aarch64/airootfs.sfs|EFI/BOOT/BOOTAA64.EFI'
```

### Installation

```bash
python3 x/tests/e2e-autoinstall.py --arch aarch64 --mode uefi \
  --iso out/x-*-aarch64.iso --profile core --encryption no
```

Inside the target:

```bash
uname -m
x gen status
x kernel list
ls /boot/EFI/BOOT/BOOTAA64.EFI
```

### Generations

- `x gen new` creates `0001`.
- `x gen status` shows running/default.
- `x gen rollback 0001` reboots into the previous generation.
- Multi-kernel ARM only if custom presets are implemented.

### Repository

```bash
sudo pacman -Sy --config /tmp/pacman.aarch64.conf x-release x-dev x-scripts
xpm sync && xpm info x-release
```

## Performance expectations

| Scenario | CPU | Approximate time |
|---|---|---|
| Native aarch64 ISO build (8 cores) | ARM | 15-40 min |
| aarch64 ISO build under TCG (8 x86 cores) | emulated | 2-6 h |
| Native UEFI e2e | ARM/KVM | 5-15 min |
| UEFI e2e under TCG | x86 emulating | 1-3 h |
| Native `pacstrap` | ARM | 3-10 min |
| `pacstrap` with binfmt | x86 | 30-90 min |

Cache the pacman package cache where possible. `xbuild.sh` deletes `work/`, so caching `work/` is not straightforward.

## Limitations

- `-M virt` does not reproduce GPIO, Wi-Fi, Bluetooth or SBC firmware.
- QEMU Raspberry Pi models do not support all peripherals and are not suitable for graphics validation.
- There is no real GPU acceleration in QEMU; `virtio-gpu` is basic.
- Serial console is the reliable headless path.
- Real Raspberry Pi validation requires hardware.

## Checklist

- [ ] `qemu-system-aarch64` and `edk2-aarch64` installed.
- [ ] `archiso` installed from source or packaged locally.
- [ ] aarch64 `grub` with `arm64-efi`.
- [ ] `pacman.aarch64.conf` with ALARM and `[x]/aarch64`.
- [ ] `packages.aarch64` without x86-only packages.
- [ ] ISO contains `BOOTAA64.EFI`.
- [ ] e2e uses `--mode uefi` and `console=ttyAMA0`.
- [ ] Assertions cover kernel names and boot entries.
- [ ] ARM job is separate from x86_64.
- [ ] TCG timeouts are increased.
- [ ] Pacman cache is preserved between runs.

## References

- https://www.qemu.org/docs/master/system/arm/virt.html
- https://docs.github.com/en/actions/reference/runners/github-hosted-runners
- https://archlinuxarm.org/platforms/armv8/generic
- `x/tests/e2e-autoinstall.py`
- `x/vm.sh`
- `ops/docs/requirements.md`
