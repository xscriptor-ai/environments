# X generations engine (`scripts/install/helpers/xgen.sh` + `xgen-home.sh`)

## Model summary

Each relevant change = writable btrfs snapshot of the root tree + metadata dir with a manifest. No content-addressed store (Arch rolling packages don't allow it), no git versioning. Rollback switches the boot default (effective on reboot). `/home` is excluded from system generations; it has its own copy-based generations.

## Layout and state

```
/@ -> /                       running/current root
/@snapshots/<id>              snapshots (0700)
/var/lib/x/current            default generation id
/var/lib/x/pending            rollback target awaiting reboot
/var/lib/x/generations/<id>/  manifest.json, packages.tsv, services.txt,
                              migrations.txt, boot/{vmlinuz-*,initramfs-*},
                              snapshot.uuid, [pinned]
~/.local/share/x/home-gens/   home gens: <id>/{manifest.json,files/,files.sha256}, current, [pinned]
```

IDs are `%04d`, monotonic, scanning metadata + snapshots. `parent` links generations.

## Manifest (schema 2)

```json
{
  "schema": 2, "id": "0002", "parent": "0001",
  "reason": "manual|setup|update|pre-update|pre-rollback|pacman|pacman-pre|install",
  "label": "...", "created": "UTC ISO-8601", "hostname": "...",
  "backend": "btrfs|dir|off", "package_backend": "pacman|xpm|none",
  "root_subvol": "/@ | /@snapshots/<id>",
  "x_scripts": "0.1.0-13|git describe|unknown",
  "kernel": {"release": "..."}, "cmdline": "...",
  "configs": {"etc_sha256": "..."},
  "packages": {"count": N, "sha256": "..."},
  "services": {"count": N}, "migrations": {"count": N}
}
```

Captures: `pacman -Q` sorted (or `xpm query`), enabled unit files, per-user migration markers (from `/home/*` + `/root`), recursive `/etc` hash (excludes `.pwd.lock`, `mtab`, `pacman.d/gnupg/*`), archived kernels/initrds (`cp -a`, multi-kernel copies all; boot picks first sorted).

## Environment variables (defaults)

```
X_GEN_STATE=/var/lib/x
X_GEN_DIR=$X_GEN_STATE/generations
X_GEN_CURRENT=$X_GEN_STATE/current
X_GEN_SNAPSHOTS=/.snapshots
X_GEN_SUBVOL_PREFIX=$X_GEN_SNAPSHOTS
X_GEN_ROOT=/
X_GEN_BACKEND=auto|btrfs|dir|off
X_GEN_BOOT=auto
X_GEN_BOOT_DIR=/boot
X_GEN_BOOT_KEEP=3
X_GEN_KEEP=5
X_GEN_CMDLINE=/proc/cmdline
X_GEN_LIVE_SUBVOL=            # set to /@ for generation 0001 during install
X_GEN_RUNNING=                # override running detection
X_GEN_SKIP=0
```

Home: `X_HGEN_STATE=~/.local/share/x/home-gens`, `X_HGEN_HOME`, `X_HGEN_INCLUDE`, `X_HGEN_EXCLUDE`, `X_HGEN_KEEP=10`.

## Subcommands (exact)

| Command | Notes |
|---|---|
| `x gen` / `list` | markers `*` default, `r` running, `p` pinned |
| `x gen new [--reason R] [--label L]` | root on btrfs; does not steal default unless first gen |
| `x gen status [--json]` | backend, running, default, pending, drift, usage; JSON schema 1 single line |
| `x gen rollback <id> [--no-safety]` | safety gen (`pre-rollback`), pin target, set `current`, `pending` if not running, sync boot |
| `x gen boot` | re-sync boot entries |
| `x gen diff <a> <b>` | packages/services/migrations/kernel/etc hash/root subvol |
| `x gen verify [id]` | live vs generation captures; exit 1 on drift |
| `x gen pin <id> [--unpin]` | prune protection |
| `x gen prune [--keep N] [--older-than DAYS] [--dry-run]` | never pinned/running/default |
| `x gen restore <path> [--from ID] [--dest PATH]` | `.bak.<ts>` backups before overwrite |
| `x gen restore --pkg <name>` | file list from pacman local db or `xpm` db |
| `x gen export <id> [--with-data]` / `import` | tar.zst/gz bundles; btrfs send for data; no signature/checksum |
| `x home list/new/status/diff/restore/prune` | copies, no root; no pin/verify/export/rollback |

## Boot integration (`xgen_boot_sync`)

- systemd-boot: `loader/entries/x-gen-<id>.conf`, `x.conf` mirror of default, `x-rescue.conf` (+`systemd.unit=rescue.target`), `loader.conf` default updated.
- GRUB: `grub/custom.cfg` with `set default=x-gen-<id>` + one menuentry per kept generation + rescue.
- Running generation boots `/vmlinuz-linux` (live root mutates); frozen generations get their archived kernel copied to `/x/gen-<id>/` and boot that.
- Cmdline = manifest cmdline minus `rootflags=*`, forced `rw`, plus `rootflags=subvol=<root_subvol or prefix/id>`.
- ESP retention `X_GEN_BOOT_KEEP` (3) + current/running/pinned/pending; pruning ESP copies does not delete snapshots/metadata.

## Pacman hooks

`etc/pacman.d/hooks/10-x-gen-pre.hook` (PreTransaction) and `20-x-gen-post.hook` (PostTransaction) over Install/Upgrade/Remove `Target=*` → `/usr/share/x/hooks/pacman-gen.sh pre|post` → `x gen new --reason pacman-pre|pacman`. Guards: `X_GEN_SKIP=1`, no `current`, backend off. `install/config.sh` copies `etc/*` onto `/etc` during `x setup`, which is how the hooks land on installed systems. `x update` sets `X_GEN_SKIP=1` on its own pacman and does its own pre/post captures.

## Migrations

`migrations/<timestamp>-<name>.sh`, idempotent, per-user; markers in `~/.local/state/x/migrations/<name>`; run by `x migrate` and at the end of `x update`; failures reported and not marked; captured into manifests. Currently **zero migrations shipped**.

## Known correctness issues (see known-issues.md for full list)

1. `X_GEN_SUBVOL_PREFIX` never exported on installed systems: installer created the snapshot subvol as top-level `@snapshots` (path `/@snapshots`) but the engine defaults to `/.snapshots`, so generation ≥0002 manifests/boot options/fstab patching can disagree with the documented `subvol=/@snapshots/<id>` contract. Fix: export `X_GEN_SUBVOL_PREFIX=/@snapshots` (or derive it from the mount) in installer, hooks, `x setup`, `x update`, and test the installed layout.
2. System restore has no `..`/traversal rejection (home restore does); runs as root.
3. `x-gen-*` files declare `# x:root=false` while btrfs ops need root; `pin` has no root check; read commands can't read the 0700 state dir as user.
4. Manifest parsing is `sed`-based; import has no schema/signature validation.
5. `generations-btrfs.sh` has a vacuous `/home` assertion (`|| true`); no btrfs boot/rollback/export tests; no multi-kernel selection test.

## Test suite

`scripts/test/validate.sh` → `smoke.sh` (syntax, sync, hyprland dry-run, dispatcher, migrations) + `generations.sh` (dir backend) + `generations-boot.sh` (fake ESP, SB+GRUB entries) + `pacman-hooks.sh` + `generations-export.sh` + `home-gens.sh`; then `cargo test` for xpm/xpkg; then `generations-btrfs.sh` with root (real loop btrfs; self-skips). All green without root per `ESTADO-GENERACIONES.md`; real-btrfs + VM pending.
