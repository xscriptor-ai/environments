# archinstall 4.x reference

## Versions

- **4.5** (2026-09-29): RT kernels, aarch64 GRUB+Limine, aarch64 root GUID, EFI `fmask=0177`, TLS verification for config fetches.
- 4.4 (2026-06-28): Plymouth setup, `share-log` (≤10 MB to paste.rs), iwd option, color-coded preview, mkosi test images, config refactor, niri/DankMaterialShell profile.
- 4.0 (2026-03-30): Textual UI replaces curses.
- Docs site is stale (footer v2.3.0) — trust the repo.

## CLI

```
archinstall [--config FILE|--config-url URL] [--creds FILE|--creds-url URL]
            [--creds-decryption-key KEY] [--silent] [--dry-run] [--script NAME|list]
            [--mountpoint PATH] [--skip-ntp] [--skip-wkd] [--skip-boot]
            [--offline] [--no-pkg-lookups] [--plugin NAME|--plugin-url URL]
            [--skip-version-check] [--skip-wifi-check] [--advanced] [--verbose] [--debug]
archinstall share-log
```

- `--silent` is ignored without a config.
- `--offline`: disables online services only (no package search/keyring update); still needs repos.
- Logs: `/var/log/archinstall/install.log`.

## Config files

- `user_configuration.json` (non-sensitive) + `user_credentials.json` (passwords).
- Credentials: yescrypt hashes by default; LUKS password stays plaintext unless the file is encrypted (age-style) and unlocked via CLI/env/TTY.
- Main schema keys (pydantic models): `disk_config`, `profile_config`, `mirror_config`, `network_config`, `bootloader_config`, `app_config`, `auth_config`, `swap`, `pacman_config`, `users`.
- Legacy 2.x/3.x keys accepted with deprecation shims: top-level `bootloader`+`uki`, `disk_encryption`, `audio_config`, `!root-password`, `!users`, `parallel_downloads`.
- Repo-root `schema.json` is stale/draft — don't treat as normative.

## Features

- Bootloaders: `systemd-bootctl`, `grub-install`, `efistub` (+ Limine in 4.5). UKI boolean.
- Storage: LUKS, LVM, btrfs subvolumes (default vols incl. `@.snapshots`), zram swap, `libfido2` dep.
- Profiles: desktop (awesome, bspwm, budgie, cinnamon, deepin, enlightenment, gnome, i3, plasma, lxqt, mate, sway, xfce4, qtile, niri...) and server; audio PipeWire/PulseAudio; GPU drivers incl. NVIDIA open/proprietary; firewalls ufw/firewalld (4.0); NetworkManager or IWD.
- Library API: `archinstall.Installer`, plugins (`--plugin`); example scripts `examples/install_scripts/*`.

## Embedding in a distro ISO

1. Add `archinstall` to `packages.x86_64` (releng already includes it).
2. Ship JSONs in `airootfs/root/` or a config package; wrapper script + optional systemd unit for automated installs.
3. CoW default 256 MiB: `mount -o remount,size=1G /run/archiso/cowspace` before install.
4. Public ISOs: avoid baked password hashes (crackable); prefer prompts/cloud-init.

## Pitfalls

1. No true offline mode → combine with a local repo baked into the ISO for offline installs, or use Calamares `unpackfs`.
2. `--silent` without config → interactive prompts (scripts hang).
3. Self-signed config URLs fail TLS verification (4.5+).
4. Stale `schema.json` misleads tooling.
5. Validate every config with `--dry-run` in a VM before release.
