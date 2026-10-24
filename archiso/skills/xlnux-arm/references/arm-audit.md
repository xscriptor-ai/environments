# Current X Linux audit against ARM

Verified: 2026-10-24 against `/home/xscriptor/Documents/repos/xscriptor/equislinux` (12 repositories).

This page records every place where the current X toolchain assumes x86_64. It is the evidence base for the changes proposed in the rest of the ARM section.

## Method

Search performed across all repositories, excluding `.git`, `x/work`, `x/out`, `node_modules` and lockfiles:

```bash
rg -i --hidden -g '!.git' -g '!work/**' -g '!out/**' -g '!node_modules/**' \
   -g '!package-lock.json' -g '!Cargo.lock' \
   'aarch64|arm64|armv7|armv6|\barm\b|archlinuxarm|alarm|raspberry|asahi|u-boot|dtb' \
   /home/xscriptor/Documents/repos/xscriptor/equislinux
```

The result is mostly incidental:

- `xpkg` validates `aarch64` and `armv7h` as legal `arch` values.
- `xpkg`/`xpm` documentation uses `$arch` in examples.
- `x/grub/loopback.cfg` contains inherited `arm64`/`riscv64` branches from archiso.
- Nothing in `x/`, `wiki/x/`, `web/content/*/x/`, `x-repo/`, `wsl/` or `ops/` documents ARM.

## Repository summary

| Repository | Files | ARM documentation | ARM code | State |
|---|---:|---|---|---|
| `x` | about 97k including `work/` | No | No | archiso profile, installer and boot are x86_64-only |
| `scripts` | 1,305 | No | Partly generic | `xgen`/`xkernel` assume x86 names; provisioning is generic |
| `xpkg` | 3,762 | Incidental | Accepts `aarch64`/`armv7h` | Builder runs for the host architecture only |
| `xpm` | 3,714 | Incidental | Partial (`$arch`, `std::env::consts::ARCH`) | `armv7h` would be mapped to `arm` |
| `x-repo` | 176 | No | No | `public/repo/x86_64` and `public/x/x86_64` hardcoded |
| `wiki` | 62 | No | No | Five `x/` documents, all x86_64 |
| `web` | 119 | No | No | `releases.json` and guides are x86_64 |
| `wsl` | 11 | No | No | x86_64 rootfs, `pacman-key --populate archlinux` |
| `wsl-scripts` | 19 | No | No | User setup; depends on the x86_64 rootfs |
| `utils` | 16 | No | No | Workspace utilities |
| `ops` | 8 | No | No | Requirements and state are x86_64 |
| `.github` | profile | No | No | Organisation profile |

Conclusion: there is no ARM document, no conditional `aarch64` in the build/install pipeline, and no ARM CI or release.

## `x/` - archiso profile, ISO and installer

### Profile

`x/profiledef.sh`:

```bash
bootmodes=('bios.syslinux'
           'uefi.grub')
packages_file="packages.x86_64"
arch="x86_64"
airootfs_image_tool_options=('-comp' 'xz' '-Xbcj' 'x86' '-b' '1M' '-Xdict-size' '1M')
```

| Line | Content | ARM problem |
|---:|---|---|
| 11-12 | `bios.syslinux`, `uefi.grub` | `syslinux` is x86-only; ARM is UEFI-only |
| 13 | `packages.x86_64` | Must become `packages.aarch64` |
| 14 | `arch="x86_64"` | Fixes the ISO architecture |
| 17 | `-Xbcj x86` | Must become `arm64` for AArch64 binaries |

`x/xbuild.sh` and `x/x.sh` clean `work/x86_64/airootfs`, so an ARM build would leave mounts under `work/aarch64/` behind:

```bash
# x/xbuild.sh:11
for mp in work/x86_64/airootfs/proc work/x86_64/airootfs/sys ...
# x/x.sh:2
sudo umount -R work/x86_64/airootfs
```

### pacman configuration

Both the build host and the live environment pin the `[x]` repository to x86_64:

```ini
# x/pacman.conf:84 and x/airootfs/etc/pacman.conf:83
[x]
Server = https://equislinux.github.io/x-repo/repo/x86_64
```

`x/airootfs/etc/pacman.d/mirrorlist` contains Arch x86_64 mirrors:

```ini
Server = https://geo.mirror.pkgbuild.com/$repo/os/$arch
Server = https://mirror.rackspace.com/archlinux/$repo/os/$arch
...
```

An ARM live environment needs ALARM mirrors and the `[alarm]`/`[aur]` repositories.

### mkinitcpio

`x/airootfs/etc/mkinitcpio.conf.d/archiso.conf`:

```ini
HOOKS=(base udev microcode modconf kms memdisk archiso archiso_loop_mnt archiso_pxe_common archiso_pxe_nbd archiso_pxe_http archiso_pxe_nfs block filesystems keyboard)
COMPRESSION="xz"
COMPRESSION_OPTIONS=(-9e)
```

The `archiso` hooks are generic. The `microcode` hook is x86-specific and should be removed on ARM.

### Manifests

- `x/packages.x86_64`: 143 packages.
- `x/bootstrap_packages.x86_64`: `arch-install-scripts` and `base`.
- `x/airootfs/root/x-installer/packages.x86_64`: 143 packages.
- `x/airootfs/root/x-installer/packages/x-scripts-0.1.0-39-any.pkg.tar.zst`: architecture-independent payload.

### Installer

`x/airootfs/root/x-installer/install.sh` (483 lines):

| Line | Content | ARM problem |
|---:|---|---|
| 39 | `KERNEL="${KERNEL:-linux}"` | ALARM has no package named `linux`; use `linux-aarch64` |
| 46-47 | `linux|linux-lts|linux-zen|linux-hardened|linux-rt|linux-rt-lts` | Missing `linux-aarch64`, `linux-rpi`, `linux-rpi-16k` |
| 88 | `PKGLIST=.../packages.x86_64` | x86 manifest name |
| 207 | `EXTRA="base base-devel $KERNEL $KERNEL-headers linux-firmware ... xfetch-bin xtop-git"` | `xfetch-bin` and `xtop-git` have no ARM build; headers name differs |
| 251 | `pacman-key --populate archlinux` | ARM needs `archlinuxarm` |
| 271 | `pacman-key --gpgdir "$GPGDIR" --populate archlinux` | Same |
| 312 | `Server = .../repo/x86_64` | Must use `$arch` |
| 390-408 | `systemd-bootx64.efi`, `BOOTX64.EFI` | ARM uses `systemd-bootaa64.efi`, `BOOTAA64.EFI` |
| 418 | `linux /vmlinuz-$KERNEL` | ALARM uses `/Image` (generic) or `/kernel8.img` (RPi) |
| 428-430 | `grub-install --target=x86_64-efi` | ARM uses `--target=arm64-efi` |
| 431 | `grub-install --target=i386-pc` | There is no BIOS path on ARM |
| 445 | `\EFI\systemd\systemd-bootx64.efi` | `systemd-bootaa64.efi` |
| 450 | `\EFI\x\grubx64.efi` | `grubaa64.efi` |

The installer also assumes:

- The ESP is mounted at `/boot`, and `bootctl --esp-path=/boot` is used.
- `mkinitcpio` has `encrypt` and `filesystems` hooks.
- `x setup` and `x setup --user` work from the `x-scripts` payload (they are architecture-independent).
- `x-release-apply` and `x gen` are available after installation.

### ISO boot configuration

`x/grub/grub.cfg` uses:

```grub
set linux_path=/%INSTALL_DIR%/boot/%ARCH%/vmlinuz-linux
set initrd_path=/%INSTALL_DIR%/boot/%ARCH%/initramfs-linux.img
```

With `%ARCH%` = `aarch64`, the path is correct only if the live environment provides a kernel named `vmlinuz-linux`. The ALARM kernel provides `/boot/Image`.

`x/grub/loopback.cfg` already has an `arm64` branch for the UEFI shell (`shellaa64.efi`), inherited from archiso. The main menu still points to `vmlinuz-linux`.

`x/syslinux/*` is x86-only and must not be part of the ARM profile.

### Tests and VM launcher

- `x/tests/e2e-autoinstall.py` uses `qemu-system-x86_64`, `/usr/share/edk2/x64/OVMF_*`, and `--mode bios|uefi`.
- `x/vm.sh` uses `qemu-system-x86_64`, `edk2-ovmf` and x64 OVMF paths.

There is no aarch64 path in either script.

## `scripts/` - provisioning and the `x` CLI

Strengths:

- The payload is `any` (`packaging/PKGBUILD`).
- `install/*.sh` is Bash and mostly generic; only the NVIDIA auto-detection depends on `lspci`.
- The `x` CLI is a file-based dispatcher; it does not compile anything.
- `x-gen-*` and `x-kernel-*` are separable and testable.

ARM problems:

| File | Line | Problem |
|---|---:|---|
| `install/helpers/xkernel.sh` | 14 | Known kernels are `linux linux-lts linux-zen linux-hardened linux-rt linux-rt-lts`; ARM kernels are missing |
| `install/helpers/xkernel.sh` | 36-42 | `xkernel_release_of_pkgbase` reads `/usr/lib/modules/*/pkgbase`; `linux-aarch64` does not ship that file |
| `install/helpers/xgen.sh` | 259-320 | `xgen_capture_kernel` globs `boot/vmlinuz-*`; ALARM uses `Image` or `kernel8.img` |
| `install/helpers/xgen.sh` | 303-313 | `xgen_pick_pair` pairs `vmlinuz-<suffix>` with `initramfs-<suffix>.img`; ALARM does not follow that pattern |
| `install/helpers/xgen.sh` | 628-880 | Writes systemd-boot/GRUB entries with `linux /<vmlinuz>`; must receive the real image name |
| `install/helpers/xgen.sh` | 497-499 | Reads `GRUB_CMDLINE_LINUX`; on Raspberry Pi the cmdline is in `/boot/cmdline.txt` |
| `install/x-base.packages` | - | Generic list; compatible |
| `hardware/nvidia.sh` | - | x86/NVIDIA only; not applicable to ARM |
| `hardware/qemu.sh` | - | Installs `qemu-desktop` and x86 OVMF assumptions; audit for ARM |
| `tools/hyprland-install.sh` | 217 | Clones `yay` from the AUR and compiles; works on native ARM but needs a toolchain and time |
| `bin/x-kernel-install.sh` / `x-kernel-remove.sh` | - | Depend on `xkernel_*`; inherit the problems above |

The snapshot engine itself (btrfs snapshots, manifest, retention, diff, export/import) is architecture-independent. The problem is kernel discovery and boot entry names, not the generation model.

## `xpkg/` - Rust package builder

Strengths:

- `xpkg/crates/xpkg-core/src/recipe/validate.rs:37` accepts `x86_64`, `aarch64`, `i686`, `armv7h`, `any`.
- `XBUILD` supports `arch = ["x86_64", "aarch64"]`.
- The PKGBUILD parser supports `arch=()`.
- Builds are native: sources are downloaded, `prepare/build/check/package` run, and the result is packed as `.xp` (tar.zst).

Limitations:

- No `--target` or `--arch` option. The build uses the host architecture.
- `CARCH` and `CHOST` come from the environment; there is no built-in matrix.
- The `arch` validation checks metadata only; it does not verify that the host matches.

Conclusion: `xpkg` does not block the port. Run it on an aarch64 host, VM or chroot.

## `xpm/` - package manager

Strengths:

- `GeneralOptions.architecture` is configurable (`xpm-core/src/config.rs:67-68`).
- If unset, it uses `std::env::consts::ARCH` (`xpm/src/main.rs:119-128`, `346-348`, `634-636`).
- Repository URLs use `$arch` (`config.rs:142`, `main.rs:1653-1698`).
- The resolver and transaction engine are architecture-independent.

Problems:

| File | Line | Problem |
|---|---:|---|
| `xpm/src/main.rs` | 119-128 | `std::env::consts::ARCH` returns `arm` on ARMv7, not `armv7h`; `x/armv7h` would not resolve |
| `xpm/src/main.rs` | 346-348, 634-636 | Same in other subcommands |
| `xpm-core/src/config.rs` | 268-272 | Examples use `x86_64`; not a bug, but no ARM guidance |
| `xpm/docs/FETCH_TARGETS.md` | - | Documents download targets; verify `aarch64` support for `xfetch` |

Recommendation: normalise `arm` to `armv7h` and allow an explicit `architecture = "armv7h"` override in `xpm.conf`.

## `x-repo/` - repository and portals

Hardcoded x86_64:

```bash
# x-repo/build-packages.sh:30-31
REPO_DIR="public/repo/x86_64"
XPM_DIR="public/x/x86_64"
```

Package recipes:

- `x-release`: `arch=('any')`; rebuildable for ARM.
- `x-dev`: `arch=('any')`; rebuildable, but its helpers download `xfetch`/`xtop` and its `nvidia.sh` is x86-oriented.
- `xfetch`: `arch=('x86_64')`; source `xfetch-$pkgver-x86_64-unknown-linux-gnu.tar.gz`.
- `xtop`: `arch=('x86_64')`; Rust build with `cargo fetch --target "$CARCH-unknown-linux-gnu"`.
- `opencode-bin`: `arch=('x86_64')`; source `opencode-linux-x64.tar.gz`.

Other x86_64 assumptions:

- `build-packages.sh:167`: "Commit public/repo/x86_64/".
- `.github/workflows/build.yml:37-38`: checks `public/repo/x86_64/x.db` and `x-release-*.pkg.tar.zst`.
- `x-repo/docs/en/repo-layout.md` and `publishing.md` describe only x86_64.

There is no multi-architecture layout, no per-architecture `history.json`, and no separate signing policy.

## `wiki/` and `web/` - documentation

`wiki/x/{en,es}/` contains five documents per language:

- `building.md`: `work/x86_64`, `packages.x86_64`, `out/x-...-x86_64.iso`.
- `installer.md`: `packages.x86_64`, GRUB `x86_64-efi` + `i386-pc`.
- `project-layout.md`: `packages.x86_64`, `bootstrap_packages.x86_64`.
- `vm-testing.md`: `qemu-system-x86_64`, OVMF x64.
- `index.md`.

`web/content/{en,es}/x/*` mirrors those documents. `web/data/releases.json` only contains `x-2026.10.18-x86_64.iso` and its signature. `web/components/Install.tsx:39` shows `dd if=x-<version>-x86_64.iso`. `web/components/Landing.tsx:42` shows the x86_64 repository URL.

There is no ARM page, no architecture selector in downloads, no `arch` field in `releases.json`, and no note stating that X is x86_64-only.

## `wsl/`, `wsl-scripts/`, `utils/` and `ops/`

- `wsl/build-rootfs.sh` uses `pacstrap` with the host `pacman.conf` and mirrorlist, then `pacman-key --populate archlinux` (lines 202-208). It produces an x86_64 rootfs.
- `wsl-scripts/*` assumes the x86_64 rootfs and does not detect architecture.
- `utils/` contains workspace utilities; architecture-independent.
- `ops/docs/requirements.md:10` states "Arch Linux x86_64, up to date"; the VM instructions use `qemu-system-x86_64` and x64 OVMF. `ops/docs/state/*` lists only x86_64 ISOs.

WSL on Windows 11 ARM64 is technically possible, but requires an `aarch64` rootfs and a separate validation path. It is not part of v1.

## Reusable components

| Component | Why |
|---|---|
| `x-scripts` payload (`any`) | Pure Bash; the PKGBUILD is `any` |
| `x-release` | `any`; branding and GRUB hooks work on ARM |
| `x-dev` | `any`; audit `nvidia.sh`, `qemu.sh` and `xfetch`/`xtop` downloads |
| `xpkg` | Builds natively on aarch64; validates `aarch64`/`armv7h` |
| `xpm` | Resolver and transactions are generic; normalise `$arch` |
| `xgen` engine | btrfs, manifests, retention, diff, export/import are architecture-independent |
| `install/*.sh` | User/system provisioning is generic except NVIDIA |
| `web`/`wiki` | Next.js/Markdown; only content is missing |
| `ops` runbooks | Release and signing processes are reusable with two architectures |

## Minimum change set for a bootable ARM ISO

1. `x/profiledef.sh`: `arch="aarch64"`, `packages_file="packages.aarch64"`, `bootmodes=('uefi.grub')`, `-Xbcj arm64`.
2. `x/packages.aarch64`: remove the 10 non-applicable packages, add `linux-aarch64`, `grub`, `efibootmgr`, `archlinuxarm-keyring`, `pacman-mirrorlist`.
3. `x/pacman.conf` and `x/airootfs/etc/pacman.conf`: ALARM repositories and ALARM mirrorlist; `[x]` with `$arch`.
4. `x/airootfs/etc/pacman.d/mirrorlist`: ALARM mirrorlist.
5. `x/grub/grub.cfg`: point to `/Image` or create a `vmlinuz-linux` symlink in the airootfs.
6. `xbuild.sh` / `x.sh`: parameterise `work/$arch`.
7. `install.sh`: detect `uname -m`, map the kernel, use `grub-install --target=arm64-efi`, populate `archlinuxarm`, use `$arch` in `[x]`.

With those changes the ISO can be built. Installing and generating require the changes in [Installer](arm-installer.md) and [Generations](arm-generations.md).

## References

- `x/profiledef.sh:11-17`
- `x/xbuild.sh:11-18`, `x/x.sh:2`
- `x/pacman.conf:84`, `x/airootfs/etc/pacman.conf:83`
- `x/airootfs/root/x-installer/install.sh:39, 46-47, 88, 207, 251, 271, 312, 390-408, 418, 428-431, 445-450`
- `scripts/install/helpers/xkernel.sh:14, 36-42`
- `scripts/install/helpers/xgen.sh:259-320, 628-880`
- `xpkg/crates/xpkg-core/src/recipe/validate.rs:37`
- `xpm/crates/xpm/src/main.rs:119-128`
- `x-repo/build-packages.sh:30-31`, `x-repo/.github/workflows/build.yml:37-38`
- `wsl/build-rootfs.sh:202-208`
- `ops/docs/requirements.md:10`
