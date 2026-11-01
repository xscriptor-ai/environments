---
name: xlnux
description: Project reference for X Linux (equislinux), the Arch-based distro built on this machine (October 2026). Use when working on any X component: x/ archiso profile and installer, scripts/ generations engine and x CLI, xpm/xpkg Rust tooling, wsl/wsl-scripts, x-repo, or when validating the installer/generations in QEMU. Covers architecture, contracts, current status and known issues.
---

# X Linux Reference (October 2026)

X is a custom Arch spin with its own signed `[x]` package repo, a Bash text installer, and a NixOS-style **generations** system over btrfs. Workspace: `/home/x/Documents/repos/equislinux/` (not a monorepo: each subdirectory is its own git repo; the parent is not).

## Component map

| Path | Repo | Branch | Tech | Purpose |
|---|---|---|---|---|
| `x/` | `equislinux/x` | `main` | Bash/archiso | archiso profile, `x-installer`, `xbuild.sh`, `vm.sh`; WSL lives in `equislinux/wsl` |
| `scripts/` | `equislinux/scripts` | `main` | Bash | `x` CLI, generations engine, home gens, hooks, migrations, provisioning, `x-scripts` package |
| `xpm/` | `equislinux/xpm` | `main` | Rust | Package manager (ALPM + native `.xp`, SAT resolver, hooks, journal, rollback/diff, pacnew) |
| `xpkg/` | `equislinux/xpkg` | `main` | Rust | Package builder (XBUILD/PKGBUILD, signing, lint, repo DB + `.files`, history, benchmarks) |
| `wsl/` | `equislinux/wsl` | `main` | Bash/PowerShell | Importable WSL rootfs builder + Windows importer |
| `wsl-scripts/` | `equislinux/wsl-scripts` | `main` | Bash | Two-stage in-distro provisioning for WSL |
| `x-repo/` | `equislinux/x-repo` | `main` | Next.js + Bash | GitHub Pages: signed `[x]` pacman repo + native `.xp` endpoint + portal |
| `web/`, `wiki/` | `equislinux/web`, `equislinux/wiki` | `main` | Next.js / Markdown | Docs portal and aggregated bilingual docs |

Status doc: `/home/x/Documents/repos/equislinux/ESTADO-GENERACIONES.md` (session log + blockers).

## Installed-system layout (the contract everything depends on)

```
subvol @          -> /              root, first generation = /@
subvol @home      -> /home          never rolled back
subvol @snapshots -> /.snapshots    generation snapshots (0700)
subvol @xstate    -> /var/lib/x     manifests, packages.tsv, services, boot/, current, pending
/tmp tmpfs; ESP 1 GiB (FAT32)
```

- ISO bootmodes: `bios.syslinux` + `uefi.grub` (archiso v91 names); `efiboot/` was removed.
- `customize_airootfs.sh` retired (session 23): the keyring is handled by `pacman-init.service` + `x-keyring.service`; enablement symlinks are committed.
- Target bootloaders: GRUB (BIOS+UEFI) or systemd-boot (UEFI only); per-generation entries + `x-rescue`.
- `[x]` is signed and `SigLevel = Required` with the keyring embedded in live and target.
- `os-release`: `ID=x`, `ID_LIKE=arch`, shipped by the `x-release` package from `x-repo`.

## Generations in one screen

- `x gen new` snapshots the root tree (btrfs writable snapshot), writes `manifest.json` (schema 2), captures packages/services/migrations/etc hash and archived kernels — and makes the **new generation the default boot target** (newest wins).
- `x gen rollback <id>` creates a safety generation, pins the target, updates `current` and rewrites boot entries; it overrides the default until a newer generation exists.
- Also: `list/status --json/boot/diff/verify/pin/prune/restore [--pkg]/export/import` (signed/encrypted bundles); home generations `x home ...` (copies, no root/btrfs).
- Auto-creation: pacman hooks in `/usr/share/libalpm/hooks/` (`10-x-gen-pre.hook`, `95-x-gen-post.hook` → `hooks/pacman-gen.sh`), `x setup`, `x update` (suppresses hooks with `X_GEN_SKIP=1` and records its own pre/post).
- Test suite: `bash scripts/test/validate.sh` (362 checks) + `sudo bash scripts/test/generations-btrfs.sh` (real loop btrfs) + `python3 x/tests/e2e-autoinstall.py --mode uefi|bios`.

## Current status (2026-10-17)

- **No P0 blockers.** ISO `x-2026.10.17` built with payload `x-scripts 0.1.0-37`; e2e UEFI and BIOS green (install → boot → generation `0001` → verify → `nano` → newest generation default → reboot into it).
- `[x]` serves payload **36**; 37 is built/bundled but **not published yet**. ISO 10.17 is built/tested but **not uploaded** yet.
- `hyprland=online` installs the latest equisdots stack from GitHub (including the plugin system); `hyprland=yes` still deploys the pinned 4-oct snapshot.
- Open P1: `xpm` resolver `gcc-libs` cycle; `xpm` hardlink extraction (`zoneinfo`); owner crypto backup/rotation; `install.ps1` untested on Windows.

## Where to start

- Generic Arch build knowledge: skills `archiso`, `arch-packaging`, `distro-boot`, `distro-installers`, `distro-release`.
- Project specifics: `references/architecture.md`, `references/generations.md`, `references/xpm-xpkg.md`, `references/wsl.md`, `references/known-issues.md`.
- ARM port: skill `xlnux-arm` and `equislinux/x/docs/en/arm.md`.
- Validation flow: `commands/xlnux-validate.md` and `commands/xlnux-vm.md`.
- Project map and gap analysis: `docs/xlnux-map.md`.

## Conventions

- Docs are bilingual es/en under `docs/{es,en}/`; commits conventional (`feat:`, `docs:`, `fix:`), short branches + PRs, merge to `main`.
- Idempotency is a hard rule for provisioning/migrations; no secrets in any repo (keys live outside git, 0700).
- Never edit a frozen generation via `/.snapshots/<id>` (0700, bootable fork); use `x gen restore`/`rollback`.
- `ESTADO-GENERACIONES.md` is the source of truth for session state; update it when closing blockers.
