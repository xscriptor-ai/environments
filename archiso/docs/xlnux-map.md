# X Linux — project map and pack coverage

Verified against the local repos on **2026-10-17**. This document connects each piece of X with the pack's resources and marks what is missing. Session state: `/home/x/Documents/repos/equislinux/ESTADO-GENERACIONES.md`.

## Component → coverage map

| Component | What it is | Pack resources | Status / gap |
|---|---|---|---|
| `x/` profile + `x-installer` | archiso ISO, Bash installer, subvols, gen `0001` | `agents/xlnux-installer`, `archiso-profile`, `archiso-build`; `archiso`, `distro-boot` skills | VM e2e **green** (UEFI+BIOS, ISO 10.17); publish pending |
| `scripts/` generations | `x gen`, home gens, hooks, migrations, tests | `agents/xlnux-generations`; `xlnux` skill refs `generations.md`, `known-issues.md` | Real btrfs + e2e green; newest-gen default implemented and validated |
| `scripts/` provisioning | `x setup`, user, hardware, themes, Hyprland | `archiso-branding`, `archiso-desktop`; `distro-installers` skill | Online Hyprland (`hyprland=online`) + snapshot fallback; vendored snapshot pinned 2026-10-04 |
| `xpm` | Rust package manager | `agents/xlnux-packages`; `xlnux` skill ref `xpm-xpkg.md` | Resolver/keyring/local `.xp`/rollback/diff/pacnew done; 2 P1 bugs (gcc-libs cycle, zoneinfo hardlinks) |
| `xpkg` | Rust builder + repo-add | same | `.files` DB, history/provenance, benchmarks; E2E lifecycle green |
| `x-repo` | `[x]` repo on GitHub Pages + portal | `agents/xlnux-packages`, `archiso-packages`; `arch-packaging` skill | Signed `Required` + embedded keyring; native `.xp` endpoint live; ISO publish in progress |
| `wsl/` + `wsl-scripts/` | Importable WSL rootfs + provisioning | `agents/xlnux-wsl`, `distro-installers`; `systems` skill | Rootfs `v0.1.0` published + SourceForge mirror; `install.ps1` untested on Windows |
| `web/` + `wiki/` | Portal and aggregated docs | `senior-frontend`, `web`, `api-design` skills | Bilingual mirrors synced; landing/org profile refreshed |
| Packaging/release | PKGBUILDs, signing, SourceForge | `archiso-ci`, `distro-release` skills | GitHub Pages auto-deploy; SourceForge publishing scripted and verified |

## Coverage summary

- **Strong**: archiso profile/installer, generations engine and contracts, xpm/xpkg architecture, signing/keyring flow, VM e2e harness, docs mirrors.
- **Usable with care**: vendored desktop snapshot (pinned 4-oct, missing the plugin stack), WSL importer (PowerShell path untested).
- **Deliberately out of scope**: CI (local by owner decision), UKI/Secure Boot (Microsoft-signed shim only), btrfs home snapshots, equisdots plugin hosting.

## Current status (October 2026)

- ISO `x-2026.10.17-x86_64.iso` built with payload `x-scripts 0.1.0-37`; e2e UEFI and BIOS green, including newest-generation default and reboot into it.
- `[x]` serves payload 36; payload 37 is bundled in the ISO but not yet published. The 10.17 ISO is not yet uploaded to SourceForge.
- `hyprland=online` installs the latest equisdots stack (plugin system included); `hyprland=yes` deploys the pinned snapshot.
- Open P1: two xpm bugs, owner crypto backup/rotation, `install.ps1` on real Windows.
- Details and prioritisation: `skills/xlnux/references/known-issues.md`.

## How to use this pack

1. Read `skills/xlnux/SKILL.md` for the component map and installed-system contract.
2. Use `skills/xlnux/references/*` for the area you touch (generations, xpm/xpkg, WSL, architecture).
3. Select an agent: `xlnux-installer` (ISO/VM), `xlnux-generations` (engine/tests), `xlnux-packages` (xpm/xpkg/x-repo), `xlnux-wsl`.
4. Validate through `commands/xlnux-validate.md` and `commands/xlnux-vm.md`; generic Arch depth lives in the sibling skills (`archiso`, `arch-packaging`, `distro-*`).
