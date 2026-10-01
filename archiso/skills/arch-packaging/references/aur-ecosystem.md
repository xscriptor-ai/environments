# AUR ecosystem and distro strategy (2026)

## AUR state

- Community PKGBUILDs, git-backed since 2015 (AUR4); no binaries; "completely unofficial, use at your own risk". Packages may graduate to `extra` with ~10 votes + maintainer.
- Access: `git clone https://aur.archlinux.org/<pkg>.git`, cgit snapshots, read-only GitHub mirror `archlinux/aur` (branch per package), `ssh aur@aur.archlinux.org help`, full list at `aur.archlinux.org/packages.gz`.
- **Incident 2026-06-12**: active malicious packages (mass adoptions/updates). Review PKGBUILD/`.install`/patches on every update; follow aur-general.
- Manual build: `makepkg -s`, `-i`, `-r`, `-c`, `--packagelist`; rebuild on library upgrades (`rebuild-detector`/`checkrebuild`). Build in a clean chroot when debugging or shipping.

## Helpers

| Helper | Clean chroot | Notes |
|---|---|---|
| `paru` (Rust) | yes (`--chroot`, requires `LocalRepo`) | file review/diff, batch, `--skipreview` for CI, `--makepkgconf`, `--useask` |
| `yay` (Go) | **no** | pacman wrapper; `--ask` safety; automate with `--answerdiff/--answerclean` |
| `aurutils` | yes (systemd-nspawn/bwrap) | best for unattended pipelines, signed local repos |
| `pikaur`, `trizen`, `aura`, `pakku` | varies | secondary |

CI pattern: `paru -S --skipreview --chroot --noconfirm <pkgs>` after configuring `LocalRepo`; or build with `aurutils` into a signed repo your ISO consumes.

## chaotic-aur

- Prebuilt AUR binaries maintained by a community group; rebuilt hourly/daily; **x86_64 only**; key `FBA220DFC880C036`; `Server = https://geo-mirror.chaotic.cx/$repo/$arch`.
- Unvetted by Arch; consume like any unofficial repo, pin and audit critical packages.

## Distro strategy options

1. **Vendor reviewed recipes**: copy PKGBUILDs into your own `packages/` tree, rename `pkgbase` (`midistro-foo`), mark `provides`/`conflicts` if replacing, build in clean chroots, sign into your repo. Best control.
2. **Build from AUR at ISO build time**: acceptable for the ISO only (nothing installed on user machines from unresolved recipes), still in a clean chroot, versions freezable via your build logs.
3. **Depend on chaotic-aur**: fastest, least control, x86_64-only; keep it optional (user-enabled) where possible.
4. **Ship AUR helpers in the distro** for power users (paru is the common pick), documented as unsupported.

## Safety checklist

- [ ] PKGBUILD reviewed (no anonymous curl|bash, checked sources/checksums, sane install scripts)
- [ ] Build inside clean chroot with network allowed only as needed
- [ ] Keys verified for source tarballs
- [ ] Package signed and added to your repo with `repo-add -s`
- [ ] Version pinned in ISO package list / snapshot (ALA or local repo)
- [ ] Rebuild policy on library bumps (`checkrebuild`)
