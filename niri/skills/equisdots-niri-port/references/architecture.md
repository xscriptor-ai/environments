# equisdots architecture map

Precise map of the stack as it exists before the port. All paths are relative to
the working root `/home/xscriptor/Documents/repos/xscriptor/equisdots` unless
stated as installed paths. Baseline: Hyprland 0.56.x, Quickshell, niri 26.04 is
the target.

## Repos

| Repo | Purpose | Source layout | Installed to |
| --- | --- | --- | --- |
| `dots` | Meta installer/updater. Clones the org, places payloads, installs wrappers. | `dots` (single bash script), `scripts/` | `~/.local/bin/dots` |
| `hyprland` | Compositor config (Lua), session scripts, installer, app configs. | `config/hypr/*.lua`, `config/hypr/hypridle.conf`, `config/{rofi,dunst,cava,pam.d}`, `scripts/`, `install.sh`, `uninstall.sh` | `~/.config/hypr`, `~/.config/{rofi,dunst,cava}`, `~/.config/hypr/scripts` |
| `shell` | Quickshell UI: bar, popups, panels, editor, lock, widgets, compositor adapter. | `Shell.qml`, `Lock.qml`, `core/`, `ui/` | `~/.config/hypr/scripts/quickshell` |
| `nyx` | Mascot island/notch + control dock (QML). | `front/`, `mascots/`, `nyx.json` | `~/.config/hypr/scripts/quickshell/ui/nyx` |
| `palettes` | base16 palettes: flat JSON set, `index.json`, `community/`, `schema.json`, `tools/`. | flat set | `~/.config/hypr/scripts/quickshell/dock/palettes` |
| `davincix` | Wallpaper fetch/apply kernel (xwww scenes + mpvpaper). | `davincix.sh`, `paths.sh`, `apply.sh`, `slideshow.sh`, `providers/`, `*.py` | `~/.local/bin/davincix` wrapper; kernel at `~/.local/share/equisdots/davincix` |
| `theme-sync` | Cross-app theme regeneration (Python package). | `theme-sync.sh`, `themesync/` | `~/.local/bin/theme-sync` wrapper; engine at `~/.local/share/equisdots/theme-sync` |
| `timex` | Time/weather/calendar engine + UI. | `core/timex.sh`, `api/`, `ui/` | `~/.local/bin/timex`; UI into the shell's `ui/timex` |
| `xturing` | Rust/ratatui TUI exposing the settings panel options. | `src/*.rs` | `~/.local/bin/xturing` (cargo build, cache `~/.cache/equisdots/xturing-build`) |
| `background` | Interactive xwww wallpaper scenes. | `scenes/`, `docs/` | wallpaper source dir consumed by davincix/xwww |
| `login` | Static minimal SDDM greeter theme. | `theme/` (presently empty in the tree), `install.sh` | `/usr/share/sddm/themes/x` |
| `web` | Next.js static site: docs and previews. | `src/`, `content/`, `public/` | not a runtime component |

## Config formats

- **`settings.json`** - the single source of truth for the user configuration.
  Installed at `~/.config/hypr/settings.json`; shipped default at
  `hyprland/config/hypr/default_settings.json`. Canonical sections: `uiScale`,
  `appScale`, `workspaceCount`, `unifiedDesktops`, `wallpaperDir`, `language`,
  `kbOptions`, `barEngine`, `bar` (palette, position, modules, zones, borders,
  font, formats), `mascots`, `glass`, `shadows`, `keybinds`, `startup`,
  `monitors`, `widgets`, `notifications`, `editor`. The `dots` installer keeps
  it as `default_settings.json` merged with user values (`dots/dots`,
  `sync_repo` hyprland branch, lines ~146-171).
- **Base16 palette JSON** - one file per palette at
  `~/.config/hypr/scripts/quickshell/dock/palettes/<slug>.json`, plus
  `index.json` and `community/`. Format: base16 `color0..color15` plus optional
  `background`, `foreground`, `roles` overrides. `palettes/schema.json` is the
  schema.
- **Hyprland Lua config** - `hyprland/config/hypr/hyprland.lua` requires the
  sibling modules `env`, `colors`, `variables`, `settings`, `monitors`,
  `keybinds`, `animations`, `windowrules`, `layers`, `workspaces`, `autostart`,
  then `pcall`-loads generated overrides `config.window-effects`, `config.gaps`,
  `config.user-keybinds`, `config.user-startup`, `config.user-animations`,
  `config.user-input`.
- **`hypridle.conf`** - idle/lock/suspend timers at
  `hyprland/config/hypr/hypridle.conf`, driven by `hypridle`.
- **`display-config`** - flat pipe-separated monitor layout, at
  `~/.config/hypr/display-config` (+ `.bak`). Format
  `desc|x|y|scale|mode|transform|vrr|bitdepth|cm|mirror|disabled`, keyed by EDID
  description; written by `shell/core/Config.qml`, `monitor-manager.sh`,
  `xturing/src/monitors.rs`.
- **`idle-settings.json`** - `{"idleMode":"normal|awake"}` at
  `~/.config/hypr/idle-settings.json`, written by `scripts/idle-mode.sh`.
- **`window-effects.json`** - the 12 effect knobs, at
  `~/.config/hypr/config/window-effects.json`, written by
  `shell/core/scripts/hypr-effects.sh`.

## Contracts

1. **`settings.json` is the single source of truth.** Quickshell reads it in
   `shell/core/Config.qml` (`rawSettings`, `getSetting`, `setSetting`,
   `updateJsonBulk`), `shell/core/Theme.qml`, and per-widget adapters; xturing
   reads/writes it with `serde_json` (`xturing/src/settings.rs`); theme-sync
   reads `bar.palette`; the Hyprland Lua config reads `bar` from it in
   `colors.lua`.
2. **Palettes are a shared contract.** `dock/palettes` is read by the shell
   (`core/Theme.qml`, `ui/bar/Colors.qml`), theme-sync, the Hyprland
   `colors.lua`, and the `dots` installer. The path is frozen by design.
3. **The wrapper/clone model.** `dots` clones every repo under
   `~/.local/share/equisdots/<repo>` and drops wrappers in `~/.local/bin`
   (`dots`, `davincix`, `theme-sync`, `timex`, `xturing`) that `exec` the clone.
   Deploy is `rsync`/`cp`, never a symlink to the clone for the managed payload.
   `dots doctor` verifies binaries, clones and installed paths.
4. **Generated Lua overrides.** The settings panel and the effects UI write
   `~/.config/hypr/config/user-*.lua` / `window-effects.lua` / `gaps.lua`, then
   reload Hyprland. This is the "persist" side; live preview uses `hyprctl eval`.
5. **The compositor adapter.** `shell/core/Compositor.qml` is the declared
   compositor boundary; `shell/core/compositors/Hyprland.qml` is the only
   implementation.

## Theme propagation data flow

```
PalettePage.qml / PaletteWidget.qml / xturing palette.rs
        |  writes bar.palette (+ border overrides)
        v
~/.config/hypr/settings.json  <-watched--  shell/core/Config.qml (rawSettings)
        |                                        |
        |                                 bar.palette
        v                                        v
~/.config/hypr/scripts/quickshell/dock/palettes/<slug>.json
        |                    |
        | FileView watch     | read
        v                    v
ui/bar/Colors.qml     core/Theme.qml          (derive semantic roles)
        |                    |
        | syncWindowBorders  |
        v                    v
Compositor.qml --> compositors/Hyprland.qml --> hyprctl eval 'hl.config(...)'
        |
        +-- theme-sync.sh -> themesync/targets/* (kitty, nvim, vscode, rofi,
            cava, qt, gtk, browsers, starship, opencode, xfetch, xtop)

Hyprland load-time fallback: config/hypr/colors.lua reads settings.json "bar"
section + the palette JSON (no Matugen).
```

So a palette change fans out through three independent readers (bar `Colors`,
widget `Theme`, hyprland `colors.lua`) plus theme-sync. Only the border push and
`colors.lua` are Hyprland-shaped; the palette data and the derivation are
compositor-agnostic.

## Wrapper and install model

- `dots/dots` defines `REPOS=(dots palettes theme-sync davincix shell nyx
  hyprland timex xturing login)` and per-repo `sync_repo` branches that place
  each payload (`dots/dots` lines ~117-220).
- `shell`, `nyx` use `rsync --delete` (fully managed); `palettes` uses `cp -f`
  (user edits survive); `hyprland` uses `rsync` into `~/.config/hypr`.
- `~/.local/bin/{davincix,theme-sync}` are generated bash wrappers that `exec`
  the clone. `hyprland/scripts/*` are copied into `~/.config/hypr/scripts`.
- The system phase (`dots system` -> `hyprland/install.sh`) installs distro
  packages, Hack Nerd Font, SDDM theme, `/etc/pam.d/quickshell`, kitty/nvim
  configs, and checks `hyprland` + `quickshell` (`dots/dots` `doctor`,
  lines ~465-520).

## Compositor coupling inventory

### Compositor-agnostic (no change beyond paths)

| Component | Evidence |
| --- | --- |
| `palettes` | JSON data + schema only; no compositor calls. |
| `theme-sync` | Python + target modules; only default paths in `themesync/cli.py` (`~/.config/hypr/...`) and the nvim bootstrap path. |
| `background` | xwww scenes; Wayland layer-shell wallpaper, compositor-agnostic. |
| `davincix` | xwww/mpvpaper; `paths.sh` already env-overridable; only default wallpaper dir is `~/.config/hypr/wallpapers`. |
| `timex` | Engine + QML UI; no compositor calls. |
| `web` | Static site; docs only. |
| `login` | SDDM greeter; session launched independently. |
| Most of `shell/ui` | WlrLayershell/WlSessionLock are Wayland protocols niri supports. |

### Hyprland-coupled

| Path | Coupling |
| --- | --- |
| `hyprland/config/hypr/*.lua` | `hl.*` Lua API, Hyprland option names. |
| `hyprland/config/hypr/hypridle.conf` | `hypridle` daemon. |
| `hyprland/scripts/{workspaces,qs_manager,ws-desktops-lib,restore-monitors,monitor-manager,persist-display-config,scale-menu,exit,reload,idle-mode,init,wallpapers,scenes,gpu-mode}.sh` | `hyprctl`, `HYPRLAND_INSTANCE_SIGNATURE`, `.socket2.sock`, `hypridle`. |
| `hyprland/scripts/{screenshot,brightness,volume,volume_listener,caching,check,dotfiles-update,update_notifier}.sh` | Mostly agnostic; a few `hyprctl` touches (`screenshot.sh`). |
| `shell/core/Compositor.qml`, `shell/core/compositors/Hyprland.qml` | The adapter (the seam). |
| `shell/core/Config.qml` | `hyprctl` monitor read/apply, Lua keybind/startup generation, `~/.config/hypr` paths. |
| `shell/core/HyprEffects.qml`, `shell/core/scripts/hypr-effects.sh` | `hyprctl -j getoption`, `hyprctl eval`, Lua writers. |
| `shell/core/Theme.qml`, `shell/core/Scaler.qml`, `shell/core/SysData.qml` | Hard-coded `~/.config/hypr` paths; `SysData` reads hyprctl. |
| `shell/ui/bar/editor/HyprlandPage.qml`, `InputPage.qml`, `persist-hypr.sh`, `sysinfo.sh` | hyprctl seeding + Lua persist. |
| `shell/ui/bar/popups/applauncher/appLauncher.qml` | `hyprctl eval` exec. |
| `shell/ui/settings/tabs/KeybindTab.qml` | `hyprctl eval` submap + Lua generation. |
| `shell/ui/panels/scale/ScalePicker.qml`, `shell/ui/panels/davincix/DavincixPicker.qml` | `hyprctl monitors -j`. |
| `shell/ui/panels/focustime/focus_daemon.py` | `hyprctl activewindow -j`, `.socket2.sock`, `hyprlock`. |
| `nyx/front/MascotsOverlay.qml`, `nyx/front/MascotDock.qml` | `hyprctl cursorpos`, `.socket2.sock`, `~/.config/hypr/settings.json`. |
| `xturing/src/{monitors,actions,app}.rs`, `catalog.rs` | `hyprctl`, `.config/hypr/scripts`, hypr-effects/persist-hypr, Hyprland page. |
| `dots/dots`, `hyprland/install.sh`, `hyprland/uninstall.sh` | `hyprland`/`quickshell` doctor checks, package lists, config paths, SDDM session. |
