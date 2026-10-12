# Recent windows

Configuration for the recent windows (Alt-Tab) switcher and the related MRU
actions. Baseline: niri 26.04 (2026-04-25).

Since: 25.11. The `recent-windows {}` section configures the switcher. Defaults:

```kdl
recent-windows {
    // off
    debounce-ms 750
    open-delay-ms 150

    highlight {
        active-color "#999999ff"
        urgent-color "#ff9999ff"
        padding 30
        corner-radius 0
    }

    previews {
        max-height 480
        max-scale 0.5
    }

    binds {
        Alt+Tab         { next-window; }
        Alt+Shift+Tab   { previous-window; }
        Alt+grave       { next-window     filter="app-id"; }
        Alt+Shift+grave { previous-window filter="app-id"; }

        Mod+Tab         { next-window; }
        Mod+Shift+Tab   { previous-window; }
        Mod+grave       { next-window     filter="app-id"; }
        Mod+Shift+grave { previous-window filter="app-id"; }
    }
}
```

`off` disables the switcher entirely.

## `debounce-ms`

Delay, in milliseconds, between a window receiving focus and being committed to
the recent windows list (default `750`). This prevents intermediate windows from
polluting the list, for example windows crossed with `focus-follows-mouse` or
intermediate windows when navigating with the keyboard. Some actions, such as
typing into the target window, skip the delay and commit immediately so the list
stays responsive.

Set it to `0` to commit every focused window right away:

```kdl
recent-windows {
    debounce-ms 0
}
```

## `open-delay-ms`

Delay, in milliseconds, between pressing the bind and the switcher appearing
(default `150`). It is delayed so that quickly tapping Alt-Tab switches to the
previous window with no fullscreen visual change. Set `0` to show it instantly:

```kdl
recent-windows {
    open-delay-ms 0
}
```

## `highlight`

Styles the highlight behind the focused preview.

| Option | Default | Meaning |
| --- | --- | --- |
| `active-color` | `"#999999ff"` | Highlight color of the focused window preview. |
| `urgent-color` | `"#ff9999ff"` | Highlight color for an urgent focused window (also a darker shade on unfocused windows). |
| `padding` | `30` | Highlight padding around the preview, in logical pixels. |
| `corner-radius` | `0` | Corner radius of the highlight. |

```kdl
recent-windows {
    highlight {
        corner-radius 14
    }
}
```

## `previews`

Controls the window previews.

| Option | Default | Meaning |
| --- | --- | --- |
| `max-height` | `480` | Maximum preview height; limits size on large monitors. |
| `max-scale` | `0.5` | Maximum preview scale; windows cannot render larger than this. |

On small monitors previews are limited mainly by `max-scale`; on large monitors
mainly by `max-height`. `max-scale` is applied twice: to the final window scale
and to the window height (which cannot exceed `monitor height * max-scale`).

```kdl
recent-windows {
    // Smaller previews, more on screen.
    previews {
        max-height 320
    }
}
```

```kdl
recent-windows {
    // Larger previews to read window contents.
    previews {
        max-height 1080
        max-scale 0.75
    }
}
```

## `binds`

Configure binds that open and navigate the switcher. The available actions are
`next-window` and `previous-window`, each accepting optional properties:

| Property | Values | Meaning |
| --- | --- | --- |
| `filter` | `"app-id"` | Limit the switcher to windows of the currently selected application (by Wayland app ID). |
| `scope` | `"all"`, `"output"`, `"workspace"` | Pre-select the scope when the bind opens the switcher. |

```kdl
recent-windows {
    // Pre-select the "Output" scope when switching windows.
    binds {
        Mod+Tab         { next-window     scope="output"; }
        Mod+Shift+Tab   { previous-window scope="output"; }
        Mod+grave       { next-window     scope="output" filter="app-id"; }
        Mod+Shift+grave { previous-window scope="output" filter="app-id"; }
    }
}
```

Important rules:

- The first time a `recent-windows` block contains a `binds` sub-block, **all
  default binds are cleared**, even for an empty `binds {}`. Copy the defaults
  you still want from the outline above.
- Switcher binds have lower precedence than normal `binds {}`. If a key is bound
  to something else normally, the switcher bind does not fire; remove the
  conflicting normal bind.
- Every switcher bind must include a modifier (`Alt`, `Mod`, ...) because the
  switcher stays open only while a modifier is held.
- Only keyboard keys are supported here for now (no mouse or scroll binds).

```kdl
recent-windows {
    // Even an empty binds {} section removes all default binds.
    binds {
    }
}
```

## Binds inside the switcher

While the switcher is open, these hardcoded binds are available:

| Key | Effect |
| --- | --- |
| `Escape` | Cancel the switcher. |
| `Enter` | Close the switcher, confirming the selected window. |
| `A`, `W`, `O` | Select the All / Workspace / Output scope. |
| `S` | Cycle through scopes. |
| `Left`, `Right`, `Home`, `End` | Move the selection directionally. |

Some normal binds also work automatically in the switcher, with modifiers
stripped off:

- Focus column left/right and their variants move the selection left/right.
- Focus column first/last move to the first or last window.
- Close window closes the window selected in the switcher.
- Screenshot opens the screenshot UI.

For example, with `Mod+Shift+C` bound to `close-window`, pressing plain `C`
closes the focused switcher window. This means Colemak-DH or other non-HJKL
directional binds work in the switcher too, as long as they do not collide with
the hardcoded keys above.

## `focus-window-previous` and `focus-workspace-previous`

Since: 25.11. These normal `binds {}` actions use the same MRU data as the
switcher. `focus-window-previous` focuses the previously focused window (not
necessarily the previous one in the current workspace) and works repeatedly:
each press steps further back through the focus history. `focus-workspace-previous`
focuses the previously focused workspace.

```kdl
binds {
    Mod+Tab       { focus-window-previous; }
    Mod+grave     { focus-window-previous; }
    Mod+Shift+Tab { focus-workspace-previous; }
}
```

```sh
niri msg action focus-window-previous
niri msg action focus-workspace-previous
```

## Practical recipes

Instantly appearing switcher and immediate commits:

```kdl
recent-windows {
    debounce-ms 0
    open-delay-ms 0
}
```

App-only switching on a single key, across the output:

```kdl
recent-windows {
    binds {
        Alt+grave       { next-window     scope="output" filter="app-id"; }
        Alt+Shift+grave { previous-window scope="output" filter="app-id"; }
    }
}
```

Disable the switcher but keep quick toggle to the previous window:

```kdl
recent-windows {
    off
}

binds {
    Mod+Tab { focus-window-previous; }
}
```

Compact previews on a HiDPI laptop panel:

```kdl
recent-windows {
    previews {
        max-height 360
        max-scale 0.35
    }
    highlight {
        corner-radius 12
        padding 20
    }
}
```
