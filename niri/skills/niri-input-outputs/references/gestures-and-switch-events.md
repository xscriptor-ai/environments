# Gestures and switch events

Reference for the niri `gestures {}` and `switch-events {}` sections plus the
pointer/touch gesture catalog. Baseline: niri 26.04 (2026-04-25).

## `gestures {}`

Since: 25.02. Holds gesture settings. Defaults:

```kdl
gestures {
    dnd-edge-view-scroll {
        trigger-width 30
        delay-ms 100
        max-speed 1500
    }

    dnd-edge-workspace-switch {
        trigger-height 50
        delay-ms 100
        max-speed 1500
    }

    hot-corners {
        // off
        top-left
        // top-right
        // bottom-left
        // bottom-right
    }
}
```

### `dnd-edge-view-scroll`

Scrolls the tiling view when the cursor is pushed against a monitor edge during
drag-and-drop. It also works on a touchscreen. It applies to regular drag-and-drop
(for example dragging a file from a file manager) and to interactive window move
when the target is the tiling layout.

| Option | Default | Meaning |
| --- | --- | --- |
| `trigger-width` | `30` | Size of the trigger zone near the edge, in logical pixels. |
| `delay-ms` | `100` | Delay before scrolling starts; avoids unwanted scrolls when crossing monitors. |
| `max-speed` | `1500` | Maximum scroll speed in logical pixels per second. Speed ramps linearly from `trigger-width` to the very edge. |

```kdl
gestures {
    dnd-edge-view-scroll {
        trigger-width 100
        max-speed 3000
    }
}
```

### `dnd-edge-workspace-switch`

Since: 25.05. Scrolls workspaces up/down when the cursor is pushed against a
monitor edge during drag-and-drop while in the overview. Also works on a
touchscreen.

| Option | Default | Meaning |
| --- | --- | --- |
| `trigger-height` | `50` | Size of the trigger zone near the top/bottom edge, in logical pixels. |
| `delay-ms` | `100` | Delay before scrolling starts. |
| `max-speed` | `1500` | Maximum scroll speed; `1500` is one screen height per second. |

```kdl
gestures {
    dnd-edge-workspace-switch {
        trigger-height 100
        max-speed 3000
    }
}
```

### `hot-corners`

Since: 25.05. Moving the cursor into a monitor corner toggles the overview. It
also works while drag-and-dropping.

Since: 25.11 you can select corners by name: `top-left`, `top-right`,
`bottom-left`, `bottom-right`. If no corner is set, the top-left corner is
active by default. `off` disables hot corners.

```kdl
// Disable hot corners everywhere.
gestures {
    hot-corners {
        off
    }
}
```

```kdl
// Enable the top-right and bottom-right corners.
gestures {
    hot-corners {
        top-right
        bottom-right
    }
}
```

Hot corners can be overridden per output in `output "NAME" { hot-corners {} }`
(see `outputs.md`).

## Gesture catalog

### Mouse

| Gesture | Effect | Since |
| --- | --- | --- |
| `Mod` + left button drag | Interactive move. | 0.1.10 |
| Right click while moving | Toggle floating vs tiling for the moved window. | 25.01 |
| `Mod` + right button drag | Interactive resize. | 0.1.6 |
| Double-click top/bottom resize edge | Reset the window height to automatic. | 0.1.6 |
| Double-click left/right resize edge | Expand the column to full workspace width. | 0.1.6 |
| `Mod` + middle button (or wheel) drag horizontally | Move the view horizontally. | 0.1.6 |
| `Mod` + middle button (or wheel) drag vertically | Switch workspaces. | 0.1.7 |

The interactive move insert preview is styled with the `insert-hint` layout
option (see `niri-layout-rules`).

### Touchpad

| Gesture | Effect | Since |
| --- | --- | --- |
| Three-finger vertical swipe | Switch workspaces. | |
| Three-finger horizontal swipe | Move the view horizontally. | |
| Four-finger vertical swipe | Open and close the overview. | 25.05 |

### Touchscreen

| Gesture | Effect | Since |
| --- | --- | --- |
| `Mod` + finger drag | Interactive move; dragging a tiled window horizontally scrolls the view. | 0.1.10 |
| Second-finger tap while moving | Toggle floating vs tiling. | 25.11 |

### Tablet

| Gesture | Effect | Since |
| --- | --- | --- |
| `Mod` + pen drag | Interactive move; dragging a tiled window horizontally scrolls the view. | after 26.04 |

### All pointing devices (drag-and-drop)

| Behavior | Effect | Since |
| --- | --- | --- |
| DnD edge view scroll | Scroll the view against a monitor edge; also on touchscreens. | 25.02 |
| DnD edge workspace switch | Scroll workspaces against an edge while in the overview. | 25.05 |
| DnD hold to activate | Hold over a window to activate it (raises a floating window); in the overview, hold over a workspace to switch to it. | 25.05 |
| Hot corner | Top-left corner toggles the overview; works during DnD. | 25.05 |

## `switch-events {}`

Since: 0.1.10. Switch event bindings use the same shape as key bindings, but
only the `spawn` action is supported. In contrast to key bindings, switch event
bindings are **always** executed, even when the session is locked.

```kdl
switch-events {
    lid-close { spawn "notify-send" "The laptop lid is closed!"; }
    lid-open  { spawn "notify-send" "The laptop lid is open!"; }
}
```

### `lid-close`, `lid-open`

Fire when the laptop lid closes or opens. niri already turns the internal laptop
monitor on and off based on the lid, so use these events for extra actions only.

```kdl
switch-events {
    lid-close { spawn "notify-send" "The laptop lid is closed!"; }
    lid-open  { spawn "notify-send" "The laptop lid is open!"; }
}
```

### `tablet-mode-on`, `tablet-mode-off`

Fire when a convertible laptop enters or leaves tablet mode. In tablet mode the
keyboard and mouse are usually inaccessible, so these are the right place to
toggle an on-screen keyboard (for example `sysboard` or `wvkbd`).

```kdl
switch-events {
    tablet-mode-on {
        spawn "bash" "-c" "gsettings set org.gnome.desktop.a11y.applications screen-keyboard-enabled true";
    }
    tablet-mode-off {
        spawn "bash" "-c" "gsettings set org.gnome.desktop.a11y.applications screen-keyboard-enabled false";
    }
}
```

The commands above are examples; supply your own on-screen keyboard.

## Combined example

```kdl
gestures {
    dnd-edge-view-scroll {
        trigger-width 50
        max-speed 2500
    }
    dnd-edge-workspace-switch {
        trigger-height 60
    }
    hot-corners {
        top-left
        bottom-right
    }
}

switch-events {
    lid-close { spawn "systemctl" "suspend"; }
    tablet-mode-on {
        spawn "bash" "-c" "wvkbd-mobintl &";
    }
    tablet-mode-off {
        spawn "pkill" "wvkbd-mobintl";
    }
}
```
