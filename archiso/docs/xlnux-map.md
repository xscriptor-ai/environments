# X Linux (xlnux) — project map and pack coverage

Verified against the local repos on **2026-10-01**. This document connects each piece of X with the pack's resources and marks what is missing. Session state: `/home/x/Documents/repos/xlnux/ESTADO-GENERACIONES.md`.

## Component → coverage map

| Component | What it is | Pack resources | Gap |
|---|---|---|---|
| `x/` profile + `x-installer` | archiso ISO, Bash installer, subvols, gen 0001 | `agents/xlnux-installer`, `archiso-profile`, `archiso-build`; `archiso`, `distro-boot` skills | VM e2e validation (P0) |
| `scripts/` generations | `x gen`, home gens, hooks, migrations, tests | `agents/xlnux-generations`; `xlnux` skill refs `generations.md`, `known-issues.md` | Subvol prefix (P0), real btrfs (P0) |
| `scripts/` provisioning | `x setup`, user, hardware, themes, Hyprland | `archiso-branding`, `archiso-desktop`; `distro-installers` skill | — |
| `xpm` | Rust package manager | `agents/xlnux-packages`; `xlnux` skill ref `xpm-xpkg.md` | Resolver/local install (P2) |
| `xpkg` | Rust builder + repo-add | same | `.files` DB, history hygiene, xpm E2E |
| `x-repo` | `[x]` repo on GitHub Pages + portal | `agents/xlnux-packages`, `archiso-packages`; `arch-packaging` skill | Repo signing (P1) |
| `wsl/` + `wsl-scripts/` | WSL rootfs + provisioning | `agents/xlnux-wsl`; `xlnux` skill ref `wsl.md`; new generic ref `distro-release/references/wsl-images.md` | untested install.ps1, legacy `x/` |
| `web/`, `wiki/` | portal and bilingual docs | outside the pack's scope (web/TS packs) | Keep es/en mirrors |
| Boot generations | SB/GRUB entries, `x-rescue`, future UKI | `distro-boot` (bootloaders, initramfs/UKI, secureboot) | UKI/SB/multi-kernel (roadmap) |
| Chain security | package/repo/ISO signatures | `arch-packaging`, `distro-release` | current `TrustAll` (P1) |
| Legal/identity | trademark, licenses, os-release | `docs/distro-blueprint.md` (compliance section), `archiso-branding` | LICENSE in `scripts/`, trademark audit |

## archiso pack coverage (generic + X)

- **Generic (applicable now)**: profile and build (archiso 91), bootmodes, packaging and signed repos, boot/UKI/Secure Boot/TPM, installers (Calamares/archinstall as alternatives), branding/first-boot, storage (btrfs/LUKS/snapper/hibernation), desktop, CI/QEMU/release, blueprints, state of the world 2026 with versions and myths.
- **X-specific (new)**: `xlnux` skill (architecture, generations contract, xpm/xpkg, WSL, prioritized issues), 4 agents (`xlnux-generations`, `xlnux-installer`, `xlnux-packages`, `xlnux-wsl`), `/xlnux-validate` and `/xlnux-vm` commands, this map.

## Generic gaps closed in this pass

1. **WSL**: new reference `distro-release/references/wsl-images.md` (importable rootfs, `wsl.conf`, default user, systemd, machine-id hygiene, official Arch WSL image).
2. **Compliance and licenses**: new section in `distro-blueprint.md` (0BSD of Arch sources, GPL of packages, Arch trademark, attribution, privacy/telemetry policy).
3. **Vulnerabilities**: new tracking section (Arch security tracker, arch-audit, CVE feeds, `checkrebuild`).
4. **Accessibility**: note in the blueprint and in the desktop agent (speech/brltty/espeakup, `accessibility=on` pattern that X already uses).

## X project gaps the pack cannot close (require work in xlnux)

See `skills/xlnux/references/known-issues.md` (20 prioritized items). The blockers:

1. Installer VM e2e (P0) — `/xlnux-vm` guides the procedure.
2. `X_GEN_SUBVOL_PREFIX` (P0).
3. Outdated `x-scripts` payload (P0) — without `x gen` the installer does not create gen 0001.
4. `generations-btrfs.sh` with root (P0).
5. Restore traversal + root flags (P1), repo signing (P1), CI (P2), xpm resolver (P2).

## Recommended order (current sprint)

1. Rebuild the payload (`x-scripts` pkgrel+1) and replace it in `x/airootfs/root/x-installer/packages/`.
2. `sudo bash scripts/test/generations-btrfs.sh` and fixes.
3. `sudo x/xbuild.sh` + `x/vm.sh --seed` with `xauto=1`; assert gen 0001 + rollback.
4. Fix `X_GEN_SUBVOL_PREFIX=/@snapshots` in installer/hooks/setup/update.
5. Minimal CI (`validate.sh` + cargo) and `[x]` repo signing.

## How to use the pack

```bash
# install
cp agents/*.md ~/.config/opencode/agents/
cp -r skills/* ~/.config/opencode/skills/
cp commands/*.md ~/.config/opencode/commands/
```

- Before touching generations: load the `xlnux` skill and read `references/generations.md` + `known-issues.md`.
- To validate: `/xlnux-validate` (rootless) and `/xlnux-vm` (root, QEMU).
- For platform questions (archiso/pacman/boot): the generic skills.
