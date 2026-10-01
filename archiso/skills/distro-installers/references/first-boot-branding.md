# First boot, identity and branding reference

## /etc/os-release

- Canonical: `/usr/lib/os-release`; `/etc/os-release` as **relative symlink** (`../usr/lib/os-release`) so chroot/initrd resolve it.
- Format: `VAR=value`, shell-like quoting, **no expansion**.
- Key fields: `NAME`, `ID` (lowercase, no version), `ID_LIKE` (`arch` for derivatives), `PRETTY_NAME`, `VERSION`/`VERSION_ID`, `VARIANT(_ID)`, `BUILD_ID`, `IMAGE_ID`/`IMAGE_VERSION`, `RELEASE_TYPE` (stable|lts|development|experiment), `FANCY_NAME`, `ANSI_COLOR`, `LOGO`, `HOME_URL`, `DOCUMENTATION_URL`, `SUPPORT_URL`, `BUG_REPORT_URL`, `PRIVACY_POLICY_URL`, `SUPPORT_END`, `VENDOR_NAME`/`VENDOR_URL`, `DEFAULT_HOSTNAME` (`?` → machine-id chars), `CPE_NAME`, `ARCHITECTURE`, `SYSEXT_LEVEL`/`CONFEXT_LEVEL`.
- `ID=arch` vs `ID_LIKE=arch`: CachyOS sets `ID=arch` for maximum tool/AUR compatibility while rebranding `NAME`/`PRETTY_NAME`/`LOGO`; spec-clean derivatives use `ID_LIKE=arch`. Choose once and propagate (Calamares branding `${VAR}` reads os-release).

## Other identity files

| File | Purpose |
|---|---|
| `/etc/lsb-release` (package `lsb-release`) | legacy tools that don't read os-release |
| `/etc/issue`, `/etc/motd` | login banners (agetty) |
| `/etc/hostname` | written by systemd-firstboot; `DEFAULT_HOSTNAME` fallback |
| `/etc/skel/*` | defaults for every created user |
| `/usr/share/backgrounds`, theme packages | wallpapers/branding as owned packages |
| `/etc/vconsole.conf`, `/etc/locale.conf` | keymap/locale defaults |

## Plymouth

- Package `plymouth`; params `splash` (+ `quiet`); mkinitcpio hook `plymouth` **before** `encrypt`/`sd-encrypt`; `plymouthd.conf` `Theme=`; `plymouth-set-default-theme -R` rebuilds initramfs; default theme `bgrt`; disable via `plymouth.enable=0`.
- `plymouth.use-simpledrm=0` on problematic GPUs; Calamares `plymouthcfg`; archinstall 4.4 has a Plymouth step.

## Live session identity

- Autologin (`getty@tty1.service.d/autologin.conf`, serial variant for ttyS0).
- `iwd` auto-connect: `/var/lib/iwd/<SSID>.psk`, dir `0:0:700`.
- MOTD with install docs + connectivity (`iwctl`, `nmcli`).
- fastfetch 2.69.0 config at `~/.config/fastfetch/config.jsonc` (`--gen-config`); ship logo/ascii for the distro.

## First boot

- `systemd-firstboot`: timezone/locale/hostname/root password/machine-id. Interactive: drop-in `ExecStart=/usr/bin/systemd-firstboot --prompt`, `WantedBy=sysinit.target`; first delete `/etc/{machine-id,localtime,hostname,shadow,locale.conf}` and root from `/etc/passwd`.
- `ConditionFirstBoot=yes`: run-once provisioning units.
- OOBE: `gnome-initial-setup` (GDM, no users), Plasma `plasma-setup.service` (`/etc/plasma-setup-done`), `cosmic-initial-setup`.
- Calamares OEM: `dont-chroot: true`, `oem-setup: true`; first-run modules (`welcome, users, locale, keyboard, finished`) + exec (`machineid, users, locale, keyboard, localecfg, networkcfg, services, displaymanager, packages`, e.g. remove Calamares).
- Machine-id hygiene: always `rm /etc/machine-id` before publishing an image; systemd regenerates at boot.

## Branding checklist

- [ ] os-release (+ /usr/lib copy) with logo, URLs, DEFAULT_HOSTNAME
- [ ] Product logo/wordmark for plymouth, fastfetch, installer, boot menus
- [ ] Boot menu titles/timeout (syslinux/systemd-boot/GRUB)
- [ ] Plymouth theme package
- [ ] Wallpapers package
- [ ] DM theme (sddm/gdm/lightdm)
- [ ] Calamares branding component
- [ ] MOTD/issue + optional browser start page
- [ ] `lsb-release` if third-party tools need it

## Pitfalls

1. Package-owned files overwrite airootfs branding unless backup files or profile ordering handles it.
2. Hand-made systemd symlinks: verify the target (`WantedBy`) or the unit never starts.
3. Public ISOs with password hashes are crackable → prompts/cloud-init.
4. Keep `os-release` in sync between live ISO, installed system and installer branding.
