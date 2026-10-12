# niri quick reference

One-page index for niri 26.04. Companion to
`niri/SKILL.md` and the focused `niri-*` skills.

## Paths and environment

| Item | Value |
| --- | --- |
| Config | `~/.config/niri/config.kdl` (or `$XDG_CONFIG_HOME/niri/config.kdl`) |
| Fallback | `/etc/niri/config.kdl` |
| Override | `--config`/`-c <path>`, `$NIRI_CONFIG` |
| Runtime reload path change | `niri msg action load-config-file --path <path>` (Since: 26.04) |
| IPC socket | `$NIRI_SOCKET` |
| Screenshots | `screenshot-path` (strftime format; `null` disables disk writes) |

## Session and diagnostics

| Task | Command |
| --- | --- |
| Start session (systemd/dinit) | `niri-session` |
| Start session (others) | `niri --session` |
| Validate config | `niri validate` |
| Validate a file | `niri validate -c path/to/config.kdl` |
| Version | `niri --version` |
| Session logs | `journalctl --user-unit=niri -b` |

## IPC

| Task | Command |
| --- | --- |
| Outputs | `niri msg --json outputs` |
| Workspaces | `niri msg --json workspaces` |
| Windows | `niri msg --json windows` |
| Focused window | `niri msg --json focused-window` |
| Focused output | `niri msg --json focused-output` |
| Keyboard layouts | `niri msg --json keyboard-layouts` |
| Pick window/color | `niri msg --json pick-window` / `niri msg --json pick-color` |
| Run an action | `niri msg action <name> [args]` |
| Event stream | `niri msg --json event-stream` |
| Raw request | `niri msg raw-request` |
| Show request JSON | `niri msg --print-request action focus-workspace 2` |

The `--json` output is stable; formatted output is not.

## Config sections

`input`, `output "NAME"`, `binds`, `switch-events`, `layout`,
`workspace "name"`, `window-rule`, `layer-rule`, `animations`, `gestures`,
`recent-windows`, `debug`, `include "file.kdl"`. Top-level options:
`spawn-at-startup`, `spawn-sh-at-startup`, `prefer-no-csd`, `screenshot-path`,
`environment`, `cursor`, `overview`, `xwayland-satellite`, `clipboard`,
`hotkey-overlay`, `config-notification`, `blur`.

Note: `binds {}` is not defaulted. Omitting it removes all binds.

## Bind properties

`repeat=false`, `cooldown-ms=N`, `hotkey-overlay-title="..."` (or `null`),
`allow-when-locked=true`, `allow-inhibiting=false`.

## Common actions

Column and window: `focus-column-left/right`, `focus-window-up/down`,
`move-column-left/right`, `move-window-up/down`, `consume-or-expel-window-left/right`,
`consume-window-into-column`, `expel-window-from-column`, `switch-preset-column-width`,
`switch-preset-column-width-back`, `set-column-width`, `set-window-height`,
`reset-window-height`, `center-column`, `center-visible-columns`,
`expand-column-to-available-width`.

Workspace: `focus-workspace <index|"name">`, `focus-workspace-up/down`,
`focus-workspace-previous`, `move-column-to-workspace <index|"name">`,
`move-window-to-workspace`, `move-workspace-up/down`,
`move-workspace-to-monitor-left/right/up/down/next/previous`,
`set-workspace-name`.

Monitor: `focus-monitor-left/right/up/down`, `move-column-to-monitor-*`,
`move-window-to-monitor-*`.

Window state: `close-window`, `toggle-window-floating`,
`switch-focus-between-floating-and-tiling`, `toggle-column-tabbed-display`,
`maximize-column`, `maximize-window-to-edges`, `fullscreen-window`,
`toggle-windowed-fullscreen`, `toggle-overview`, `toggle-window-rule-opacity`.

Session and effects: `spawn`/`spawn-sh`, `quit [skip-confirmation=true]`,
`power-off-monitors`, `do-screen-transition`, `screenshot`,
`screenshot-screen`, `screenshot-window`, `set-dynamic-cast-window`,
`set-dynamic-cast-monitor`, `clear-dynamic-cast-target`,
`toggle-keyboard-shortcuts-inhibit`, `switch-layout`.

See `niri-keybindings/references/actions-catalog.md` for the full list.

## Rule properties

`window-rule`: `match app-id`/`title`/`is-*`, `open-floating`, `open-maximized`,
`open-fullscreen`, `open-on-workspace`, `open-on-output`, `default-column-width`,
`default-window-height`, `default-column-display`, `geometry-corner-radius`,
`clip-to-geometry`, `opacity`, `tile-with-floating`,
`draw-border-with-background`, `border`, `focus-ring`, `shadow`, `tab-indicator`,
`background-effect`, `popups`, `block-out-from`.

`layer-rule`: `match namespace`, `match at-startup`, `layer`, `opacity`,
`background-effect`, `popups`, `block-out-from`.

See `niri-layout-rules/references/`.

## Wayland compatibility

| Protocol | niri |
| --- | --- |
| wlr-layer-shell | yes |
| ext-session-lock | yes (Quickshell lock, swaylock, gtklock) |
| wlr-screencopy | yes |
| ext-image-copy-capture | yes |
| ext-background-effect | yes (windows, layers, popups) |
| Xwayland | via xwayland-satellite (Since: 25.08) |
