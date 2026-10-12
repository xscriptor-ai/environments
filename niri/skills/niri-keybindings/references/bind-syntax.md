# Bind syntax

Complete syntax for the `binds {}` section of `~/.config/niri/config.kdl`.
Baseline: niri 26.04. Each bind has exactly one action; two actions or a
duplicate hotkey is a parse error. `niri validate` reports these.

## Hotkey plus action block

```kdl
binds {
    // modifiers + XKB key name  ->  one action node
    Mod+Shift+Slash { show-hotkey-overlay; }

    // actions with arguments
    Mod+1 { focus-workspace 1; }
    Mod+Ctrl+Right { move-column-right; }
    Mod+Minus { set-column-width "-10%"; }
    Mod+F { maximize-column; }
}
```

Grammar:

- Hotkey: `Modifier(+Modifier)*+Keysym`. Modifier matching is case-insensitive.
- Action: a single child node. It may have scalar arguments (as above), a
  string argument (`spawn "alacritty"`), or its own properties
  (`quit skip-confirmation=true;`).

## Properties

Properties are written on the hotkey, before the action block.

### `repeat`

Since: 0.1.8. Binds repeat by default when held. Disable per bind with
`repeat=false`.

```kdl
binds {
    Mod+T repeat=false { spawn "alacritty"; }
    Mod+O repeat=false { toggle-overview; }
}
```

### `cooldown-ms`

Rate-limit a bind so it cannot trigger faster than the given number of
milliseconds. Most useful for scroll binds, but valid on any bind.

```kdl
binds {
    Mod+T cooldown-ms=500 { spawn "alacritty"; }
}
```

### `hotkey-overlay-title`

Since: 25.02. A string sets the title shown for this bind in the Important
Hotkeys overlay; `null` hides a hardcoded entry from the overlay. Custom titles
support Pango markup. See `hotkey-overlay-and-inhibit.md` for precedence rules
and worked examples.

```kdl
binds {
    Mod+Shift+S hotkey-overlay-title="Toggle Dark/Light Style" { spawn "some-script.sh"; }
    Mod+Q hotkey-overlay-title=null { close-window; }
}
```

### `allow-when-locked`

Since: 0.1.5. Valid only on `spawn` and `spawn-sh` binds. When `true`, the bind
still runs while the session is locked (for example volume, brightness, or media
keys).

```kdl
binds {
    // Works even when the session is locked.
    XF86AudioMute allow-when-locked=true {
        spawn "wpctl" "set-mute" "@DEFAULT_AUDIO_SINK@" "toggle";
    }
}
```

Using `allow-when-locked` on any other action is a config error. Independently of
this property, niri always processes `change-vt`, `suspend`, `power-off-monitors`,
`power-on-monitors`, `switch-layout`, and `toggle-keyboard-shortcuts-inhibit`
while locked.

### `allow-inhibiting`

Default `true`. When set to `false`, niri always handles the bind and never
passes it to the focused window, even while a keyboard-shortcuts inhibitor is
active. See `hotkey-overlay-and-inhibit.md`.

```kdl
binds {
    // Always works, even inside a VM that requested the inhibitor.
    Super+Alt+L allow-inhibiting=false { spawn "swaylock"; }
}
```

## Scroll binds

Mouse wheel ticks use `WheelScrollUp/Down/Left/Right`. Their direction follows the
`natural-scroll` setting. While the bound modifiers are held, niri consumes *all*
mouse wheel scrolling so applications do not also receive it.

```kdl
binds {
    Mod+WheelScrollDown      cooldown-ms=150 { focus-workspace-down; }
    Mod+WheelScrollUp        cooldown-ms=150 { focus-workspace-up; }
    Mod+WheelScrollRight                { focus-column-right; }
    Mod+WheelScrollLeft                 { focus-column-left; }
}
```

Touchpad scroll ticks use `TouchpadScrollUp/Down/Left/Right`. Touchpad scrolling
is continuous, so niri splits it into discrete intervals by distance travelled.
These binds also honour the touchpad's `natural-scroll` (enabled by default), so
the example below is intentionally inverted.

```kdl
binds {
    Mod+TouchpadScrollDown { spawn "wpctl" "set-volume" "@DEFAULT_AUDIO_SINK@" "0.02+"; }
    Mod+TouchpadScrollUp   { spawn "wpctl" "set-volume" "@DEFAULT_AUDIO_SINK@" "0.02-"; }
}
```

`cooldown-ms` is the usual way to keep wheel binds from firing too fast.

## Mouse click binds

Since: 25.01. Available triggers: `MouseLeft`, `MouseRight`, `MouseMiddle`,
`MouseForward`, `MouseBack`.

```kdl
binds {
    Mod+MouseLeft    { close-window; }
    Mod+MouseRight   { close-window; }
    Mod+MouseMiddle  { close-window; }
    Mod+MouseForward { close-window; }
    Mod+MouseBack    { close-window; }
}
```

Two important behaviors:

- Clicks operate on the window that was focused at the time of the click, not the
  window under the cursor.
- Binding `Mod+MouseLeft` or `Mod+MouseRight` overrides the corresponding
  gesture: interactive move (left) or resize (right). The bind wins, so the
  gesture no longer works while those modifiers are held.

## Tablet stylus binds

Since: next release (post-26.04; not available in the 26.04 baseline). Triggers:
`TabletStylusButton1`, `TabletStylusButton2`, `TabletStylusButton3`.

```kdl
binds {
    Mod+TabletStylusButton1 { close-window; }
    Mod+TabletStylusButton2 { close-window; }
    Mod+TabletStylusButton3 { close-window; }
}
```

## Interaction with gestures

niri's touchpad and mouse gestures are separate from binds, but they share some
inputs:

- `Mod+MouseLeft` / `Mod+MouseRight` binds override the move/resize window
  gestures (see above).
- A touchpad four-finger swipe toggles the overview, matching the
  `toggle-overview` bind. The top-left hot corner does the same.
- Scroll binds consume scroll events while their modifiers are held, so
  applications cannot scroll "through" a `Mod+WheelScroll...` bind.

See the niri Gestures page for the `gestures {}` config section and the
`dnd-edge-view-scroll`, `dnd-edge-workspace-switch`, and `hot-corners` options.
