---
name: hyprland-niri-config-mapping
description: Translate a Hyprland 0.55+ Lua config (hyprland.lua, hl.config, hl.bind, hl.monitor, hl.curve, hl.animation, hl.window_rule, hl.layer_rule, hl.workspace_rule) or legacy hyprlang to niri 26.04 KDL (config.kdl, output, binds, window-rule, layer-rule, workspace, animations, include). Use when porting windowrule, layerrule, monitor, keybind, dispatcher, gesture, environment or autostart directives, when deciding where a Hyprland module require() maps to a KDL section or include, or when migrating hyprctl reload, hyprctl eval and hyprctl setcursor to niri save-reload, niri validate and niri msg.
---

# Skill: hyprland-niri-config-mapping

Section-by-section translation guide for moving a Hyprland configuration to
niri 26.04. It targets both the 0.55+ Lua API (`hl.config`, `hl.bind`,
`hl.window_rule`, ...) and the older `hyprlang` syntax (`general {}`,
`windowrule =`, `bind =`). Grounding examples are the real equisdots Hyprland
Lua modules under `~/.config/hypr/*.lua`.

This skill is documentation, not an automated converter. Many Hyprland options
have no niri equivalent; every reference states explicitly what is lost and
what the closest approximation is. Never invent niri options: run `niri
validate` against `~/.config/niri/config.kdl` before trusting a snippet.

## The core structural difference

Hyprland evaluates one top-level Lua program (`hyprland.lua`) that `require()`s
sibling modules. Every module calls the same global `hl` table, so categories
are a naming convention, not a schema, and order of execution is the config
order. At runtime the whole config can be re-evaluated with `hyprctl reload`,
and individual options can be patched live with `hyprctl eval`.

niri parses a single KDL document (`config.kdl`) into a fixed typed schema.
Sections are discrete, named and mostly singletons: one `layout {}`, one
`input {}`, one `animations {}`, one `binds {}`, plus multipart sections
(`window-rule`, `layer-rule`, `output`, `workspace`) that may repeat. There is
no Lua, no conditionals and no runtime eval. Composition is done with `include`
(Since: 25.11). The file is live-reloaded on save and validated with `niri
validate`.

| Hyprland | niri |
| --- | --- |
| `hyprland.lua` + `require("env")` ... | `config.kdl` + `include "env.kdl"` ... |
| One Lua program, arbitrary control flow | One KDL document, fixed schema, `include` only |
| `hl.config({ general = {...} })` | top-level `layout {}`, `input {}`, ... |
| `hl.monitor({...})` | `output "NAME" {}` |
| `hl.bind(key, hl.dsp.*)` | `binds { Key { action; } }` |
| `hl.window_rule({...})` | `window-rule {}` |
| `hl.layer_rule({...})` | `layer-rule {}` |
| `hl.workspace_rule({...})` | `workspace "name" {}` |
| `hl.curve` / `hl.animation` | `animations {}` |
| `hl.env` / `hl.on("hyprland.start")` | `environment {}` / `spawn-at-startup` |
| `hyprctl reload` | save the file (live reload) |
| `hyprctl reload full-reset` | edit config and re-save, or `niri msg action load-config-file` |
| `hyprctl eval 'hl.monitor(...)'` | `niri msg output <name> ...` (session only) |

## Module-by-module approach

Use the Hyprland module list as the migration checklist. Each source module has
one destination:

| Hyprland module | niri destination | Reference |
| --- | --- | --- |
| `hyprland.lua` (require graph) | `config.kdl` + `include` | `references/config-structure.md` |
| `colors.lua`, `variables.lua` | KDL colors inline; `include`d color file | `references/config-structure.md` |
| `settings.lua` (`general`, `decoration`, `dwindle`, `master`, `misc`, `xwayland`, `ecosystem`, `cursor`, `binds`) | `layout {}`, `border`, `focus-ring`, `shadow`, `blur {}`, `prefer-no-csd`, `input {}` | `references/general-decoration.md` |
| `settings.lua` (`input`, `device`) | `input {}` | `references/input.md` |
| `monitors.lua` | `output "NAME" {}` | `references/monitors-outputs.md` |
| `keybinds.lua` | `binds {}` | `references/keybinds-dispatchers.md` |
| `windowrules.lua` | `window-rule {}` | `references/window-rules.md` |
| `layers.lua` | `layer-rule {}` + `blur {}` | `references/layer-rules.md` |
| `workspaces.lua` | `workspace "name" {}` + window rules | `references/workspaces.md` |
| `animations.lua` | `animations {}` | `references/animations.md` |
| `env.lua`, `autostart.lua` | `environment {}`, `spawn-at-startup` | `references/environment-autostart.md` |

## Migration strategy

1. Build the KDL shell first: create `config.kdl` with the top-level sections
   and `include` lines mirroring the Hyprland `require()` graph. See
   `references/config-structure.md`.
2. Port `env.lua` and `autostart.lua` before anything else, so the migrated
   session can actually start. See `references/environment-autostart.md`.
3. Port `monitors.lua` to `output` sections. Do this before the layout, because
   logical-pixel positioning depends on scale. See `references/monitors-outputs.md`.
4. Port `settings.lua` to `layout {}`, borders, shadows and global `blur {}`.
   Expect to drop dwindle/master knobs. See `references/general-decoration.md`
   and `references/input.md`.
5. Port `keybinds.lua` to `binds {}`. Rewrite dispatchers as niri actions;
   redesign submaps. See `references/keybinds-dispatchers.md`.
6. Port `windowrules.lua` and `layers.lua`. Class becomes `app-id`, and layer
   blur becomes a `background-effect`. See `references/window-rules.md` and
   `references/layer-rules.md`.
7. Port `workspaces.lua`. This is a model change, not a syntax change; decide
   the workspace model before writing rules. See `references/workspaces.md`.
8. Re-author `animations.lua`; the leaf names do not line up. See
   `references/animations.md`.
9. Validate with `niri validate`, then test in a nested niri session
   (`niri --session` / a winit window) before switching the login session.

## What does not translate cleanly

- Dwindle/master layout options (`general.layout`, `dwindle {}`, `master {}`):
  niri is always scrollable columns.
- `decoration` blur variants, `dim_inactive`, `blur.size`/`passes` semantics:
  niri blur is the global `blur {}` section plus `background-effect` rules.
- `misc:enable_swallow`, `snap`, snapping, tearing, `cursor:no_hardware_cursors`.
- Monitor mirroring: niri has no mirror option.
- Per-device `device "name"` input sections: not supported in 26.04; a device
  section fails `niri validate`.
- Hyprland submaps: niri has no submaps; use separate binds or an external mode
  script.
- Special/scratchpad workspaces: no toggle-workspace primitive; approximate with
  named workspaces.
- Animation leaf names, Hyprland bezier curves and `speed` semantics.
- `hyprctl eval` live patching: only `niri msg output` has a session-only
  equivalent.
- `windowrule` effects with no niri counterpart: `noanim`, `idleinhibit`, `pin`,
  `immediate` (tearing), `dimaround`, layer `noanim`.

Record each dropped behavior in an ADR rather than silently omitting it.

## References

- `references/config-structure.md` - module `require()` vs KDL `include`, file
  tree layout, live-reload and reload/full-reset semantics.
- `references/general-decoration.md` - `general`/`decoration`/`dwindle`/`master`/
  `misc`/`xwayland`/`ecosystem` to `layout {}`, border, focus-ring, shadow, blur.
- `references/input.md` - `input {}` and `device {}` to niri `input {}`, plus the
  no-per-device limitation.
- `references/monitors-outputs.md` - `monitor` / `hl.monitor` to `output`.
- `references/keybinds-dispatchers.md` - `hl.bind` and `hl.dsp.*` to `binds {}`.
- `references/window-rules.md` - `windowrule`/`windowrulev2` to `window-rule {}`.
- `references/layer-rules.md` - `layerrule` to `layer-rule {}` and background
  effects.
- `references/workspaces.md` - static + special workspaces to dynamic + named.
- `references/animations.md` - curves and leaves to niri animations.
- `references/environment-autostart.md` - env, exec-once and startup handlers.
- `references/cheatsheet.md` - consolidated lookup table.
