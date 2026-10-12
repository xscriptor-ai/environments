# KDL essentials and `include`

Reference for the niri config file format and for splitting a configuration
across multiple files. Baseline: niri 26.04 (2026-04-25).

## KDL basics for niri configs

The config is [KDL](https://kdl.dev). Only the subset niri uses is described
here.

### Comments

- `//` starts a line comment.
- `/-` comments out the node that follows it, including its children. This is
  used heavily in the default config to keep examples inert.

```kdl
// This line is ignored.

/-output "eDP-1" {
    // Everything inside this node is ignored,
    // so the display is not turned off.
    off
}
```

### Flags

Toggles are flags: writing the flag turns the feature **on**; omitting or
commenting it out turns it **off**.

```kdl
input {
    focus-follows-mouse      // enabled

    // focus-follows-mouse    // disabled
}
```

A small number of flags can be explicitly negated with `false`, which matters
when a later include needs to undo an earlier include:

```kdl
prefer-no-csd false
```

### Nodes and sections

A section is a node with a body in braces:

```kdl
input {
    keyboard { xkb { layout "us"; } }
    touchpad { tap; natural-scroll }
}
```

Rules:

- Most sections may appear **once**. Writing `input {}` twice is a parse error.
- Name-keyed sections may repeat, but each key must be unique:
  - `output "eDP-1" {}` / `output "HDMI-A-1" {}` are fine; a second
    `output "eDP-1" {}` is an error.
  - `workspace "web" {}` behaves the same way.
  - `window-rule {}` and `layer-rule {}` may repeat freely (rules stack in
    order).
- Values are bare tokens (`16`, `0.5`, `true`, `null`), quoted strings
  (`"wayland"`), or named properties (`mode "1920x1080@120"`, `offset x=0 y=5`).
- Semicolons are optional line separators; a newline also separates nodes.

### Strictness gotcha: terminate the last child

niri's KDL parser rejects a **one-line** block whose last child is not terminated
by a newline or `;` before `}`. These fail to parse:

```kdl
window-rule { match app-id="x"; open-floating true }
focus-ring { off }
```

Either write the block across multiple lines, or terminate the last child:

```kdl
window-rule {
    match app-id="x"
    open-floating true
}

window-rule { match app-id="x"; open-floating true; }
```

> Consequence: an invalid `config.kdl` - or any file it includes or that a script
> generates - makes niri **silently keep or fall back to its default config**.
> Typical symptoms are a plain gray background and the "Important Hotkeys"
> overlay at startup. Always run `niri validate -c <path>` after generating or
> editing config text. Generated fragments written by scripts/shell must use
> multi-line blocks.

## `include`

Since: 25.11.

You can include other files at the **top level** of the config only. Included
files have the same structure as the main config; their settings are merged with
the main file's settings.

```kdl
// config.kdl
include "colors.kdl"
include "binds.kdl"
```

Included files may themselves include more files. Every included file is watched
for changes, so the live reload applies to the whole tree.

### Path resolution

| Form | Meaning |
| --- | --- |
| `other.kdl` or `./other.kdl` | relative to the file containing the include |
| `/path/to/file.kdl` | absolute path |
| `~/file.kdl` | expands to `$HOME/file.kdl` (Since: 26.04) |

`include` works only at the top level. Putting it inside another section is an
error.

```kdl
include "something.kdl"       // OK

layout {
    include "other.kdl"       // error: not allowed
}
```

### Optional includes

Since: 26.04.

By default, including a missing file is an error. `optional=true` allows the
file to be absent; niri logs a warning on every reload but still loads the
config, and still watches the path so the config reloads if the file appears
later.

```kdl
include optional=true "optional-config.kdl"   // missing file is not fatal
include "required-config.kdl"                 // missing file is an error
```

`optional` only suppresses the *missing file* error. If the file exists but has
invalid syntax, parsing still fails.

### Positionality and override order

Includes are **positional**: they behave as if the included text were pasted at
the `include` line. Later settings override earlier ones, and window/layer rules
are inserted at the include's position.

```kdl
// colors.kdl
layout { border { active-color "green" } }
overview { backdrop-color "green" }
```

```kdl
// config.kdl
layout { border { active-color "red" } }

include "colors.kdl"        // overrides border -> green, backdrop -> green

overview { backdrop-color "red" }   // set after the include, so it wins
```

Result: border is green, overview backdrop is red.

Rules are inserted in place:

```kdl
// rules.kdl
window-rule { match app-id="Alacritty"; open-maximized false }
```

```kdl
// config.kdl
window-rule { open-maximized true }
include "rules.kdl"                 // inserted right here
window-rule { match app-id="firefox$"; open-maximized true }
```

### Merging rules per section type

| Kind | Merge behavior |
| --- | --- |
| Most sections (`layout`, `overview`, ...) | Deep-merged; only the properties you write change |
| Multipart sections (`output`, `workspace`, `window-rule`, `layer-rule`) | Inserted as-is, not merged |
| `binds` | Later bind for the same key overrides the earlier one |
| Flags | Can be undone by writing `false` |
| Non-merging sections (`struts`, `preset-column-widths`, `animations` subsections, `input` pointing-device subsections) | Replaced wholesale |

Example of property-level merging:

```kdl
// colors.kdl
layout {
    focus-ring { active-color "blue" }
    border { active-color "green" }
}
```

```kdl
// config.kdl
include "colors.kdl"
layout {
    gaps 8                       // colors from colors.kdl are kept
    border { width 8 }           // only width changes
}
```

Non-merging example: two `struts` blocks do not combine; the included one
replaces the first.

### Border special case

Writing `layout { border {} }` in the **main** config *enables* the border
(equivalent to `border { on; }`). Writing the same empty section in an
**included** file does nothing, because no property changes. If you move border
config into an included file, add `on` explicitly:

```kdl
// separate.kdl
layout {
    border {
        on
        width 4
        active-color "#ffc87f"
        inactive-color "#505050"
    }
}
```

## Worked example: modular config

Split a single config into focused modules. Order matters.

```text
~/.config/niri/
  config.kdl
  modules/
    input.kdl
    outputs.kdl
    appearance.kdl
    rules.kdl
    binds.kdl
```

```kdl
// config.kdl
include "modules/input.kdl"
include "modules/outputs.kdl"
include "modules/appearance.kdl"

// Optional machine-local overrides.
include optional=true "modules/local.kdl"

include "modules/rules.kdl"
include "modules/binds.kdl"

spawn-at-startup "waybar"
screenshot-path "~/Pictures/Screenshots/Screenshot from %Y-%m-%d %H-%M-%S.png"
```

```kdl
// modules/appearance.kdl
layout {
    gaps 12
    border {
        on
        width 2
        active-color "#7fc8ff"
        inactive-color "#505050"
    }
}

overview {
    zoom 0.5
    backdrop-color "#262626"
}
```

```kdl
// modules/binds.kdl
binds {
    Mod+T { spawn "alacritty"; }
    Mod+D { spawn "fuzzel"; }
    Mod+Q { close-window; }
    Mod+O repeat=false { toggle-overview; }
}
```

Result of the layout above:

- `input.kdl` and `outputs.kdl` are `input {}` and `output "NAME" {}` sections.
- `appearance.kdl` contributes `layout` properties and the `overview` block.
- `local.kdl` is loaded only if present, and since it is included after
  `appearance.kdl`, it can override those settings.
- `binds.kdl` is last, so its bindings win over any earlier ones.

Validate the assembled result with `niri validate`.
