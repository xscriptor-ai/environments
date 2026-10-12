# Component matrix

One row per repo/component. `Reuse level` is the dominant disposition; most
components contain a mix (see the percentage estimate for the fractions).

## Per-component disposition

| Component | Purpose | Compositor coupling | Reuse level | Notes |
| --- | --- | --- | --- | --- |
| `palettes` | base16 palette data + schema | none | as-is | Pure data. Only its deploy path (`.../dock/palettes`) is coupled by location. |
| `background` | xwww interactive scenes | none | as-is | Layer-shell wallpaper; niri supports wlr-layer-shell. |
| `theme-sync` | cross-app theme regeneration | none | as-is (paths) | `themesync/cli.py` defaults to `~/.config/hypr/...`; `targets/nvim.py` reads the settings path. Overridable with `--palettes/--settings`. |
| `timex` | time/weather/calendar engine + UI | none | as-is | Deployed as engine + `ui/timex` QML; no compositor calls. |
| `login` | static SDDM greeter | none | as-is | SDDM launches whichever session is selected; no per-compositor code. |
| `web` | docs/preview site | none | as-is (docs) | Update architecture/tools docs for niri; no runtime coupling. |
| `davincix` | wallpaper kernel (xwww/mpvpaper) | low | as-is (path) | `paths.sh` env-overridable; default wallpaper dir is the only `~/.config/hypr` string. |
| `nyx` | mascot island + dock | high | adapt | Visuals and dock are pure QML (as-is). Cursor tracking (`hyprctl cursorpos`) and window events (`.socket2.sock`) must be redesigned against niri, which has no cursor-position IPC. |
| `shell` (agnostic majority) | bar, popups, panels, widgets, lock, editor | none | as-is | WlrLayershell/WlSessionLock and all palette/theme logic survive. |
| `shell` (adapter) | `core/Compositor.qml` | seam | adapt | Extend with a backend selector; add `compositors/Niri.qml`. |
| `shell` (direct bypasses) | ~12 files that call `hyprctl` directly | high | adapt | See the second table. Each is small except `Config.qml` and the effects pair. |
| `xturing` | Rust TUI for the settings panel | medium | adapt | settings.json/palette logic is agnostic (~65%); `monitors.rs`, `actions.rs`, the Hyprland/Input/Idle pages call hyprctl + hypr scripts. |
| `dots` | meta installer/updater | medium | adapt | Clone/deploy/wrapper logic reusable; path root, repo list (`hyprland` -> niri config repo), `doctor` checks and `system` phase are Hyprland-specific. |
| `hyprland` (config) | Lua compositor config | total | rewrite | Replaced by a niri `config.kdl` + modules; `colors.lua`, `layers.lua`, `keybinds.lua`, `animations.lua`, `windowrules.lua`, `workspaces.lua` have no 1:1 form. |
| `hyprland` (scripts) | session helpers | high | adapt | Port: `workspaces`, `qs_manager`, `ws-desktops-lib`, `restore-monitors`, `monitor-manager`, `persist-display-config`, `scale-menu`, `exit`, `reload`, `idle-mode`, `init`, `wallpapers`, `scenes`. Reusable: `screenshot`, `brightness`, `volume`, `gpu-mode`, `caching`, `dotfiles-update`, `update_notifier`. |
| `hyprland` (installer) | `install.sh`, `uninstall.sh` | high | rewrite/adapt | Package lists and NVIDIA logic mostly reusable; session registration, PAM, portal and config deployment change. |
| session/idle/lock/portal/capture | `hypridle.conf`, `lock.sh`, screenshot/record stack, portals | high | adapt/rewrite | Idle daemon selection, lock path, portal packages and capture change; niri provides `spawn-at-startup` and its own screenshot UI. |

## Hyprland-coupled files and niri replacement

| Coupled file | Coupling | niri replacement |
| --- | --- | --- |
| `shell/core/compositors/Hyprland.qml` | `hyprctl activewindow -j`, `hyprctl eval`, `hyprctl switchxkblayout` | new `shell/core/compositors/Niri.qml` using `niri msg --json focused-window`, KDL write + reload, `niri msg action switch-layout next`. |
| `shell/core/Compositor.qml` | hard-wired `Hyprland {}` | backend selection on `XDG_CURRENT_DESKTOP`. |
| `shell/core/Config.qml` | `hyprctl monitors -j`, `hyprctl eval` monitor apply, Lua keybind/startup writers, `~/.config/hypr` paths | read `niri msg --json outputs`; write `output "..." {}` KDL + reload; generate `binds.kdl` / `spawn-at-startup` KDL; path root per strategy. |
| `shell/core/HyprEffects.qml` + `shell/core/scripts/hypr-effects.sh` | `hyprctl -j getoption` (12 knobs), `hyprctl eval`, writes `window-effects.lua`/`gaps.lua` | read niri values (KDL/`layout`), write a `layout { ... }` KDL include and reload; apply knobs on Save (niri reload is smooth). Rename to `niri-effects.*` or keep the file name behind the adapter. |
| `shell/ui/bar/editor/HyprlandPage.qml` | labels/knobs for Hyprland effects | repurpose as a Niri appearance page; keep the shared `WindowBordersSection`. |
| `shell/ui/bar/editor/InputPage.qml` | `hyprctl getoption input:*` seeding | seed from `input {}` in `config.kdl`; write `input {}` include. |
| `shell/ui/bar/editor/persist-hypr.sh` | writes `user-animations.lua`, `user-input.lua`, `hyprctl reload` | write `animations.kdl`, `input.kdl` includes, `niri msg action load-config-file`. |
| `shell/ui/bar/editor/sysinfo.sh` | `hyprctl version`, `hyprctl monitors -j` | `niri msg version --json`, `niri msg --json outputs`. |
| `shell/ui/bar/popups/applauncher/appLauncher.qml` | `hyprctl eval` to exec | `niri msg action spawn -- <cmd>` or `Quickshell.execDetached`. |
| `shell/ui/settings/tabs/KeybindTab.qml` | `hyprctl eval` submap reset/passthru, Lua generation | write `binds.kdl`; niri submaps are not equivalent (see risks). |
| `shell/ui/panels/scale/ScalePicker.qml` | `hyprctl -j monitors` for scale | `niri msg --json outputs`, then `niri msg output <name> scale <n>` or KDL + reload. |
| `shell/ui/panels/davincix/DavincixPicker.qml` | `hyprctl monitors -j` | `niri msg --json outputs`. |
| `shell/ui/panels/focustime/focus_daemon.py` | `hyprctl activewindow -j`, `.socket2.sock`, `hyprlock` | `niri msg --json focused-window` + `niri msg --json event-stream`; lock detection via quickshell lock or `swaylock`/`gtklock`. |
| `shell/core/Theme.qml`, `Scaler.qml`, `SysData.qml` | `~/.config/hypr` paths; `SysData` hyprctl | path root per strategy; `SysData` -> niri IPC. |
| `nyx/front/MascotsOverlay.qml` | `hyprctl cursorpos`, `.socket2.sock` | no cursor IPC in niri; redesign (event stream for moods; pointer tracking needs an in-surface or `ext-image-copy-capture` approach). |
| `hyprland/config/hypr/*.lua` | `hl.*` API | `~/.config/niri/config.kdl` + modules. |
| `hyprland/config/hypr/hypridle.conf` | `hypridle` | niri `spawn-at-startup` + `swayidle`/`hypridle`-equivalent, or a niri-aware idle tool. |
| `hyprland/scripts/workspaces.sh`, `ws-desktops-lib.sh`, `qs_manager.sh` | `hyprctl` workspaces/monitors/dispatch, `.socket2.sock` | `niri msg --json workspaces/windows/outputs` + `niri msg --json event-stream`; `focus-workspace`/`move-window-to-workspace`. |
| `hyprland/scripts/restore-monitors.sh`, `monitor-manager.sh`, `persist-display-config.sh` | `hyprctl monitors -j`, `hyprctl eval hl.monitor` | `niri msg --json outputs` + `output` KDL + reload (or `niri msg output` runtime set as a first pass). |
| `hyprland/scripts/exit.sh` | `hyprctl eval hl.dsp.exit` | `niri msg action quit` / `power-off-monitors`. |
| `hyprland/scripts/reload.sh` | `qs ipc` + theme-sync | unchanged except the compositor reload path (niri auto-reloads). |
| `hyprland/scripts/idle-mode.sh` | `hypridle` process control | idle daemon of choice + niri idle events. |
| `hyprland/install.sh`, `uninstall.sh`, `dots/dots` | packages, `hyprland`/`quickshell` checks, `~/.config/hypr` | niri package, `niri`/`quickshell` checks, neutral or retained root, session registration. |
| `xturing/src/monitors.rs` | `hyprctl monitors -j`, `hyprctl eval hl.monitor`, display-config | `niri msg --json outputs`; write `output` KDL. |
| `xturing/src/actions.rs` | `~/.config/hypr/scripts` paths | path root per strategy. |
| `xturing/src/app.rs`, `catalog.rs` | hypr-effects.sh, persist-hypr.sh, idle-mode.sh, Hyprland page | call the niri equivalents; rename the page. |
| `theme-sync/themesync/cli.py`, `targets/nvim.py` | default `~/.config/hypr` paths | pass/derive paths from the chosen root. |
| `davincix/paths.sh` | default `~/.config/hypr/wallpapers` | set `DAVINCIX_WALLPAPER_DIR`/`WALLPAPER_DIR` to the chosen root. |
