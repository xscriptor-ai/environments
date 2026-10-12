# Config structure: Hyprland modules to niri includes

Baseline: Hyprland 0.55+ Lua config, niri 26.04. This file covers how the
Hyprland `require()` composition maps to KDL `include`, how to lay out a
migrated config tree, and how reload semantics differ.

## Two composition models

Hyprland runs a Lua program. `hyprland.lua` is the entry point; each
`require("name")` executes a sibling `.lua` file in the same directory. The
modules share the global `hl` table and run top to bottom, so later modules
override earlier ones. This is arbitrary code: a module can loop, read files,
read environment variables, and compute values (the equisdots `variables.lua`
returns a table, `keybinds.lua` builds binds in a `for` loop).

niri parses one KDL document into a strict schema. There is no code, no
conditionals and no loops. Composition is `include`, added in niri 25.11.

| Hyprland Lua | niri KDL |
| --- | --- |
| `require("settings")` | `include "settings.kdl"` |
| `require("config.user-input")` in `pcall` | `include optional=true "user-input.kdl"` (Since: 26.04) |
| Computed values in Lua | Literal values; no computation |
| Top-level `hl.env(...)` | `environment {}` block |
| Order of `require()` calls is the merge order | Position of `include` is the merge order |

```lua
-- hyprland.lua (Hyprland)
require("env")
require("colors")
require("settings")
require("monitors")
require("keybinds")
pcall(require, "config.user-keybinds")
```

```kdl
// config.kdl (niri)
include "env.kdl"
include "colors.kdl"
include "settings.kdl"
include "monitors.kdl"
include "keybinds.kdl"
include optional=true "user-keybinds.kdl"
```

## Suggested file tree

Keep the Hyprland module boundaries and mirror them one-to-one. niri watches
every included file, so this keeps the same "edit one module, see it apply"
workflow.

```
~/.config/niri/
├── config.kdl                  # entry: top-level sections + includes
├── modules/
│   ├── env.kdl                 # environment {} + startup
│   ├── colors.kdl              # color values used by other includes
│   ├── settings.kdl            # layout {} + border/focus-ring/shadow
│   ├── effects.kdl             # blur {} + window/layer background effects
│   ├── input.kdl               # input {} (keyboard, touchpad, mouse)
│   ├── monitors.kdl            # output "..." {} sections
│   ├── keybinds.kdl            # binds {}
│   ├── window-rules.kdl        # window-rule {} sections
│   ├── layer-rules.kdl         # layer-rule {} sections
│   ├── workspaces.kdl          # workspace "..." {} sections
│   ├── animations.kdl          # animations {}
│   └── autostart.kdl           # spawn-at-startup / spawn-sh-at-startup
└── user/                       # machine-local overrides, optional
    ├── user-input.kdl
    └── user-keybinds.kdl
```

```kdl
// config.kdl
include "modules/env.kdl"
include "modules/colors.kdl"
include "modules/settings.kdl"
include "modules/effects.kdl"
include "modules/input.kdl"
include "modules/monitors.kdl"
include "modules/keybinds.kdl"
include "modules/window-rules.kdl"
include "modules/layer-rules.kdl"
include "modules/workspaces.kdl"
include "modules/animations.kdl"
include "modules/autostart.kdl"

include optional=true "user/user-input.kdl"
include optional=true "user/user-keybinds.kdl"
```

`include` accepts `other.kdl` or `./other.kdl` (relative to the including
file), `/absolute/path.kdl`, and Since: 26.04 `~/file.kdl`. Includes can be
nested. `optional=true` (Since: 26.04) allows a missing file; the file is still
watched, so creating it later triggers a reload.

## Include semantics you must know

Includes are positional and merged into the document.

- **Most sections merge.** `layout {}` in `colors.kdl` and `layout {}` in
  `settings.kdl` combine key by key. Setting only `focus-ring.active-color` in
  one file does not reset `gaps` from another.

  ```kdl
  // colors.kdl
  layout {
      border { active-color "#ffc87f" inactive-color "#505050" }
  }
  ```

  ```kdl
  // config.kdl
  include "colors.kdl"

  layout {
      gaps 8            // does not clear the colors above
      border { width 2 } // active-color/inactive-color still come from colors.kdl
  }
  ```

- **Multipart sections do not merge.** `window-rule`, `layer-rule`, `output`
  and `workspace` blocks from an include are inserted as-is at the include
  position. Two `output "eDP-1"` blocks in the same effective document are a
  parse error, so never duplicate an output across files.

- **`binds` override by key.** A later `Mod+T` bind replaces an earlier
  `Mod+T`, which is how a `user-keybinds.kdl` overrides the base.

- **Flags can be disabled with `false`.** `prefer-no-csd` enabled in the main
  file can be turned off by `prefer-no-csd false` in a later include.

- **Some sections are not merged.** `struts`, `preset-column-widths`, each
  animation subsection and each pointing-device subsection in `input` are
  combined structures: the later one replaces, not merges.

- **Border special case.** Writing `layout { border {} }` in the *main* config
  enables the border (equivalent to `border { on; }`). The same empty block in
  an *included* file does nothing. When moving border setup into a module, add
  `on` explicitly.

## Live-reload and reload commands

| Hyprland | niri |
| --- | --- |
| Save and run `hyprctl reload` | Just save `config.kdl` (live reload) |
| `hyprctl reload full-reset` | Edit and re-save; there is no full-reset primitive |
| `hyprctl eval '<lua>'` | No equivalent; `niri msg output` for session-only output changes |
| `hyprctl configerrors` | `niri validate` |
| `hyprctl setcursor THEME SIZE` | `cursor { xcursor-theme ...; xcursor-size ...; }` |

niri live-reloads on save, including included files. `niri validate` parses the
config offline and prints errors without touching the running session; it is the
equivalent of `hyprctl configerrors` but stronger, because a parse failure
prevents the reload rather than applying a partial config.

To force a reload from a script or keybind, use the IPC action:

```sh
niri msg action load-config-file
niri msg action load-config-file --path ~/.config/niri/config.kdl
```

There is no `full-reset`. Hyprland's `hyprctl reload full-reset` re-reads all
device and monitor state; in niri, output state that was changed at runtime with
`niri msg output` is session-only and is dropped when that output's config
section changes. To get back to a clean parsed state, edit the file (touch it)
and let it reload, or reload a specific path.

A typical reload keybind migration:

```kdl
binds {
    Mod+Shift+R { spawn-sh "niri validate && niri msg action load-config-file"; }
}
```

`hyprctl eval` has no niri equivalent: niri cannot evaluate arbitrary code. The
only runtime config surface is `niri msg output <name> ...`, which changes an
output for the current session only and is never written back to the file.

## Verifying a migrated tree

```sh
# Parse errors in config.kdl and every include.
niri validate

# If using a non-default path.
niri validate -c ~/.config/niri/config.kdl
```

Because includes are watchers, a syntax error in one module fails the whole
reload. Keep modules small and validate after each file you add.
