# X Linux WSL (equislinux/wsl + equislinux/wsl-scripts)

## Canonical flow (dedicated repos, branch `main`)

```
Arch host:  sudo ./build-rootfs.sh          -> out/x-wsl-rootfs.tar.gz (+ .sha256)
Windows:    .\install.ps1 -Rootfs ...\out\x-wsl-rootfs.tar.gz
            (Store WSL >= 0.67.6, Win11/Server 2022, `wsl --import x ... --version 2`)
First boot: root session -> git clone wsl-scripts -> ./install.sh   (system stage)
Relaunch:   wsl --terminate x && wsl -d x -> ./install.sh           (user stage)
```

## `wsl/` (rootfs builder + importer)

- `build-rootfs.sh`: root on Arch host; requires `pacstrap`, `arch-chroot`, `tar`, `gzip`, `sha256sum`, `sed`. Pacstraps `base bash sudo pacman-contrib git zsh tzdata` — **no kernel/firmware/NetworkManager/openssh** (WSL kernel; networking via Windows).
- `templates/wsl.conf` → `/etc/wsl.conf`: `[boot] systemd=true`, `[user] default=root`, interop on + appendWindowsPath, host-generated hosts/resolv, Windows timezone.
- Packs with `tar --numeric-owner --no-acls --no-xattrs --no-selinux --one-file-system` + `gzip -9n` (sha256 written). This is the importable format (WSL 2 now accepts tar streams directly).
- Env: `X_WSL_NAME=x`, `X_WSL_USER=root`, `X_WSL_LOCALE=en_US.UTF-8`, `X_WSL_OUT_DIR=./out`, `X_DRY=1`, `X_KEYRING_POPULATE=1`.
- `install.ps1`: params `-Rootfs` (mandatory), `-Name` (default `x`), `-InstallDir`, `-NoDefault`, `-CreateWslConfig`; rejects inbox WSL, refuses duplicate names, never overwrites host `.wslconfig`; **never run on Windows yet** (explicitly acknowledged).
- Templates `.wslconfig`: `guiApplications=false`, `autoMemoryReclaim=dropCache`, `sparseVhd=true` commented/copies.

## `wsl-scripts/` (two-stage in-distro provisioning)

- `setup.sh` dispatch: root without `SUDO_USER` → `stage-root.sh`; root via sudo → `stage-user.sh`; system options (`--locale/--keymap/--timezone/--user/--shell/--sudo/--no-install`) force the root stage.
- `stage-root.sh`: tools (`sudo git curl wget zsh` best-effort), locale (`locale.gen`/`locale.conf` + `locale-gen`), keymap (`vconsole.conf`), timezone (`windows-time` = no-op), creates user (`useradd -m -G wheel`), sudoers drop-in `/etc/sudoers.d/x-wsl-wheel` (NOPASSWD by default), pins `[user] default` in `/etc/wsl.conf` (idempotent awk helpers in `lib/common.sh`).
- `stage-user.sh`: marker-delimited rc block (`~/.zprofile`+`~/.zshrc` or `~/.profile`+`~/.bashrc`) with EDITOR/XDG/PATH/prompt/aliases; creates `~/.local/bin`, `~/Projects`, `~/.config/x`; idempotent re-runs.
- `lib/ui.sh`: gum when available, plain fallback, `X_AUTO=1`/non-tty picks defaults.
- `legacy/`: old XScriptor bootstrap, dead raw URLs to `equislinux/x/main/wsl/install.sh`; keep out of the active flow.
- Tests: `test/smoke.sh` (syntax, wsl.conf helpers, dry-runs, real user-stage into temp HOME).

## Known issues and gaps

1. `install.ps1` has not been run on real Windows; CI stays local by decision (no Actions in either repo).
2. `lib/common.sh` `x_require_root` forwards only `X_DRY`/`X_AUTO`/`X_INSTALL` across sudo; env-provided `X_LOCALE/X_KEYMAP/X_TIMEZONE/X_USER/X_SHELL/X_SUDO` are lost on elevation (options still work).
3. Rootfs release `v0.1.0` is published on GitHub and mirrored to SourceForge as `x-wsl-rootfs.tar.gz` (+ `.sha256`); rebuilds must be regenerated with the current keyring/mirrorlist.
4. `wsl-scripts` does not provision `x-scripts`/`x` CLI, generations or `x home`; WSL integration of those is parked by decision.
5. The legacy WSL builders that lived in `x/` were removed (session 23); do not reintroduce them.
6. The rootfs has no `linux`/firmware by design (WSL kernel); `x` generations/hook paths are no-ops there (backend detection returns `off`).

## Generic WSL best practices (for X and any Arch rootfs)

- Import format: tar (optionally compressed) with numeric owners, no xattrs/ACLs; `wsl --import <name> <dir> <file> --version 2`; WSL 2 accepts `.tar`/`.tar.gz` streams in 2026 Store builds.
- `/etc/wsl.conf` is the only place to set default user for imported distros (no launcher): `[boot] systemd=true`, `[user] default=...`, `[interop]`, `[network] generateResolvConf`.
- Machine-id: regenerate on first boot (`systemd-firstboot` or delete `/etc/machine-id` in the image).
- Don't ship pacman keys/cache; run `pacman-key --init/--populate` at build; strip `/var/cache/pacman/pkg`.
- Version pinning: systemd requires Win11/Server 2022+; document minimum WSL Store version.
- Cross-check against the official Arch WSL image (`wsl --install archlinux`, distributed from `fastly.mirror.pkgbuild.com/wsl/`) for conventions.
