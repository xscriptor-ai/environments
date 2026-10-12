# Environment and autostart

Baseline: Hyprland 0.55+ Lua, niri 26.04. This maps `hl.env` / `env =`,
`exec-once` / `exec`, and `hl.on("hyprland.start")` to niri `environment {}`,
`spawn-at-startup`, `spawn-sh-at-startup` and systemd.

## Environment variables

| Hyprland | niri |
| --- | --- |
| `hl.env("VAR", "value")` | `environment { VAR "value" }` |
| `env = VAR,value` (hyprlang) | same |
| remove a variable | `environment { VAR null }` |
| `envd` | no equivalent |

`environment {}` overrides variables for processes spawned by niri. It does not
propagate to the systemd user environment (see the caveat below).

```lua
-- env.lua (Hyprland)
hl.env("QT_QPA_PLATFORM", "wayland;xcb")
hl.env("MOZ_ENABLE_WAYLAND", "1")
hl.env("XCURSOR_SIZE", "24")
hl.env("XCURSOR_THEME", "Bibata-Modern-Classic")
```

```kdl
// env.kdl (niri)
environment {
    QT_QPA_PLATFORM "wayland;xcb"
    MOZ_ENABLE_WAYLAND "1"
    XCURSOR_SIZE "24"
    XCURSOR_THEME "Bibata-Modern-Classic"
}
```

Cursor variables are better set in the dedicated block, which also applies the
theme to niri's own cursor:

```kdl
cursor {
    xcursor-theme "Bibata-Modern-Classic"
    xcursor-size 24
}
```

### PATH and computed variables

The equisdots `env.lua` computes values: it prepends `~/.local/bin` to `PATH`
only if absent, and derives scaling variables. niri KDL cannot compute. Options:

- Set `PATH` explicitly. This **replaces** the inherited PATH, so include the
  standard directories, or set it in the login shell instead.
- Prefer setting computed values in the login shell (`~/.bash_profile`) when the
  value depends on other environment state.

```kdl
environment {
    // Replaces the inherited PATH; list everything you need.
    PATH "/home/you/.local/bin:/usr/local/bin:/usr/bin"
}
```

### The systemd propagation caveat

`environment {}` only affects processes niri spawns. It does **not** reach the
systemd user environment, so a shell or app started by systemd, or an
application launcher inside a systemd-started desktop shell, will not see these
variables.

Hyprland works around this with explicit calls:

```
hl.exec_cmd("dbus-update-activation-environment --systemd WAYLAND_DISPLAY XDG_CURRENT_DESKTOP")
hl.exec_cmd("systemctl --user import-environment WAYLAND_DISPLAY XDG_CURRENT_DESKTOP")
```

niri handles this when started through `niri-session`: that script runs through
the login shell and imports all environment variables into systemd before
starting niri. So:

- Start the session with `niri-session` (the systemd path) to get systemd-wide
  variables from your login shell.
- Put variables that everything must see in `~/.bash_profile`, not only in
  `environment {}`.
- Do not rely on `dbus-update-activation-environment` for `environment {}`
  values; niri never exports them to D-Bus/systemd.

## Autostart

| Hyprland | niri | Runs |
| --- | --- | --- |
| `exec-once = CMD` | `spawn-at-startup "bin" "arg"...` | Once, at niri start. |
| `hl.on("hyprland.start", function() hl.exec_cmd(CMD) end)` | `spawn-at-startup` / `spawn-sh-at-startup` | Once, at niri start. |
| `exec = CMD` (every reload) | none | niri does not re-run startup spawns on reload. |
| (none) | `spawn-sh-at-startup "CMD"` (Since: 25.08) | Once, via `sh -c`. |

`spawn-at-startup` has exactly the same argv semantics as `spawn`: no shell,
each argument separate. Use `spawn-sh-at-startup` when the command uses a shell
(`&&`, `||`, pipes, `$VARS`, `2>/dev/null`, `&`).

```lua
-- autostart.lua (Hyprland)
hl.on("hyprland.start", function()
    hl.exec_cmd("gnome-keyring-daemon --start --components=secrets 2>/dev/null")
    hl.exec_cmd("/usr/lib/polkit-kde-authentication-agent-1 || /usr/lib/polkit-gnome/polkit-gnome-authentication-agent-1")
    hl.exec_cmd("xwww-daemon")
    hl.exec_cmd("wl-paste --type text --watch cliphist store")
    hl.exec_cmd("nm-applet --indicator")
    hl.exec_cmd("playerctld")
end)
```

```kdl
// autostart.kdl (niri)
spawn-at-startup "gnome-keyring-daemon" "--start" "--components=secrets"
spawn-sh-at-startup "/usr/lib/polkit-kde-authentication-agent-1 || /usr/lib/polkit-gnome/polkit-gnome-authentication-agent-1"

spawn-at-startup "xwww-daemon"
spawn-at-startup "wl-paste" "--type" "text" "--watch" "cliphist" "store"
spawn-at-startup "nm-applet" "--indicator"
spawn-at-startup "playerctld"
```

For the keyring daemon, the Hyprland version used `2>/dev/null`; with
`spawn-at-startup` the shell redirection is lost, so either drop it (niri does
not route the daemon through an interactive terminal) or use
`spawn-sh-at-startup` to keep the exact shell line.

### Startup handlers with logic

The equisdots `autostart.lua` uses a shell fallback chain
(`A || B || C`) and a `bash -c` wrapper that picks `quickshell` or `qs`. These
are shell constructs and become `spawn-sh-at-startup`:

```kdl
spawn-sh-at-startup "bash -c 'BIN=\"\"; command -v quickshell >/dev/null 2>&1 && BIN=quickshell || command -v qs >/dev/null 2>&1 && BIN=qs; [ -n \"$BIN\" ] && exec $BIN -p ~/.config/niri/scripts/quickshell/Shell.qml || true'"
```

`hl.on("hyprland.start", ...)` values that depended on the session starting
exactly once still map to `spawn-at-startup`; that is also once per niri start.

## systemd session and xdg-desktop-autostart

When niri runs as a systemd session (via `niri-session`), it supports
`xdg-desktop-autostart` out of the box. Any `.desktop` file in
`~/.config/autostart/`, `/etc/xdg/autostart/` or the XDG data dirs is launched.
This can replace a long `autostart.kdl`:

```
~/.config/autostart/nm-applet.desktop
~/.config/autostart/playerctld.desktop
```

Runnable unit shape (for reference, do not hand-roll if `niri-session` already
does this):

```ini
# ~/.config/systemd/user/niri.service
[Unit]
Description=niri
After=graphical-session-pre.target
PartOf=graphical-session.target

[Service]
Type=notify
ExecStart=/usr/bin/niri-session
Restart=on-failure

[Install]
WantedBy=graphical-session.target
```

Apps that must follow the graphical session should include:

```ini
[Unit]
PartOf=graphical-session.target
After=graphical-session.target
```

Key differences from Hyprland:

- Hyprland exports variables to systemd manually with
  `dbus-update-activation-environment` and
  `systemctl --user import-environment`. niri does this in `niri-session`. If you
  copy those two commands into `autostart.kdl`, they are redundant under
  `niri-session` and ineffective for `environment {}` values regardless.
- There is no `exec` (run on every config reload). If a Hyprland module used a
  top-level `hl.exec_cmd` specifically to rerun on reload, the behavior is lost.
  Move it to an explicit keybind or a systemd service.

## Complete port checklist

1. Convert every `hl.env` to a line in `environment {}`.
2. Move cursor theme/size to `cursor {}`.
3. Convert each `hl.on("hyprland.start")` command: plain argv becomes
   `spawn-at-startup`, shell lines become `spawn-sh-at-startup`.
4. Move session-wide variables to the login shell so systemd services and
   xdg-desktop-autostart entries see them.
5. Drop `dbus-update-activation-environment` / `systemctl --user
   import-environment` lines when running under `niri-session`.
6. Run `niri validate` and start a nested `niri` session to confirm the
   startup commands actually launch.
