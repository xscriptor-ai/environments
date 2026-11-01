# xpm and xpkg (X Linux Rust tooling)

## Positioning and current status

- **xpm** (GPL-3.0-or-later): pure-Rust package manager for the native `.xp` format and Arch `.pkg.tar.zst`, reading ALPM repo DBs. The SAT resolver (`resolvo`) is **wired into install/upgrade** (closure, ordering, provides/conflicts); local `.xp` installs, `search`, `query --orphans`, OpenPGP verification, ALPM hooks, a transaction journal linked to generation ids, `rollback --last/--journal` (package level, from the cache), `diff <generation>` and `.pacnew`/`.pacsave` handling are implemented. 233 tests. Status: active; it coexists with pacman, which still ships the system and the signed `[x]` repo.
- **xpkg** (GPL-3.0-or-later): `makepkg` + `repo-add` + `namcap` equivalent: XBUILD/PKGBUILD recipes, isolated fakeroot-less builds, sequoia signing, lint, ALPM repo DBs with `.files`, `history.json` with provenance, retention, comparative benchmarks vs makepkg and a lifecycle E2E with xpm. The native endpoint is built and signed by `x-repo/scripts/build-xp.sh`; the pacman repo is still built by `x-repo/build-packages.sh` (makepkg + repo-add).
- **Open P1 bugs**: resolver cycle with `gcc-libs` (`Unsolvable(Conflict)`); hardlink extraction ENOENT for `zoneinfo` files. Details in `known-issues.md`.

## xpm CLI (13 subcommands)

`sync (Sy)`, `install (S)`, `remove (R)`, `upgrade (Su)`, `query (Q)`, `search (Ss)`, `info (Si)`, `files (Ql)`, `repo add|remove|list`, `history [--json]`, `rollback [--last|--journal <id>] [--dry-run]`, `diff <generation>`, `usage [topic]`.

Global: `-c/--config`, `-v`, `--no-confirm`, `--root`, `--dbpath`, `--cachedir`, `--no-color`.

Notable flags: `sync -f`; `install -w --as-deps --as-explicit --no-optional` (accepts `name`, `name=version` and local `.xp` paths); `remove -s -d -n`; `upgrade --force --ignore <pkg>...`; `query -e --orphans --format plain|tsv`; `repo add <name> <url>`; `history` renders the journal; `diff` compares installed packages against a generation capture (added/removed/changed).

### Paths and configuration

- Config: `/etc/xpm.conf` (TOML). Repos are cached under `/var/lib/xpm/sync`; local DB `/var/lib/xpm/local`; journal `/var/lib/xpm/journal`; package cache configurable (`--cachedir`).
- Signatures: detached OpenPGP; Web-of-Trust. GPG dir resolution: configured `gpg_dir` when it exists → `/etc/pacman.d/gnupg` → `/etc/xpm/gnupg` (embedded keyring fallback).
- Resolver input: installed DB + sync DBs (pacman-style `desc`/`files`); local `.xp` packages are added as candidates for the transaction.
- Transaction order: download → signature check → conflict/ordering plan → ALPM pre-hooks (`XPM_*` env) → extract → scriptlets → post-hooks → journal entry (with the current generation id when available). Config-file changes are emitted as `.pacnew`; removals preserve modified files as `.pacsave` unless `-n`.

### Verification

`cargo test` (workspace), `cargo clippy --all-targets`, `cargo fmt --check`; E2E against the published endpoint and the package lifecycle with xpkg.

## xpkg CLI

`build`, `lint`, `info`, `verify`, `new`, `srcinfo`, `repo-add`, `repo-remove`, `repo-prune`.

- Recipes: XBUILD (TOML) or PKGBUILD (bash), variable expansion, `name::url` sources, local sources, `CARCH`/`CHOST`, `srcdir`/`pkgdir` reset, makepkg parity fixes.
- Builds: download (retries, SHA-256/512) or git clone, isolated environment via unshare/fakeroot/tar-rewrite, deterministic `SOURCE_DATE_EPOCH`, `.xp` output (tar.zst with `.PKGINFO`/`.BUILDINFO`/`.MTREE`).
- Repo tools: ALPM DB creation and updates, `.files` DB generation, `--keep` retention, `history.json` schema 1 (signed with `sign_key`) with provenance (`x:source_url`, `x:source_sha256`, `x:source_commit`, `x:recipe_sha256`, `x:tool_version`); `repo-remove`/`deploy_repo` keep history-referenced versions coherent.
- Validation: lint rules (deps, permissions, paths, metadata, ELF); 265+ unit/integration tests; benchmarks vs makepkg (#57); E2E xpkg → repo → xpm.

## Integration seams

- `x gen restore --pkg` reads both pacman and xpm databases and records the source in the manifest.
- ALPM hooks live in `/usr/share/libalpm/hooks/` (generations: `10-x-gen-pre.hook`, `95-x-gen-post.hook`); xpm and pacman execute them.
- The native endpoint (`public/x/x86_64/`) and the pacman repo (`repo/x86_64/`) are published from `x-repo`; both are signed and consumed by the tools above.
- ADR-0004 governs replacing pacman; no such replacement is planned until the two P1 bugs and remaining hardening are closed.

## Remaining work (post-v1.0)

- xpm: fix the two P1 bugs; fuzzing, error-message audit, TUI/i18n, mirror selection, advanced cache management.
- xpkg: Phase 10 items in `xpkg/ROADMAP.md`; keep makepkg parity as recipes evolve.
