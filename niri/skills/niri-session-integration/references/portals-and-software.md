# Portals and required companion software

niri is not a complete desktop environment. These components make other
applications behave. Baseline: niri 26.04 (2026-04-25).

## Checklist

| Component | Purpose | Example package |
| --- | --- | --- |
| Notification daemon | Most apps need one | `mako` |
| Fallback portal | Basic desktop integration | `xdg-desktop-portal-gtk` |
| Screencast portal | Screen sharing / casting | `xdg-desktop-portal-gnome` |
| Secret portal | Credentials/keyring access | `oo7-portal` or `gnome-keyring` |
| Authentication agent | Apps requesting root privileges | `plasma-polkit-agent` |
| Xwayland | X11 apps (Steam, Discord) | `xwayland-satellite >= 0.7` |
| GPU drivers | Hardware acceleration | `mesa-dri-drivers`, `mesa-libEGL` |

## Notification daemon

Many apps require one. `mako` works well. Start it with
[systemd](systemd-session.md) or `spawn-at-startup`.

## Portals

Portals provide a cross-desktop API for file pickers, UI settings, screencasting,
and more. Flatpak apps in particular require working portals.

Portals **require** running niri as a session, i.e. through `niri-session` or a
display manager. Install:

- `xdg-desktop-portal-gtk` - implements most basic functionality; the default
  fallback portal.
- `xdg-desktop-portal-gnome` - required for screencasting support.
- `oo7-portal` or `gnome-keyring` - implements the Secret portal, required for
  certain apps.

systemd starts them on demand. These providers are configured in
`niri-portals.conf`, which must be installed in the correct location.

### `niri-portals.conf`

The file is shipped as `resources/niri-portals.conf` and installs to:

| Install type | Destination |
| --- | --- |
| Distribution package | `/usr/share/xdg-desktop-portal/` |
| Manual install | `/usr/local/share/xdg-desktop-portal/` |

### File chooser and nautilus

With `xdg-desktop-portal-gnome` version 47.0 and later, the GNOME portal uses
**nautilus** as its file chooser by default. If you use the provided
`resources/niri-portals.conf`, you also need `nautilus` installed for file
chooser dialogs to work properly.

If you do not want nautilus (for example you use `nemo`), set the GTK portal as
the file chooser in `niri-portals.conf`:

```ini
org.freedesktop.impl.portal.FileChooser=gtk;
```

### GNOME UI settings under Flatpak

Because `xdg-desktop-portal-gnome` is in use, Flatpak apps read GNOME UI
settings. To enable the dark style:

```sh
dconf write /org/gnome/desktop/interface/color-scheme '"prefer-dark"'
```

### GDK_BACKEND warning

> Do not set the `GDK_BACKEND` environment variable globally, as this will break
> the screencast portal.

## Authentication agent

Required when apps ask for root permissions. `plasma-polkit-agent` works fine.
Start it with systemd or `spawn-at-startup`.

On Fedora, starting `plasma-polkit-agent` under systemd needs an override so it
waits for the session. Edit the unit:

```sh
systemctl --user edit --full plasma-polkit-agent.service
```

and add:

```systemd
After=graphical-session.target
```

## Xwayland

To run X11 apps such as Steam or Discord, use `xwayland-satellite`. See
`xwayland.md` for integration, verification, and fallbacks.

## Default application associations

To keep GNOME or KDE default app associations when running niri, symlink their
`mimeapps.list` into the user applications directory:

```sh
ln -s /usr/share/applications/gnome-mimeapps.list ~/.local/share/applications/niri-mimeapps.list
```

Point the symlink at the `mimeapps.list` of the desktop environment whose
associations you want to inherit.
