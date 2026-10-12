# Hotkey overlay and keyboard-shortcuts inhibitor

The Important Hotkeys overlay and the keyboard-shortcuts inhibitor, plus how to
configure and escape each. Baseline: niri 26.04.

## Important Hotkeys overlay

The overlay is a dialog listing important binds. It is shown by the
`show-hotkey-overlay` action, bound by default to `Mod+Shift+Slash` (`Mod+?`):

```kdl
binds {
    Mod+Shift+Slash { show-hotkey-overlay; }
}
```

It is also shown once at startup unless disabled. The overlay shows a hardcoded
list of important binds, plus `spawn` binds, and can be customized per bind with
`hotkey-overlay-title`.

## `hotkey-overlay-title`

Since: 25.02. Set on the hotkey of a bind to control how it appears in the
overlay.

- A string adds the bind to the overlay with that title.
- `null` removes a hardcoded bind from the overlay.
- Binds with custom titles are listed after the hardcoded binds and before
  non-customized `spawn` binds.

```kdl
binds {
    Mod+Shift+S hotkey-overlay-title="Toggle Dark/Light Style" { spawn "some-script.sh"; }
    Mod+Q hotkey-overlay-title=null { close-window; }
}
```

Custom titles support [Pango markup](https://docs.gtk.org/Pango/pango_markup.html):

```kdl
binds {
    Mod+Shift+S hotkey-overlay-title="<b>Toggle</b> <span foreground='red'>Dark</span>/Light Style" {
        spawn "some-script.sh";
    }
}
```

### Precedence when several binds share an action

When multiple key combinations are bound to the same action:

1. If any of the binds has a custom `hotkey-overlay-title`, niri shows that bind.
2. Otherwise, if any bind has a `null` title, niri hides the bind.
3. Otherwise, niri shows the first key combination.

## Overlay config: `hide-not-bound` and `skip-at-startup`

Options live in the top-level `hotkey-overlay {}` section.

```kdl
hotkey-overlay {
    // Do not open the overlay at startup.
    skip-at-startup
    // Only show actions that are actually bound to a key.
    hide-not-bound
}
```

| Option | Since | Effect |
| --- | --- | --- |
| `skip-at-startup` | | Do not show the overlay at niri startup. |
| `hide-not-bound` | 25.08 | Hide actions that are not bound to any key. By default niri shows the most important actions even when unbound, to prevent confusion. |

## Keyboard-shortcuts inhibitor

Applications such as remote-desktop clients and software KVM switches may ask
niri to stop processing keyboard shortcuts so they can forward key presses as-is
(for example into a VM or remote machine).

`toggle-keyboard-shortcuts-inhibit` is the escape hatch that toggles the
inhibitor for the focused surface (Since: 25.02). Bind it so a buggy application
cannot hold the session hostage:

```kdl
binds {
    Mod+Escape { toggle-keyboard-shortcuts-inhibit; }
}
```

niri always processes `toggle-keyboard-shortcuts-inhibit` even while an
inhibitor is active, so it can always be toggled back off.

### `allow-inhibiting=false`

Set `allow-inhibiting=false` on any bind to make niri always handle it and never
pass it to the window, even during an inhibitor. This is useful for a lock-screen
bind that must keep working:

```kdl
binds {
    Super+Alt+L allow-inhibiting=false { spawn "swaylock"; }
}
```

The default is `allow-inhibiting=true`.

## Worked examples

Minimal overlay customization plus inhibitor escape hatch:

```kdl
hotkey-overlay {
    skip-at-startup
    hide-not-bound
}

binds {
    // Add a descriptive entry to the overlay.
    Mod+Shift+S hotkey-overlay-title="Toggle Dark/Light Style" {
        spawn "some-script.sh";
    }

    // Remove the built-in close-window entry from the overlay.
    Mod+Q hotkey-overlay-title=null { close-window; }

    // Escape hatch, always reachable.
    Mod+Escape allow-inhibiting=false { toggle-keyboard-shortcuts-inhibit; }

    // Critical lock bind that must bypass a stuck inhibitor.
    Super+Alt+L allow-inhibiting=false { spawn "swaylock"; }
}
```

Media keys that keep working while locked (note `allow-when-locked`, which is
valid only on `spawn` and `spawn-sh`):

```kdl
binds {
    XF86AudioRaiseVolume allow-when-locked=true {
        spawn-sh "wpctl set-volume @DEFAULT_AUDIO_SINK@ 0.1+ -l 1.0";
    }
    XF86AudioMute allow-when-locked=true {
        spawn-sh "wpctl set-mute @DEFAULT_AUDIO_SINK@ toggle";
    }
}
```

Verify the config parses with `niri validate` after editing. The overlay updates
live once the config reloads.
