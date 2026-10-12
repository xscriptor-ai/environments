# Running niri as a systemd user session

How niri behaves as a systemd user service, how to attach companion daemons, and
how to keep programs alive across logout. Baseline: niri 26.04 (2026-04-25).

## How niri becomes a service

When you start niri from a display manager, or through the `niri-session`
binary, it runs as a **systemd user service** (`niri.service`). This is what
provides the systemd integration that lets programs such as `mako` and services
such as `xdg-desktop-portal` bind to the graphical session.

The default `niri.service`:

- is the graphical session unit for niri;
- pulls in `graphical-session.target`;
- pulls in `xdg-desktop-autostart.target` (so `~/.config/autostart/*.desktop`
  entries run).

Check it:

```sh
systemctl --user status niri.service
systemctl --user list-dependencies niri.service
```

## Attaching services to the session

`mako` and `waybar` ship systemd user units, so attach them directly:

```sh
systemctl --user add-wants niri.service mako.service
systemctl --user add-wants niri.service waybar.service
```

`add-wants` creates symlinks under
`~/.config/systemd/user/niri.service.wants/`. Anything linked there starts
together with `niri.service` and stops when it exits. Compared with
`spawn-at-startup`, this lets you monitor status/output and restart or reload
each daemon individually.

To remove a service from niri startup, delete its symlink from
`~/.config/systemd/user/niri.service.wants/`, then run:

```sh
systemctl --user daemon-reload
```

## Writing your own units

`swaybg` and `swayidle` do not ship units (they need command-line arguments),
so write your own under `~/.config/systemd/user/`. The essential pattern is the
`graphical-session.target` dependency:

```systemd
[Unit]
PartOf=graphical-session.target
After=graphical-session.target
Requisite=graphical-session.target

[Service]
ExecStart=/usr/bin/swaybg -m fill -i "%h/Pictures/LakeSide.png"
Restart=on-failure
```

`PartOf=` ties the unit's start/stop to the target, `After=` orders it after the
target comes up, and `Requisite=` ensures it only starts when the target is
active. `%h` expands to your home directory.

`~/.config/systemd/user/swayidle.service` uses the same `[Unit]` block:

```systemd
[Service]
ExecStart=/usr/bin/swayidle -w timeout 601 'niri msg action power-off-monitors' timeout 600 'swaylock -f' before-sleep 'swaylock -f'
Restart=on-failure
```

After editing a unit file, always reload:

```sh
systemctl --user daemon-reload
systemctl --user add-wants niri.service swaybg.service
systemctl --user add-wants niri.service swayidle.service
```

Restart an individual service without touching the session:

```sh
systemctl --user restart waybar.service
```

## Autostart without touching the config

niri works with the normal systemd autostart. To make a program run at niri
startup without editing `config.kdl`, either:

- symlink its `.desktop` file into `~/.config/autostart/`, or
- use a `.service` file with `WantedBy=graphical-session.target`.

The equivalent niri-native option is `spawn-at-startup "program"` in the config.

## Keeping programs alive across logout

Exiting a niri session (logging out) kills every program started inside it. To
keep a program such as `tmux` or `dtach` running across logout, start it in a
transient systemd scope:

```sh
systemd-run --user --scope tmux new-session
```

The scope is not part of `niri.service`, so it survives the session ending.
