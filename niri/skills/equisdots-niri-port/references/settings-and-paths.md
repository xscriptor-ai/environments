# Settings and paths

Every component hard-codes the deployment root `~/.config/hypr`. This document
lays out the two ways to make the stack path-agnostic and recommends one.

Measured coupling: `rg -o '\.config/hypr' shell | wc -l` reports **139
occurrences across 60 shell files**; outside `shell` there are ~91 more (many
are docs, but the live ones include `xturing`, `theme-sync`, `davincix`,
`timex`, `dots`, `hyprland`). This number drives the recommendation.

## Paths in use

| Path | Purpose | Hard-coded in |
| --- | --- | --- |
| `~/.config/hypr/settings.json` | single source of truth | `shell/core/{Config,Theme,Scaler,SysData}.qml`, `shell/ui/bar/Bar.qml`, `shell/ui/Main.qml`, `shell/ui/bar/Colors.qml`, `hyprland/config/hypr/colors.lua`, `hyprland/scripts/*`, `xturing/src/settings.rs`, `timex/core/timex.sh`, `theme-sync/themesync/cli.py` |
| `~/.config/hypr/scripts/quickshell` | shell install root (`Shell.qml`, `Lock.qml`) | `dots/dots`, `hyprland/scripts/{qs_manager,lock,reload}.sh`, `xturing/src/actions.rs` |
| `~/.config/hypr/scripts/quickshell/dock/palettes` | palette store (frozen contract) | `shell/core/Theme.qml`, `shell/ui/bar/Colors.qml`, `hyprland/config/hypr/colors.lua`, `theme-sync` |
| `~/.config/hypr/scripts` | session scripts | `hyprland/config/hypr/env.lua` (`SCRIPT_DIR`), `hyprland/scripts/*`, `xturing/src/actions.rs`, dozens of QML `Process` commands |
| `~/.config/hypr/wallpapers` | default wallpaper dir | `hyprland/config/hypr/env.lua`, `davincix/paths.sh`, `shell/core/Config.qml`, `xturing/src/catalog.rs` |
| `~/.config/hypr/display-config` | monitor layout | `shell/core/Config.qml`, `hyprland/scripts/{restore-monitors,monitor-manager,persist-display-config}.sh`, `xturing/src/monitors.rs` |
| `~/.config/hypr/idle-settings.json` | idle mode | `hyprland/scripts/idle-mode.sh`, `xturing/src/app.rs` |
| `~/.config/hypr/config/user-*.lua` | generated overrides | `shell/core/Config.qml`, `shell/core/scripts/hypr-effects.sh`, `shell/ui/bar/editor/persist-hypr.sh`, `xturing/src/app.rs` |
| `~/.local/bin/{dots,davincix,theme-sync,timex,xturing}` | wrappers | `dots/dots` |
| `~/.local/share/equisdots/<repo>` | clones | `dots/dots`, `davincix` docs, `theme-sync` docs |

## Option A - keep `~/.config/hypr` as the data root

The compositor config changes to niri, but the equisdots data keeps living under
`~/.config/hypr`. The directory name becomes a historical artifact; functionally
nothing breaks.

**Files that must change:**

- None for paths. The only edits are the compositor calls described in
  `component-matrix.md`.
- Document the choice (a one-line ADR): "`~/.config/hypr` is the equisdots data
  root; the compositor config lives in `~/.config/niri`."

**Pros:** zero path churn; enables Hyprland/niri parallel run from one
`settings.json` and one palette store; matches the frozen `dock/palettes`
contract unchanged; the `doctor`/install paths keep working.

**Cons:** misleading directory name; `hypr` in the path where no Hyprland
exists.

**Effort:** ~0 additional.

## Option B - neutral root `~/.config/equisdots`

Introduce a compositor-agnostic root and an env override so every consumer can
be pointed at it:

```
EQUISDOTS_CONFIG_DIR   default ${XDG_CONFIG_HOME:-$HOME/.config}/equisdots
EQUISDOTS_SETTINGS     default $EQUISDOTS_CONFIG_DIR/settings.json
EQUISDOTS_PALETTES     default $EQUISDOTS_CONFIG_DIR/palettes
EQUISDOTS_WALLPAPERS   default $EQUISDOTS_DATA_DIR/wallpapers
EQUISDOTS_STATE_DIR    default $EQUISDOTS_CONFIG_DIR   (display-config, idle-settings)
```

The same variables must be exported by the niri session config
(`environment { ... }` / `spawn-sh-at-startup`) so QML `Process` commands and
scripts inherit them, and mirrored into a shell-side constant so QML does not
have to read the environment in 60 places.

**Files that must change (the real cost):**

| Area | Files | Change |
| --- | --- | --- |
| Shell core | `Config.qml`, `Theme.qml`, `Scaler.qml`, `SysData.qml`, `ui/bar/Colors.qml`, `ui/Main.qml`, `ui/bar/Bar.qml` | derive root from one constant/env var |
| Shell QML | ~55 more files with `~/.config/hypr/scripts/...` `Process` commands | replace with `Config.scriptsDir + "/..."` |
| Shell scripts | `hypr-effects.sh`, `persist-hypr.sh`, watchers (`*_fetch.sh`) | use `$EQUISDOTS_*` with fallbacks |
| `hyprland` scripts | all scripts reading `settings.json`/`display-config`/`idle-settings.json` | use `$EQUISDOTS_*` with fallbacks |
| `hyprland` config | `env.lua` (`WALLPAPER_DIR`, `SCRIPT_DIR`), `colors.lua` (settings/palette path) | derive from env |
| `theme-sync` | `themesync/cli.py`, `targets/nvim.py` | read `$EQUISDOTS_SETTINGS`/`$EQUISDOTS_PALETTES` (already has `--settings/--palettes` flags) |
| `davincix` | `paths.sh` | default from `$EQUISDOTS_WALLPAPERS` |
| `timex` | `core/timex.sh` (`TIMEX_SETTINGS`) | default from `$EQUISDOTS_SETTINGS` |
| `xturing` | `settings.rs`, `actions.rs`, `monitors.rs`, `app.rs`, `catalog.rs`, `palette.rs` | one path resolver reading the env vars |
| `dots` | path constants | derive root + migrate existing installs |
| `install.sh`/`uninstall.sh` | deployment paths + a migration step | move files, never delete `settings.json` |

**Pros:** one compositor-agnostic layout; no misleading name; cleaner separation
of compositor config (`~/.config/niri`) from the desktop stack.

**Cons:** touches ~120+ files; needs a migration path for existing installs
(move `settings.json`, palettes, wallpapers, display-config, idle-settings);
risks breaking `theme-sync`/`colors.lua`/palette readers if any path is missed.

**Effort:** 6-8 weighted points moved from reuse to adapt (see
`percentage-estimate.md`).

## Recommended approach

**Start with Option A.** Keep `~/.config/hypr` as the data root for the first
niri release. The stack is deployment-coupled, not semantically coupled, and a
working compositor port is the priority. Concretely:

1. Leave all path strings alone during phases 1-5.
2. Add `EQUISDOTS_*` support **behind defaults** where it is cheap and already
   present (`theme-sync` flags, `davincix` env vars, `timex` `TIMEX_SETTINGS`),
   so consumers are ready but nothing moves.
3. In phase 6, decide on Option B. If chosen, do the mechanical migration in
   one commit per repo, with a migration step in `dots install` that moves the
   user data (never deletes `settings.json`, palettes, wallpapers,
   display-config or idle-settings).
4. Whichever root is chosen, keep `~/.config/niri/config.kdl` as the compositor
   config and never mix compositor config into the equisdots data root.

This keeps the headline estimate at ~63/25/12 and preserves the ability to run
Hyprland and niri side by side from one settings file and one palette store.
