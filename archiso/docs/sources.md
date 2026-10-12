# Sources — Arch ISO / distro building (verified 2026-10-01)

Note: `gitlab.archlinux.org` blocks scraping with Anubis (JS proof-of-work). The read-only GitHub mirrors (`github.com/archlinux/*`, `raw.githubusercontent.com/archlinux/*`) serve the same content and are citable.

## archiso and ISO building

- Package: https://archlinux.org/packages/extra/any/archiso/
- Upstream repo (GitLab): https://gitlab.archlinux.org/archlinux/archiso
- GitHub mirror: https://github.com/archlinux/archiso
- Changelog: https://raw.githubusercontent.com/archlinux/archiso/master/CHANGELOG.rst
- Profile specification: https://raw.githubusercontent.com/archlinux/archiso/master/docs/README.profile.rst
- releng profile: https://github.com/archlinux/archiso/tree/master/configs/releng
- baseline profile: https://github.com/archlinux/archiso/tree/master/configs/baseline
- archiso CI: https://raw.githubusercontent.com/archlinux/archiso/master/.gitlab-ci.yml
- Wiki: https://wiki.archlinux.org/title/Archiso
- Man page: https://man.archlinux.org/man/mkarchiso.1
- Boot params (CoW, PXE): https://github.com/archlinux/mkinitcpio-archiso/blob/master/docs/README.bootparams
- Official releases: https://archlinux.org/releng/releases/
- archiso-manager (releng tooling): https://github.com/pierres/archiso-manager

## Packaging (repos, chroots, signatures)

- Clean chroot: https://wiki.archlinux.org/title/DeveloperWiki:Building_in_a_clean_chroot
- devtools / pkgctl: https://man.archlinux.org/man/pkgctl.1 · https://man.archlinux.org/man/pkgctl-build.1 · https://man.archlinux.org/man/pkgctl-repo.1 · https://man.archlinux.org/man/pkgctl-db.1
- devtools (package): https://archlinux.org/packages/extra/any/devtools/
- ABS / sources in git: https://wiki.archlinux.org/title/Arch_build_system · https://archlinux.org/news/git-migration-completed/
- PKGBUILD: https://wiki.archlinux.org/title/PKGBUILD · https://wiki.archlinux.org/title/Makepkg
- Local repo: https://wiki.archlinux.org/title/Pacman/Tips_and_tricks#Custom_local_repository · https://man.archlinux.org/man/repo-add.8
- Signing: https://wiki.archlinux.org/title/Pacman/Package_signing · https://man.archlinux.org/man/pacman.conf.5
- ALA (snapshots): https://wiki.archlinux.org/title/Arch_Linux_Archive · https://archive.archlinux.org/repos/
- Reproducible: https://wiki.archlinux.org/title/Reproducible_builds · https://reproducible.archlinux.org
- AUR: https://wiki.archlinux.org/title/Arch_User_Repository · https://wiki.archlinux.org/title/AUR_helpers · incident: https://archlinux.org/news/active-aur-malicious-packages-incident/
- chaotic-aur: https://wiki.archlinux.org/title/Unofficial_user_repositories#chaotic-aur

## Boot, initramfs, Secure Boot

- Boot process: https://wiki.archlinux.org/title/Arch_boot_process
- GRUB: https://wiki.archlinux.org/title/GRUB · https://archlinux.org/packages/core/x86_64/grub/
- systemd-boot: https://wiki.archlinux.org/title/Systemd-boot · systemd 262: https://github.com/systemd/systemd/releases/tag/v262
- Limine: https://wiki.archlinux.org/title/Limine
- rEFInd: https://wiki.archlinux.org/title/REFInd
- Syslinux: https://wiki.archlinux.org/title/Syslinux
- mkinitcpio: https://wiki.archlinux.org/title/Mkinitcpio · changelog: https://raw.githubusercontent.com/archlinux/mkinitcpio/master/CHANGELOG
- UKI: https://wiki.archlinux.org/title/Unified_kernel_image
- Secure Boot: https://wiki.archlinux.org/title/Secure_Boot · sbctl: https://github.com/Foxboron/sbctl
- TPM2/LUKS: https://wiki.archlinux.org/title/Systemd-cryptenroll · https://wiki.archlinux.org/title/Trusted_Platform_Module
- linux-firmware split: https://archlinux.org/news/linux-firmware-2025061312fe085f-5-upgrade-requires-manual-intervention/
- mkinitcpio 42 TPM: https://archlinux.org/news/mkinitcpio-42-requires-manual-intervention-for-tpm2-based-unlocking-of-luks-devices/
- Snapper/Btrfs: https://wiki.archlinux.org/title/Snapper · https://wiki.archlinux.org/title/Btrfs
- Hibernation/Zram: https://wiki.archlinux.org/title/Hibernation · https://wiki.archlinux.org/title/Zram
- Ventoy persistence: https://www.ventoy.net/en/plugin_persistence.html
- Removable media: https://wiki.archlinux.org/title/Install_Arch_Linux_on_a_removable_media

## Installers and distro layer

- archinstall: https://github.com/archlinux/archinstall · releases: https://github.com/archlinux/archinstall/releases · docs (outdated): https://archinstall.archlinux.page/
- Calamares: https://codeberg.org/Calamares/calamares · releases: https://codeberg.org/Calamares/calamares/releases · deploy guide: https://calamares.codeberg.page/docs/deploy-guide/ · OEM: https://calamares.codeberg.page/docs/deploy-oem/
- os-release: https://man.archlinux.org/man/os-release.5
- systemd-firstboot: https://wiki.archlinux.org/title/Systemd-firstboot · OOBE: https://wiki.archlinux.org/title/Out-of-the-Box_Experience
- Plymouth: https://wiki.archlinux.org/title/Plymouth
- fastfetch: https://github.com/fastfetch-cli/fastfetch

## Reference distributions

- EndeavourOS: https://github.com/endeavouros-team/EndeavourOS-ISO · Calamares fork: https://github.com/endeavouros-team/calamares
- CachyOS: https://github.com/CachyOS/CachyOS-Live-ISO · https://github.com/CachyOS/cachyos-calamares · kernels: https://github.com/CachyOS/linux-cachyos · CLI installer: https://github.com/CachyOS/New-Cli-Installer
- Garuda: https://gitlab.com/garuda-linux/tools/garuda-tools · profiles: https://gitlab.com/garuda-linux/tools/iso-profiles
- Manjaro: https://wiki.manjaro.org/index.php?title=Build_Manjaro_ISOs_with_buildiso
- Artix: https://gitea.artixlinux.org/artix/artools · https://gitea.artixlinux.org/artix/iso-profiles
- Archcraft: https://github.com/archcraft-os/archcraft
- archboot: https://archboot.com/ · https://github.com/tpowa/Archboot
- ALMA (archived): https://github.com/r-darwish/alma · maintained fork: https://github.com/jamesmcm/alma-nv

## CI, testing and release

- archlinux-docker: https://github.com/archlinux/archlinux-docker · https://hub.docker.com/_/archlinux
- arch-boxes (QCOW2): https://github.com/archlinux/arch-boxes
- releng CI: https://github.com/archlinux/releng
- run_archiso: https://raw.githubusercontent.com/archlinux/archiso/master/scripts/run_archiso.sh
- QEMU: https://wiki.archlinux.org/title/QEMU · Libvirt: https://wiki.archlinux.org/title/Libvirt
- Packer qemu: https://developer.hashicorp.com/packer/integrations/hashicorp/qemu
- openQA (no Arch distro): https://fedoraproject.org/wiki/OpenQA · https://github.com/os-autoinst/openQA
- GitHub Actions limits: https://docs.github.com/en/actions/reference/limits · releases: https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases
- Mirrors: https://wiki.archlinux.org/title/Mirrors · status: https://archlinux.org/mirrors/status/
- Arch release signatures: https://archlinux.org/download/ · Signstar: https://github.com/archlinux/signstar

## Sources that were down during research (nothing was invented)

- `gitlab.archlinux.org` (Anubis), `chaotic.cx`/`docs.chaotic.cx` (JS), `reproducible.archlinux.org` API (JS), `gitlab.manjaro.org` (timeout), `ArchWiki:Calamares` page (404), `archlinux.org/news/pacman-7-0-0-released/` (404), `github.com/archlinux/setup-arch` (404), `cirrus-ci.org/guide/linux` (error).
