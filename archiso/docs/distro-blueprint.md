# Blueprint — building an Arch-based distro from zero to release

Reference architecture document. Each phase lists decisions, current tools (2026) and exit criteria. The pack's agents execute each block.

## Phase 0 — Define scope

| Decision | 2026 options | Recommendation |
|---|---|---|
| Base | pure archiso / archiso fork (EndeavourOS) / Manjaro-lineage framework (Garuda, Artix artools) / own toolchain (archboot) | pure archiso to start; fork only if you need to touch mkarchiso |
| Installer | Calamares (GUI), archinstall (official TUI), custom (CachyOS New-Cli) | Calamares offline + archinstall as fallback |
| Audience | rolling / monthly snapshot / LTS-like | rolling with a dated monthly ISO |
| Architectures | x86_64, x86_64_v3, aarch64 | x86_64_v3 if your user base is modern |
| Identity | ID=arch vs ID_LIKE=arch | `ID_LIKE=arch` (spec-clean); `ID=arch` maximizes AUR/tooling compatibility |
| Repos | official only / + own / + chaotic / AUR at build | own signed repo; AUR only at build with a clean chroot |

Exit criterion: one-page scope document + name, `ID`, channels (nightly/beta/stable) and update policy.

## Phase 1 — Bootstrap the tree

```text
distro/
├── profiles/
│   └── my-distro/            # archiso profile (copy of /usr/share/archiso/configs/releng)
│       ├── profiledef.sh
│       ├── packages.x86_64
│       ├── pacman.conf       # build-time (mirrors + own repo)
│       ├── airootfs/
│       ├── efiboot/loader/{loader.conf,entries/}
│       ├── syslinux/
│       └── grub/
├── packages/                 # own PKGBUILDs (my-distro-*)
├── repo/                     # signed binary repo (repo-add)
├── ci/                       # workflows
└── scripts/                  # build.sh, release.sh, test-iso.sh
```

Output: `mkarchiso -v -w work -o out profiles/my-distro` produces a bootable ISO (even if ugly).

## Phase 2 — Package layer

- Build your own packages with `pkgctl build` (mimics Arch) or `makechrootpkg`; sign with `GPGKEY`.
- Own repo: `repo-add -s -k KEY repo/my-distro.db.tar.zst repo/*.pkg.tar.zst` + `.files`, `*.db`/`*.files` symlinks.
- Profile consumption: `[my-distro]` **above** official in `pacman.conf`, `Server = file:///srv/repo` (build-time) and a copy of `pacman.conf`+keyring into `airootfs/etc` + `airootfs/usr/share/pacman/keyrings/` (live runtime).
- If you replace official packages: `provides` + `conflicts`, and `replaces` for takeover; `IgnoreGroup`/`IgnorePkg` to hold.
- Own kernel: rename `pkgbase` (e.g. `linux-midistro`), **never** `provides=('linux')`; matching headers; updated boot entries.

Output: signed and reproducible repo; the ISO installs packages from your repo.

## Phase 3 — Boot and security

- Bootmodes: `bios.syslinux` (if you support legacy) + `uefi.systemd-boot` (2026 default). GRUB only if you need loopback/encrypted `/boot`.
- x86_64 UKI (optional but recommended): `uki` preset + `ukify`, output `EFI/Linux/*.efi`; systemd-boot auto-discovers them.
- Secure Boot: Microsoft-signed shim+GRUB (maximum compatibility), own keys with `sbctl` (full control), or PreLoader (simplest). At minimum: document how to disable SB.
- Artifact signing: GPG detached (`iso.sig`, `sha256sums.txt`, `b2sums.txt`) + torrent with webseeds.
- Explicit `linux-firmware` (split): include `-amdgpu -intel -nvidia -realtek -other`; add the wifi/storage used during install.

Output: ISO boots on UEFI (and BIOS if applicable), with documented Secure Boot and signed artifacts.

## Phase 4 — Installer and first boot

- Calamares offline: modules `partition → mount → unpackfs → machineid → fstab → locale → keyboard → localecfg → initcpiocfg → initcpio → users → networkcfg → displaymanager → packages@offline → hwclock → bootloader → services-systemd → umount`; own branding in `/etc/calamares/branding/<id>`.
- `unpackfs` extracts `airootfs.sfs` from the ISO itself into `${ROOT}`.
- archinstall as a TUI alternative: `archinstall --config config.json --creds creds.json --silent`.
- First boot: interactive `systemd-firstboot` or `ConditionFirstBoot=yes`; clear `/etc/machine-id` before publishing; `/etc/skel` for user defaults.

Output: full offline install in a VM without manual intervention (automated mode).

## Phase 5 — Branding and experience

- `/etc/os-release` (NAME, ID, ID_LIKE, PRETTY_NAME, LOGO, HOME_URL, SUPPORT_URL, BUG_REPORT_URL, DEFAULT_HOSTNAME, RELEASE_TYPE).
- Plymouth (`splash` + `plymouth` hook before `encrypt`/`sd-encrypt`), own theme.
- fastfetch config, MOTD, `/etc/issue`, wallpapers, GRUB/syslinux with the distro name.
- Live session: autologin (`getty@tty1.service.d/autologin.conf`), CoW by default (`cow_spacesize=4G`), iwd/NetworkManager, optional sshd.

Output: coherent identity at boot, live and installed.

## Phase 6 — CI, testing and release

- CI: `archlinux:base-devel` container (or a dated tag for reproducibility) + `mkarchiso`; cache of `/var/cache/pacman/pkg`; `{releng-like, minimal} × {iso, netboot}` matrix; static validation (`xorriso -report_el_torito`, `unsquashfs -l`, `mcopy -i efiboot.img`, `gpg --verify`).
- Headless QEMU UEFI smoke test: OVMF pflash + `-display none -serial mon:stdio -no-reboot`, wait for login/SSH/QGA, run a command; BIOS variant; optional Secure Boot.
- Release: checksums, signatures, torrent (`mktorrent -l 19` + webseeds), rsync to mirror, `latest` symlink, N-release retention, generated release notes.
- Reproducibility: `SOURCE_DATE_EPOCH`, TZ=UTC, sorted lists, `--source-date-epoch` in container builds; optional gate with `diffoscope`.

Output: nightly pipeline + a signed and tested release.

## Phase 7 — Operations

- Channels: nightly → beta → stable (dated ISO); warn about breaking changes (partial upgrades, keyring).
- Monitor mirror status, ISO size and package count against previous builds (cheap regression check).
- Keep `archiso`, `mkinitcpio`, `grub`, `systemd`, `calamares` up to date: they are the boot surface.
- Supply-chain security: sign packages, SLSA/provenance if CI allows, review AUR (2026-06-12 incident).

## Realistic time budget (first usable ISO)

| Milestone | Effort |
|---|---|
| Rebranded releng ISO | 1 day |
| Own profile + own packages | 1-2 weeks |
| Signed repo + build CI | 1 week |
| Functional offline Calamares | 1-2 weeks |
| Secure Boot + UKI | 1 week |
| QEMU smoke tests in CI | 2-4 days |
| Reproducible and signed release | 1 week |

## Compliance, licensing and trademark

- **Arch sources**: official PKGBUILDs are 0BSD (RFC40) and pass REUSE (RFC52); you may legally fork them, but keep the copyright notices of upstream patches and of the sources (GPL/MIT/etc.).
- **Own packages**: every PKGBUILD needs the correct `license=` and, if it packages binaries, the license text in `/usr/share/licenses/<pkg>/`. GPL requires a source offer (publish your PKGBUILDs and sources).
- **Trademark**: "Arch Linux" and its logo are registered trademarks (Arch terms policy); do not use them to promote your derivative. Create your own logo/name and use `ID_LIKE=arch` (or `ID=arch` only for compatibility, documenting it).
- **Attribution**: credit Arch, upstream and contributors in the README/download page; include the license text of the ISO and the artifacts.
- **Privacy/telemetry**: if you add telemetry, be explicit and opt-in; publish a policy. If not, state it ("no telemetry").
- **Export/control**: if your distro is distributed in countries with export/crypto regulations (LUKS), review the corresponding notice.

## Vulnerability tracking (own distro)

- **Arch Security Tracker**: `https://security.archlinux.org/` (JSON/API per package) — monitor the packages you repackage or pin.
- `arch-audit` (package `arch-audit`) against the installed system; in CI, compare the profile's package list against open advisories.
- **CVE**: NVD/MITRE feeds + `cve-bin-tool`/OSV-scanner for your own packages; GitHub Advisory DB for toolchain dependencies.
- Rebuild policy: when updating a shared library, `checkrebuild`/`rebuild-detector` and rebuild your own packages; for kernels/loader, re-sign after every update.
- Subscriptions: `arch-security` mailing list/RSS and your upstreams' channels; document a patching SLA (e.g. critical ≤72 h) if you publish a distro.

## Accessibility (ISO pattern)

- Boot consoles: "speech" entries with `accessibility=on` (releng includes them) + `espeakup`/`brltty`; services enabled under `sound.target.wants`.
- Live: screen reader available (Orca on GNOME), high contrast/theme, readable fonts; the installer (Calamares) has accessible QML/keyboard.
- Installed: do not break the accessibility defaults of the chosen DE; verify keyboard navigation and focus in the installer.
- Real test: boot the ISO with `accessibility=on` and validate that the installer is operable without a screen.
