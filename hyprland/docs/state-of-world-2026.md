# Hyprland — state of the ecosystem, November 2026

Verified on **2026-11-01** against primary sources: hyprwm/Hyprland **v0.57.0** (tag, release notes, `src/config/values/ConfigValues.cpp`, generated Lua stubs), wiki.hypr.land (`main`), Arch `extra` packages, quickshell.org, wayle.app, aylur.github.io/ags, lua.org. Version-sensitive claims below were checked against the v0.57.0 tag, not against the moving wiki.

## Verified versions

| Component | Latest | Notes |
|---|---|---|
| Hyprland | **v0.57.0** (2026-10-28) | Lua-only config; legacy hyprlang loader removed |
| Lua (embedded) | 5.5.1 | Hyprland builds against Lua `>=5.5 <5.6` |
| aquamarine | v0.15.1 | 2026-09-17 |
| hyprutils | v0.14.3 | 2026-10 |
| hyprlang | v0.6.8 | maintenance; no longer used as a runtime config provider |
| hyprwayland-scanner | v0.4.6 | 2026-04 |
| hyprgraphics | v0.5.1 | 2026-04 |
| hyprcursor | v0.1.13 | 2025-07 |
| hyprtoolkit | v0.6.0 | official C++ UI toolkit |
| hyprlock | v0.9.6 | 2026-07 |
| hypridle | v0.1.8 | 2026-07 |
| hyprpaper | v0.8.4 | 2026-04 |
| hyprpicker | v0.4.7 | 2026-05 |
| hyprsunset | v0.4.0 | Arch `extra` |
| xdg-desktop-portal-hyprland | v1.4.1 | 2026-07 |
| hyprlauncher | v0.1.7 | 2026-10 (Arch `extra`) |
| hyprpolkitagent | v0.2.0 | 2026-09 |
| hyprsysteminfo | v0.2.0 | 2026-04 |
| hyprshutdown | v0.1.1 | 2026-05 |
| hyprpwcenter | v0.1.2 | 2026-02 |
| hyprland-guiutils | v0.2.2 | active; successor of hyprland-qtutils (archived) |
| hyprland-qt-support | v0.1.0 | the "Hyprland" Qt Quick Controls style |
| Quickshell | v0.3.2 (2026-10-08) | docs quickshell.org; repo git.outfoxxed.me |
| Wayle | v0.7.0 (2026-07-25) | Rust/GTK4; compositor-agnostic |
| AGS (Astal+Gnim) | v3.1.2 (2026-04) | GTK + TS |
| Waybar | v0.15.0 (2026-02) | classic bar |
| SwayNC | v0.12.6 (2026-03) | notification center |
| hyprshot (community) | v1.3.0 | dormant; Arch `extra` |
| cliphist | v0.7.0 | Arch `extra` |

Arch package checks (2026-11-01, `extra`): `hyprland 0.57.0-1`, `quickshell 0.3.2-1`, `aquamarine 0.15.1-1`, `hyprutils 0.14.3-1`, `hyprlang 0.6.8-5`, `hyprcursor 0.1.13-7`, `hyprgraphics 0.5.1-4`, `hyprtoolkit 0.6.0-1`, `hyprlock 0.9.6-3`, `hypridle 0.1.8-2`, `hyprpaper 0.8.4-9`, `hyprpicker 0.4.7-4`, `hyprsunset 0.4.0-3`, `xdg-desktop-portal-hyprland 1.4.1-2`, `hyprlauncher 0.1.7-1`, `hyprpolkitagent 0.2.0-1`, `hyprshutdown 0.1.1-8`, `hyprpwcenter 0.1.2-9`, `hyprland-guiutils 0.2.2-4`, `hyprland-qt-support 0.1.0-14`, `lua 5.5.1-1`.

## What changed in 0.57.0 (the current baseline)

### Config provider: Lua only

- **The legacy hyprlang loader was removed** (`config: remove legacy config support`, #15539). `~/.config/hypr/hyprland.conf` is no longer read as hyprlang; a `.conf` path is parsed as **Lua** and fails (`attempt to call a nil value (global 'general')`).
- `hyprctl keyword` is no longer a registered IPC command. Use `hyprctl eval 'hl.config({...})'`.
- `hyprctl dispatch <arg>` is now a shorthand for `hl.dispatch(<arg>)`; pass a Lua expression such as `hyprctl dispatch 'hl.dsp.window.close()'`, not a legacy dispatcher string.
- `hyprctl reload` reloads Lua; `hyprctl reload full-reset` still recreates the Lua config context (it no longer switches providers).
- `hyprctl deprecated-config` lists config keys set with a deprecation notice; `hyprctl configerrors` still lists parse errors.

### Option ranges are enforced in Lua configs

- `Lua::fromGenericValue` now forwards `min`/`max`/`map`/validators (`config/lua: fix forwarding of details to lua values`, #15651). A value outside its range is a **config error** (`value 5 is more than the maximum of 4`), not silently accepted. The invalid option keeps its previous/default value; the rest of the config still loads.
- Practical consequence: generated config writers (settings UIs, theme tools, installers) must clamp values to the documented ranges before writing.

### New rendering and decoration options

- **Swappable blur variants** (`decoration.blur.variant`, string or index): `kawase` (0, default), `frost` (1), `ripple` (2), `drops` (3), `water` (4), `fluid_jar` (5), `prism` (6), `heat_shimmer` (7), `acrylic` (8), `aurora` (9), `haze` (10). Each variant owns a dotted option group; see the `hyprland-animations-decorations` agent.
- `decoration.blur.proportional` (bool, default false): blur strength proportional to pixel opacity.
- **Region-shaped backdrop blur**: Hyprland 0.57 advertises `ext_background_effect_manager_v1` v1. Quickshell's attached `BackgroundEffect.blurRegion: Region { ... }` can request blur only for a visible rounded region instead of a whole transparent layer surface. Pair it with `decoration.blur.variant = "acrylic"`/`frost`/... or a layer rule, never both.
- **Window wobble** (`decoration.wobble.*`): spring-based deformation on move/resize; `enabled`, `mesh` (12, 2-32), `stiffness` (200), `damping` (12), `mass` (1), `intensity` (0.2, 0-2 in v0.57.0), `value_epsilon`, `velocity_epsilon`.
- Renderer scene composition and pointer transforms are internal improvements; they expose no stable config surface.

### New options and categories

- `layers` category: `layers.allow_new_top_layers_over_existing_fullscreen` (true) and `layers.layers_hog_keyboard_focus` (true). `misc.layers_hog_keyboard_focus` is now a deprecated alias.
- `cursor.warp_on_monitor_change` (int, -1..2, default -1).
- `input.swallow_focus_click` (bool, false), `input.tablet.enabled` (bool, true).
- `misc.bell_sound` (string, `"default"`; `none`/empty mutes), `misc.new_float_force_onscreen` (2), `misc.float_force_onscreen` (0).
- `binds.drag_center_window` (true), `binds.client_requested_fs_uses_layout_handler` (true).
- `render.async_commit` (false), `render.not_shown_fifo_lock` (0..2).
- `debug.invalidate_buffers` (0..1); `debug.fifo_pending_workaround` removed.
- `quirks.skip_non_kms_dmabuf_formats` (true).
- Groupbar: `group.groupbar.indicator_height`, `rounding`, `rounding_power`, `gradient_rounding`, `gradient_rounding_power`; positional dragging re-added.
- `scrolling.follow_focus` changed from bool to int.

### Changed ranges/defaults

- `decoration.rounding` max **20 → 100**; `decoration.rounding_power` min **2 → 1**.
- `decoration.shadow.scale` range **0..1 → 0.05..2**.
- `input.scroll_factor` and `input.touchpad.scroll_factor` max **2 → 100**.
- `binds.workspace_back_and_forth` bool → int (0..2).
- `misc.exit_window_retains_fullscreen` bool → int (0..3).
- `dwindle/master.special_scale_factor` deprecated ("use workspace rules").
- `debug.invalidate_fp16` deprecated (use `debug.invalidate_buffers`).

### New rules and events

- Window rules: `no_glow`, `no_wobble`, `no_xdg_drags`, `active_border`, `inactive_border`.
- Workspace rules: `no_wobble`.
- Events: `config.unload`, `window.bell`, `window.minimize`, `window.update_state`, `workspace.created_early`; `workspace.created_early` vs `workspace.created` and `window.open_early` vs `window.open` now form documented early/late pairs.
- Socket2: `changeworkspaceid` event added; workspace events made consistent.

### Lua API additions

- `hl.get_devices()` → `HL.Device[]` (type, name, address, layout/keymap, caps/num lock, scroll factor, ...).
- `hl.get_monitors({ all = true })`.
- `hl.dsp.exec_cmd(cmd, rules?)` — `rules` is a table of window-rule effects applied to the spawned window (PID-based).
- `hl.dsp.reload_config()`.
- `hl.on("window.update_state", fn)` and `HL.WindowStateUpdate` (`float`, `pin`, nil = unchanged).
- Window objects gained `stable_id` (string), `addressable_name`, `hardware_details`, `keyboard_interactivity`, and a richer `mode` table.
- `hl.exec_cmd` is asynchronous; no `& disown` needed.

## Timeline of changes that break old knowledge

- v0.42 (2024-08): wlroots out → Aquamarine.
- v0.49 (2025-05): Permission Manager; hyprpm with sudo.
- v0.50 (2025-07): first test-suite (hyprtester); monitor v2 syntax; GLES 3.0 renderer floor.
- v0.51 (2025-09): configurable gestures; `hyprctl getprop`.
- v0.52 (2025-11): qtutils → guiutils (`misc.disable_hyprland_guiutils_check`).
- v0.53 (2025-12): window-rules rewrite; `start-hyprland` wrapper.
- v0.54 (2026-02): togglesplit/swapsplit removed; hyprpm Nix integration.
- v0.55 (2026-05): Lua config by default (Lua 5.5), Lua layout API, springs, glows, `hl.permission`/`hl.timer`/queries; hyprlang deprecated.
- v0.56 (2026-07): Lua REPL, full reload, Lua gestures, `.conf` deprecation notice (0.56.1), `--verify-config` tooling, `hyprctl instances`.
- **v0.57 (2026-10-28): Lua-only (legacy hyprlang removed); `hyprctl keyword` gone; option ranges enforced; blur variants, wobble, `layers` category, new rules/events/queries.**

## Visible roadmap

- No 1.0 milestone. The 0.57 line is the current stable; 0.58 is not released.
- hyprwire + hyprtavern (new IPC/session-bus direction): early development; today both UNIX sockets remain authoritative.
- Official UI: hyprtoolkit (C++) plus hyprlauncher/hyprpolkitagent/hyprpwcenter/hyprshutdown/hyprsysteminfo. Official QML is hyprland-qt-support (Qt Quick Controls style), not a shell.
- Quickshell 0.3.2 tracks Hyprland's workspace address format; Wayle and AGS are compositor-agnostic alternatives.

## Current documentation map

- Wiki: https://wiki.hypr.land/ — paths are lowercase and nested: `configuring/core/*` (config-options, binds + flags/gestures/submaps/devices/globals, dispatchers, rules/{window,layer,workspace}-rules, animations, environment-variables, autostart, advanced-configuration/{using-hyprctl,lua-utilities,events,notifications,permissions}), `configuring/layouts/*` (dwindle, master, scrolling, monocle, custom-layouts), `configuring/extra/*` (multi-gpu, virtual-gpu, performance, tearing, xwayland, systemd), `hypr-ecosystem/{dev,user}/*`, plus `plugins/`, `ipc/`, `nix/`, `crashes-and-bugs`, `contributing-and-debugging/*`.
- The wiki allows per-release snapshots (e.g. `/0.57.0/`). Prefer the tag artifacts for exact defaults/ranges; the `main` wiki may describe unreleased changes.
- Source of truth used by this pack: `hyprwm/Hyprland` **v0.57.0** tag → `src/config/values/ConfigValues.cpp` (defaults/ranges/deprecations), `src/config/lua/types/*` (Lua coercion), `meta/generateLuaStubs.py` output `/usr/share/hypr/stubs/hl.meta.lua` (API), `/usr/share/hypr/hyprland.lua` (example), `src/ipc/s1/Commands.cpp` (hyprctl/IPC), release notes.
- News: https://hypr.land/news (RSS hypr.land/rss.xml); blog.hyprland.org is down/irrelevant.
- Quickshell: https://quickshell.org/docs/v0.3.2/ (docs for 0.3.x); repo git.outfoxxed.me/quickshell/quickshell (GitHub `quickshell-mirror/quickshell` is a read-only mirror); changelogs under `changelog/`.
- Wayle: wayle.app, repo `wayle-rs/wayle`. AGS: aylur.github.io/ags. Waybar: `Alexays/Waybar`.
- Lua 5.5: https://www.lua.org/manual/5.5/ (Hyprland embeds upstream Lua; stubs are generated from source).

## Knowledge traps (2023-2024 → 2026)

1. `wiki.hyprland.org/Configuring/Variables` no longer exists → `wiki.hypr.land/configuring/core/config-options/`.
2. `exec-once =`, `env =`, `windowrule =`, `animation = bezier` are not valid on 0.55+; on **0.57+ any `.conf` is unreadable** — write Lua.
3. `hyprctl keyword` is gone in 0.57; do not emit it for modern targets. `hyprctl dispatch` takes a Lua `hl.dsp.*` expression.
4. Blur variants (acrylic/aurora/fluid_jar/...) are **0.57**, not 0.55. Blur `variant`, `proportional`, and wobble do not exist on 0.55/0.56.
5. A value outside its option range is now a config error in the Lua path (0.57); older releases accepted it silently. Check `Hyprland --verify-config` and `hyprctl configerrors`.
6. HyprPanel was never QML (it was AGS/GJS) and is archived; successor is Wayle.
7. "Quickshell at quickshell.outfoxxed.dev" → quickshell.org / .me; repo moved to git.outfoxxed.me (GitHub is a mirror).
8. hyprland-qtutils → archived (2025-11); successor hyprland-guiutils. It has no "QtScreenManager/QmlUtils" QML modules.
9. `trayicon*`, `groupopen`, `screenresize`, `lockactivegroup` are not socket2 events.
10. `misc.vfr` is a different option from `debug.vfr`; do not "migrate" VRR to VFR. `decoration.shadow.ignore_window` and `render.cm_fs_passthrough` are gone. `master.center_master_slaves_on_right` → `center_master_fallback`.
11. Bare `Hyprland` sessions are unsupported tooling-wise: use `start-hyprland` (0.53+); bare start logs a watchdog warning.
12. `hyprland.log` lives at `$XDG_RUNTIME_DIR/hypr/<instance>/hyprland.log`; `hyprctl rollinglog` follows the in-memory buffer.
13. "Hyprland in WSL with WSLg as a desktop" is not a supported desktop: WSL is a headless test rig (render-only node or `vgem` + `AQ_NO_KMS_REQUIREMENT=1`, view via wayvnc).
14. Lua is 5.5, not LuaJIT/5.1: no `bit` library; integers and bitwise operators are native; `global` declarations exist.
15. Quickshell layer surfaces: use `implicitWidth`/`implicitHeight`; assigning `width`/`height` on `PanelWindow`/`WlrLayershell` is deprecated in 0.3.x and forces a surface resize.
