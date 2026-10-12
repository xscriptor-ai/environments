---
name: niri-keybindings
description: Use when writing or debugging niri keybindings and binds in config.kdl: bind syntax, modifiers (Mod, Super/Win, Ctrl/Control, Shift, Alt, ISO_Level3_Shift/Mod5, ISO_Level5_Shift), XKB key names, wev, shifted-key spelling, repeat, cooldown-ms, hotkey-overlay-title, allow-when-locked, allow-inhibiting, spawn, spawn-sh, mouse click and scroll binds, tablet stylus binds, niri msg action, and the Important Hotkeys overlay.
---

# Skill: niri-keybindings

Key bindings live in the `binds {}` section of `~/.config/niri/config.kdl`. Each
bind is a hotkey followed by exactly one action enclosed in curly brackets. Every
bound action is also invocable programmatically through `niri msg action`.

Baseline for this resource set: **niri 26.04** (2026-04-25). niri uses date
versioning. Config is live-reloaded on save; validate with `niri validate`.

> Do not omit `binds {}` while copying the default config: unlike most sections,
> it is not filled with defaults automatically.

## Minimal shape

```kdl
binds {
    Mod+Left  { focus-column-left; }
    Mod+Right { focus-column-right; }
    Mod+T     { spawn "alacritty"; }
    Super+Alt+L { spawn "swaylock"; }
}
```

The hotkey is modifiers joined by `+`, ending in an XKB key name:
`Modifier+Modifier+...+Key`. The action is the only child node.

## Valid modifiers

| Modifier | Aliases | Notes |
| --- | --- | --- |
| `Ctrl` | `Control` | |
| `Shift` | | |
| `Alt` | | |
| `Super` | `Win` | |
| `ISO_Level3_Shift` | `Mod5` | AltGr on some layouts |
| `ISO_Level5_Shift` | `Mod3` | Requires an xkb lv5 option, e.g. `lv5:caps_switch` |
| `Mod` | | Special: `Super` on a TTY, `Alt` in a nested winit window |

`Mod` exists so configs can be tested in a nested window without clashing with
the host compositor. Most default binds use `Mod`.

Since: 25.05 - the `Mod` key can be customized in the `input {}` section.

## Key names and the wev tip

The trailing token is an XKB keysym name (`Left`, `Right`, `A`, `Slash`,
`XF86AudioRaiseVolume`, `Print`, ...). To discover the name of a key, run
[`wev`](https://git.sr.ht/~sircmpwn/wev) from a terminal and press the key. Look
for `sym:` in the output:

```
[14: wl_keyboard] key: serial: 757775; time: 44940343; key: 113; state: 1 (pressed)
                  sym: Left         (65361), utf8: ''
```

Binding shifted keys requires spelling out `Shift` plus the *unshifted* key,
according to your XKB layout:

- US QWERTY: `<` is `Shift` + `,`, so bind `Mod+Shift+Comma`.
- French BÉPO: `<` is AltGr + `«`, so bind `Mod+Mod5+guillemotleft`.

When resolving latin keys, niri searches the *first* configured XKB layout that
has the latin key.

## Bind properties

| Property | Values | Default | Purpose |
| --- | --- | --- | --- |
| `repeat` | `true` / `false` | `true` | Whether holding the bind retriggers it (Since: 0.1.8) |
| `cooldown-ms` | integer ms | unset | Rate-limit the bind; most useful on scroll binds |
| `hotkey-overlay-title` | string / `null` | unset | Customize the Important Hotkeys overlay (Since: 25.02) |
| `allow-when-locked` | `true` / `false` | `false` | Keep a `spawn` bind working while locked (Since: 0.1.5; `spawn`/`spawn-sh` only) |
| `allow-inhibiting` | `true` / `false` | `true` | When `false`, the bind always bypasses a keyboard-shortcuts inhibitor |

```kdl
binds {
    Mod+T repeat=false { spawn "alacritty"; }
    Mod+WheelScrollDown cooldown-ms=150 { focus-workspace-down; }
    Mod+Q hotkey-overlay-title=null { close-window; }
    XF86AudioMute allow-when-locked=true { spawn "wpctl" "set-mute" "@DEFAULT_AUDIO_SINK@" "toggle"; }
    Super+Alt+L allow-inhibiting=false { spawn "swaylock"; }
}
```

`allow-when-locked` is only valid on `spawn` and `spawn-sh` binds; using it on
another action is a config error. Binding the same hotkey twice is also a parse
error.

## Binds and `niri msg action`

`niri msg action <name>` invokes the same actions that binds use. Run
`niri msg action` to list every action with its short description.

```sh
niri msg action focus-workspace 2
niri msg action set-column-width "+10%"
niri msg action do-screen-transition --delay-ms 100
```

Some actions accept arguments in config (`focus-workspace 2`,
`set-column-width "+10%"`); on the command line these become positional or
`--long` flags. Binds and IPC share the action vocabulary but not every IPC
action is bindable and vice versa (`change-vt` and `suspend` are bind-only).

## References

- `references/bind-syntax.md` - full bind syntax: properties, scroll and touchpad
  binds, mouse click binds, tablet stylus binds, and gesture interaction.
- `references/actions-catalog.md` - categorized catalog of bindable and
  `niri msg action` actions with exact names and one-line descriptions.
- `references/hotkey-overlay-and-inhibit.md` - Important Hotkeys overlay,
  `hotkey-overlay-title`, `hide-not-bound`, `skip-at-startup`, and
  keyboard-shortcuts-inhibit behavior with worked examples.
