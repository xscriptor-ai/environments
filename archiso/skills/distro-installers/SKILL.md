---
name: distro-installers
description: Deep reference for Arch distro installers and first-boot UX (October 2026): Calamares 3.4.3 on Codeberg, archinstall 4.5, offline vs netinstall, branding, OEM, systemd-firstboot and distro identity files. Use when adding or configuring an installer, writing Calamares/archinstall configs, or designing first-run/OEM experiences.
---

# Distro installers Reference (October 2026)

## Current versions

- **Calamares 3.4.3** (2026-09-10), development on **Codeberg** (`codeberg.org/Calamares/calamares`); GitHub archived 2025-08-18; `calamares.io/docs` is 404 → `calamares.codeberg.page/docs/`. Qt6/KF6 first-class (Qt ≥6.5).
- **archinstall 4.5** (2026-09-29), Textual TUI since 4.0, official Arch installer shipped in releng.
- The Arch Wiki has **no Calamares page** (404). Use Codeberg docs + real distro configs (CachyOS, EndeavourOS).
- systemd 262 for `systemd-firstboot`/OOBE.

## Choosing

| Path | Best for |
|---|---|
| Calamares offline (`unpackfs` from ISO squashfs) | GUI distro installer, works without network |
| Calamares netinstall | minimal ISO, packages from repos |
| archinstall | official TUI, automated JSON installs, CI |
| Own CLI (CachyOS New-Cli) | niche, more work |

For a distro: Calamares offline as primary + archinstall as fallback covers most use cases.

## Offline Calamares pipeline (archiso)

```
show: welcome, locale, keyboard, partition, users, summary
exec: partition, mount, unpackfs, machineid, fstab, locale, keyboard, localecfg,
      luksbootkeyfile, luksopenswaphookcfg, initcpiocfg, initcpio, removeuser,
      users, networkcfg, displaymanager, packages@offline, hwclock, bootloader,
      shellprocess@before, services-systemd, shellprocess, umount
show: finished
```

- `unpackfs` extracts the ISO squashfs (`/<install_dir>/x86_64/airootfs.sfs`) to `${ROOT}`.
- `initcpiocfg` + `initcpio` rebuild the initramfs **inside the target chroot** (critical for `autodetect`).
- Branding component: `/etc/calamares/branding/<id>/branding.desc` (+ `stylesheet.qss`, `show.qml`, `lang/`); `branding.desc` strings can substitute `${VAR}` from os-release at build time.
- Config under `/etc/calamares`; `modules-search: [local]`; don't edit `/usr/share` samples.

## archinstall JSON install

```sh
archinstall --config user_configuration.json --creds user_credentials.json --silent
```

- `--silent` requires a config; `--offline` only disables online services (not an offline install).
- Creds: yescrypt-hashed or encrypted file (`--creds-decryption-key`).
- Bootloaders: `systemd-bootctl`, `grub-install`, `efistub`, Limine (4.5).

## First boot / OEM

- `systemd-firstboot --prompt` via sysinit drop-in after clearing `/etc/{machine-id,localtime,hostname,shadow,locale.conf}`.
- `ConditionFirstBoot=yes` for run-once provisioning.
- OOBE: `gnome-initial-setup`, Plasma `plasma-setup.service`, `cosmic-initial-setup`.
- Calamares OEM: `dont-chroot: true`, `oem-setup: true`; first-run module list in deploy-oem docs.
- Always remove `/etc/machine-id` before publishing images.

## Reference files

- `references/calamares.md` — module catalog, sequence, branding, OEM, failure modes.
- `references/archinstall.md` — CLI flags, JSON schema, credentials, embedding, pitfalls.
- `references/first-boot-branding.md` — os-release, Plymouth, fastfetch, MOTD, skel, OOBE, identity checklist.

## Primary sources

- `https://codeberg.org/Calamares/calamares` + `calamares.codeberg.page/docs/`
- `https://github.com/archlinux/archinstall` + releases
- `https://man.archlinux.org/man/os-release.5`, `https://wiki.archlinux.org/title/Systemd-firstboot`, `/Out-of-the-Box_Experience`, `/Plymouth`
