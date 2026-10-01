# Custom repositories, signing, pacman 7 (2026)

## Layout

```
customrepo/<arch>/
  customrepo.db        -> customrepo.db.tar.zst
  customrepo.db.tar.zst
  customrepo.files     -> customrepo.files.tar.zst
  customrepo.files.tar.zst
  pkg-1.0-1-<arch>.pkg.tar.zst
  pkg-1.0-1-<arch>.pkg.tar.zst.sig   # optional
```

Extensions supported for DBs: `.db`/`.files` + `.tar[.gz|.bz2|.xz|.zst|.lrz|.lz|lz4|lzo|Z]`.

## repo-add / repo-remove

```sh
repo-add -s -k "$GPGKEY" /srv/repo/midistro.db.tar.zst /srv/repo/*.pkg.tar.zst
repo-add -R /srv/repo/midistro.db.tar.zst pkg-2.0-1-x86_64.pkg.tar.zst   # remove old file
repo-remove /srv/repo/midistro.db.tar.zst pkgname
```

Flags: `-s/--sign` (DB detached `.sig`), `-k/--key`, `-v/--verify`, `-R/--remove`, `-w/--wait-for-lock`, `-n/--new`, `-p/--prevent-downgrade`, `--include-sigs`, `-q`. If `<pkg>.sig` exists it is embedded. Re-run after **every** artifact drop (clients fetch DB first).

## pacman.conf

```ini
[midistro]
SigLevel = Required DatabaseOptional
Server = https://repo.example.org/$repo/os/$arch
# Server = file:///srv/repo
```

- Place custom repos **above** official ones for precedence.
- `SigLevel` groups: `Never|Optional|Required` + `TrustedOnly|TrustAll`, prefixed `Package`/`Database`. Default distro: `Required DatabaseOptional` (official DBs unsigned — verified `.db.sig` 404 in 2026).
- `LocalFileSigLevel` governs `pacman -U` of your own unsigned packages.
- `CacheServer` (pacman 7.x): per-repo URL tried before normal servers; package-only, never DBs, never dropped on 404.
- pacman 7 download user: `chown :alpm -R /srv/repo`, directories need `+x` (news 2024-09-14).

## Signing

- Key: `gpg --full-generate-key`; set `PACKAGER` in `Name <mail>` form; `GPGKEY` in makepkg.conf; `BUILDENV sign` or `makepkg --sign`.
- DB signing with `repo-add -s -k`.
- Clients: import key (`pacman-key --add`, `--lsign-key`) or hand out keyring `.gpg` + `-trusted` files for airootfs.
- `archlinux-keyring` 20260909 uses sequoia-sq/voa; `pacman 7.1+` auto-updates expired keys via WKD/keyservers; `archlinux-keyring-wkd-sync.timer` refreshes weekly.

## Version pinning with ALA

```ini
[core]
Server = https://archive.archlinux.org/repos/2026/09/01/$repo/os/$arch
```

- Daily full-repo snapshots since 2013; symlinks `last/week/month`; package-level archive at `/packages`.
- Roll back with `pacman -Syyuu`; update `archlinux-keyring` + `ca-certificates` first; never mix ALA with live mirrors (partial upgrade).
- `community` disappeared May 2023 (merged into extra): pre-2023 snapshots need a `[community]` section.

## Gotchas for distros

1. Keyring expiry in old chroots/ISOs → unknown trust errors; refresh keyring first (`pacman -Sy archlinux-keyring`).
2. DB lock `/var/lib/pacman/db.lck`; check `fuser`.
3. Mirror staleness: use `-Syy` when mirror DBs lag; monitor `archlinux.org/mirrors/status/`.
4. Package replacement: `provides` + `conflicts`; `replaces` for takeover; hold with `IgnoreGroup`/`IgnorePkg` (glob) or a `modified` group.
5. Debug packages: separate `.debug`; strip/keep policy via `OPTIONS`.
6. Repo size: keep old versions if you support rollback consumers; otherwise `repo-add -R` prunes.

## Cookbook: self-hosted repo in an archiso profile

```ini
# profiles/midistro/pacman.conf  (build-time)
[midistro]
SigLevel = Required DatabaseOptional
Server = file:///srv/repo
[core]
...
```

```text
# airootfs (runtime)
/etc/pacman.conf                       -> includes [midistro]
/usr/share/pacman/keyrings/midistro.gpg
/usr/share/pacman/keyrings/midistro-trusted   # FPR:4:
```

Import+trust during build (`pacman-key --add/--lsign-key`) or first boot via a hook/unit.
