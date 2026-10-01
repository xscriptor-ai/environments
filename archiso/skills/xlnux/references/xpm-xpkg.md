# xpm and xpkg (X Linux Rust tooling)

## Positioning and current status

- **xpm** (GPL-3.0-or-later): pure-Rust package manager; reads Arch `.pkg.tar.zst` and its native `.xp` (tar.zst with `.PKGINFO`/`.BUILDINFO`/`.MTREE`), SAT resolver via `resolvo` (implemented, **not wired to the CLI**), OpenPGP detached signatures, journal + hooks. Status: de-prioritized; the distro ships pacman + `x-scripts` today. "Reboot pending" until xpm meets ADR-0004 preconditions.
- **xpkg** (GPL-3.0-or-later): makepkg+repo-add+namcap equivalent in Rust: XBUILD/PKGBUILD recipes, fakeroot-less builds (unshare/fakeroot/tar-rewrite), signing (sequoia), lint, ALPM repo DBs, retention (`--keep`), `history.json` with provenance, `SOURCE_DATE_EPOCH`. Status: reboot pending; `[x]` repo today is built with PKGBUILD/makepkg (`x-repo/build-packages.sh`).

## xpm CLI (11 subcommands)

`sync (Sy)`, `install (S)`, `remove (R)`, `upgrade (Su)`, `query (Q)`, `search (Ss)`, `info (Si)`, `files (Ql)`, `repo add|remove|list`, `history [--json]`, `usage [topic]`.

Global: `-c/--config`, `-v`, `--no-confirm`, `--root`, `--dbpath`, `--cachedir`, `--no-color`.

Flags: `sync -f`; `install -w --as-deps --as-explicit --no-optional`; `remove -s -d -n`; `upgrade --force --ignore <pkg>`; `query --format plain|tsv -e -d -t -u`; `search -l`; `info -l`.

### Paths and formats

```
/etc/xpm.conf                     TOML (defaults: root /, db /var/lib/xpm, cache /var/cache/xpm/pkg,
                                  gpg_dir /etc/pacman.d/gnupg [docs say /etc/xpm/gnupg — drift],
                                  sig_level optional, parallel_downloads 5)
/etc/xpm.d/<name>.toml            user repos
/var/lib/xpm/local/<pkg>/{version,reason,files,origin,install}
/var/lib/xpm/sync/<repo>.db|.files
/var/lib/xpm/journal/<epoch>-<pid>.json
/usr/lib/xpm/hooks/{pre,post}-transaction.d/   env contract XPM_ROOT_DIR, XPM_ACTION,
                                               XPM_JOURNAL, XPM_PKG_NAMES, XPM_PKG_VERSIONS
```

Journal schema 1: `{schema,id,action,root_dir,started,finished,result(running|ok|failed),packages:[{name,from,to}],error}`. Docs (`docs/GENERATIONS.md`) describe extra fields (`repo`, `sha256`, `source`, `scriptlets`) that the code does not yet write.

Scriptlets: `.INSTALL` `pre_install/post_install/pre_upgrade/post_upgrade/pre_remove/post_remove`, env `XPM_ROOT_DIR`, `XPM_PKG_NAME`, `XPM_PKG_VERSION`; persisted at `local/<pkg>/install`.

### Implemented vs stubbed

| Real | Stub/missing |
|---|---|
| `sync` (DB+files, sig), `query --format tsv/-e/-d/-u`, `info`, `files`, `repo`, `history`, `install/remove/upgrade` for repo names | `search` (stub), `query --orphans` (bails), local `.xp` file install, `pkg=ver` install, transitive dependency solving, `rollback --last`, `diff <gen>`, generation id in journal, `.pacnew/.pacsave`, working `Transaction::rollback()` |

## xpkg CLI (9 subcommands)

`build`, `lint`, `info [-l|--json]`, `verify [-k]`, `new`, `srcinfo`, `repo-add`, `repo-remove`, `repo-prune`.

Global: `-c/--config`, `-v`, `--no-confirm`, `--no-color`.

- `build`: `-f/--file`, `--pkgbuild`, `-d/--builddir`, `-o/--outdir`, `--no-check`, `--sign`; output `{name}-{version}-{release}-{arch}.xp`; `.PKGINFO`/`.BUILDINFO`/`.MTREE`/`.INSTALL`; provenance `x:source_commit`, `x:recipe_sha256`, `x:tool_version` (only `x:source_commit` is actually emitted, and `BuildProvenance::collect(..., None)` means clone-HEAD resolution is unused from the CLI).
- `repo-add <DB> <pkg> [--sign] [--keep N]`; `repo-remove`; `repo-prune <DB> --keep N [--dry-run]`.
- `history.json` (schema 1, at repo root, signed as `.sig` when `sign_key` is set): per package, newest-first `{version,filename,sha256,sig,builddate,source{url,sha256,commit}}`; upsert by version; retention never deletes the DB-exposed version, only files listed in history; `repo-remove` does **not** update history (bug).
- DB format: ALPM tar (`<name>-<ver>/desc`, `/depends`) with extra `%SHA256SUM%`/`%URL%`; `repo-add` does **not** generate a `.files` DB (xpm expects one best-effort).
- Reproducibility: `SOURCE_DATE_EPOCH` freezes `.PKGINFO`/`.BUILDINFO` builddate and all tar mtimes ("cheap 80%").

## Integration seams with generations

- `x gen restore --pkg` reads file lists from `/var/lib/pacman/local/<pkg>/files` **or** `/var/lib/xpm/local/<pkg>/files`.
- xpm `pre/post-transaction.d` hooks are the intended bridge for generation capture when xpm becomes the active PM; xpkg `repo-add`/`repo-prune` + `history.json` are the intended retention/pinning source for `xpm install <pkg>=<ver>` and `rollback --last`.
- Current blockers: resolver not wired, no local-file install, journal schema mismatch, no generation id linkage, signing/keyring path drift (`/etc/pacman.d/gnupg` vs `/etc/xpm/gnupg`), `system.toml` integration absent.

## Tests

`cargo test --workspace`: xpm 157 tests (151 unit + 6 integration), xpkg 255 (245 unit + 10 integration); clippy/fmt clean. Missing: upgrade/conflict/rollback E2E (xpm), xpm↔xpkg integration (#56), benchmarks (#57), real Arch package install E2E.

## Roadmap pointers

- xpm: wire resolver + local `.xp` install → then `orphans`, `rollback --last`, `diff <generation>`, history↔generation ids; `.pacnew/.pacsave`; exit-code mapping; benchmarks/fuzzing.
- xpkg: Phase 10 (split packages, chroot builds, batch builds, AUR-like helper, VCS versions, i18n); publish history-referenced old versions in `deploy_repo`; generate `.files` DB; lint `--json`.
