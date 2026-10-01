# Release engineering (2026)

## Versioning

- Arch ISO: `iso_version=$(date +%Y.%m.%d)` (SOURCE_DATE_EPOCH-aware); label `ARCH_YYYYMM`; releng CI tag `%Y.%m.%d.<jobid>`.
- arch-boxes: `YYYYMMDD.JOBID`, published 1st/15th; archlinux-docker: `YYYYMMDD.0.JOBID` (weekly library).
- Your distro: pick `YYYY.MM.DD` stable + git tag `vYYYY.MM.DD`; keep N releases (Arch keeps 3).

## Checksums and signatures

```sh
gpg --use-agent --sender "$GPG_SENDER" --local-user "$GPG_KEY" --detach-sign midistro-YYYY.MM.DD.iso
sha256sum midistro-*.iso > sha256sums.txt
b2sum midistro-*.iso > b2sums.txt
gpg --detach-sign sha256sums.txt
```

- Publish key fingerprint prominently; verify with `pacman-key -v` or `gpg --verify`.
- archiso can also PGP-sign netboot rootfs (`-g`) and CMS-sign netboot/iPXE (`-c cert key ca`).
- Repo DBs: `repo-add -s -k "$GPGKEY"`.
- Package sigs: `BUILDENV sign` + `GPGKEY`; Arch is migrating signing to **Signstar** (HSM-backed).

## Torrent and mirrors

```sh
mktorrent -l 19 -c "Midistro <version> <https://example.org>" \
  -w https://example.org/iso/<version>/ \
  -w https://archive.example.org/repos/<...> \
  midistro-<version>-x86_64.iso
```

- Mirror flow (Arch model): rsync to origin staging → atomically move to `/srv/ftp/iso/<VERSION>/` → re-point `latest` symlink → mirrors pull via rsync; HTTP mirror list from `mirrors/status/json`.
- Webseeds make torrents immediately useful before many seeders exist.
- `archiso-manager` (GitHub pierres/archiso-manager) automates verify/build/publish/remove-release for Arch itself.

## Release artifacts per channel

| Artifact | Cadence |
|---|---|
| ISO | monthly/stable or on-demand |
| netboot tree | every build (always latest) |
| bootstrap tarball | per build/CI artifact |
| QCOW2 cloud images | fortnightly (arch-boxes model) |
| Docker/dev images | daily moving + weekly pinned |
| WSL/other | optional |

## Promotion

nightly (moving, unsigned ok) → beta (tagged, frozen packages) → stable (`YYYY.MM.DD`, signed, checksums, torrent, release notes, mirror). Keep a `latest` pointer and a release manifest (JSON) for automation.

## Reproducibility

- `SOURCE_DATE_EPOCH` (archiso reads env or `work/build_date`), TZ=UTC, fixed package set (ALA snapshot or local pinned repo), pinned container tags (`--source-date-epoch`), sorted file lists.
- Compare with `diffoscope`; the `archlinux` Docker `repro` tag pipeline (podman `--source-date-epoch` + `--rewrite-timestamp` + diffoscope/diffoci) is the best available template.
- Known blockers: signed kernel modules, build paths/uname, gzip/JAR timestamps, revoked packager keys.
- Treat bit-identical ISOs as a stretch goal (upstream doesn't guarantee it); publish reproduction instructions either way.

## Release notes and support

- Include: version, kernel, package count, hash, signature, known issues, upgrade notes (keyring, partial upgrades, mkinitcpio/PCR warnings), Secure Boot instructions, download/mirror/torrent links.
- Retention: keep old ISOs for rollback; document ALA pinning for full-repo rollback.
- Monitor: mirror status, ISO size/package-count drift, `checkrebuild` for AUR-vendored packages.
