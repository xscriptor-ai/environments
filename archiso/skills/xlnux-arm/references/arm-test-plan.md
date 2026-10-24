# ARM test plan

Purpose: define how to verify that the aarch64 port works, what to test at each layer, and what evidence is required before release.

## Strategy

| Layer | Scope | Where | Required for release |
|---|---|---|---|
| Static | Shell, Python, Rust, TypeScript, links, JSON/YAML | CI | Yes |
| Unit | `xkernel`, `xgen` helpers, parsing | CI | Yes |
| Integration | `pacstrap`, package resolution, repo sync | ARM runner | Yes |
| ISO | Boot, live environment, installer | QEMU `virt` | Yes |
| Installation | Disk layout, bootloader, target boot | QEMU `virt` | Yes |
| Generations | Create, rollback, verify | QEMU `virt` | Yes |
| Hardware | Real UEFI system | Lab | Yes |
| Repository | `[x]/aarch64`, `x/aarch64`, signatures | ARM host | Yes |
| Performance | Build time, install time, ISO size | ARM host | Informational |
| Security | Keys, signatures, secrets, Secure Boot state | Review | Yes |

## Test identifiers

Use stable IDs in PR descriptions and release notes:

```text
ARM-STATIC-001   Shell syntax
ARM-STATIC-002   Python syntax
ARM-STATIC-003   Rust tests
ARM-STATIC-004   TypeScript/Next build
ARM-STATIC-005   Markdown links
ARM-PKG-001      Package matrix refresh
ARM-PKG-002      X packages build
ARM-PKG-003      Repository sync
ARM-BUILD-001    ISO build
ARM-BUILD-002    ISO layout
ARM-INST-001     QEMU core install
ARM-INST-002     QEMU encrypted install
ARM-INST-003     Dualboot ESP
ARM-GEN-001      Generation create
ARM-GEN-002      Rollback
ARM-GEN-003      Kernel list/remove
ARM-HW-001       Real UEFI server
ARM-HW-002       Second firmware vendor
ARM-REL-001      Signed ISO
ARM-REL-002      Download verification
```

## Static tests

```bash
bash -n x/profiledef.sh x/xbuild.sh x/x.sh
shellcheck x/xbuild.sh x/x.sh x/airootfs/root/x-installer/*.sh
python3 -m py_compile x/tests/e2e-autoinstall.py
cargo test --manifest-path xpkg/Cargo.toml
cargo test --manifest-path xpm/Cargo.toml
npm ci && npm run build   # web
```

Markdown links:

```bash
python3 - <<'PY'
import re, pathlib
bad = []
for md in pathlib.Path('references').glob('arm*.md'):
    for m in re.finditer(r'\[[^\]]*\]\(([^)]+)\)', md.read_text()):
        t = m.group(1)
        if t.startswith(('http://', 'https://', '#', 'mailto:')):
            continue
        if not (md.parent / t).resolve().exists():
            bad.append((md.name, t))
print(bad)
PY
```

## Package tests

Refresh ALARM data:

```bash
mkdir -p /tmp/alarmdb && cd /tmp/alarmdb
for r in core extra alarm aur; do
  curl -fsSL "http://mirror.archlinuxarm.org/aarch64/$r/$r.db.tar.gz" -o "$r.db.tar.gz"
  mkdir -p "$r" && tar -xzf "$r.db.tar.gz" -C "$r"
done
```

Verify the manifest:

- Every package in `packages.aarch64` exists in ALARM or in `[x]/aarch64`.
- No x86-only package is present.
- `linux-aarch64` and `linux-aarch64-headers` are present.
- `archlinuxarm-keyring` and `pacman-mirrorlist` are present.
- The four X packages are either published or explicitly removed.

Build X packages:

```bash
cd x-repo
export X_ARCH=aarch64
./build-packages.sh
```

Repository sync:

```bash
sudo pacman -Sy --config /tmp/pacman.aarch64.conf x-release x-scripts
xpm sync
xpm info x-release
```

## ISO tests

```bash
ISO="$(ls -t out/x-*-aarch64.iso | head -1)"
xorriso -report_el_torito as_mkisofs "$ISO" | grep -i BOOTAA64
bsdtar -tf "$ISO" | grep -E 'arch/aarch64/airootfs.sfs|EFI/BOOT/BOOTAA64.EFI'
sha256sum "$ISO"
```

Boot QEMU `virt` and confirm:

- UEFI output.
- GRUB menu.
- Kernel starts with `console=ttyAMA0`.
- Live environment reaches the installer.
- `uname -m` is aarch64.

## Installation tests

### ARM-INST-001: core install

```bash
python3 x/tests/e2e-autoinstall.py --arch aarch64 --mode uefi \
  --iso "$ISO" --profile core --encryption no
```

Pass criteria:

- Installer completes.
- Reboot reaches the target.
- `uname -m` = aarch64.
- `efibootmgr` has X.
- `x gen status` healthy.

### ARM-INST-002: encrypted install

```bash
python3 x/tests/e2e-autoinstall.py --arch aarch64 --mode uefi \
  --iso "$ISO" --profile core --encryption yes
```

Pass criteria:

- LUKS unlock prompt.
- Root mounts.
- Boot completes.
- `cryptsetup status` shows the mapping.

### ARM-INST-003: existing ESP / dualboot

- Create an ESP with a dummy `EFI/BOOT/BOOTAA64.EFI`.
- Install X without formatting the ESP.
- Confirm the dummy file is preserved.
- Confirm the X entry is added.

## Generation tests

```bash
x gen new --label test
x gen list
x gen status
x gen verify
x gen rollback <id>
```

Pass criteria:

- Generation directory and manifest exist.
- Kernel and initramfs archived.
- Entry exists in `/boot/loader/entries` or `grub/custom.cfg`.
- Rollback changes the default.
- Reboot enters the target generation.

## Kernel tests

```bash
x kernel list
x kernel install linux-aarch64   # if not installed
x kernel remove linux-aarch64    # must refuse the running/last kernel
```

Pass criteria:

- ARM kernels are recognized.
- The running and last kernel guards work.
- `pkgbase` fallback works without the file.

## Hardware tests

For each machine in the [hardware matrix](arm-hardware-matrix.md):

- [ ] ISO boots from USB.
- [ ] Installer reaches the disk selection.
- [ ] Network works.
- [ ] Install completes.
- [ ] Target boots.
- [ ] Generations work.
- [ ] Update works.
- [ ] Serial console works, if present.
- [ ] Suspend/resume, if applicable.
- [ ] GPU/desktop, if applicable.

Record:

```text
Machine:
Firmware:
Secure Boot:
CPU:
RAM:
Storage:
Network:
GPU:
ISO version:
Kernel:
Result:
Notes:
```

## Performance tests

Measure and record:

| Metric | Target |
|---|---|
| ISO build on 8-core ARM | under 45 min |
| ISO size | at most 2.5 GiB |
| Install in QEMU KVM | under 15 min |
| Install on hardware | under 20 min |
| Boot to installer | under 90 s |
| Boot installed system | under 60 s |
| `x gen new` | under 60 s |
| `x gen rollback` | under 30 s |

Use `time`, `systemd-analyze`, and the build log.

## Security tests

- [ ] `[x]/aarch64` database signature verifies.
- [ ] Every package signature verifies.
- [ ] ISO signature verifies.
- [ ] SHA-256 matches the published value.
- [ ] No secret is present in the repository or ISO.
- [ ] The live keyring trusts only the expected keys.
- [ ] Secure Boot state is documented.
- [ ] SSH is not exposed with default passwords in the live environment.

## Flake control

- Increase timeouts for TCG.
- Retry only infrastructure failures, never assertion failures.
- Keep the QEMU serial log and disk image for failures.
- Pin the ALARM mirror snapshot or package cache for reproducibility.
- Record the QEMU and edk2 versions.

## CI mapping

| Job | Tests |
|---|---|
| `lint` | ARM-STATIC-001..005 |
| `packages` | ARM-PKG-001..003 |
| `iso` | ARM-BUILD-001..002 |
| `e2e` | ARM-INST-001..003, ARM-GEN-001..003 |
| `hardware` | ARM-HW-001..002 (manual or self-hosted) |
| `release` | ARM-REL-001..002 |

## Evidence to attach to a release

- ISO SHA-256 and signature.
- Build log.
- `xorriso` El Torito report.
- QEMU e2e log.
- Hardware validation record.
- Repository signature verification.
- List of known failures and limitations.

## Exit criteria

The ARM port is releasable when:

- All required test IDs pass.
- At least one real UEFI ARM system is validated.
- No P0 or P1 defect remains open.
- Documentation and release metadata are updated.
- The x86_64 suite is still green.

## References

- [Testing and CI](arm-testing.md)
- [Build runbook](arm-runbook-build.md)
- [Install runbook](arm-runbook-install.md)
- [Hardware matrix](arm-hardware-matrix.md)
- [Checklists](arm-checklists.md)
- `arm-references.md` for QEMU, U-Boot and ALARM sources
