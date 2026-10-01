---
name: xlnux
description: Project reference for X Linux (xlnux), the Arch-based distro built on this machine (October 2026). Use when working on any xlnux component: x/ archiso profile and installer, scripts/ generations engine and x CLI, xpm/xpkg Rust tooling, wsl/wsl-scripts, x-repo, or when validating the installer/generations in QEMU. Covers architecture, contracts, current blockers and known issues.
---

# X Linux (xlnux) Reference (October 2026)

X is a custom Arch spin with its own `[x]` package repo, a Bash text installer, and a NixOS-style **generations** system over btrfs. Workspace: `/home/x/Documents/repos/xlnux/` (not a monorepo: each subdirectory is its own git repo; the parent is not).

## Component map

| Path | Repo | Branch (2026-10-01) | Tech | Purpose |
|---|---|---|---|---|
| `x/` | `xlnux/x` | `feat/generations` | Bash/archiso | archiso profile, `x-installer`, `xbuild.sh`, `vm.sh`, legacy WSL builders |
| `scripts/` | `xlnux/scripts` | `feat/generations` | Bash | `x` CLI, generations engine, home gens, hooks, migrations, provisioning, `x-scripts` package |
| `xpm/` | `xlnux/xpm` | `feat/generations-alignment` | Rust | Package manager (pacman-compatible format, journal, hooks) — de-prioritized, not wired as distro PM |
| `xpkg/` | `xlnux/xpkg` | `feat/generations-alignment` | Rust | Package builder (makepkg+repo-add+namcap equivalent, retention, history.json, provenance) — reboot pending |
| `wsl/` | `xlnux/wsl` | `main` | Bash/PowerShell | Importable WSL rootfs builder + Windows importer |
| `wsl-scripts/` | `xlnux/wsl-scripts` | `main` | Bash | Two-stage in-distro provisioning for WSL |
| `x-repo/` | `xlnux/x-repo` | `main` | Next.js + Bash | GitHub Pages: `[x]` pacman repo + `.xp` endpoint + web portal |
| `web/`, `wiki/` | — | `main` | Next.js | Docs site / aggregated bilingual docs |

Status doc: `/home/x/Documents/repos/xlnux/ESTADO-GENERACIONES.md` (session log + blockers).

## Installed-system layout (the contract everything depends on)

```
subvol @          -> /              root, first generation = /@
subvol @home      -> /home          never rolled back
subvol @snapshots -> /.snapshots    generation snapshots (0700)
subvol @xstate    -> /var/lib/x     manifests, packages.tsv, services, boot/, current, pending
/tmp tmpfs; ESP 1 GiB (FAT32)
```

- ISO bootmodes: `bios.syslinux` + `uefi.grub` (v91 names). `efiboot/` (systemd-boot) is **orphaned by profiledef**.
- Target bootloaders: GRUB (BIOS+UEFI) or systemd-boot (UEFI only), chosen by the installer; per-generation entries + `x-rescue`.
- `os-release`: `ID=x`, `ID_LIKE=arch`, shipped by the `x-release` package from `x-repo` (not baked into airootfs).

## Generations in one screen

- `x gen new` snapshots the root tree (btrfs writable snapshot) + writes `manifest.json` (schema 2) and captures (`packages.tsv`, `services.txt`, `migrations.txt`, `etc` hash, archived kernel/initrd).
- `x gen rollback <id>` creates a safety generation, pins the target, updates `current` and rewrites boot entries (systemd-boot `x-gen-<id>.conf` + GRUB `custom.cfg`, plus `x-rescue`).
- Also: `list/status --json/boot/diff/verify/pin/prune/restore [--pkg]/export/import`; home generations `x home ...` (copies under `~/.local/share/x/home-gens`, no root/btrfs).
- Auto-creation: pacman hooks (`10-x-gen-pre.hook`, `20-x-gen-post.hook` → `hooks/pacman-gen.sh`), `x setup`, `x update` (suppresses hooks with `X_GEN_SKIP=1`).
- Test suite: `bash scripts/test/validate.sh` (no root) + `sudo bash scripts/test/generations-btrfs.sh` (real loop btrfs) + VM e2e.

## Current blockers (do not plan around them; fix them)

1. **VM end-to-end untested** (`sudo x/xbuild.sh && x/vm.sh --seed` + `xauto=1`) — blocking merge; subvols, @xstate, 1G ESP and first generation never validated on a real install.
2. **`X_GEN_SUBVOL_PREFIX` mismatch**: on installed systems the snapshots live in top-level subvol `@snapshots` (path `/@snapshots`), but the engine defaults to `/.snapshots`; installer/`x setup`/`x update` never export the prefix → manifests and boot options can disagree with the documented `rootflags=subvol=/@snapshots/<id>`.
3. **Bundled `x-scripts-0.1.0-13` payload predates generations** (no `x gen`, no hooks) while `install.sh` calls `x gen new` → first generation silently warns/skips. Rebuild the package (bump `pkgrel`) and refresh `x/airootfs/root/x-installer/packages/`.
4. **No CI** for scripts/xpm/xpkg; published artifacts drift from the branches.

Full prioritized list: `references/known-issues.md`.

## Where to start

- Generic Arch build knowledge: skills `archiso`, `arch-packaging`, `distro-boot`, `distro-installers`, `distro-release`.
- Project specifics: `references/architecture.md`, `references/generations.md`, `references/xpm-xpkg.md`, `references/wsl.md`, `references/known-issues.md`.
- Validation flow: `commands/xlnux-validate.md` (in this pack).
- Project map and gap analysis: `docs/xlnux-map.md` (in this pack).

## Conventions

- Docs are bilingual es/en under `docs/{es,en}/`; user-facing messages in Spanish-English mix; commits conventional (`feat:`, `docs:`, `fix:`).
- Idempotency is a hard rule for provisioning/migrations (`scripts/CONTRIBUTING.md`); no secrets in repo.
- Never edit a frozen generation via `/.snapshots/<id>` (0700, bootable fork); use `x gen restore`/`rollback`.
- The state doc `ESTADO-GENERACIONES.md` is the source of truth for session state; update it when closing blockers.
