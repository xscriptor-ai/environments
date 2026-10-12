# Getting started with niri

Install paths, the ways to start niri, the default hotkeys, and the first-run
notes for unusual hardware. Baseline: niri 26.04 (2026-04-25).

## Quick install per distribution

The fastest "fairly out-of-the-box" route pairs niri with a Quickshell shell
(**DankMaterialShell** / `dms`). The same package set is what you want even
without the shell.

Fedora:

```sh
sudo dnf copr enable avengemedia/dms
sudo dnf install niri dms
systemctl --user add-wants niri.service dms
```

Arch Linux:

```sh
sudo pacman -Syu niri xwayland-satellite xdg-desktop-portal-gnome xdg-desktop-portal-gtk \
    alacritty dms-shell-niri matugen cava qt6-multimedia-ffmpeg
systemctl --user add-wants niri.service dms
```

Ubuntu 25.10 and above:

```sh
sudo add-apt-repository ppa:avengemedia/danklinux
sudo add-apt-repository ppa:avengemedia/dms
sudo apt install niri dms
```

After installing, log out, choose **Niri** in the display manager, and log back
in. Without a display manager, run `niri-session` on a TTY.

`dms` launches its own bar; the default niri config also spawns Waybar, so you
may see two bars. Remove the duplicate:

```sh
pkill waybar
```

then delete the `spawn-at-startup "waybar"` line from
`~/.config/niri/config.kdl`.

Other packages: Fedora COPR `yalter/niri` and nightly `yalter/niri-git`;
a NixOS flake (community-maintained fork of `sodiboo/niri-flake`); a pacstall
package for Debian-based distros. Packaging status is tracked on Repology.

## Starting niri

1. Install a distribution package (preferred), or build from source.
2. Start it from a display manager such as GDM, or run `niri-session` on a TTY.
3. First default bindings to know: `Mod+T` runs `alacritty`, `Mod+D` runs
   `fuzzel`, `Mod+Shift+E` exits niri. On a TTY the Mod key is **Super**; in a
   windowed session it is **Alt**.

`niri-session` vs `niri --session`:

| Command | Env import + D-Bus services | systemd/dinit service | `graphical-session.target` |
| --- | --- | --- | --- |
| `niri-session` | yes | yes | yes |
| `niri --session` | yes | no | no |
| `niri` | no | no | no |

Portals require a session, so use `niri-session` (or a display manager). Running
niri directly on a TTY leaves you with an unlocked shell prompt if niri exits or
crashes; a display manager avoids that.

Running `niri` inside an existing desktop session opens it as a window for
trying it out. Windowed mode is mainly for development and is buggy (notably
hotkeys).

## Manual installation destinations

When installing without a package, place files as follows. The system-wide
packaging table lives in `references/packaging-and-integration.md`; this is the
"direct install into `/usr/local`" variant.

| File | Destination |
| --- | --- |
| `target/release/niri` | `/usr/local/bin/` |
| `resources/niri-session` | `/usr/local/bin/` |
| `resources/niri.desktop` | `/usr/local/share/wayland-sessions/` |
| `resources/niri-portals.conf` | `/usr/local/share/xdg-desktop-portal/` |
| `resources/niri.service` (systemd) | `/etc/systemd/user/` |
| `resources/niri-shutdown.target` (systemd) | `/etc/systemd/user/` |
| `resources/dinit/niri` (dinit) | `/etc/dinit.d/user/` |
| `resources/dinit/niri.target` (dinit) | `/etc/dinit.d/user/` |

Make sure the path to `niri` inside `niri.service` is correct; it defaults to
`/usr/bin/niri`.

## Default hotkeys

Mod is Super on a TTY and Alt in a window. General rule: if a hotkey switches
somewhere, adding `Ctrl` moves the focused window or column there.

| Hotkey | Description |
| --- | --- |
| `Mod+Shift+/` | Show the list of important hotkeys |
| `Mod+T` | Spawn `alacritty` (terminal) |
| `Mod+D` | Spawn `fuzzel` (launcher) |
| `Super+Alt+L` | Spawn `swaylock` (locker) |
| `Mod+Q` | Close the focused window |
| `Mod+H` / `Mod+Left` | Focus the column left |
| `Mod+L` / `Mod+Right` | Focus the column right |
| `Mod+J` / `Mod+Down` | Focus the window below in a column |
| `Mod+K` / `Mod+Up` | Focus the window above in a column |
| `Mod+Ctrl+H` / `Mod+Ctrl+Left` | Move the focused column left |
| `Mod+Ctrl+L` / `Mod+Ctrl+Right` | Move the focused column right |
| `Mod+Ctrl+J` / `Mod+Ctrl+Down` | Move the focused window down in a column |
| `Mod+Ctrl+K` / `Mod+Ctrl+Up` | Move the focused window up in a column |
| `Mod+Shift+H/J/K/L` (or arrows) | Focus the monitor to the side |
| `Mod+Ctrl+Shift+H/J/K/L` (or arrows) | Move the focused column to the monitor to the side |
| `Mod+U` / `Mod+PageDown` | Switch to the workspace below |
| `Mod+I` / `Mod+PageUp` | Switch to the workspace above |
| `Mod+Ctrl+U` / `Mod+Ctrl+PageDown` | Move the focused column to the workspace below |
| `Mod+Ctrl+I` / `Mod+Ctrl+PageUp` | Move the focused column to the workspace above |
| `Mod+Shift+U` / `Mod+Shift+PageDown` | Move the focused workspace down |
| `Mod+Shift+I` / `Mod+Shift+PageUp` | Move the focused workspace up |
| `Mod+[` | Consume or expel the focused window to the left |
| `Mod+]` | Consume or expel the focused window to the right |
| `Mod+R` / `Mod+Shift+R` | Toggle preset column widths forward and back |
| `Mod+M` | Maximize window |
| `Mod+C` | Center column within view |
| `Mod+-` / `Mod+=` | Decrease / increase column width by 10% |
| `Mod+Shift+-` / `Mod+Shift+=` | Decrease / increase window height by 10% |
| `Mod+Ctrl+R` | Reset window height back to automatic |
| `Mod+Shift+F` | Toggle fullscreen on the focused window |
| `Mod+V` | Move the focused window between floating and tiling |
| `Mod+Shift+V` | Switch focus between floating and tiling |
| `PrtSc` | Area screenshot; move with mouse, Space to save, Escape to cancel |
| `Alt+PrtSc` | Screenshot focused window to clipboard and `~/Pictures/Screenshots/` |
| `Ctrl+PrtSc` | Screenshot focused monitor to clipboard and `~/Pictures/Screenshots/` |
| `Mod+Shift+E` / `Ctrl+Alt+Delete` | Exit niri |

## First-run and unusual-hardware notes

- **Black screen (NVIDIA):** update drivers to a GBM-capable version and enable
  kernel modesetting, usually `nvidia-drm.modeset=1`. See `nvidia.md`.
- **Black screen on TTY (Asahi, ARM, kmsro devices):** niri may pick the wrong
  primary render device. List devices with `ls -l /dev/dri/`, then pin it:

  ```kdl
  debug {
      render-drm-device "/dev/dri/renderD128"
  }
  ```

  If it still fails, try each `card` device in turn.
- **Nix/NixOS:** keep the system mesa version in sync with the mesa niri was
  built against; a mismatch usually shows as a black screen on TTY start. On
  Intel graphics, apply the workaround from the NixOS Intel Graphics wiki.
- **Virtual machines:** enable 3D acceleration.
- **Double bars:** if you use a Quickshell shell that ships a bar, remove the
  default `spawn-at-startup "waybar"` line.

## Default application associations

If niri is installed alongside GNOME or KDE and you want to keep their default
app associations (image viewer, video player), symlink their `mimeapps.list`:

```sh
ln -s /usr/share/applications/gnome-mimeapps.list ~/.local/share/applications/niri-mimeapps.list
```

Replace the source path with the `mimeapps.list` shipped by whichever desktop
environment you want to inherit associations from.

## Desktop shells that support niri

niri is not a desktop environment; you supply the shell. Besides a bare
Waybar setup, complete Quickshell-based shells work with niri and give a more
cohesive experience in one package:

- **DankMaterialShell** (`dms`, `dms-shell-niri`) - the quickstart above.
- **Noctalia** (`noctalia-shell`).

Other desktop environments with partial or official niri support: LXQt (official
support), many XFCE components, and a COSMIC session via `cosmic-ext-extra-sessions`.
