---
name: archiso
description: Deep up-to-date archiso reference (v91, October 2026). Use when authoring live ISO profiles, configuring mkarchiso builds (iso/netboot/bootstrap), boot modes, airootfs customization, live environment behavior, or debugging Arch ISO builds. Covers profiledef.sh, packages, hooks, CoW persistence and netboot.
---

# archiso Reference (October 2026)

Current: **archiso 91-1** (built 2026-09-27), package `extra/any`, GPL-3.0-or-later. `mkarchiso` is the core script; docs ship at `/usr/share/doc/archiso/` and upstream in `docs/README.profile.rst`. Upstream is GitLab (`gitlab.archlinux.org/archlinux/archiso`), Anubis-blocked for scraping — use the read-only GitHub mirror `github.com/archlinux/archiso`.

## Critical realities

- Boot modes are exactly **`bios.syslinux`, `uefi.systemd-boot`, `uefi.grub`**; the two UEFI modes are mutually exclusive. Granular names (`uefi-x64.*`, `*.eltorito`, `*.esp`) are deprecated v86 and auto-remap. `.esp`/`.eltorito` combined names never existed.
- `customize_airootfs.sh` **deprecated** (v91); supported path is pacman hooks in `airootfs/etc/pacman.d/hooks/` with `# remove from airootfs!`.
- No root required since v89 (`unshare --map-auto --map-root-user`); v91 warns when run via sudo.
- Both `baseline` and `releng` profiles ship in 91-1. EROFS is **not** the default (`airootfs_image_type` defaults `squashfs`).
- `mkarchiso -r` = remove workdir. Reproducibility = `SOURCE_DATE_EPOCH` / `work/build_date`.
- No native x86_64 UKI bootmode; only AArch64 uses `ukify`/`stubble` (v91).

## Workflow

```sh
# Build releng as-is
mkarchiso -v -w /tmp/archiso-work -o out /usr/share/archiso/configs/releng

# Custom profile
cp -r /usr/share/archiso/configs/releng archlive
mkarchiso -v -r -w /tmp/archiso-work -o out archlive

# All artifact types
mkarchiso -v -m "iso netboot bootstrap" -w /tmp/w -o out archlive
```

- `-m` modes: `bootstrap`, `iso`, `netboot` (space-delimited).
- `-p` appends packages; `-C` pacman conf; `-D` install_dir; `-L/-P/-A` metadata; `-c` CMS signing; `-g/-G` PGP signing.
- Outputs: `out/<iso_name>-<iso_version>-<arch>.iso`, bootstrap tarball, netboot tree under `out/<install_dir>/`.

## Runtime testing

```sh
run_archiso -i out/midistro-*.iso     # UEFI default
run_archiso -b -i out/*.iso           # BIOS
run_archiso -s -i out/*.iso           # Secure Boot firmware test
```

Host port 60022 → guest 22. Needs `qemu-desktop` + `edk2-ovmf`.

## Key knobs

| profiledef variable | Values |
|---|---|
| `airootfs_image_type` | `squashfs` (default), `ext4+squashfs`, `erofs` |
| `airootfs_image_tool_options` | pass-through to mksquashfs/mkfs.erofs |
| `bootstrap_tarball_compression` | `(zstd -c -T0 --long -19)`, `(xz -9e)`, lz4/pzstd (v91) |
| `file_permissions` | `["/etc/shadow"]="0:0:400"`, trailing `/` recursive |
| `kernel_params_<arch>` | `%KERNEL_PARAMS%` substitution (v91) |

releng: squashfs xz + x86/arm64 BCJ, initramfs `COMPRESSION="xz" -9e`, 129 packages, root autologin, `mirror=`/`archiso_http_srv=` boot params, iwd + systemd-networkd, pacman-init on tmpfs, cloud-init, sshd.

## References

- `references/profile.md` — full profile anatomy, profiledef fields, hooks, permissions, custom repos.
- `references/bootmodes.md` — boot mode generation (syslinux/systemd-boot/GRUB/ESP/memtest) and templates.
- `references/live-env.md` — live environment units, autologin, CoW persistence, boot params, troubleshooting.

## Primary sources

- `https://archlinux.org/packages/extra/any/archiso/`
- `https://github.com/archlinux/archiso` (mirror of GitLab; `CHANGELOG.rst`, `docs/README.profile.rst`, `configs/releng/`)
- `https://wiki.archlinux.org/title/Archiso`
- `https://man.archlinux.org/man/mkarchiso.1`
- `https://github.com/archlinux/mkinitcpio-archiso/blob/master/docs/README.bootparams`
