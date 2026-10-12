# Layout reference

The `layout {}` block sets global defaults for how columns are sized, spaced,
decorated, and indicated. Every key listed here can be overridden per output and
per named workspace with a nested `layout {}` block (Since: 25.11); see
[Overrides](#overrides) at the end.

All lengths are in **logical pixels** unless stated otherwise. Fractional values
are rounded to physical pixels according to each output's scale factor.

## Contents at a glance

```kdl
layout {
    gaps 16
    center-focused-column "never"
    always-center-single-column
    empty-workspace-above-first
    default-column-display "tabbed"
    background-color "#003300"

    preset-column-widths {
        proportion 0.33333
        proportion 0.5
        proportion 0.66667
    }

    default-column-width { proportion 0.5; }

    preset-window-heights {
        proportion 0.33333
        proportion 0.5
        proportion 0.66667
    }

    focus-ring {
        on
        width 4
        active-color "#7fc8ff"
        inactive-color "#505050"
        urgent-color "#9b0000"
        // active-gradient from="#80c8ff" to="#bbddff" angle=45
        // inactive-gradient from="#505050" to="#808080" angle=45 relative-to="workspace-view"
        // urgent-gradient from="#800" to="#a33" angle=45
    }

    border {
        off
        width 4
        active-color "#ffc87f"
        inactive-color "#505050"
        urgent-color "#9b0000"
        // active-gradient from="#ffbb66" to="#ffc880" angle=45 relative-to="workspace-view"
        // inactive-gradient from="#505050" to="#808080" angle=45 relative-to="workspace-view" in="srgb-linear"
        // urgent-gradient from="#800" to="#a33" angle=45
    }

    shadow {
        off
        softness 30
        spread 5
        offset x=0 y=5
        draw-behind-window true
        color "#00000070"
        // inactive-color "#00000054"
    }

    tab-indicator {
        on
        hide-when-single-tab
        place-within-column
        gap 5
        width 4
        length total-proportion=1.0
        position "right"
        gaps-between-tabs 2
        corner-radius 8
        active-color "red"
        inactive-color "gray"
        urgent-color "blue"
        // active-gradient from="#80c8ff" to="#bbddff" angle=45
        // inactive-gradient from="#505050" to="#808080" angle=45 relative-to="workspace-view"
        // urgent-gradient from="#800" to="#a33" angle=45
    }

    insert-hint {
        on
        color "#ffc87f80"
        // gradient from="#ffbb6680" to="#ffc88080" angle=45 relative-to="workspace-view"
    }

    struts {
        // left 64
        // right 64
        // top 64
        // bottom 64
    }
}
```

## Defaults summary

These are niri's built-in defaults (what applies when the key is omitted), which
may differ from the shipped default config.

| Key | Default | Since |
| --- | --- | --- |
| `gaps` | `16` | 0.1.7 fractional |
| `center-focused-column` | `"never"` | - |
| `always-center-single-column` | off | 0.1.9 |
| `empty-workspace-above-first` | off | 25.01 |
| `default-column-display` | `"normal"` | 25.02 |
| `preset-column-widths` | `1/3`, `1/2`, `2/3` proportions | - |
| `default-column-width` | `{ proportion 0.5; }` | - |
| `preset-window-heights` | `1/3`, `1/2`, `2/3` proportions | 0.1.9 |
| `focus-ring` | on, `width 4`, active `#7fc8ff`, inactive `#505050`, urgent `#9b0000` | - |
| `border` | off, `width 4`, active `#ffc87f`, inactive `#505050`, urgent `#9b0000` | - |
| `shadow` | off, `softness 30`, `spread 5`, `offset x=0 y=5`, `draw-behind-window false`, color `#00000077` | 25.02 |
| `tab-indicator` | on, `gap 5`, `width 4`, `length total-proportion=0.5`, `position "left"`, `gaps-between-tabs 0`, `corner-radius 0` | 25.02 |
| `insert-hint` | on, color `#7fc8ff80` | 0.1.10 |
| `struts` | all `0` | 0.1.7 fractional, 0.1.8 negative |
| `background-color` | `#404040` | 25.05 |

## `gaps`

Gaps around windows, both inside and outside. Accepts fractional values
(Since: 0.1.7); the value is rounded to physical pixels per output scale, so
`gaps 0.5` on a `scale 2` output yields one physical pixel.

```kdl
layout {
    gaps 16
}
```

To emulate inner-only gaps, combine `gaps` with equal negative `struts`
(Since: 0.1.8; see [struts](#struts)).

## `center-focused-column`

When focusing a column causes niri to center it.

| Value | Behavior |
| --- | --- |
| `"never"` | No special centering; an off-screen column scrolls to the left or right edge. Default. |
| `"always"` | The focused column is always centered. |
| `"on-overflow"` | Center only if the column does not fit on screen together with the previously focused column. |

```kdl
layout {
    center-focused-column "always"
}
```

## `always-center-single-column`

Since: 0.1.9. Always center a single column on a workspace, regardless of
`center-focused-column`.

```kdl
layout {
    always-center-single-column
}
```

## `empty-workspace-above-first`

Since: 25.01. Always add an empty workspace at the very start, in addition to
the empty workspace at the very end.

```kdl
layout {
    empty-workspace-above-first
}
```

## `default-column-display`

Since: 25.02. Default display mode for new columns. One of `"normal"` or
`"tabbed"`.

```kdl
layout {
    default-column-display "tabbed"

    // Often paired with hiding the indicator for single-tab columns.
    tab-indicator {
        hide-when-single-tab
    }
}
```

## `preset-column-widths`

The widths that `switch-preset-column-width` (bound to `Mod+R` by default)
toggles between. Each entry is one of:

- `proportion <f64>`: a fraction of the output width, taking gaps into account.
  Four `proportion 0.25` windows fit exactly on an output regardless of gaps.
- `fixed <i32>`: the width in logical pixels, exactly.

Default presets are `1/3`, `1/2`, and `2/3`. Since: 25.08 you can cycle in
reverse with `switch-preset-column-width-back` (bound to `Mod+Shift+R` by
default).

```kdl
layout {
    preset-column-widths {
        proportion 0.33333
        proportion 0.5
        proportion 0.66667
        fixed 1280
    }
}
```

## `default-column-width`

Default width for new windows; same syntax as `preset-column-widths`.

```kdl
layout {
    // New windows open at 1/3 of the output.
    default-column-width { proportion 0.33333; }
}
```

An empty block means the window decides its own initial width:

```kdl
layout {
    default-column-width {}
}
```

> `default-column-width {}` makes niri send a `(0, H)` size in the initial
> configure request. This is loosely defined by the Wayland protocol and some
> clients may misinterpret it. It is most useful as a per-window override via the
> `default-column-width` window rule.

## `preset-window-heights`

Since: 0.1.9. The heights that `switch-preset-window-height`
(`Mod+Ctrl+Shift+R` by default) toggles between. Same `proportion`/`fixed`
syntax as `preset-column-widths`. Default presets are `1/3`, `1/2`, `2/3`.
Since: 25.08 `switch-preset-window-height-back` cycles in reverse (not bound by
default).

```kdl
layout {
    preset-window-heights {
        proportion 0.33333
        proportion 0.5
        proportion 0.66667
        fixed 720
    }
}
```

## `focus-ring` and `border`

Both draw a decoration around windows and mark the active window. They share the
same options.

- The **focus ring** is drawn only around the active window on each monitor, and
  does not affect window sizes. Enabled by default.
- The **border** is drawn around all windows and adds to their occupied size
  (windows shrink to make room). Disabled by default.

By default both render as a solid rectangle behind the window, so they show
through semitransparent windows. Enable `prefer-no-csd` to have niri draw them
around windows that omit client-side decorations, or override with the
`draw-border-with-background` window rule.

With `draw-border-with-background` at its default (`true`), niri paints a
**solid rectangle** in the border colour behind the window; combined with any
window `opacity` this tints translucent windows the border colour. Set
`draw-border-with-background false` (e.g. in a catch-all window rule) to draw the
border as a ring instead. Using the palette's loud accent as the active border
colour clashes; the muted colour (`color8`) is a neutral choice.

Common options:

```kdl
layout {
    focus-ring {
        off            // or on
        width 4        // logical pixels
        active-color "#7fc8ff"
        inactive-color "#505050"
        urgent-color "#9b0000"
        // active-gradient from="#80c8ff" to="#bbddff" angle=45
        // inactive-gradient from="#505050" to="#808080" angle=45 relative-to="workspace-view"
        // urgent-gradient from="#800" to="#a33" angle=45
    }

    border {
        width 2
        active-color "#ffc87f"
        inactive-color "#505050"
        urgent-color "#9b0000"
    }
}
```

### Width

Thickness in logical pixels. Fractional values are allowed (Since: 0.1.7) and
are rounded to physical pixels per output scale (`width 0.5` on `scale 2` gives
a one-pixel border).

### Colors

Accepted formats:

- CSS named colors, e.g. `"red"`.
- RGB hex: `"#rgb"`, `"#rgba"`, `"#rrggbb"`, `"#rrggbbaa"`.
- CSS-like: `"rgb(255, 127, 0)"`, `"rgba(...)"`, `"hsl(...)"`, and a few more.
- Deprecated 4-number form: `active-color 127 200 255 255`.

`active-color` is used for the active window, `inactive-color` for all others.
A focus ring draws only around the active window on each monitor, so with a
single monitor you never see its `inactive-color`; with multiple monitors you
do.

`urgent-color` colors windows that request attention.

### Gradients

`active-gradient`, `inactive-gradient`, and `urgent-gradient` take precedence
over the corresponding solid colors. They render like CSS
`linear-gradient(angle, from, to)`.

| Property | Meaning | Default |
| --- | --- | --- |
| `from` | Start color | required |
| `to` | End color | required |
| `angle` | CSS gradient angle | `180` (top-to-bottom) |
| `relative-to` | `"window"` (default) or `"workspace-view"` | window |
| `in` | Interpolation color space | `srgb` |

`relative-to="workspace-view"` colors the gradient across the whole workspace
view rather than per window.

```kdl
layout {
    border {
        active-gradient from="#ffbb66" to="#ffc880" angle=45 relative-to="workspace-view"
        inactive-gradient from="#505050" to="#808080" angle=45 relative-to="workspace-view"
    }
}
```

Since: 0.1.8 you can select the interpolation color space with `in=`:

- `srgb` (default)
- `srgb-linear`
- `oklab`
- `oklch`, optionally with a hue interpolation: `oklch shorter hue`,
  `oklch longer hue`, `oklch increasing hue`, `oklch decreasing hue`.

```kdl
layout {
    border {
        active-gradient from="#f00f" to="#0f05" angle=45 in="oklch longer hue"
    }
}
```

These render the same as CSS, e.g. `linear-gradient(45deg in oklch longer hue, #f00f, #0f05)`.

## `shadow`

Since: 25.02. A shadow drawn behind a window. Disabled by default; set `on` to
enable. Shadow drawing follows the window corner radius set by the
`geometry-corner-radius` window rule.

| Option | Meaning | Default |
| --- | --- | --- |
| `off` / `on` | Disable / enable | off |
| `softness` | Blur radius in logical pixels, like CSS `box-shadow` blur; `0` gives hard shadows | `30` |
| `spread` | Expand the rectangle in logical pixels, like CSS spread; negative allowed (Since: 25.05) | `5` |
| `offset` | `offset x=<n> y=<n>` shift in logical pixels | `x=0 y=5` |
| `draw-behind-window` | `true` draws the shadow behind the window rather than only around it | `false` |
| `color` | Shadow color and opacity | `#00000077` |
| `inactive-color` | Override color for inactive windows; default is a more transparent `color` | transparent `color` |

```kdl
layout {
    shadow {
        on
        softness 30
        spread 5
        offset x=0 y=5
        draw-behind-window true
        color "#00000070"
        inactive-color "#00000054"
    }
}

// Ask windows to omit client-side decorations so they don't draw their own shadows.
prefer-no-csd
```

`draw-behind-window true` fixes shadow artifacts inside CSD rounded corners,
because niri cannot otherwise know the corner radius. Alternatively set
`prefer-no-csd` and/or `geometry-corner-radius`, which also removes client-side
shadows.

> Shadow drawing currently supports one radius for all corners. If
> `geometry-corner-radius` is set to four values, the top-left (first) radius is
> used for shadows.

## `tab-indicator`

Since: 25.02. Appearance of the indicator shown next to columns in tabbed
display mode (see [Tabs](./floating-tabs-fullscreen.md#tabs)).

| Option | Meaning | Default |
| --- | --- | --- |
| `off` / `on` | Hide / show the indicator | on |
| `hide-when-single-tab` | Hide for tabbed columns with a single window | off |
| `place-within-column` | Include the indicator in column sizing instead of overlaying adjacent columns | off |
| `gap` | Gap between indicator and window in logical pixels; can be negative to overlay | `5` |
| `width` | Thickness in logical pixels | `4` |
| `length total-proportion=<f>` | Indicator length as a fraction of the window size | `0.5` |
| `position` | `"left"`, `"right"`, `"top"`, or `"bottom"` | `"left"` |
| `gaps-between-tabs` | Gap between individual tabs in logical pixels | `0` |
| `corner-radius` | Rounded corner radius for tabs; with `gaps-between-tabs 0` only the first and last tabs round | `0` |
| colors | `active-color`, `inactive-color`, `urgent-color` | inherit |
| gradients | `active-gradient`, `inactive-gradient`, `urgent-gradient` | none |

Tab color precedence:

1. Colors from the `tab-indicator` window rule, if set.
2. Colors from the `tab-indicator` layout options, if set.
3. Otherwise, niri uses the color matching the active border or focus ring.

```kdl
layout {
    tab-indicator {
        width 8
        gap 8
        length total-proportion=1.0
        position "top"
        place-within-column
    }
}
```

## `insert-hint`

Since: 0.1.10. Settings for the window insert position hint during an
interactive window move.

| Option | Meaning | Default |
| --- | --- | --- |
| `off` / `on` | Disable / enable the hint | on |
| `color` | Hint color | `#7fc8ff80` |
| `gradient` | Hint gradient, same syntax as border gradients | none |

`color`/`gradient` have the same semantics as border and focus-ring colors.

```kdl
layout {
    insert-hint {
        color "#ffc87f80"
        gradient from="#ffbb6680" to="#ffc88080" angle=45 relative-to="workspace-view"
    }
}
```

## `struts`

Struts shrink the area occupied by windows, like layer-shell panels. Think of
them as a kind of outer gap. They are in logical pixels.

- Left and right struts make the next window to the side always peek out
  slightly.
- Top and bottom struts add outer gaps on top of the space used by layer-shell
  panels and regular gaps.

```kdl
layout {
    struts {
        left 64
        right 64
        top 64
        bottom 64
    }
}
```

Fractional values are allowed (Since: 0.1.7) and rounded per output scale.

Since: 0.1.8 values may be negative; they push windows outwards, even beyond the
screen edge. Combine equal negative struts with matching `gaps` to emulate
inner-only gaps:

```kdl
layout {
    gaps 16

    struts {
        left -16
        right -16
        top -16
        bottom -16
    }
}
```

## `background-color`

Since: 25.05. The default background color niri draws for workspaces, visible
when no background tool such as `swaybg` is running. Default `#404040`.

```kdl
layout {
    background-color "#003300"
}
```

It can also be set per output in the output's `layout {}` block.

## Overrides

Since: 25.11, the `layout {}` block can be nested inside an `output {}` block or
a named `workspace {}` block to override settings for that output or workspace.
Each nested block accepts the same keys as the top-level block.

```kdl
output "SomeCompany UltrawideMonitor 1234" {
    layout {
        default-column-width { proportion 0.25; }
        preset-column-widths {
            proportion 0.2
            proportion 0.25
            proportion 0.5
            proportion 0.75
            proportion 0.8
        }
    }
}

workspace "aesthetic" {
    layout {
        gaps 32
        struts {
            left 64
            right 64
            top 64
            bottom 64
        }
        border {
            on
            width 4
        }
    }
}
```

To unset a flag that is enabled globally, write it with `false`:

```kdl
layout {
    always-center-single-column
}

output "eDP-1" {
    layout {
        always-center-single-column false
    }
}
```

Named-workspace `layout {}` blocks accept all top-level options **except**:

- `empty-workspace-above-first`: an output-level setting, meaningless on a
  workspace.
- `insert-hint`: always drawn at the output level, not customizable
  per-workspace.

See also `references/window-rules.md` and `references/layer-rules.md` for
per-window and per-surface overrides.
