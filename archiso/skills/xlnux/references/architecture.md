# X Linux architecture (xlnux)

## Repo topology

Each component is an independent git repo cloned side by side under `/home/x/Documents/repos/xlnux/`; the parent directory is not a repo. Cross-repo contracts are file/CLI/env based, not submodules.

## ISO profile (`x/`)

`profiledef.sh` (verified 2026-10-01):

```sh
iso_name="x"; iso_label="x_$(date ... +%Y%m)"; iso_version="$(date ... +%Y.%m.%d)"
iso_publisher="Xscriptor <https://xscriptor.io/x>"
install_dir="arch"
buildmodes=('iso')
bootmodes=('bios.syslinux' 'uefi.grub')
airootfs_image_type="squashfs"
airootfs_image_tool_options=('-comp' 'xz' '-Xbcj' 'x86' '-b' '1M' '-Xdict-size' '1M')
bootstrap_tarball_compression=('zstd' '-c' '-T0' '--auto-threads=logical' '--long' '-19')
```

- 141 packages: full rescue/live toolkit (clonezilla, gpart, testdisk, fsarchiver, nmap, tcpdump, lvm/mdadm/cryptsetup, tpm2, openconnect/openvpn, firefox, NetworkManager, x-release, x-dev) + `gum` for the installer UI.
- `pacman.conf`: `[x]` repo first (`Server = https://xlnux.github.io/x-repo/repo/x86_64`, `SigLevel = Optional TrustAll`) + core/extra; same file in `airootfs/etc/pacman.conf`.
- Live identity: autologin root on tty1, `x-autoinstall.service`, pacman-init, choose-mirror, reflector (conditioned on `!mirror`), systemd-networkd + iwd + NetworkManager enabled, sshd with root/password auth (ISO only), volatile journald, no suspend.
- `customize_airootfs.sh` initializes keyring and enables `x-autoinstall.service`/NetworkManager.
- `.zlogin` launches `xinstall` on tty1 when no `script=`/`xauto=1`; `/usr/local/bin/xinstall` wraps the installer.
- Build: `sudo ./xbuild.sh` (unmounts work, wipes out/, `mkarchiso -C pacman.conf -v -w ./work -o ./out .`, logs to `build-<ts>.log`); minimal variant `x.sh`.
- VM: `x/vm.sh` (QEMU; `--boot iso|disk`, `--uefi`, `--seed` cidata with `x-install.json`, `xauto=1` in the kernel cmdline triggers unattended install via `autoinstall.sh`; default disk `~/x-vm.qcow2`, 32G, 6G RAM, KVM auto).

## Installer (`x/airootfs/root/x-installer/`)

Bash (`set -euo pipefail`) + gum, no Calamares:

| File | Role |
|---|---|
| `installer.sh` | entry; honors `X_SKIP_INSTALLER=1`, `X_DRY=1` |
| `configurator.sh` | interactive collection → JSON (mode 600) |
| `install.sh` | partition/format/pacstrap/provision/bootloader/first generation |
| `autoinstall.sh` | unattended via `x-autoinstall.service` (requires `xauto=1` + `cidata` label + `x-install.json`) |
| `ui.sh` | gum/plain prompts |
| `packages.x86_64` | full-profile manifest (same as profile list) |
| `packages/x-scripts-*.pkg.tar.zst` | offline provisioning payload |

JSON keys: `disk, hostname, username, password, language, locale, keyboard, timezone, profile(full|core), bootloader(grub|systemd-boot), encryption(no|yes), luks_password, hyprland(no|yes)`. Mandatory: `disk`, `hostname`, `username`.

Partitioning (`sgdisk --zap-all`):
- GRUB: p1 1M BIOS boot, p2 1G EFI, p3 rest.
- systemd-boot: p1 1G EFI, p2 rest.
- LUKS2 optional (`cryptsetup luksFormat --type luks2`, mapper `xroot`).
- btrfs subvols `@ @home @snapshots @xstate`, `/tmp` tmpfs, ESP at `/boot`.
- `pacstrap -K` online (official + `[x]`), then install offline `x-scripts-*.pkg.tar.zst`.
- Provisioning: `X_HW_AUTO=0 X_GEN_SKIP=1 x setup` (root) + `x setup --user` (user); optional Hyprland via `tools/hyprland-install.sh`.
- Branding: `x-release-apply` before bootloader.
- First generation: `X_GEN_CMDLINE="$CMDROOT" X_GEN_LIVE_SUBVOL=/@ x gen new --reason install --label first` (guarded by `test -x /usr/bin/x`; **current payload lacks `x gen`**, so it warns).

## x-scripts payload (`scripts/`)

- `bin/x` dispatcher: `x-<group>-<verb>.sh` resolution, `# x:summary/aliases/root` metadata, exec bash.
- `install/` phase scripts (`system.sh`, `config.sh`, `hardware.sh`, `login.sh`, `user.sh`, `user-seed.sh`); `install/helpers/{common,sync,xgen,xgen-home}.sh`.
- `etc/` overlay installs pacman hooks; `hooks/pacman-gen.sh` wrapper; `migrations/` (empty mechanism); `themes/x-dark`; `tools/` (node, hyprland); `config/` dotfiles seed; `skel/.bashrc`.
- Package: `scripts/packaging/PKGBUILD` → `x-scripts 0.1.0-13` (depends `bash` only — audit list includes adding `btrfs-progs`/`zstd`/`util-linux` relations and a LICENSE).
- Vendor pinning: `packaging/vendor-config.lock` pins 10 upstream repos to exact commits merged into the package.

## `[x]` repo and artifacts (`x-repo/`)

- `build-packages.sh`: `makepkg` for `x-release` (1.0-8) and `x-dev` (1.0-2), imports `x-scripts` artifact, `repo-add -R x.db.tar.gz *.pkg.tar.zst`, symlinks `x.db`/`x.files`, `sha256sum * > SHA256SUMS`; commit + push; Pages workflow (manual) deploys the Next.js portal.
- `packages/x-release`: os-release (`NAME="X"`, `ID=x`, `ID_LIKE=arch`, `LOGO=x`), grub defaults, logos, wallpapers, `x-release-apply`, pacman hooks `99-x-os-release`, `99-x-grub`.
- Native `.xp` endpoint `public/x/x86_64/` is **disabled/frozen** (build-x-native workflow disabled; `build_xbuild` commented). Version drift exists between PKGBUILD/XBUILD/published artifacts.

## Build/validation commands (canonical)

```bash
# Repo-local validation (no root)
bash scripts/test/validate.sh              # smoke + generations + boot + hooks + home-gens + cargo tests
# Real btrfs (root, loop device)
sudo bash scripts/test/generations-btrfs.sh
# ISO build + VM e2e (blocking validation, not yet green)
sudo x/xbuild.sh
x/vm.sh --seed                             # add xauto=1 at the boot menu
```

## Related generic knowledge

Mapping to the rest of this pack: profile/ISO → `archiso` skill; packaging → `arch-packaging`; boot entries/UKI/SB → `distro-boot`; installer patterns (Calamares/archinstall as alternatives) → `distro-installers`; CI/QEMU/release → `distro-release`. X deliberately differs: Bash installer instead of Calamares, custom generations instead of snapper/limine, own repo instead of chaotic-aur.
