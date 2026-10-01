# Calamares 3.4.x reference

## Versions and platform

- 3.4.3 (2026-09-10): QML embedding fix (keyboard under Wayland), `Etc/GMT±` locales, partition/KPMcore alignment.
- 3.4.2 (2026-03-10): `plasma-login` displaymanager, lightdm alternate greeters, NVMe/MMC SSD detection.
- 3.4.0 (2025-07-21): test release; Qt6/KF6 first-class. 3.3.14 last of 3.3.
- Requirements: C++17/CMake, Qt ≥6.5 (or 5.15 legacy), KF5/KF6 deps.
- Docs: `calamares.codeberg.page/docs/` (deploy guide, OEM, known issues).

## Module model

- Types: *viewmodule* (pages) and *jobmodule*.
- Interfaces: `qtplugin`, `python` (job modules only; `run()` + `libcalamares.globalstorage/job/utils`), `process` (discouraged; use `shellprocess`).
- Config: `$LIBDIR/calamares/modules`; `<module>.conf` from `/etc/calamares/modules` overrides samples. `INSTALL_CONFIG` off since 3.2.2.
- Weights affect progress (unpackfs weight 12); emergency modules run on failure.

## Arch-relevant modules

| Module | Role |
|---|---|
| `partition` | partitioning UI (auto/manual), flags ESP |
| `mount` | mounts target; detects NVMe/MMC as SSD |
| `unpackfs` | extract squashfs/fs image into `${ROOT}` (offline install) |
| `machineid`, `fstab`, `locale`, `keyboard`, `localecfg` | system basics |
| `luksbootkeyfile`, `luksopenswaphookcfg` | LUKS keyfile/hook for encrypted boot |
| `initcpiocfg`, `initcpio` | configure/rebuild initramfs in target |
| `users`, `removeuser` | create user, remove live user |
| `networkcfg`, `displaymanager`, `services-systemd` | installed-system config |
| `packages` | install package list (offline) |
| `netinstall` | online package selection (packagechooser integration) |
| `hwclock`, `bootloader`, `umount` | finalize |
| `plymouthcfg` | Plymouth theme installation |
| `grubcfg` | GRUB config generation |
| `shellprocess`, `contextualprocess` | distro glue |
| `packagechooser`, `notesqml`, `tracking` | UI/telemetry choices |

## settings.conf skeleton

```yaml
modules-search: [ local ]
sequence:
- show: [ welcome, locale, keyboard, partition, users, summary ]
- exec: [ partition, mount, unpackfs, machineid, fstab, locale, keyboard, localecfg,
         initcpiocfg, initcpio, users, networkcfg, displaymanager, packages@offline,
         hwclock, bootloader, services-systemd, umount ]
- show: [ finished ]
branding: midistro
prompt-install: false
```

- Unattended: `autoProceed: true` on partition instance, `quit-at-end`, `disable-cancel`.
- OEM: `dont-chroot: true`, `oem-setup: true`.

## Branding

```
/etc/calamares/branding/midistro/
├── branding.desc          # componentName, strings, images, style, slideshowAPI
├── stylesheet.qss
├── show.qml
├── icon.png / logo.png / welcome.png / slide*.png
└── lang/calamares-midistro_<lang>.ts -> .qm
```

`branding.desc` keys: `componentName`, `strings` (`productName`, `shortProductName`, `version`, `versionedName`, `bootloaderEntryName`, URLs; `${VAR}` substituted from os-release), `images` (`productIcon`, `productLogo`, `productWallpaper`, `productWelcome`, optional `productBanner`), `style` (sidebar colors), `slideshow`/`slideshowAPI: 2`, `uploadServer`.

## Common failures

1. `unpackfs` source wrong: must be the ISO's squashfs path (`/<install_dir>/x86_64/airootfs.sfs`).
2. Black screen post-install: `initcpiocfg`/`initcpio` not run in chroot (autodetect from live env).
3. No ESP found: partition flags not set; check `bootloader.conf` (`efiSystemPartition`, `kernel`, `timeout`).
4. No DM: enable via `displaymanager`/`services-systemd`.
5. Wayland keyboard issues: use ≥3.4.3.
6. CoW exhaustion during install: `cow_spacesize=4G`.

## Distro references

- CachyOS: `settings_offline.conf`/`settings_online.conf` + `cachyos-calamares` fork (12k commits) — the most complete Arch example.
- EndeavourOS: Calamares fork at `endeavouros-team/calamares`.
