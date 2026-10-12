# Portals: replacing `xdg-desktop-portal-hyprland`

`xdg-desktop-portal-hyprland` is the Hyprland backend for the
`xdg-desktop-portal` stack. It provides screen sharing/screencasting and some
desktop integration by talking to Hyprland. Under niri it must be removed and
replaced by the GNOME and GTK backends, selected through a `niri-portals.conf`.

Baseline: **niri 26.04** (2026-04-25).

## What to install and what to remove

| Action | Package |
| --- | --- |
| Remove | `xdg-desktop-portal-hyprland` |
| Install | `xdg-desktop-portal-gnome` - required for screencasting |
| Install | `xdg-desktop-portal-gtk` - the fallback portal for most basic functionality |
| Install | `oo7-portal` or `gnome-keyring` - implements the Secret portal |
| Install | `xdg-desktop-portal` itself (usually a dependency) |

Distro command (Arch example; use your package manager):

```sh
sudo pacman -Rns xdg-desktop-portal-hyprland
sudo pacman -S --needed xdg-desktop-portal-gnome xdg-desktop-portal-gtk oo7-portal
```

Portals **require** niri to run as a session: through `niri-session` (systemd or
dinit) or a display manager. A bare `niri` process started from a TTY does not
provide the D-Bus/graphical-session plumbing portals need.

## `niri-portals.conf`

The niri source ships `resources/niri-portals.conf`. Its contents in 26.04:

```ini
[preferred]
default=gnome;gtk;
org.freedesktop.impl.portal.Access=gtk;
org.freedesktop.impl.portal.Notification=gtk;
org.freedesktop.impl.portal.Secret=oo7-portal;gnome-keyring;
```

Install it where the portal stack looks for the session's config:

| Installer | Destination |
| --- | --- |
| Distro package (recommended) | `/usr/share/xdg-desktop-portal/` |
| Manual install (niri docs) | `/usr/local/share/xdg-desktop-portal/` |
| Per-user override | `~/.config/xdg-desktop-portal/niri-portals.conf` |

The filename must be `<desktop>-portals.conf`, where `<desktop>` matches
`$XDG_CURRENT_DESKTOP` for the session. niri's session sets it to `niri`, hence
`niri-portals.conf`.

If you do not install `nautilus`, the GNOME backend (>= 47.0) cannot offer a file
chooser. Either install `nautilus`, or force the GTK chooser by adding:

```ini
org.freedesktop.impl.portal.FileChooser=gtk;
```

## Screencasting

Screencasting uses the portal plus PipeWire:

1. A working D-Bus user session (niri-session / display manager).
2. PipeWire running.
3. `xdg-desktop-portal-gnome` installed (it implements the screen-share portal by
   talking to niri).
4. `niri-portals.conf` installed as above.

This combination is what OBS, Firefox, Chromium, Electron, and Telegram use. It
lets you share whole monitors and individual windows. niri also supports the
`ext-image-copy-capture` and `wlr-screencopy` protocols directly, which is what
`wf-recorder`, `wl-mirror`, `wayvnc`, and `xdg-desktop-portal-wlr` use; those need
no GNOME portal.

Verify a screencast from the compositor side:

```sh
niri msg --json casts | jq '.'      # should list the active cast while sharing
```

And check the portal units:

```sh
systemctl --user status xdg-desktop-portal
systemctl --user status xdg-desktop-portal-gnome
journalctl --user -u xdg-desktop-portal -u xdg-desktop-portal-gnome -b --no-pager
```

If no portal is selected at all, check that `$XDG_CURRENT_DESKTOP` contains
`niri` inside the session. Starting niri manually without `niri-session` commonly
leaves it unset and breaks portal selection.

## The `GDK_BACKEND` warning

The niri documentation is explicit: **do not set `GDK_BACKEND` globally**, because
it breaks the screencast portal (GTK apps then stop negotiating the surface the
portal needs). This is a common migration mistake when copying Wayland environment
tweaks from other setups.

- Do not put `export GDK_BACKEND=wayland` in `~/.profile`, `~/.bash_profile`,
  `~/.config/environment.d/`, or the niri `environment {}` block.
- Per-application overrides are fine when a specific app misbehaves, for example
  launching one app with `env GDK_BACKEND=x11 app`. Keep it scoped.

Other environment notes: do not force `QT_QPA_PLATFORM` globally either unless you
know an app is broken; niri's `environment {}` block only affects processes niri
spawns, and variables needed by systemd-launched apps must be in the login shell
config (which `niri-session` imports into systemd).

## Secret portal (`oo7` / `gnome-keyring`)

The Secret portal is what apps use for `libsecret` (keyring) storage: browser
passwords, network credentials, Git credentials, and similar. niri's
`niri-portals.conf` selects it with:

```ini
org.freedesktop.impl.portal.Secret=oo7-portal;gnome-keyring;
```

`oo7-portal` is the lightweight implementation used by the GNOME ecosystem and is
the first choice; `gnome-keyring` is the alternative. Install exactly one backend
plus its D-Bus service package, then verify:

```sh
busctl --user list | rg -i 'secret|keyring|oo7'
```

If a previously working Hyprland setup stored secrets via an
`xdg-desktop-portal-hyprland` path, the actual secret storage lives with the
Secret backend, not the compositor portal; after switching backends the same
keyring should still serve the secrets. Re-login after installing so the
`org.freedesktop.impl.portal.Secret` selection is re-read.

## GNOME-side settings leak

Because the default configuration prefers `xdg-desktop-portal-gnome`, Flatpak and
GTK apps read GNOME's UI settings. To enable dark mode:

```sh
dconf write /org/gnome/desktop/interface/color-scheme '"prefer-dark"'
```

If you would rather not inherit GNOME defaults, change the `[preferred] default`
line in `niri-portals.conf` to prefer `gtk` (for example
`default=gtk;gnome;`), accepting that screencasting still needs the GNOME
backend for the screen-share interface.

## Interfaces lost from the Hyprland portal

`xdg-desktop-portal-hyprland` bundled several Hyprland-specific behaviors. Under
niri:

- **Screen share / screencast** comes from `xdg-desktop-portal-gnome`; fine.
- **Screencopy** for tools like `wf-recorder` comes from niri's protocol support,
  not a portal; no portal needed.
- **Hyprland-specific interfaces** (idle inhibit details, global shortcuts
  specifics, `hyprland` implementation name) do not exist. Rely on the GTK/GNOME
  portal interfaces and niri's own features. If an app required a Hyprland-only
  portal interface, treat it as a gap.

## Verification checklist

- [ ] `xdg-desktop-portal-hyprland` is uninstalled.
- [ ] `xdg-desktop-portal-gnome` and `xdg-desktop-portal-gtk` are installed.
- [ ] A Secret backend (`oo7-portal` or `gnome-keyring`) is installed.
- [ ] `niri-portals.conf` is in `/usr/share/xdg-desktop-portal/`,
      `/usr/local/share/xdg-desktop-portal/`, or
      `~/.config/xdg-desktop-portal/`.
- [ ] `$XDG_CURRENT_DESKTOP` contains `niri` inside the session.
- [ ] `GDK_BACKEND` is not set globally.
- [ ] `systemctl --user status xdg-desktop-portal` is active after login.
- [ ] A screencast (OBS/Firefox) lists monitors and windows, and
      `niri msg --json casts` shows the stream.
- [ ] A Flatpak file-open dialog appears (nautilus or the GTK chooser).

## Version gating

- `niri-portals.conf` content above is from niri 26.04 (`resources/niri-portals.conf`).
- File-chooser behavior depends on `xdg-desktop-portal-gnome` >= 47.0, which
  defaults to `nautilus`.
- Screencasting, wlr-screencopy and ext-image-copy-capture are supported in
  26.04; `ext-image-copy-capture` is used by newer recorders and mirrors.
