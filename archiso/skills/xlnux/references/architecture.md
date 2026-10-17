# X Linux architecture (verified 2026-10-17)

## Topology

Workspace `/home/x/Documents/repos/equislinux/` (not a monorepo, not a git repo itself). Each component is its own repository on `main`:

| Repo | Role |
|---|---|
| `x/` | archiso v91 profile, Bash `x-installer`, `xbuild.sh`, `vm.sh`, e2e harness |
| `scripts/` | `x` CLI, generations engine, home generations, hooks, migrations, provisioning, `x-scripts` package |
| `xpm/` | Rust package manager (native `.xp` + ALPM, SAT resolver, journal, rollback/diff) |
| `xpkg/` | Rust builder (XBUILD/PKGBUILD, signing, lint, repo DB + `.files`, history) |
| `x-repo/` | GitHub Pages: signed `[x]` pacman repo, native `.xp` endpoint, portal, packaging |
| `wsl/`, `wsl-scripts/` | WSL rootfs builder/importer and two-stage in-distro provisioning |
| `web/`, `wiki/` | Public portal and aggregated bilingual documentation |

## ISO profile (`x/`)

- archiso **v91**; `profiledef.sh`: `iso_name=x`, label `X`, publisher `X Linux`; bootmodes `bios.syslinux` + `uefi.grub` (mutually exclusive with systemd-boot for UEFI in v91). The orphaned `efiboot/` tree was removed.
- Live rootfs: full Arch base plus rescue/tooling (btrfs-progs, zstd, NetworkManager, openssh, grub/syslinux, firmware, editors, etc.). `airootfs` overrides for branding, MOTD, sysctl, locale, sshd (root only in the live session).
- Keyring: no `customize_airootfs.sh` (retired in session 23). `pacman-init.service` + `x-keyring.service` populate the keyring; enablement symlinks are committed.
- Networking: **only NetworkManager** in the live session (no networkd/iwd overlap). `choose-mirror` + reflector run before install.
- Users: root autologin on `tty1`; `x-autoinstall` consumes the JSON config from the cidata/seed and powers off on completion. Installed systems get the user configured in JSON.
- Journald volatile in live; persistent on target.

## Installer (`/root/x-installer`)

- Entry points: `install.sh` (non-interactive), `configurator.sh` (TUI), `helpers/`; shared JSON schema.
- Config keys (documented subset): `disk`, `mode` (`wipe`/`dualboot`), `hostname`, `username`, `password`, `language`, `locale`, `keyboard`, `timezone`, `profile`, `bootloader`, `kernel`, `kernel_params`, `encryption`, `luks_password`, `agents`, `hyprland` (`no`/`yes`/`online`), `hyprland_ref`.
- Partitioning: GPT, 1 GiB FAT32 ESP, optional LUKS2 root, btrfs with subvolumes `@`, `@home`, `@snapshots`, `@xstate`; mounting and fstab generation.
- Payload: offline `x-scripts` package embedded in the ISO (`0.1.0-37` as of 2026-10-17) installed with `pacstrap`; online mode uses the mirrors. The payload includes the generations engine, hooks, tools, themes and provisioning.
- First generation: `x-scripts` post-install creates generation `0001` with `X_GEN_SUBVOL_PREFIX=/@snapshots` (explicit in `install.sh`; the engine also auto-detects it).
- Desktop: `hyprland=yes` deploys the vendored equisdots snapshot (pinned 2026-10-04); `hyprland=online` clones `equisdots` `main` plus app configs and runs theme sync, with automatic fallback to the snapshot if the clone fails. `hyprland_ref` pins a ref for `online`.
- Bootloader: GRUB (BIOS+UEFI) or systemd-boot (UEFI only); per-generation entries, `x-rescue`, newest generation as default. Initramfs regenerated per kernel.
- Target identity: `/etc/os-release` (`ID=x`, `ID_LIKE=arch`) from the `x-release` package; `/etc/motd` empty on installed systems.

## Package repo (`x-repo`)

- `[x]` pacman repo on GitHub Pages: `https://equislinux.github.io/x-repo/repo/x86_64`, **signed**, `SigLevel = Required`; keyring embedded in live and target. Built with `build-packages.sh` (makepkg + `repo-add`), SHA256SUMS published.
- Native `.xp` endpoint: `https://equislinux.github.io/x-repo/x/x86_64` built/signed by `scripts/build-xp.sh` (wraps xpkg), consumed end-to-end by xpm.
- `x-release`, `x-scripts` and the rest of the distro packages live in `x-repo/packages/`; version drift reconciled (x-scripts 0.1.0-37, x-release 1.0-8).
- Portal: Next.js static export on Pages.

## Build and validation

```bash
# ISO
cd x && sudo ./xbuild.sh                 # out/x-YYYY.MM.DD-x86_64.iso + .sha256

# Static + rootless suite
bash scripts/test/validate.sh            # 362 checks

# Real btrfs (loop device)
sudo bash scripts/test/generations-btrfs.sh

# Installer E2E (QEMU/OVMF or SeaBIOS)
python3 x/tests/e2e-autoinstall.py --mode uefi
python3 x/tests/e2e-autoinstall.py --mode bios --profile full --hyprland yes
```

The e2e harness asserts: install rc=0, `/var/lib/x/current` + boot entry `0001`, `x gen verify`, package install creates a newer generation, **the newest generation becomes the boot default**, and a reboot lands in it. It also checks the absence of `db.lck` and collects serial evidence.

Publication: `x-repo/scripts/publish-iso.sh --verify` signs, uploads to SourceForge, removes the previous ISO, updates `web/data/releases.json`, waits for the stable URL and verifies the hash. `wsl/publish-sf.sh` mirrors the WSL rootfs.

## Related generic knowledge

- `archiso`, `arch-packaging`, `distro-boot`, `distro-installers`, `distro-release` skills for Arch/archiso specifics.
- `xlnux/references/generations.md` for the generations contract; `known-issues.md` for the current backlog.
