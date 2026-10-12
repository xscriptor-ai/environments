# Arch ISO / distro building — state of the ecosystem, October 2026

Compiled on **2026-10-01** while verifying primary sources (archlinux.org packages, wiki, man pages, upstream repos, GitHub mirrors of Arch GitLab, Codeberg). Useful to date knowledge and detect staleness.

## Verified versions

| Component | Latest | Date | Note |
|---|---|---|---|
| archiso | **91-1** | 2026-09-27 | extra/any; `mkarchiso`, releng+baseline profiles |
| Official ISO | 2026.10.01 | 2026-10-01 | kernel 7.2.7, ~1.5 GB, BIOS+UEFI, no Secure Boot |
| arch-install-scripts | 31-2 | 2026 | `pacstrap -N` (rootless), `arch-chroot` |
| devtools | 1:1.5.1-1 | 2026-06-21 | `pkgctl`, mkarchroot/makechrootpkg, `_v3` builds |
| pacman | 7.1.0.r9.g54d9411-2 | 2026-05-06 | 7.0 → 2024-07-14; 7.1 → 2025-11-01; no 8.x |
| archlinux-keyring | 20260909-1 | 2026-09-09 | split with `voa-verifiers-arch` (OpenPGP/VOA) |
| mkinitcpio | **42.1-1** | 2026-09-28 | 42.2 in core-testing; systemd default hooks since v40 |
| dracut | 111-1 | 2026-05-19 | marked outdated 2026-08-02 |
| booster | 0.13-1 | 2026-06-21 | no embedded microcode |
| systemd / systemd-boot / ukify | 262-1 | 2026-09-22 | UKI, NvPCRs, PCR policy |
| GRUB | 2:2.16-1 | 2026-09-22 | upstream moved to freedesktop GitLab |
| Limine | 12.9.1-1 | 2026-09-27 | favorite for UKI+snapshots (`limine-snapper-sync`) |
| rEFInd | 0.14.2-3 | 2026-05-30 | UEFI only; does not boot ISOs |
| syslinux (Arch) | 6.04.pre3.r3.g05acc…-5 | 2026-07-20 | upstream frozen at 6.03 (2014); BIOS only |
| sbctl | 0.18-2 | 2026-08-10 | create/enroll/sign; YubiKey backend |
| linux-firmware | 20260916-1 | 2026-09-16 | **split** 2025-06-13; empty meta-package |
| archinstall | 4.5-1 | 2026-09-29 | Textual UI since 4.0; JSON config |
| Calamares | 3.4.3 | 2026-09-10 | Codeberg; Qt6/KF6 |
| erofs-utils | 1.9.4-1 | 2026-08-25 | baseline/optional only |
| qemu | 11.1.2 / qemu-desktop 11.1.1-4 | 2026-09-28 | `run_archiso` uses it |
| libvirt | 1:12.8.0-1 | 2026-10-01 | alternative to QEMU CLI |
| virt-install | 5.1.0-4 | 2026-07-19 | |
| Packer (+qemu plugin) | 1.16.1 / 1.1.7 | 2026 | qemu builder, cloud-init |
| archlinux container | base-20260927.0.600689 | weekly (Sun 00:00 UTC) | daily on quay/ghcr, `repro` tag |
| Ventoy | 1.1.17 | 2026-07-24 | new Secure Boot CA since 1.1.14 |
| fastfetch | 2.69.0 | 2026-09-25 | neofetch replacement |
| artools (Artix) | 0.40.0 | 2026-09-11 | alternative framework to archiso |
| archboot | rolling | 2026-09-30 | UKI, Secure Boot (Fedora shim), offline, reproducible |
| EndeavourOS ISO repo | active | 2026-09-27 | fork of mkarchiso + fork of Calamares |
| CachyOS Live ISO | active | 2026-09-30 | archiso + Manjaro scripts + cachyos-calamares |

## archiso timeline that breaks old knowledge

- v75 (2024-01): the ISO becomes a "Live/Rescue DVD" (>900 MiB).
- v77 (2024-04): **releng UEFI moves from GRUB to systemd-boot**; `archisosearchuuid`; `microcode` hook.
- v78 (2024-05): ESP +8 MiB headroom; FAT32 if ≥36 MiB; initramfs xz -9e.
- v80 (2024-09): empty UUID for EROFS; baseline with EROFS lzma.
- v82 (2024-11): `DownloadUser` commented out in the profile's pacman.conf.
- v86 (2025-09): **combined bootmodes** (`bios.syslinux`, `uefi.systemd-boot`, `uefi.grub`); `run_archiso` UEFI by default; `%ARCH%` templates.
- v87 (2025-10): **multi-arch UEFI support** (aarch64/riscv64/loongarch64, no cross-build); `reflector.service` no longer enabled; HTTPS mirrors only.
- v88 (2026-03): baseline bootstrap in xz.
- v89 (2026-07): **mkarchiso runs as a normal user** via `unshare`; `install_dir` validation (`[a-z0-9]`, ≤30); systemd-boot and grub mutually exclusive; `ntfs-3g`→`ntfsprogs`.
- v90 (2026-09): BIOS skipped on non-x86 with a warning; `broadcom-wl` removed.
- v91 (2026-09-27): AArch64 with `stubble`/DTB; `kernel_params_<arch>` and `%KERNEL_PARAMS%`; lz4/pzstd bootstrap; **`customize_airootfs.sh` deprecated**; removed the `linux.preset` override; warning when run with sudo.

## Myth corrections

1. `baseline` was **not** removed (v91 ships it: `configs/baseline`, 12 packages).
2. EROFS is **not** the default; releng uses squashfs+xz, baseline erofs+lzma.
3. The names `uefi.systemd-boot.esp` / `uefi.grub.eltorito` **never existed**; the granular ones were `uefi-x64.*`/`uefi-ia32.*` (deprecated v86).
4. `mkarchiso -r` = delete workdir; it is **not** reproducible. Reproducibility is `SOURCE_DATE_EPOCH`/`build_date`.
5. `mkarchiso -m` = build modes, **not** mirrors.
6. `offload-build` is no longer a standalone binary: `pkgctl build --offload` (default host `build.archlinux.org`).
7. `dbscripts` and `asp` no longer exist: `pkgctl db` and `pkgctl repo clone`.
8. GRUB 2.16 is no longer on GNU Savannah: development at `gnu-grub.freedesktop.org`.
9. `linux-firmware` is an empty meta since the 2025 split; list explicit subpackages.
10. Official ISOs do not sign Secure Boot; `run_archiso -s` is for testing only.

## External changes that affect ISOs

- **pacman 7.0** (2024-07-14): sandboxed downloader + `DownloadUser=alpm`; local repos must be readable/executable by `alpm` (`chown :alpm -R`). `ParallelDownloads` ON by default (5). **`CacheServer`** per repo.
- **Official databases unsigned**: `core.db.sig`/`extra.db.sig` do not exist (404); hence `DatabaseOptional`. Packages themselves are signed.
- **Malicious AUR** (2026-06-12 incident): treat AUR as hostile input; build in a clean chroot; chaotic-aur is unaudited x86_64 binaries.
- **Arch Linux Archive**: daily snapshots at `https://archive.archlinux.org/repos/YYYY/MM/DD/$repo/os/$arch`; enables pinned rebuilds (do not mix with live mirrors).
- **mkinitcpio 42 + TPM2** (2026-09-22 notice): `systemd-pcrosseparator` changes PCRs 0-7, 9, 12-14 → re-enroll LUKS TPM2; prefer signed policies or an empty PCR 15.
- **grub-btrfs + systemd initramfs**: `grub-btrfs-overlayfs` is a busybox hook; incompatible. 2026 route: Limine + `limine-snapper-sync`.
- **Ventoy**: new Secure Boot CA since 1.1.14 (enroll on first boot); the Arch Wiki keeps a security warning about binary blobs of unknown provenance.
- **systemd 262**: NvPCRs + signed PCR policy inside the UKI; only `ukify` generates it today (mkinitcpio 42.2 documents this as a limitation).

## Primary source map

- archiso: `gitlab.archlinux.org/archlinux/archiso` (blocks web scraping with Anubis; use the `github.com/archlinux/archiso` mirror), `wiki.archlinux.org/title/Archiso`, `man.archlinux.org/man/mkarchiso.1`.
- Packaging: `wiki.archlinux.org/title/DeveloperWiki:Building_in_a_clean_chroot`, devtools/pkgctl man pages, `wiki.archlinux.org/title/Pacman/Tips_and_tricks`.
- Boot: `wiki.archlinux.org/title/Arch_boot_process`, `/GRUB`, `/Systemd-boot`, `/Limine`, `/Unified_kernel_image`, `/Secure_Boot`.
- Installers: `github.com/archlinux/archinstall`, `codeberg.org/Calamares/calamares`.
- CI/releng: `.gitlab-ci.yml` of archiso/releng/arch-boxes/archlinux-docker (GitHub mirrors), `github.com/pierres/archiso-manager`, `wiki.archlinux.org/title/Mirrors`.
- Reference distributions: EndeavourOS, CachyOS, Garuda, Artix, archboot (URLs in `sources.md`).

## Knowledge traps (pre-2025 → 2026)

1. "edit `customize_airootfs.sh`" → deprecated: pacman hooks + `# remove from airootfs!`.
2. "bootmode `uefi.systemd-boot.esp`" → does not exist; use `uefi.systemd-boot`.
3. "archiso signs the ISO" → no; archiso only produces artifacts and checksums/zsync in its CI. Signing is yours (`gpg --detach-sign`).
4. "mkarchiso always needs root" → since v89 it can with `unshare`; since v91 it warns with sudo.
5. "the ISO kernel carries `archisodevice`" → since v77 it is `archisosearchuuid=%ARCHISO_UUID%` and `%ARCHISO_SEARCH_FILENAME%` (grub).
6. "I need a separate `intel-ucode.img`" → the `microcode` hook embeds it (booster does need a separate initrd).
7. "`ParallelDownloads` is optional" → it defaults to 5 in pacman 7.
8. "Calamares is on GitHub/Arch Wiki" → Codeberg; wiki page 404.
9. "archinstall has an offline mode" → `--offline` only disables online services, it does not install without network.
10. "`dbscripts` to manage my repo" → use `repo-add`/`repo-remove` or `pkgctl db` if you are Arch.
