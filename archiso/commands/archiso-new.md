---
description: Scaffold a new archiso profile (v91) with current bootmodes, sane defaults and optional branding
agent: archiso-profile
---

Create a fresh archiso profile for building an Arch-based distro ISO, current as of October 2026 (archiso v91).

1. Ask for: distro name, `install_dir` (lowercase, ≤30), UEFI-only or hybrid BIOS, whether a custom repo will be used, and target size (minimal/live/desktop).
2. Copy `/usr/share/archiso/configs/releng/` (or `baseline` for minimal) to `profiles/<name>/`.
3. Update `profiledef.sh`: `iso_name`, `iso_label` (short uppercase), `iso_publisher`, `iso_application`, `iso_version`, `install_dir`, `bootmodes` (exactly `uefi.systemd-boot` and optionally `bios.syslinux`), `airootfs_image_type` (squashfs + zstd for speed), and `file_permissions` for `/etc/shadow`, `/root`, scripts.
4. Adjust `packages.x86_64`: keep `mkinitcpio` + `mkinitcpio-archiso`; add kernels, firmware subsets (`linux-firmware-{amdgpu,intel,nvidia,realtek,other}`), installer (calamares/archinstall), desktop base. Remove unneeded releng packages.
5. Brand: edit `airootfs/etc/os-release` (+ `/usr/lib`), boot menu titles, autologin user, MOTD.
6. Do NOT use `customize_airootfs.sh` (deprecated v91); create pacman hooks in `airootfs/etc/pacman.d/hooks/` marked `# remove from airootfs!` for users/services.
7. Verify with `mkarchiso -v -w /tmp/archiso-work -o out profiles/<name>` and `run_archiso -i out/*.iso`.

Report the created tree, the exact build command, and any placeholders the user must fill (GPG keys, repo URLs, branding assets).

$ARGUMENTS
