# Screen locking and idle under niri

niri has no built-in lock screen or idle daemon. Both are external programs that
niri runs. Locking uses the standard `ext-session-lock` protocol; idle uses a
layer of `swayidle` (or `hypridle`) running commands that ultimately talk to niri.

Baseline: **niri 26.04** (2026-04-25).

## Locking

### Quickshell `WlSessionLock` (recommended for equisdots)

The equisdots locker is already a Quickshell `WlSessionLock` app: `scripts/lock.sh`
executes `quickshell -p ~/.config/hypr/scripts/quickshell/Lock.qml`, and
`shell/Lock.qml` uses `import Quickshell.Wayland` and `WlSessionLock`.
`WlSessionLock` implements the `ext-session-lock` Wayland protocol, which niri
supports. This means the existing locker is **already portable**; only the path to
the QML bundle changes from the `hypr` config directory to the niri one.

```
scripts/lock.sh (niri)
  exec quickshell -p ~/.config/niri/scripts/quickshell/Lock.qml
```

Run it directly (from a bind, from `swayidle`, or on `loginctl lock-session`).
A single instance is enough; `ext-session-lock` refuses a second locker while the
session is locked.

Bind it with `allow-when-locked=true` so you can recover from a stuck lock:

```kdl
binds {
    Mod+L { spawn "lock.sh"; allow-when-locked=true; }
}
```

### swaylock

`swaylock` (or `swaylock-effects`) is a plain `ext-session-lock` client and works
on niri. It is a good fallback and is trivial to invoke:

```sh
swaylock -f
```

### hyprlock

`hyprlock` speaks `ext-session-lock` and therefore *can* start on a non-Hyprland
compositor, but it is developed and tested against Hyprland and assumes
Hyprland-oriented behavior and config. It is not the supported path on niri.
Migration guidance: replace `hyprlock` with the Quickshell `WlSessionLock` locker
you already have, or with `swaylock`/`gtklock`/`swaylock-effects`.

### What does not change

- `loginctl lock-session` remains the canonical "lock me" signal; a session
  `ext-session-lock` client responds to it.
- PAM authentication stays in the locker (`Quickshell.Services.Pam` for the
  Quickshell locker, PAM for swaylock). No compositor involvement.

## Idle

### swayidle (recommended)

`swayidle` runs the same way under niri. The Hyprland-specific commands become
niri commands:

| hypridle action (Hyprland) | swayidle command (niri) |
| --- | --- |
| `hyprctl eval 'hl.dispatch(hl.dsp.dpms({action="off"}))'` | `niri msg action power-off-monitors` |
| monitor on | `niri msg action power-on-monitors` (usually automatic on input) |
| lock | `lock.sh` / `swaylock -f` / `loginctl lock-session` |
| suspend | `systemctl suspend` |
| before sleep | lock command |

niri powers monitors back on automatically on input, so an explicit power-on hook
after resume is usually unnecessary; `niri msg action power-on-monitors` exists if
you need it.

### swayidle systemd unit

The niri documentation ships this shape and the equisdots migration checklist
reuses it. Create `~/.config/systemd/user/swayidle.service`:

```systemd
[Unit]
PartOf=graphical-session.target
After=graphical-session.target
Requisite=graphical-session.target

[Service]
ExecStart=/usr/bin/swayidle -w \
  timeout 600 'swaylock -f' \
  timeout 601 'niri msg action power-off-monitors' \
  timeout 1200 'systemctl suspend' \
  before-sleep 'swaylock -f'
Restart=on-failure
```

Then enable it in the session:

```sh
systemctl --user daemon-reload
systemctl --user add-wants niri.service swayidle.service
```

To remove it from niri startup, delete the symlink under
`~/.config/systemd/user/niri.service.wants/` and `daemon-reload`.

For the equisdots Quickshell locker, replace `swaylock -f` with the absolute path
to `lock.sh` in both the timeout and `before-sleep` slots.

### hypridle

`hypridle` runs its own listener and calls Hyprland IPC for DPMS. It has no niri
integration; migrate to `swayidle`. Do not try to keep `hypridle` running against
niri, because its config format and DPMS commands are Hyprland-specific.

## Recreating `idle-mode.sh`

The equisdots `idle-mode.sh` starts/stops the idle daemon and persists the choice
in `idle-settings.json`:

- `stop_idle` / `start_idle` become `pkill -x swayidle` /
  `setsid nohup swayidle -w ...` (or, if you use the systemd unit,
  `systemctl --user stop swayidle.service` / `start`).
- The `boot` branch that runs from autostart is replaced by a
  `spawn-at-startup`/systemd unit that consults the same JSON flag, or by an
  enable/disable of `swayidle.service`.
- The notification strings that mention "hypridle.conf" should mention the
  `swayidle` command line or unit instead.

If you keep the daemon-style approach (no systemd unit), the script stays
essentially identical apart from the binary name and the commands inside the
`-w` argument list. That is the smallest possible port and is fine for equisdots,
which already manages its daemons manually.

## Session integration

Idle and lock only work correctly when niri runs as a session (`niri-session` or
a display manager), because that provides the D-Bus session, `graphical-session.target`,
and the systemd user manager that `PartOf=graphical-session.target` depends on.
A bare `niri` process started from a TTY does not.

## Version gating

- `ext-session-lock` support: niri has it across the 25.x/26.x line; verify the
  locker is a real `ext-session-lock` client, not a wlr-layer-shell imitation.
- `niri msg action power-off-monitors` / `power-on-monitors`: present in 26.04
  (`enum Action`).
- The niri docs' `swayidle` unit example uses `timeout 601 ... power-off-monitors`
  then `timeout 600 ... swaylock`; the exact ordering is cosmetic as long as the
  lock fires at or before the DPMS-off.
