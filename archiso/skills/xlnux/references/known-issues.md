# X Linux — known issues and gaps (verified 2026-10-01)

Prioritized from live repo inspection (branches `feat/generations` / `feat/generations-alignment` / `main`). Each item: impact, evidence, suggested fix. This is the working backlog; keep `ESTADO-GENERACIONES.md` as the session log.

## P0 — blocking merge / correctness

1. **Installer never validated end-to-end in a VM.**
   Evidence: `ESTADO-GENERACIONES.md` ("bloqueante antes de mergear"), `x/docs/installation.md` ("pending"), installer changed (subvols, `@xstate`, 1G ESP, entries).
   Fix: `sudo x/xbuild.sh` + `x/vm.sh --seed` (seed JSON, add `xauto=1` in the GRUB/syslinux menu), confirm: partitioning, LUKS variant, pacstrap, `x setup`(+`--user`), `x gen new` → `0001`, bootloader entries, reboot into installed system, `x gen status`, rollback to a new generation and back. Capture serial log.

2. **`X_GEN_SUBVOL_PREFIX` mismatch on installed systems.**
   Evidence: installer creates top-level subvol `@snapshots` (in-fs path `/@snapshots`); engine default `X_GEN_SUBVOL_PREFIX=$X_GEN_SNAPSHOTS=/.snapshots`; only `test/generations-btrfs.sh` exports `/@snapshots`. Docs promise `rootflags=subvol=/@snapshots/<id>`.
   Fix: derive/export `X_GEN_SUBVOL_PREFIX=/@snapshots` in `x/airootfs/root/x-installer/install.sh`, `hooks/pacman-gen.sh`, `install/system.sh`, `bin/x-update.sh`; add an installed-layout test (fake `/@snapshots` + `stat -f` btrfs mock or extend `generations-btrfs.sh` to use the real installer layout).

3. **Bundled `x-scripts-0.1.0-13` payload predates generations.**
   Evidence: `x/airootfs/root/x-installer/packages/x-scripts-0.1.0-13-any.pkg.tar.zst` has no `xgen.sh`, no `x-gen-*`, no hooks, no generations tests; `install.sh` still calls `x gen new` (guard only `test -x /usr/bin/x`).
   Fix: rebuild `scripts/packaging` with a bumped `pkgrel` (e.g. `0.1.0-14`), verify `tar -tf` contains `xgen.sh` + `hooks/` + `etc/`, copy into `x/airootfs/root/x-installer/packages/`, import into `x-repo` (`build-packages.sh` copies `../scripts/packaging/x-scripts-*.pkg.tar.zst`), and add a payload assertion (grep `x-gen-new` inside the package) to `validate.sh` or the VM test.

4. **`generations-btrfs.sh` pending with root; suite green only without root.**
   Fix: `sudo bash scripts/test/generations-btrfs.sh`; then fix whatever fails; make the script cover boot entries + rollback + export/import on real btrfs; remove the vacuous `/home` assertion (`check ... || true` at line ~103).

## P1 — security / data safety

5. **System restore path traversal.** `xgen_restore` builds `src="$root/${path#/}"` without rejecting `..` (home restore does); runs as root. Fix: normalize and reject `..`/absolute escapes like `hgen_restore`.
6. **`x gen pin` has no root check; read commands misbehave as user** (state dir 0700 → "no generations"). Fix: mark `x-gen-*` files `# x:root=true` where needed, or degrade gracefully with a clear message.
7. **`[x]` repo uses `SigLevel = Optional TrustAll`** (ISO and docs) — acceptable for dev, not for release. Fix: sign DB/packages (`repo-add -s`, `sig_level = required`) and ship `trustedkeys.gpg`/keyring in airootfs; document key rotation.
8. **Export/import has no checksum or signature validation** (`BUNDLE.txt` schema 1 only) and silently downgrades to metadata-only when `btrfs receive` fails. Fix: embed sha256 per file + optional GPG signature; fail loudly by default.
9. **Public ISO ships root autologin + passwordless root + sshd root/password.** Acceptable for live medium, but make sure the installed system never inherits it (installer creates a wheel user; verify no `PermitRootLogin yes` in target) and document it.

## P1 — build/boot coherence

10. **`efiboot/` orphaned**: `bootmodes=('bios.syslinux' 'uefi.grub')` means mkarchiso ignores `efiboot/`; docs claim otherwise. Either switch ISO UEFI to `uefi.systemd-boot` (then keep only one) or delete/annotate `efiboot/`. Note systemd-boot and grub UEFI modes are mutually exclusive in archiso v91.
11. **`xbuild.sh` references non-existent `x-customize.sh`** in its error text; real script is `customize_airootfs.sh`. Also `customize_airootfs.sh` is deprecated by archiso v91 (works, warns) — consider migrating to pacman hooks marked `# remove from airootfs!`.
12. **WSL legacy builders drop dotfiles**: `cp -r "${PROFILE_DIR}/airootfs/"*` misses `root/.zlogin`, `root/.automated_script.sh`, `root/.gnupg`; `xbuildwslc.sh` also excludes files that were never copied. Fix or retire in favor of `xlnux/wsl`.
13. **Live networking overlap**: `customize_airootfs.sh` enables NetworkManager while symlinks enable systemd-networkd/resolved/iwd; both can manage the same NIC. Pick one manager for the live session.
14. **PKGBUILD deps incomplete**: `x-scripts` depends only on `bash` but its engines use `btrfs-progs`, `zstd`/`xz`, `util-linux`, `pacstrap` helpers, etc. Audit `depends`/`optdepends`; add LICENSE file to `scripts/`.

## P2 — product/engineering

15. **No CI** in `scripts`, `xpm`, `xpkg`, `wsl`, `wsl-scripts`, `x`: add workflows running `validate.sh` (no root) + `cargo test/clippy/fmt` + shellcheck; `x-repo` only has a manual Pages deploy.
16. **xpm de-prioritized but docs promise**: resolver not wired (install matches exact names, no deps), no local `.xp` install, `search` stub, `--orphans` bails, no rollback, journal schema drift vs `docs/GENERATIONS.md`, keyring path drift (`/etc/pacman.d/gnupg` vs `/etc/xpm/gnupg`), no `.files` DB generation in xpkg.
17. **xpkg gaps**: `repo-remove` leaves `history.json`/files stale; `deploy_repo` doesn't copy history-referenced versions; builder emits `x:source_commit` but not `x:source_url/sha256`; README/ROADMAP test counts and command tables stale.
18. **Version drift in `x-repo`**: `x-release` PKGBUILD `1.0-8` vs XBUILD `1.0-6` vs published `.xp` `1.0-4`; CHANGELOG mentions `xpm-0.1.0-1` while `-2/-3` exist; `public/repo` ships `xpm` with no source PKGBUILD in repo. Single-source versions.
19. **Docs drift**: README link to missing `docs/default-installation.md`; `project-state` claims airootfs `os-release` (it's in `x-release`); `X_PKGLIST` default documented wrong; wiki omits WSL; `sync_roadmap.py` orphaned in 5 repos while ROADMAP says sync removed; stray `syslinux/splash.png:Zone.Identifier`.
20. **Roadmap items pending by design**: `system.toml` + `x gen plan/apply`; qgroup space limits; UKIs/Secure Boot; multi-kernel; btrfs home snapshots; `x home pin/export`; automatic snapshot timer; export encryption.

## Suggested order of attack

1. Payload rebuild (P0.3) → 2. btrfs test (P0.4) → 3. VM e2e (P0.1) → 4. subvol prefix fix (P0.2) → 5. restore traversal + root flags (P1.5-6) → 6. CI minimal (P2.15) → 7. repo signing (P1.7) → 8. xpm resolver/local install if xpm is revived.

## Validation doors (definition of done for the generations merge)

- `bash scripts/test/validate.sh` green without root.
- `sudo bash scripts/test/generations-btrfs.sh` green on a real loop btrfs.
- VM install from ISO with `xauto=1` reaches login; `x gen list` shows `0001`; `x gen new` + `x gen rollback 0001` boots the other generation; `x gen verify` clean.
- Bundled payload contains the same engine as the branch (hash-checked).
