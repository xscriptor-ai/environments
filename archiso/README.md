# Archiso Pack — agents, skills, commands and docs (October 2026)

Agent, skill, command and documentation pack for OpenCode covering the building of Arch Linux-based distributions: archiso/mkarchiso, packaging, boot and Secure Boot, installers, branding, CI, QEMU testing and release engineering.

All the knowledge is verified against primary sources on **2026-10-01** (archiso **91-1**, pacman 7.1, mkinitcpio 42, archinstall 4.5, Calamares 3.4.3, systemd 262, GRUB 2.16).

## Contents

- `agents/` — 19 subagents: 15 generic + 4 X Linux ones (`xlnux-generations`, `xlnux-installer`, `xlnux-packages`, `xlnux-wsl`).
- `skills/` — 6 deep-reference skills with `references/`:
  - `archiso` (profile, bootmodes, live env)
  - `arch-packaging` (devtools/pkgctl, repos and signatures, AUR)
  - `distro-boot` (bootloaders, initramfs/UKI, Secure Boot)
  - `distro-installers` (Calamares, archinstall, first-boot/branding)
  - `distro-release` (CI, QEMU testing, release engineering, WSL images)
  - `xlnux` (X architecture, generations, xpm/xpkg, WSL, prioritized issues)
- `commands/` — 6 commands: `/archiso-new`, `/archiso-build`, `/archiso-test`, `/archiso-diag`, `/xlnux-validate`, `/xlnux-vm`.
- `docs/` — state of the ecosystem 2026, distro blueprint from zero to release, source map, and the X Linux project map with gap analysis.

## X Linux layer

This pack is meant to work on **X Linux** (`/home/x/Documents/repos/equislinux`), the Arch-based distro of this workspace (`x/` profile + Bash installer, btrfs generations in `scripts/`, `xpm`/`xpkg`, WSL, `x-repo`). The specific layer lives in:

- skill `xlnux` — real architecture, generations contract, Rust toolchain, WSL and a prioritized `known-issues.md` (P0–P2).
- `xlnux-*` agents — generations, installer/VM, packaging and WSL.
- `/xlnux-validate` and `/xlnux-vm` commands — validation gates (rootless suite, real btrfs, QEMU e2e).
- `docs/xlnux-map.md` — component→coverage map and open gaps.

Current status (2026-10-17): no P0 blockers. ISO 10.17 (payload 37) built and e2e-validated on UEFI+BIOS, including the newest-generation default and reboot; `[x]` is signed and `Required`; the native `.xp` endpoint is live and consumed by xpm. Open: two xpm P1 bugs, publishing payload 37 / ISO 10.17, refreshing the vendored desktop snapshot for the plugin stack, and owner crypto housekeeping. Details in `skills/xlnux/references/known-issues.md`.

## Install

```bash
# Agents (flat copy, as opencode expects)
cp agents/*.md ~/.config/opencode/agents/
# Skills (one folder per skill)
cp -r skills/* ~/.config/opencode/skills/
# Commands
cp commands/*.md ~/.config/opencode/commands/
```

Then restart opencode. The agents already ship with `permission` allow-all (no prompts when delegating), like the rest of the installed pack.

## Key findings this pack corrects (against old documentation)

1. **archiso v91** (2026-09-27): the only valid bootmodes are `bios.syslinux`, `uefi.systemd-boot` and `uefi.grub`. The granular names (`uefi-x64.systemd-boot.esp`, `bios.syslinux.eltorito`, …) are deprecated since v86 and are remapped automatically. `uefi.systemd-boot` and `uefi.grub` are mutually exclusive.
2. **`customize_airootfs.sh` is deprecated** (notice since v91): the supported method is pacman hooks in `airootfs/etc/pacman.d/hooks/` marked with `# remove from airootfs!`.
3. **mkarchiso can run rootless** via `unshare` since v89; since v91 it warns if run with sudo. `-r` deletes the workdir (it is not "reproducible"); `-m` selects build modes (`iso`, `netboot`, `bootstrap`), not mirrors. Reproducibility is anchored with `SOURCE_DATE_EPOCH`/`<work>/build_date`.
4. **The `baseline` profile was NOT removed** (still in v91, 12 packages, erofs+lzma). **EROFS is not the default**: `airootfs_image_type` defaults to `squashfs`; releng uses squashfs+xz.
5. **archiso does not sign or enroll Secure Boot**: the official ISO does not support it either. You have to repack with shim/PreLoader or sign with your own keys (`sbctl` 0.18).
6. **There is no native x86_64 UKI in archiso**: v91 only uses `ukify`/`stubble` for AArch64. For an x86_64 UKI ISO you have to add your own `uki` preset + entries under `EFI/Linux/`.
7. **`linux-firmware` has been split since 2025-06-21**: it is now an empty meta-package; ISOs can save hundreds of MB by choosing `linux-firmware-{amdgpu,intel,nvidia,realtek,other}`.
8. **Official packaging lives in Git** (SVN→Git migration completed 2023-05-21): `pkgctl repo clone`, 0BSD sources, `pkgctl build/release/db`. `asp` and `dbscripts` no longer exist; `offload-build` is no longer a binary (`pkgctl build --offload`).
9. **Calamares moved to Codeberg** (GitHub archived 2025-08-18); latest 3.4.3 (2026-09-10), Qt6/KF6 first-class. **There is no Calamares page on the Arch Wiki** (404).
10. **mkinitcpio 42 changed the PCRs** (Arch notice 2026-09-22): LUKS volumes unlocked by TPM2 must be re-enrolled. With a systemd initramfs (default since mkinitcpio 40) `grub-btrfs-overlayfs` does not work; the 2026 route for bootable snapshots is Limine + `limine-snapper-sync`.

Primary sources: `gitlab.archlinux.org/archlinux/archiso` (via GitHub mirror), `wiki.archlinux.org/title/Archiso`, `archlinux.org/packages`, `man.archlinux.org`, `codeberg.org/Calamares`, `github.com/archlinux/archinstall`, `archboot.com`. Full detail in `docs/sources.md`.

## Recommended flow

1. `distro-architect` defines scope, base (archiso vs fork vs artools/garuda-tools) and roadmap.
2. `archiso-profile` + `archiso-build` create and build the profile.
3. `archiso-boot` / `archiso-secureboot` / `archiso-kernel` harden the boot path.
4. `archiso-calamares` or `archiso-archinstall` add the installer.
5. `archiso-branding` and `archiso-desktop` give it identity and a session.
6. `archiso-ci` + `archiso-testing` automate build, smoke test and release.
7. `archiso-troubleshooting` steps in when something does not boot.
