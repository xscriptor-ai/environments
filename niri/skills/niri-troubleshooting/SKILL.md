---
name: niri-troubleshooting
description: Use when niri misbehaves or something is broken: niri validate, config parse error, config-notification, "Failed to parse the config file", debug options, debug {} section, log level, RUST_LOG, journalctl --user-unit=niri, event-stream, black screen, application issues, Steam, Electron, gamescope, Waybar, WezTerm, accessibility, Orca, security model, lockscreen.
---

# Skill: niri-troubleshooting

Triage workflow and reference index for diagnosing niri problems: bad config,
broken apps, rendering and debug flags, accessibility, and the security model.
Baseline: **niri 26.04** (2026-04-25).

## Triage workflow

Work top to bottom; most problems are caught at step 1 or 2.

**Top symptom: the desktop looks like the default niri config** - a plain gray
background and the "Important Hotkeys" overlay at startup - even though you wrote
a config. The config, or one of its `include`s, failed to parse and niri fell
back to the default. Run `niri validate`, fix the offending node (see the KDL
strictness gotcha in the `niri-configuration` skill), and save; niri only reports
the error in a notification and the log. Diagnose further with
`journalctl --user-unit=niri -b` and `niri msg --json event-stream`.

1. **Validate the config.** A save with a parse error keeps the previous config
   running and raises a "Failed to parse the config file" notification.

   ```sh
   niri validate
   niri validate -c /path/to/config.kdl
   ```

   Parse errors are logged at the `warn!` level and, in a session, announced by
   the screen reader. Check `niri validate` output before anything else.

2. **Read the niri journal.** When run as a session, niri logs to its systemd
   user unit.

   ```sh
   journalctl --user-unit=niri -b --no-pager
   systemctl --user status niri.service
   ```

   Raise verbosity if needed with `RUST_LOG` (for example, `RUST_LOG=niri=debug`).
   An `ERROR` line always indicates a niri **bug**; `WARN` usually means config
   or hardware. `trace` messages are compiled out of release builds.

3. **Inspect runtime state over IPC.**

   ```sh
   niri msg outputs
   niri msg windows
   niri msg --json event-stream        # live event stream for scripting/debug
   ```

   `--json` output is stable; the human-readable output is not.

4. **Isolate application issues.** If the compositor is healthy but one app
   misbehaves, it is usually a toolkit/protocol issue with a documented
   workaround. Check `references/application-issues.md` before adding debug
   flags.

5. **Reach for `debug {}` last.** Debug options are experimental, not covered by
   the config breaking-change policy, and can change or stop working at any
   time. Use them as targeted workarounds for driver/hardware bugs, then remove
   them. See `references/debug-options.md`.

6. **Black screen on start.** Confirm the session is a full `niri-session`, then
   check GPU-specific notes in the `niri-session-integration` skill (its
   `references/nvidia.md`, and the Asahi/ARM/kmsro note in its
   `references/getting-started.md`).

## Quick command index

| Goal | Command |
| --- | --- |
| Parse config | `niri validate` |
| Reload from a path (Since: 26.04) | `niri msg action load-config-file --path <file>` |
| Session logs | `journalctl --user-unit=niri -b` |
| Session status | `systemctl --user status niri.service` |
| Live events | `niri msg --json event-stream` |
| Outputs / windows | `niri msg outputs`, `niri msg windows` |
| Verbose logs | `RUST_LOG=niri=debug niri ...` |
| Panic backtrace test (packaging) | `niri panic` |

## References

- `references/faq.md` - high-value FAQ answers: CSD/rectangular windows,
  transparent-window tinting, rounded corners, why windows do not overflow
  monitors, screen sharing, hybrid-GPU lag, locker recovery, output profiles.
- `references/application-issues.md` - per-application workarounds (Steam,
  Electron, VSCode, JetBrains, WezTerm, Ghidra, Zen Browser, GTK4 dead keys,
  gamescope, Waybar) with exact config or environment variables.
- `references/debug-options.md` - every `debug {}` option with since-version and
  safe-vs-advanced marking, plus `niri validate`, log level, and
  `config-notification`.
- `references/accessibility-and-security.md` - Orca integration and advice, plus
  the niri security model: unsandboxed clients, filtered sockets, lock screen.

## Related skills

- `niri-configuration` - config syntax, `prefer-no-csd`, `config-notification`,
  `debug {}` section membership.
- `niri-session-integration` - session, systemd, portals, Xwayland, NVIDIA.
