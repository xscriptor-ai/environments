---
name: niri-session-integration
description: Use when starting niri as a full desktop session or integrating it with the surrounding system: niri-session, niri --session, display manager, systemd user services, graphical-session.target, xdg-desktop-autostart, add-wants, portals, niri-portals.conf, xdg-desktop-portal-gnome, xdg-desktop-portal-gtk, oo7-portal, gnome-keyring, xwayland-satellite, X11 apps, nvidia, niri.service, packaging, desktop entry, mimeapps, install paths.
---

# Skill: niri-session-integration

Orientation for running niri as a *session* rather than a bare compositor: how to
launch it, why `niri-session` exists, and which companion daemons (portals,
notifications, Xwayland, polkit) and GPU integration niri expects. Use this skill
when the question is about session startup, systemd units, portals, X11 apps,
NVIDIA, or installing/packaging niri, not about the config file itself.

Baseline: **niri 26.04** (2026-04-25). niri uses date versioning (`25.01`,
`25.05`, `26.04`), not semantic versioning.

## Starting niri: the two supported ways

| Path | Command | What you get |
| --- | --- | --- |
| Display manager (GDM, SDDM, ly, ...) | pick "Niri" in the session list | Runs `niri-session` under systemd/dinit; safe exit back to a greeter |
| TTY | `niri-session` | Same as above; the recommended manual path |
| TTY without systemd/dinit | `niri --session` | Imports env vars into the system manager and D-Bus and starts D-Bus services, but does *not* start a systemd/dinit service or `graphical-session.target` |
| Inside another session | `niri` | Windowed mode for development; buggy, Mod is `Alt` |

> Running niri directly from a TTY means that exiting or crashing niri will put
> the user straight into an unlocked shell prompt. Use a display manager.

## Why `niri-session` matters

`niri --session` imports niri's environment variables globally into the system
manager and D-Bus, and starts niri's D-Bus services. The `niri-session` script
additionally starts niri as a **systemd (or dinit) user service**, which brings
up `graphical-session.target`. That target is required by services such as the
**portals**, screencasting, and `xdg-desktop-autostart`. Portals specifically
**require** running niri as a session (`niri-session` or a display manager);
running the bare `niri` binary is not enough.

Consequences:

- If `niri msg`/portals/screencast/autostart misbehave, first confirm you are in
  a `niri-session` (check `systemctl --user status niri.service`).
- Add companion daemons to the session with
  `systemctl --user add-wants niri.service <unit>`.
- The default `niri.service` pulls in `graphical-session.target` and
  `xdg-desktop-autostart.target`.

## Session integration map

| Concern | Reference |
| --- | --- |
| Install paths, launch commands, default hotkeys, distro/DMS/Noctalia quickstart | `references/getting-started.md` |
| systemd user services, `add-wants`, `graphical-session.target`, `systemd-run --user --scope` | `references/systemd-session.md` |
| Required software: notification daemon, portals, `niri-portals.conf`, auth agent | `references/portals-and-software.md` |
| xwayland-satellite, nested compositors, Proton-GE, gamescope, clipboard | `references/xwayland.md` |
| NVIDIA VRAM heap-reuse, GBM, `nvidia-drm.modeset=1`, black screen | `references/nvidia.md` |
| Config load locations, `NIRI_` env vars, localed, autostart, shells | `references/packaging-and-integration.md` |

## Fast checks

```bash
systemctl --user status niri.service          # is niri running as a session?
systemctl --user list-dependencies niri.service
journalctl --user-unit=niri -b                # startup + X11 socket + errors
echo "$DISPLAY"                               # non-empty once xwayland-satellite is up
niri validate                                 # config parses?
```

## Related skills

- `niri` - entry point and compositor overview.
- `niri-configuration` - config file, `spawn-at-startup`, `environment`,
  `xwayland-satellite`, `prefer-no-csd`.
- `niri-troubleshooting` - triage, FAQ, per-app issues, debug options.
