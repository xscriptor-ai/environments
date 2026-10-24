# ARM implementation plan

Purpose: turn the ARM research into a sequence of reviewable changes with explicit files, tests, acceptance criteria and rollback.

This is a plan, not an applied patch. No commit or push is included.

## Principles

1. Preserve x86_64 behavior. Every ARM change is conditional on `uname -m` or `X_ARCH`.
2. Keep the first ARM release small. aarch64 and UEFI only.
3. Do not mix platform work (Raspberry Pi, SBC, Asahi) with the generic UEFI port.
4. Every phase must leave the x86_64 build and tests green.
5. Every new assumption about ALARM must be verified against the live repositories before implementation.
6. Documentation, code and CI move together; a phase is not done until its docs are updated.

## Work breakdown

| PR | Scope | Depends on | Risk |
|---|---|---|---|
| PR-01 | ARM documentation (this section) | - | Low |
| PR-02 | Architecture-aware profile and manifests | PR-01 | Medium |
| PR-03 | Multi-architecture package repository | PR-02 | Medium |
| PR-04 | ARM installer and bootloader | PR-02, PR-03 | High |
| PR-05 | Kernel discovery and generations | PR-04 | High |
| PR-06 | ISO build and QEMU e2e | PR-03, PR-04, PR-05 | High |
| PR-07 | CI and release metadata | PR-03, PR-06 | Medium |
| PR-08 | Raspberry Pi image flow (v2) | PR-06 | High |
| PR-09 | armv7h and SBC support (v3) | PR-08 | High |

## PR-01: documentation

Files:

- `references/arm.md` and the other `references/arm-*.md` pages in this skill pack.
- `references/arm-toolkit/` for the scripts.
- Optional AI skill in `xscriptor-ai/environments/archiso/skills/xlnux-arm/`.

Acceptance:

- English, ASCII, no emoji.
- Links resolve.
- English portal lists the pages; Spanish portal is unchanged.
- No code or build behavior changes.

Rollback: revert the documentation commit; no runtime impact.

## PR-02: architecture-aware profile and manifests

Files:

- `x/profiledef.sh`
- `x/xbuild.sh`
- `x/x.sh`
- `x/pacman.conf` (keep for x86_64)
- `x/pacman.aarch64.conf` (new)
- `x/airootfs/etc/pacman.conf`
- `x/airootfs/etc/pacman.d/mirrorlist` (architecture-aware or new ARM file)
- `x/packages.aarch64` (new)
- `x/bootstrap_packages.aarch64` (new, same as x86_64)
- `x/airootfs/root/x-installer/packages.aarch64` (new)
- `x/airootfs/etc/mkinitcpio.conf.d/archiso.conf`

Exact changes:

```bash
# profiledef.sh
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

`pacman.aarch64.conf` must contain `[core]`, `[extra]`, `[alarm]`, `[aur]` via the ALARM mirrorlist, and `[x]` using `$arch`. The live `airootfs/etc/pacman.conf` uses `SigLevel = Required` for `[x]`.

Package manifest changes:

- Remove `linux`, `intel-ucode`, `amd-ucode`, `syslinux`, `memtest86+`, `memtest86+-efi`, `refind`, `edk2-shell`, `hyperv`, `open-vm-tools`, `virtualbox-guest-utils-nox`, `reflector`.
- Add `linux-aarch64`, `linux-aarch64-headers`, `archlinuxarm-keyring`, `pacman-mirrorlist`.
- Keep `grub`, `efibootmgr`, `mkinitcpio-archiso`.
- Keep the four X packages only if they are published for aarch64.

Tests:

```bash
X_ARCH=x86_64 bash -n x/profiledef.sh
X_ARCH=aarch64 bash -n x/profiledef.sh
X_ARCH=aarch64 bash -n x/xbuild.sh
test -f x/packages.aarch64
test -f x/pacman.aarch64.conf
# Verify the package names exist in ALARM
for p in linux-aarch64 grub efibootmgr archlinuxarm-keyring pacman-mirrorlist; do
  curl -fsSL "http://mirror.archlinuxarm.org/aarch64/core/$p-1/desc" >/dev/null 2>&1 || true
done
```

Acceptance:

- x86_64 profile output is byte-identical to the current profile when `X_ARCH=x86_64`.
- `X_ARCH=aarch64` selects the ARM files.
- No x86-only package remains in `packages.aarch64`.
- No ARM-only package appears in the x86_64 manifest.

Rollback: revert the commit; x86_64 was not changed.

## PR-03: multi-architecture repository

Files:

- `x-repo/build-packages.sh`
- `x-repo/packages/x-release/PKGBUILD`
- `x-repo/packages/x-dev/PKGBUILD`
- `x-repo/packages/xfetch/PKGBUILD`
- `x-repo/packages/xtop/PKGBUILD`
- `x-repo/packages/opencode-bin/PKGBUILD`
- `x-repo/.github/workflows/build.yml`
- `x-repo/public/repo/aarch64/` (new)
- `x-repo/public/x/aarch64/` (new)
- `x-repo/docs/en/repo-layout.md`, `publishing.md`, `signing.md`

Changes:

- `ARCH="${X_ARCH:-$(uname -m)}"`.
- `REPO_DIR="public/repo/$ARCH"`, `XPM_DIR="public/x/$ARCH"`.
- Build `x-release`, `x-dev`, `x-scripts` for both.
- Build `xpm`, `xpkg`, `xtop` on aarch64.
- Resolve or exclude `xfetch` and `opencode`.
- Sign both databases with the same key.
- CI checks both directories.

Tests:

```bash
X_ARCH=aarch64 ./build-packages.sh --index-only
test -f public/repo/aarch64/x.db
test -f public/repo/aarch64/x.db.sig
gpg --verify public/repo/aarch64/x.db.sig public/repo/aarch64/x.db
test -f public/x/aarch64/x.db.tar.gz
```

Acceptance:

- x86_64 repository is unchanged.
- aarch64 repository verifies.
- `x-scripts` is present in both.
- `history.json` has `arch=aarch64`.
- No x86-only binary is published under `aarch64`.

Rollback: remove the new directories and revert the script; the x86_64 repository keeps working.

## PR-04: installer and bootloader

Files:

- `x/airootfs/root/x-installer/install.sh`
- `x/airootfs/root/x-installer/configurator.sh`
- `x/airootfs/root/x-installer/packages.aarch64`
- `x/grub/grub.cfg`
- `x/grub/loopback.cfg`

Changes:

- Detect `uname -m`.
- Default to `linux-aarch64` on ARM.
- Populate `archlinuxarm`.
- Use `$arch` in `[x]`.
- GRUB `--target=arm64-efi`.
- systemd-boot `systemd-bootaa64.efi` and `BOOTAA64.EFI`.
- `efibootmgr` paths `\EFI\x\grubaa64.efi` and `\EFI\systemd\systemd-bootaa64.efi`.
- Kernel symlinks or native map.
- Remove `i386-pc` on ARM.

Tests:

```bash
# Static checks
bash -n x/airootfs/root/x-installer/install.sh
shellcheck x/airootfs/root/x-installer/install.sh

# QEMU install
python3 x/tests/e2e-autoinstall.py --arch aarch64 --mode uefi \
  --iso out/x-*-aarch64.iso --profile core --encryption no
```

Acceptance:

- Install completes on QEMU `virt`.
- Target boots with GRUB `arm64-efi`.
- `efibootmgr` lists X.
- `uname -m` is aarch64.
- x86_64 installer behavior is unchanged.

Rollback: revert; no effect on existing x86_64 installs.

## PR-05: kernel discovery and generations

Files:

- `scripts/install/helpers/xkernel.sh`
- `scripts/install/helpers/xgen.sh`
- `scripts/bin/x-kernel-install.sh`
- `scripts/bin/x-kernel-remove.sh`
- `scripts/test/*`

Changes:

- Add ARM kernels to `xkernel_known`.
- Add `xkernel_pkgbase_of_release` fallback via `pacman -Qoq /boot/Image`.
- Add `xkernel_image_name` and `xkernel_initramfs_name`.
- Replace `vmlinuz-*` globs with the kernel map.
- Update `xgen_pick_pair` and `kernels.tsv`.
- Write boot entries for `Image` or `kernel8.img`.
- Add ARM fixtures.

Tests:

```bash
bash scripts/test/validate.sh
bash scripts/test/kernel.sh
bash scripts/test/generations.sh
bash scripts/test/generations-boot.sh
```

Acceptance:

- Existing x86_64 tests pass.
- ARM fixtures pass.
- `x gen new` archives `Image` and `initramfs-linux.img`.
- `x gen rollback` works.
- `x kernel list` shows `linux-aarch64`.

Rollback: revert; x86_64 continues using `vmlinuz-*`.

## PR-06: ISO build and QEMU e2e

Files:

- `x/xbuild.sh`
- `x/tests/e2e-autoinstall.py`
- `x/vm.sh` (optional ARM mode)
- `x/grub/grub.cfg`
- `x/airootfs/etc/mkinitcpio.conf.d/archiso.conf`

Changes:

- Build with `X_ARCH=aarch64`.
- `console=ttyAMA0`.
- `qemu-system-aarch64`, `-M virt`, `edk2-aarch64`.
- Remove BIOS mode from the ARM path.
- Increase TCG timeouts.

Tests:

```bash
xorriso -report_el_torito as_mkisofs out/x-*-aarch64.iso | grep -i BOOTAA64
bsdtar -tf out/x-*-aarch64.iso | grep -E 'arch/aarch64/airootfs.sfs|EFI/BOOT/BOOTAA64.EFI'
python3 x/tests/e2e-autoinstall.py --arch aarch64 --mode uefi --iso out/x-*-aarch64.iso
```

Acceptance:

- ISO boots to the live prompt.
- Install, reboot and generation `0001` verify.
- No x86_64-only package is used.

Rollback: keep the ARM ISO unpublished; x86_64 releases continue.

## PR-07: CI and release metadata

Files:

- `.github/workflows/` (x, x-repo, web)
- `x-repo/scripts/publish-iso.sh`
- `web/data/releases.json`
- `web/components/Install.tsx`
- `web/components/Landing.tsx`
- `wiki` and `web` docs already updated by PR-01

Changes:

- ARM runner job.
- `publish-iso.sh --arch`.
- `releases.json` with `arch` and `latest_by_arch`.
- Architecture selector on the download page.

Tests:

```bash
# JSON schema validation
python3 -m json.tool web/data/releases.json >/dev/null
# Build the web portal
npm ci && npm run build
```

Acceptance:

- x86_64 download still works.
- aarch64 download appears after release.
- CI fails if either repository is missing.
- No secret is printed.

Rollback: revert the release metadata; the previous x86_64 release remains valid.

## PR-08 and PR-09: platform work

Do not start until the generic aarch64 release is stable.

Raspberry Pi:

- Separate image builder.
- `config.txt`, `cmdline.txt`, `kernel8.img`, DTBs.
- U-Boot or firmware flow, not both.
- Hardware validation.

armv7h and SBC:

- Separate userland, toolchain and bootloader.
- Board-specific DTBs and U-Boot.
- Do not mix with the generic ISO.

## File-level change map

| File | PR | Change |
|---|---|---|
| `x/profiledef.sh` | PR-02 | Architecture switch |
| `x/xbuild.sh` | PR-02, PR-06 | `work/$ARCH`, ARM build |
| `x/x.sh` | PR-02 | `work/$ARCH` |
| `x/pacman.aarch64.conf` | PR-02 | New |
| `x/packages.aarch64` | PR-02 | New |
| `x/airootfs/etc/pacman.conf` | PR-02 | ARM repo and `$arch` |
| `x/airootfs/etc/pacman.d/mirrorlist` | PR-02 | ALARM mirrorlist |
| `x/airootfs/root/x-installer/install.sh` | PR-04 | Architecture, keyring, bootloader |
| `x/airootfs/root/x-installer/packages.aarch64` | PR-04 | New |
| `x/grub/grub.cfg` | PR-04, PR-06 | Kernel path and `%ARCH%` |
| `x/grub/loopback.cfg` | PR-04 | Remove x86-only entries on ARM |
| `x/tests/e2e-autoinstall.py` | PR-06 | aarch64 platform profile |
| `scripts/install/helpers/xkernel.sh` | PR-05 | ARM kernels and fallback |
| `scripts/install/helpers/xgen.sh` | PR-05 | Kernel map and entries |
| `x-repo/build-packages.sh` | PR-03 | Multi-arch |
| `x-repo/packages/*/PKGBUILD` | PR-03 | ARM architectures |
| `x-repo/.github/workflows/build.yml` | PR-03, PR-07 | Both repos |
| `x-repo/scripts/publish-iso.sh` | PR-07 | `--arch` |
| `web/lib/docs.ts` | PR-01 | ARM pages (English only) |
| `web/data/releases.json` | PR-07 | Multi-arch schema |

## Dependency graph

```text
PR-01 docs
  -> PR-02 profile/manifests
      -> PR-03 repo
          -> PR-04 installer
              -> PR-05 generations
                  -> PR-06 ISO/e2e
                      -> PR-07 CI/release
                          -> PR-08 RPi
                          -> PR-09 armv7h/SBC
```

## Review checklist for each PR

- [ ] x86_64 build and tests pass.
- [ ] ARM path is conditional, not a replacement.
- [ ] No secrets or keys in the diff.
- [ ] Documentation updated under `references/` in the skill pack.
- [ ] New package names verified against live ALARM.
- [ ] New boot paths verified with `xorriso`/`bootctl`.
- [ ] Rollback plan documented.
- [ ] No commit/push without approval.

## Definition of done for the implementation

- [ ] PR-01 through PR-07 merged.
- [ ] aarch64 ISO built and signed.
- [ ] QEMU `virt` e2e green.
- [ ] One real UEFI ARM system validated.
- [ ] `[x]/aarch64` published and consumable.
- [ ] CI green for both architectures.
- [ ] Release notes and limitations published.
- [ ] RPi/SBC/armv7h explicitly out of scope.

## References

- `arm-archiso.md`, `arm-installer.md`, `arm-generations.md`, `arm-tooling.md`, `arm-testing.md`.
- `arm-runbook-build.md`, `arm-runbook-install.md`, `arm-runbook-release.md`.
- `arm-checklists.md`, `arm-test-plan.md`.
- `arm-references.md` for primary sources.
