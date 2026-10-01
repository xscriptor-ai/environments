---
name: arch-packaging
description: Deep up-to-date Arch packaging reference (October 2026, devtools 1.5.1, pacman 7.1, makepkg). Use when building packages for a distro, running clean chroots, managing a custom signed repository, pinning versions (ALA), or dealing with AUR/chaotic-aur.
---

# Arch packaging Reference (October 2026)

Current versions: **pacman 7.1.0** (7.1 upstream 2025-11-01), **devtools 1.5.1** (2026-06-21), **archlinux-keyring 20260909-1** (split with `voa-verifiers-arch`), **arch-install-scripts 31**.

## Critical realities

- Package sources are **Git** since 2023-05-21 (`archlinux/packaging/packages/*` on Arch GitLab, 0BSD-licensed, REUSE-checked). `asp` and `dbscripts` are gone. Clone with `pkgctl repo clone`.
- Repo management is `pkgctl db` (update/move/remove) + `repo-add`/`repo-remove` for your own repos.
- `offload-build` is now `pkgctl build --offload` (no standalone binary).
- Official DB files are **unsigned** (`core.db.sig` → 404); default `SigLevel = Required DatabaseOptional`. Packages are signed.
- pacman 7 sandboxes downloads with `DownloadUser=alpm`; local repos need `chown :alpm` and `+x` on dirs.
- `ParallelDownloads = 5` is the shipped default; `CacheServer` (7.x) is a package-only per-repo cache, never for DBs.
- AUR had a mass malicious-package incident (2026-06-12): treat as hostile input; build reviewed recipes in a clean chroot.

## Core commands

```sh
# Clean chroot (classic)
mkarchroot ~/chroot/root base-devel
arch-nspawn ~/chroot/root pacman -Syu
cd pkgdir && makechrootpkg -c -r ~/chroot

# Modern devtools
pkgctl build              # clean chroot build for current repo
pkgctl build --offload    # remote build
pkgctl release            # commit/tag/upload
pkgctl db update          # repo database update (Arch infra)
pkgctl repo clone --protocol=https pkgbase
pkgctl repo switch pkgbase 1.2.3-4

# Custom repo
repo-add -s -k "$GPGKEY" /srv/repo/midistro.db.tar.zst /srv/repo/*.pkg.tar.zst
```

## Reference files

- `references/devtools.md` — devtools/pkgctl, clean chroots, makepkg 2026 defaults, reproducibility.
- `references/repos-signing.md` — custom repo layout, repo-add, SigLevel, signing, ALA snapshots, pacman 7 gotchas.
- `references/aur-ecosystem.md` — AUR state, helpers, clean-chroot workflows, chaotic-aur, vendoring strategy.

## Primary sources

- `https://wiki.archlinux.org/title/DeveloperWiki:Building_in_a_clean_chroot`
- `https://man.archlinux.org/man/pkgctl.1`, `pkgctl-build.1`, `pkgctl-repo.1`, `pkgctl-db.1`
- `https://wiki.archlinux.org/title/Pacman/Tips_and_tricks#Custom_local_repository`
- `https://man.archlinux.org/man/repo-add.8`, `pacman.conf.5`, `makepkg.conf.5`
- `https://wiki.archlinux.org/title/Arch_Linux_Archive`
- `https://wiki.archlinux.org/title/Arch_User_Repository`, `AUR_helpers`
