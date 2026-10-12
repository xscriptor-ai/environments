# Packaging and distribution integration

How niri loads configuration, the environment variables it honors, and the
integration points a distribution should wire up. Baseline: niri 26.04
(2026-04-25).

## Configuration load locations

niri loads configuration in this order (highest precedence first):

1. `--config` / `-c <path>` passed to the `niri` binary.
2. `$NIRI_CONFIG`.
3. `$XDG_CONFIG_HOME/niri/config.kdl` (usually `~/.config/niri/config.kdl`).
4. `/etc/niri/config.kdl`.

If neither (3) nor (4) exists, niri writes the embedded default config to
`$XDG_CONFIG_HOME/niri/config.kdl`. The default config content is embedded into
the binary at build time from
`resources/default-config.kdl`.

### Distribution defaults via `/etc/niri/config.kdl`

A distribution can ship defaults at `/etc/niri/config.kdl`. Important
consequences:

- When that file is present, niri does **not** automatically create a config at
  `~/.config/niri/`, so packages must tell users how to create their own.
- The default config is updated in new releases. A custom `/etc/niri/config.kdl`
  should be re-inspected and updated on each release to track relevant changes.

### Runtime config path change (Since: 26.04)

The config path can be changed at runtime via IPC:

```sh
niri msg action load-config-file --path <path-to-config.kdl>
```

### Splitting the config (Since: 25.11)

Use `include "other.kdl"` to split the config across multiple files.

## `NIRI_` environment variables

| Variable | Effect |
| --- | --- |
| `NIRI_CONFIG` | Override the config file location (see precedence above). |
| `NIRI_SOCKET` | Path to the IPC socket, exported for clients and scripts. |
| `NIRI_BUILD_COMMIT` | Set the commit hash when packaging, so `niri --version` shows it instead of "unknown commit". |
| `NIRI_BUILD_VERSION_STRING` | Override the whole version string; keep the niri version intact, e.g. `25.01-1 (e35c630)`. |

`NIRI_BUILD_COMMIT` / `NIRI_BUILD_VERSION_STRING` must be set for both
`cargo build` and `cargo install`, since the latter rebuilds niri if the
environment changes.

## Recommended package layout

The recommended packaging is a standalone desktop session. Place files as:

| File | Destination |
| --- | --- |
| `target/release/niri` | `/usr/bin/` |
| `resources/niri-session` | `/usr/bin/` |
| `resources/niri.desktop` | `/usr/share/wayland-sessions/` |
| `resources/niri-portals.conf` | `/usr/share/xdg-desktop-portal/` |
| `resources/niri.service` (systemd) | `/usr/lib/systemd/user/` |
| `resources/niri-shutdown.target` (systemd) | `/usr/lib/systemd/user/` |
| `resources/dinit/niri` (dinit) | `/usr/lib/dinit.d/user/` |
| `resources/dinit/niri.target` (dinit) | `/usr/lib/dinit.d/user/` |

This makes niri appear in GDM and other display managers.

### Recommended dependencies

niri dynamically loads `libwayland-server`, so packages must depend on it
explicitly. Strongly recommended optional dependencies:

- `xwayland-satellite` - X11 apps (Steam, Discord).
- `xdg-desktop-portal-gnome` - screencasting.
- `xdg-desktop-portal-gtk` - fallback portal in `niri-portals.conf`.
- `oo7-portal` or `gnome-keyring` - Secret portal in `niri-portals.conf`.
- GPU driver packages (`mesa-dri-drivers`, `mesa-libEGL`).
- A notification daemon such as `mako`.

Consider auto-installing the applications referenced in the default config
(search the config for `spawn`), for example `alacritty` and `fuzzel`.

### Build notes

- Do **not** build with `--all-features`; some features are development-only
  (for example a profiling buffer that grows until OOM).
- The `niri-visual-tests` sub-crate is development-only and should not be
  packaged.
- Check `Cargo.toml` for build features; systemd can be replaced with dinit via
  `cargo build --release --no-default-features --features dinit,dbus,xdp-gnome-screencast`.
- Use `niri panic` to verify the package produces good panic backtraces without
  debuginfo.
- `niri completions <SHELL>` generates shell completions.

## Keyboard layout

<sup>Since: 25.08</sup>

Unless configured manually under `input { keyboard { xkb { ... } } }`, niri
reads keyboard layout settings from **systemd-localed** at
`org.freedesktop.locale1` over D-Bus. Installers should set the layout via
systemd-localed and niri will pick it up.

## Autostart

niri works with the normal systemd autostart. The default `niri.service` brings
up `graphical-session.target` and `xdg-desktop-autostart.target`. To run a
program at niri startup without editing the niri config:

- link its `.desktop` file into `~/.config/autostart/`, or
- use a `.service` file with `WantedBy=graphical-session.target`.

Alternatively add `spawn-at-startup "program"` lines to the niri config. See
`systemd-session.md` for worked examples.

## Screen readers

<sup>Since: 25.08</sup>

niri works with the Orca screen reader when running as a full desktop session
(`niri-session` or a display manager). See `accessibility-and-security.md` for
details and distribution advice.

## Desktop shells and components

Minimally, ship or recommend a notification daemon, portals, and an
authentication agent (see `portals-and-software.md`). On top of that:

- The default config spawns Waybar; consider trimming it and adding the
  `niri/workspaces` module.
- Add a wallpaper tool (`swaybg`, or `awww` which used to be `swww`) and a
  nicer locker than the default `swaylock` (for example `hyprlock`).
- Complete Quickshell-based shells support niri: **DankMaterialShell** and
  **Noctalia**.
- Desktop environments with niri support: LXQt (official), many XFCE
  components, and a COSMIC session via `cosmic-ext-extra-sessions`.

## Security model pointer

For what niri does and does not isolate, see `accessibility-and-security.md`.
