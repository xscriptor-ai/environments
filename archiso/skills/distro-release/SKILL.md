---
name: distro-release
description: Deep reference for Arch distro CI, testing and releases (October 2026): archlinux containers, GitHub/GitLab CI for mkarchiso, QEMU/OVMF smoke tests, cloud-init/QGA assertions, static ISO validation, signing, torrents, mirrors, promotion and reproducibility. Use when automating ISO builds, writing VM tests, or publishing signed releases.
---

# Distro release engineering Reference (October 2026)

## Verified anchors

- Official ISO `archlinux-2026.10.01-x86_64.iso` (kernel 7.2.7): sha256+b2 sums, `.sig` (release key `3E80CA1A8B89F69CBA57D98A76A5EF9054449A5C`), torrent with webseeds, kept last 3 releases.
- archiso CI: `make check` = shellcheck only; builds on self-hosted `vm` runners; release builds run inside a VM (`archlinux/ci-scripts`); no upstream QEMU boot test.
- Containers: `archlinux:base-devel` (weekly library tag Sundays 00:00 UTC; daily dated tags; `repro` variant; quay/ghcr daily). No official `setup-arch` GitHub Action.
- Current GitHub actions: `actions/upload-artifact@v7`, `softprops/action-gh-release@v3`; release asset limit 2 GiB/file, 1000 assets; artifact quotas are small (500 MB free) — publish ISOs as release assets or on mirrors.
- No Arch openQA distro exists (you'd write `os-autoinst-distri-arch`); Fedora/openSUSE are the models.
- Reproducibility: archiso honors `SOURCE_DATE_EPOCH`; upstream ISO bit-reproducibility is not guaranteed; Docker `repro` tag is the best template.

## Minimum viable pipeline

checkout → container `archlinux:base-devel` → install archiso → shellcheck → `mkarchiso -v -r -w /tmp/w -o out profile` → checksums → static validation → upload artifact / release.

## Mature pipeline

lint → build matrix (`{profiles} × {iso,netboot,bootstrap}`) → VM build isolation → boot matrix (UEFI/BIOS, optionally SB) with SSH/QGA/serial assertions → reproducibility gate → signing (HSM or agent) → promotion (nightly/beta/stable) → mirror sync + torrent + release notes.

## Reference files

- `references/ci-pipelines.md` — container patterns, GitHub/GitLab/Forgejo examples, caching, limits.
- `references/qemu-testing.md` — run_archiso, headless QEMU, OVMF, cloud-init, QGA, Packer, libvirt, static validation.
- `references/release-engineering.md` — versioning, signing, checksums, torrents, mirrors, archiso-manager flow, reproducible builds.
- `references/wsl-images.md` — importable WSL rootfs (pacstrap + tar), `/etc/wsl.conf`, default user, systemd, provisioning and checklist.

## Primary sources

- `https://github.com/archlinux/archiso` (`.gitlab-ci.yml`, `scripts/run_archiso.sh`)
- `https://github.com/archlinux/arch-boxes`, `https://github.com/archlinux/archlinux-docker`, `https://github.com/archlinux/releng`
- `https://github.com/pierres/archiso-manager`
- `https://wiki.archlinux.org/title/QEMU`, `/Libvirt`, `/Mirrors`, `/Reproducible_builds`
- `https://docs.github.com/en/actions/reference/limits`
