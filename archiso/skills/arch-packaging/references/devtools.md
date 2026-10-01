# devtools / pkgctl / makepkg (2026)

## devtools 1.5.1 programs

`arch-nspawn`, `archbuild`, `archrelease`, `checkpkg`, `commitpkg`, `diffpkg`, `export-pkgbuild-keys`, `find-libdeps`, `find-libprovides`, `finddeps`, `lddd`, `makechrootpkg`, `makerepropkg`, `mkarchroot`, `pkgctl`, `sogrep`, plus convenience symlinks: `extra-x86_64-build`, `core-testing-x86_64-build`, `multilib-build`, `gnome-unstable-x86_64-build`, `kde-unstable-x86_64-build`, and **`*_v3` variants** (x86-64-v3).

Config locations:
- `/usr/share/devtools/pacman.conf.d/{extra,extra-testing,extra-staging,core-testing,core-staging,multilib*,extra-x86_64_v3,...}.conf`
- `/usr/share/devtools/makepkg.conf.d/{x86_64,x86_64_v3}.conf` + `.conf.d/`
- Git hook templates installed by `pkgctl repo configure` (pre-commit, commit-msg, pre-push).

## pkgctl (1.5.1)

Subcommands: `aur`, `auth`, `build`, `db`, `diff`, `issue`, `license`, `release`, `repo`, `search`, `version`.

`pkgctl build` flags: `--arch`, `--repo`, `-s/--staging`, `-t/--testing`, `-o/--offload`, `--offload-host` (default `build.archlinux.org`), `-c/--clean`, `--inspect never|always|failure`, `-w/--worker`, `--nocheck`, `-I/--install-to-chroot`, `-i/--install-to-host`, `--pkgver=`, `--pkgrel=`, `--rebuild`, `--update-checksums`, `-e/--edit`, `-r/--release`, `-m/--message`, `-u/--db-update`.

`pkgctl license setup|check` (2025-08) enforces REUSE on package sources.

## Classic clean chroot

```sh
mkdir -p ~/chroot && CHROOT=~/chroot
mkarchroot $CHROOT/root base-devel
arch-nspawn $CHROOT/root pacman -Syu                  # refresh keyring/packages
cd pkgdir && makechrootpkg -c -r $CHROOT
makechrootpkg -c -r $CHROOT -I dep-1.0-1-x86_64.pkg.tar.zst -- --check
# custom configs at creation
mkarchroot -C <pacman.conf> -M <makepkg.conf> $CHROOT/root base-devel
# host-side convenience
extra-x86_64-build -c -r /mnt/chroots/arch
```

Options: `mkarchroot -U` (pacman -U), `-C`/`-M` configs, `-c` cache, `-f src[:dst]`, `-s` no setarch; `makechrootpkg -c -u -d/-D -t -T -U user -I pkg -l -n -C -x`; `arch-nspawn` wraps systemd-nspawn (`-C/-M/-c/-f/-s`). Btrfs creates the chroot as a subvolume.

Defaults of `makechrootpkg` makepkg args: `--syncdeps --noconfirm --log --holdver --skipinteg`.

## makepkg 2026

- Packages: `.pkg.tar.zst`; `COMPRESSZST='zstd -c -T0'`; `PKGEXT`/`SRCEXT` overridable (`PKGEXT='.pkg.tar'`, `.lz4` shortcuts).
- Shipped distro defaults: `debug` and `lto` **on**; `BUILDENV=(!distcc !color !ccache check !sign)`.
- `PACKAGER="Name <email>"` (WKD), `GPGKEY`, `BUILDENV sign` for signing; `INTEGRITY_CHECK` includes b2.
- `SOURCE_DATE_EPOCH` for build timestamps; `debuginfod` optional.
- Refuses to run as root. User config `$XDG_CONFIG_HOME/pacman/makepkg.conf` > `~/.makepkg.conf`; system drop-ins `/etc/makepkg.conf.d/*.conf`.
- Autodeps via libmakepkg + `LIB_DIRS`; policy tools `find-libdeps`/`find-libprovides`.
- `libmakepkg-dropins` is a separate package (pacman depends on it).

## Reproducibility

- `makerepropkg` (devtools): rebuild from a package's BUILDINFO and compare bit-for-bit; `-d` diffoscope, `-n` no check, `-c` cache.
- `repro` (package `archlinux-repro`): compares against published packages.
- Arch runs an experimental rebuilderd at `reproducible.archlinux.org`; it skips `check()` in workers.
- Known blockers: signed kernel modules, sorted file order, JAR timestamps, uname/build paths, gzip timestamps, revoked packager keys.

## Sources and versions

- `pkgctl repo clone https://gitlab.archlinux.org/archlinux/packaging/packages/<pkgbase>.git` (or `pkgctl repo clone <pkgbase>`); pin with `pkgctl repo switch <pkgbase> <version>`.
- Inside a packaging repo: `PKGBUILD`, `.SRCINFO`, `keys/pgp/*.asc`, distro files (patches, units); upstream sources are not stored.
- Custom kernel: clone `linux`, rename pkgbase (`linux-midistro`), never `provides=('linux')`; ship matching headers; consult `/usr/share/doc/systemd/README` for kernel CONFIG requirements.
