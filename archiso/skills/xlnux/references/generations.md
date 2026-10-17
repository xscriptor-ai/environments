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

IDs are `%04d`, monotonic, scanning metadata + snapshots. `parent` links generations. The snapshots directory is auto-detected from the btrfs layout; an explicit `X_GEN_SUBVOL_PREFIX` wins, and the installer exports `X_GEN_SUBVOL_PREFIX=/@snapshots`.

## Manifest (schema 2)

```json
{
  "schema": 2, "id": "0002", "parent": "0001",
  "reason": "manual|setup|update|pre-update|pre-rollback|pacman|pacman-pre|install",
  "label": "after-nvidia", "created": "2026-10-09T12:00:00Z",
  "subvol": "/@snapshots/0002", "snapshot_uuid": "...",
  "kernel": "6.12.10-arch1-1", "boot": ["vmlinuz-linux", "vmlinuz-linux-lts"],
  "x_scripts": "0.1.0-37",
  "packages_sha256": "...", "services_sha256": "...", "etc_sha256": "...",
  "migrations": ["0001-example"], "pinned": false
}
```

## Subcommands (`x gen …`)

| Command | Behaviour |
|---|---|
| `list [--json]` | generations with id/parent/label/date/reason/size/pinned/current |
| `status [--json]` | current default, pending rollback target, snapshot dir, broken/missing gens |
| `new [--label TEXT]` | snapshot root, write manifest, archive kernels, sync boot entries, **make it the default** |
| `rollback <id>` | safety gen for the running state, flatten target (no nested subvol), set `current`/`pending`, rewrite boot entries |
| `diff <id>` | files/packages/services diff between the running system and a generation |
| `verify <id>` | manifest hashes; a frozen gen reports an `/etc` hash difference by design (its fstab points to its own subvol) |
| `pin <id>`, `prune` | protect from or reclaim unpinned generations |
| `restore <id> [--pkg]` | revert files (tracked paths), optionally reinstall the package set from pacman and xpm DBs; always creates a safety generation |
| `export <id> [--sign] [--encrypt]` | `btrfs send` stream or portable tarball; per-file checksums; magic detection on import |
| `import <file>` | restore from a verified bundle |
| `boot [--regenerate]` | inspect/rewrite GRUB/systemd-boot entries; orphan entries for pruned gens are swept |
| `quota` | qgroup usage/per-gen sizes |
| `plan`, `apply` | `system.toml` declarative generation (packages/services/migrations) with tests |

Home generations mirror the model with plain copies: `x home list|new|status|diff|restore|prune`, including `--pin`.

## Default-selection policy (NixOS-style)

- `x gen new` makes the **newest generation the default boot target**. Ids are monotonic, so the newest is also the highest id.
- `x gen rollback <id>` pins that target and overrides the default **until a newer generation exists** (next `x gen new`, hook generation, setup or update). It creates a safety generation for the state it leaves.
- A `pacman-pre` generation can become the default only during the transaction window; the post-transaction generation wins afterwards.
- Boot entry regeneration scans `/var/lib/x/generations` and removes entries whose generation no longer exists; `x-rescue` is always kept.

## Automatic creation (pacman hooks)

- Hooks live in `/usr/share/libalpm/hooks/` and are shipped by `x-scripts`:
  - `10-x-gen-pre.hook` → `/usr/share/x/hooks/pacman-gen.sh pre` (safety generation, `When = PreTransaction`).
  - `95-x-gen-post.hook` → `pacman-gen.sh post` (records the new generation, re-syncs boot entries).
- The legacy `/etc/pacman.d/hooks/` copies are removed by `x-scripts.install`; both pacman and xpm execute hooks from the libalpm directory.
- `X_GEN_SKIP=1` suppresses hook generation for a transaction. `x update` sets it and records its own pre/post generations; `x setup` creates a `setup` generation after provisioning.

## Failure modes and invariants

- Never edit a frozen generation through `/.snapshots/<id>` (0700, bootable fork): use `x gen restore`/`rollback`.
- `x gen prune` never removes the current generation, the pending target or pinned generations; it also sweeps stale boot entries.
- Snapshots are excluded from themselves; `/home` is a separate subvolume and never rolled back with system generations.
- `x gen verify` on a frozen generation is expected to show the `/etc` fstab difference; verify a running system instead when checking drift.
- Exports use per-file checksums; signatures/encryption are optional (`--sign`, `--encrypt`, `--encrypt-to`) and detected on import by magic, not extension.

## Tests

- `bash scripts/test/validate.sh` (362 checks, no root): smoke, generations, boot entries, pacman hooks, export/import, home gens.
- `sudo bash scripts/test/generations-btrfs.sh`: real loop btrfs exercising snapshots/rollback/prune/export.
- `python3 x/tests/e2e-autoinstall.py --mode uefi|bios`: install → boot → `0001` → verify → package install → newest gen default → reboot into it.
