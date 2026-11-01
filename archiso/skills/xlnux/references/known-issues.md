# X Linux — known issues and gaps (verified 2026-10-17)

Backlog after sessions 26–33, verified against the repos (`main`), the published ISO and the latest e2e runs. This is the working backlog; `/home/x/Documents/repos/equislinux/ESTADO-GENERACIONES.md` is the session log.

## Closed (do not plan around these)

| Item | Evidence |
|---|---|
| Installer VM e2e | 6/6 on ISO 10.07 + 3 scenarios on 10.09; **ISO 10.17 (payload 37) e2e UEFI and BIOS green**, including newest-generation default and reboot into it |
| `X_GEN_SUBVOL_PREFIX` | Auto-detected by the engine and exported by the installer (`/@snapshots`); manifests and boot options agree |
| Payload predates generations | `x-scripts 0.1.0-37` built and bundled (encrypted export, `hyprland=online`, newest-generation default, MOTD); `[x]` still serves 36 until published |
| Real btrfs suite with root | `sudo bash scripts/test/generations-btrfs.sh` green (loop device) |
| Restore traversal / root checks | fixed (0.1.0-18); export has per-file checksums + optional sign/encrypt |
| Repo signing | `[x]` signed, `SigLevel = Required`, keyring embedded live+target |
| Live credentials | audited and documented; the target does not inherit them |
| Dualboot / qgroups / system.toml | dualboot VM-validated; `x gen quota`; `x gen plan/apply` with tests |
| xpm | SAT resolver wired into `install`/`upgrade`, local `.xp`, search, `--orphans`, `rollback --last/--journal`, `diff`, `.pacnew/.pacsave`, ALPM hooks, journal with generation ids |
| xpkg | `.files` DB maintained/signed, benchmarks vs makepkg (#57), lifecycle E2E with xpm, makepkg parity (local sources, `name::url`, variable expansion, CARCH/CHOST, srcdir reset) |
| Native `.xp` endpoint | Revived, published and consumed end-to-end by xpm (`x-repo/scripts/build-xp.sh`) |
| WSL legacy builders in `x/` | removed; dedicated `equislinux/wsl` + `wsl-scripts`; rootfs `v0.1.0` published (mirrored to SourceForge) |
| Org rename | `xlnux` → `equislinux`; distro name stays X; `x update` self-heals the legacy repo URL |
| Docs mirrors | fully synced (repo → wiki → web) in session 31 |

## Open — P1 (correctness / validation)

1. **xpm resolver — `gcc-libs` cycle.** `Unsolvable(Conflict)` for packages that depend on `gcc-libs`, reproduced against the published `.xp` endpoint.
2. **xpm extraction — hardlinks.** ENOENT extracting `zoneinfo` files (`usr/share/zoneinfo/`) from real Arch packages.
3. **Owner crypto housekeeping.** Offline backup of `keys/gnupg` + `keys/revoke.asc` and a rotation plan (runbook `x-repo/docs/{en,es}/signing.md`).
4. **`install.ps1` never run on real Windows** (rootfs release `equislinux/wsl v0.1.0`).

## Open — P2 (product/engineering)

5. **Publish payload 37 to `[x]`** (installed systems still receive 36 via `x update`) and **upload ISO 10.17 to SourceForge** (built and e2e-tested, not published yet).
6. **Vendored desktop snapshot pinned to 2026-10-04**, before the equisdots plugin stack. `hyprland=online` avoids it at install time. A real refresh needs `packaging/vendor-config.sh` to include `plugin-api`, `plugin-sdk`, `plugins`, `nyx`, `xturing` and the offline deploy to mirror the new `dots install` (plugins + settings merge).
7. **CI stays local** (owner decision): no Actions in `x`, `scripts`, `xpm`, `xpkg`, `wsl`, `wsl-scripts`; only `web` auto-deploy and `x-repo` manual Pages.
8. **WSL parked** to the end: `x home`/`x setup` integration needs feasibility research.
9. **Not started by decision:** UKI / Secure Boot (a Microsoft-signed shim is the only zero-touch ISO route), btrfs home snapshots, `x home` pin/export, `x agent` guided first-run, equisdots plugin hosting.

## Notes (verified behaviour, not bugs)

- `x gen verify <frozen-id>` reports an `/etc` hash difference by design: the snapshot's fstab is patched to its own subvol.
- `x gen new` makes the newest generation the default boot target; `x gen rollback` overrides it until a newer generation exists. A `pacman-pre` safety generation can be the default only during the transaction window.
- The dev signing key is generated without passphrase by default; rotate to `--protect` for public releases.

## Validation doors (definition of done)

- `bash scripts/test/validate.sh` green without root (362 checks).
- `sudo bash scripts/test/generations-btrfs.sh` green on a real loop btrfs.
- `python3 x/tests/e2e-autoinstall.py --mode uefi|bios` green: install → boot → `running/default=0001` → verify; package install → newest generation default → reboot into it.
- Bundled payload contains the same engine as the branch (`package-payload.sh`).

## Suggested order of attack

1. Publish payload 37 and ISO 10.17.
2. Close the two xpm P1 bugs.
3. Refresh the vendored snapshot (plugin stack) or formalise `hyprland=online` as the default desktop path.
4. Revisit WSL/CI when the stack consolidates.
