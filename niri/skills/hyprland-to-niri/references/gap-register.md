# Gap register: Hyprland concepts with weak or no niri equivalent

Baseline: source **Hyprland 0.55+/0.56**, target **niri 26.04** (2026-04-25).

This register catalogs every Hyprland concept that does not translate one-to-one
into niri. Status values:

- **none** - no equivalent exists in niri 26.04.
- **partial** - an equivalent exists but covers only part of the behavior.
- **different model** - niri has the capability, but it is expressed through a
  different abstraction; the migration is a redesign, not a rename.

Each entry lists the Hyprland concept, niri status, the impact on the equisdots
setup, and a recommended workaround. Workarounds that invent a niri option are
explicitly avoided; where nothing exists the correct action is to drop the feature
and record the decision in an ADR (`docs/adr/`).

## Summary

| # | Hyprland concept | niri status |
| --- | --- | --- |
| 1 | Dwindle / master layouts | different model |
| 2 | `hyprctl keyword` / `hyprctl eval` live config | none |
| 3 | Special / scratchpad workspaces | none |
| 4 | Static workspace index identity | different model |
| 5 | Per-namespace layer blur (`ignore_alpha`) | partial; no `ignore_alpha` |
| 6 | Decoration dim / blur variants | partial |
| 7 | `hyprpm` plugins | none |
| 8 | Submap keybind mode | none |
| 9 | Cursor position query (`hyprctl cursorpos`) | none |
| 10 | Per-device input sections | none |
| 11 | Window-rule / layer-rule syntax | different model |
| 12 | Animation leaf names | different model |
| 13 | Dispatchers as strings | different model |
| 14 | Monocle layout | different model |
| 15 | Named bezier curves | different model |
| 16 | Workspace pinned to a monitor at boot | different model |
| 17 | `on_created_empty` scratchpad autostart | none |
| 18 | Window swallowing | none |
| 19 | Tearing / `immediate` | none |
| 20 | Floating snap / `resize_on_border` / `extend_border_grab_area` | none / partial |
| 21 | Active/inactive opacity pair | partial |
| 22 | `follow_mouse` / `mouse_refocus` | partial |
| 23 | `no_hardware_cursors` / `no_warps` | none |
| 24 | Global `vrr` toggle | partial |
| 25 | `xwayland:force_zero_scaling` | none |
| 26 | `hyprctl setcursor` | partial |
| 27 | Bind flags `locked` / `repeating` / `submap` | partial |
| 28 | `hyprlock` / `hypridle` / `hyprpaper` / `hyprpicker` | partial / none |
| 29 | Animated border gradients (`borderangle`) | none |
| 30 | Compositor-specific environment variables | none |
| 31 | Bar/shell built against `hyprctl` (Quickshell glass) | partial |
| 32 | `xdg-desktop-portal-hyprland` | different model |
| 33 | Configurable touchpad gestures | none (built-in, fixed) |

---

## 1. Dwindle / master layouts and their knobs

- **Hyprland concept**: `general.layout = "dwindle" | "master" | "scrolling"`,
  plus `dwindle {}` and `master {}` tuning (`preserve_split`, `smart_split`,
  `smart_resizing`, `special_scale_factor`, `orientation`, ...).
- **niri status**: different model. niri has exactly one layout: an infinite,
  horizontally scrollable strip of columns, each column a vertical stack of
  windows. There is no dwindle, no master, and no `special_scale_factor`.
- **Impact**: any workflow that depends on split direction, master/stack ratio,
  or per-layout behavior must be rebuilt. Preset column widths, tabbed columns
  and maximize replace most of the practical value.
- **Recommended workaround**: adopt the scrollable model. Use
  `layout { preset-column-widths { proportion 0.33333; proportion 0.5; proportion 0.66667 } }`
  with `switch-preset-column-width`, `default-column-display "tabbed"`, and
  `maximize-column`. Record the loss of split semantics in an ADR.

## 2. `hyprctl keyword` / `hyprctl eval` live config

- **Hyprland concept**: mutate arbitrary options at runtime
  (`hyprctl keyword general:gaps_in 20`), and evaluate Lua with `hyprctl eval`.
  The equisdots Window Controls widget persists runtime overrides this way.
- **niri status**: none. niri has no keyword/eval IPC. The only runtime config
  mechanism is editing `config.kdl`; the file is live-reloaded on save.
- **Impact**: any runtime "settings" UI that patches the compositor directly must
  be redesigned. The equisdots Settings panel's compositor pages cannot rewrite
  niri state in place.
- **Recommended workaround**: have the UI write a KDL fragment
  (`include "user-*.kdl"`, Since: 25.11 for `include`; `optional=true` for
  optional includes Since: 26.04) and let niri reload it. niri also exposes
  `niri msg action load-config-file --path <file>` to load a specific config file
  at runtime. Where niri has a dedicated action (screenshot, opacity toggle,
  workspace naming, dynamic cast), call `niri msg action` instead. Accept that
  some toggles become file edits rather than instant one-shot calls.

## 3. Special / scratchpad workspaces

- **Hyprland concept**: `special:name` workspaces toggled with
  `workspace.toggle_special`, plus `on_created_empty` autostart.
- **niri status**: none. niri has no special/scratchpad workspaces. Workspaces
  are dynamic, vertical, per-monitor, and cannot be overlaid on top of the
  current one.
- **Impact**: the equisdots `special:terminal`, `special:files`, `special:music`
  scratchpads and their toggles have no direct replacement.
- **Recommended workaround**: emulate a scratchpad with a **floating window** and
  a dedicated window rule: give the app a fixed `app-id`/title, set
  `open-floating true`, `default-column-width`/`default-window-height` and a
  `default-floating-position`, then toggle visibility by launching/closing it or
  by moving it to a named workspace and focusing that workspace. A script over the
  niri event stream can approximate toggle behavior. There is no overlay
  semantics; the window participates in the normal layout.

## 4. Static workspace index identity

- **Hyprland concept**: workspaces 1..N have stable numeric identity; `Super+2`
  always goes to workspace 2, and window rules target `workspace = "2"`.
- **niri status**: different model. Workspaces have no intrinsic index. Index in
  `focus-workspace 2` means "whichever workspace is currently second on the
  focused monitor". Dynamic workspaces disappear when empty.
- **Impact**: all `Super+1..0` binds and `workspace = "N"` window rules change
  meaning; workspaces can be reordered and moved between monitors.
- **Recommended workaround**: declare **named workspaces** (Since: 0.1.6),
  optionally with `open-on-output`, and bind `focus-workspace "name"`. Use
  `open-on-workspace "name"` in window rules. Named workspaces always exist and
  stick to their output. The upstream docs advise *not* emulating static indices;
  if the workflow demands stable slots, names are the supported path.

## 5. Per-namespace layer blur (`ignore_alpha`)

- **Hyprland concept**: `hl.layer_rule({ namespace = ..., blur = true, ignore_alpha = 0.15 })`
  to blur the backdrop behind a layer-shell surface and skip transparent regions.
- **niri status**: partial, and weaker than a rule-for-rule port suggests. Since
  26.04, `layer-rule { background-effect { blur true } }` (and the equivalent
  window-rule form) blurs the **entire rectangle of the surface**, including its
  transparent areas. niri has **no `ignore_alpha`** and no per-surface alpha
  threshold. Forcing `background-effect { blur true }` ignores transparency and
  blurs the full surface bounds; the only shape-aware path is for the client to
  request the effect itself via `ext-background-effect`, which carries the
  surface's own blur region.
- **Impact**: forcing blur on a large, mostly transparent surface (popups,
  panels, overlays with big transparent padding or shadow margins) produces a
  **full-height blur sheet** around the visible contents instead of a
  shape-hugging blur. The equisdots Quickshell glass surfaces (`^quickshell$`,
  `^qs-master$`, `^qs-popups$`, `^qs-floating-overlay$`, `^qs-widget-`) all carry
  transparent host padding, so blanket forcing is actively harmful there.
- **Recommended workaround**: do **not** force `background-effect` on the large
  transparent namespaces. Instead have the Quickshell surfaces opt in with
  `ext-background-effect` (the shell declares the real blur region), and reserve
  a forced `background-effect { blur true }` for small surfaces that are fully
  opaque. Hyprland's `layerrule = blur, ignore_alpha=X` has **no direct
  equivalent** on niri; recreate the look client-side or drop it and record the
  decision. See `Configuration:-Layer-Rules.md#background-effect` and
  `Window-Effects.md`.

## 6. Decoration dim / blur variants

- **Hyprland concept**: `decoration { dim_inactive; dim_strength; blur { xray;
  ignore_opacity; vibrancy; contrast; brightness; special; popups } }` - many
  knobs including dimming and vibrancy.
- **niri status**: partial. Since 26.04 niri supports global `blur {}`
  (passes, offset, noise, saturation), per-window/layer `background-effect`
  (blur, xray, noise, saturation) and popup blocks. It does **not** support
  `dim_inactive`, `dim_strength`, vibrancy, contrast, or brightness.
- **Impact**: the equisdots `dim_inactive = true, dim_strength = 0.15` look is
  lost; blur can be recreated but not the vibrancy/contrast tuning.
- **Recommended workaround**: recreate blur with `blur { passes 3; offset 3.0;
  noise 0.02; saturation 1.5 }` and per-window/layer `background-effect`. Emulate
  dimming with a `window-rule { match is-active=false; opacity <v> }`. Drop
  vibrancy/contrast/brightness and record it.

## 7. `hyprpm` plugins

- **Hyprland concept**: `hyprpm` loads third-party C++ plugins that hook the
  compositor (custom layouts, effects, bars).
- **niri status**: none. niri has no plugin ABI and no `hyprpm` equivalent.
- **Impact**: any plugin dependency must be replaced by built-in niri behavior or
  a user-space tool. Plugins cannot be ported.
- **Recommended workaround**: identify each plugin's function and reimplement it
  with niri config primitives, custom layout shaders where supported, or a
  Wayland client (layer-shell/Quickshell) driven by the event stream. If nothing
  covers it, drop the plugin.

## 8. Submap keybind mode

- **Hyprland concept**: `submap` switches the whole bind table for modal resize
  or command modes (`hl.submap`).
- **niri status**: none. There is no submap/mode concept; all binds are always
  active.
- **Impact**: any modal keybinding layer (resize mode, launcher mode) must be
  redesigned.
- **Recommended workaround**: use distinct modifier chords (e.g. `Super+Ctrl+...`
  for resize) or delegate the modal UI to a client (a Quickshell/rofi mode) that
  captures input and then calls `niri msg action`. niri cannot switch bind tables.

## 9. Cursor position query

- **Hyprland concept**: `hyprctl cursorpos` returns the global pointer
  coordinates, used by overlays/mascots that follow the cursor.
- **niri status**: none. niri exposes no IPC request for the pointer position.
- **Impact**: any script that polls or reacts to pointer coordinates breaks.
- **Recommended workaround**: reimplement the feature inside a Wayland client
  that receives pointer events directly (a layer-shell surface with an input
  region), or drop the feature. There is no compositor query to call.

## 10. Per-device input sections

- **Hyprland concept**: `device { name = "..." ; sensitivity = ... }` per actual
  device, plus `per-device` overrides.
- **niri status**: none. Input is configured by device **type** only:
  `keyboard`, `touchpad`, `mouse`, `trackpoint`, `trackball`, `tablet`, `touch`.
  Per-device configuration is planned but not available in 26.04.
- **Impact**: settings that targeted a single physical mouse/keyboard cannot be
  expressed.
- **Recommended workaround**: fold the per-device settings into the type section
  if they apply to all devices of that type; otherwise drop them or set them
  externally with `libinput`/udev where possible. Record the gap.

## 11. Window-rule / layer-rule syntax

- **Hyprland concept**: one-line rules with a flat matcher
  (`hl.window_rule({ match = { class = "...", title = "..." }, float = true })`),
  and layer rules with `namespace`.
- **niri status**: different model. niri uses block rules with `match`/`exclude`
  directives and many properties (opening, dynamic, geometry, opacity, shadow,
  border, background-effect, popups). Matching is regex on `title`/`app-id`;
  layer matching is regex on `namespace`. Window rules are order-dependent and
  cannot be "unset" except by overriding.
- **Impact**: every rule must be rewritten structurally; `class` becomes `app-id`;
  combined same-line properties become multiple statements; some properties
  (`pin`, `immediate`, `swallow`) have no niri counterpart.
- **Recommended workaround**: port rule by rule using
  `Configuration:-Window-Rules.md` and `Configuration:-Layer-Rules.md`; use
  `niri msg pick-window` to discover `app-id`/`title`, `niri msg layers` for
  namespaces. Map-only properties that do not exist are listed in their own
  entries here.

## 12. Animation leaf names

- **Hyprland concept**: leaf names `windowsIn`, `windowsOut`, `windowsMove`,
  `fadeIn`, `fadeOut`, `fadeSwitch`, `fadeShadow`, `fadeDim`, `border`,
  `borderangle`, `workspaces`, `specialWorkspace`, plus styles
  (`popin 80%`, `slide`, `slidevert`, `loop`).
- **niri status**: different model. niri names are `window-open`, `window-close`,
  `window-movement`, `window-resize`, `horizontal-view-movement`,
  `workspace-switch`, `overview-open-close`, `screenshot-ui-open`,
  `config-notification-open-close`, `exit-confirmation-open-close`,
  `recent-windows-close`. Styles do not exist.
- **Impact**: leaf-by-leaf mapping is required; several Hyprland leaves have no
  niri counterpart, and Hyprland's `speed` does not map to niri's `duration-ms`.
- **Recommended workaround**: map the overlapping leaves, recreate pop-in with
  `custom-shader` (Since 0.1.6) if desired, drop `fadeSwitch`/`fadeShadow`/
  `fadeDim`/`border`/`borderangle`/`specialWorkspace`. Tune springs by feel.

## 13. Dispatchers as strings

- **Hyprland concept**: dispatchers are strings passed to `hl.dsp.*` and
  `hyprctl dispatch`, e.g. `hl.dsp.window.move({ direction = "l" })`.
- **niri status**: different model. Actions are structured KDL nodes inside a
  bind, e.g. `Super+Left { move-column-left; }`, and IPC actions are subcommands
  `niri msg action <name>`. The full catalog is printed by `niri msg action`.
- **Impact**: scripts that build dispatcher strings must be rewritten to the
  subcommand form, and direction is split into separate actions (column vs
  window, left/right vs up/down).
- **Recommended workaround**: translate each dispatcher to the corresponding
  action, consult `niri msg action` for the authoritative list, and use
  `niri msg --print-request` (next release) or `niri msg raw-request` when
  talking to the socket directly.

## 14. Monocle layout

- **Hyprland concept**: not built in upstream, but common via plugins/emulation; many setups emulate it
  with a fullscreen/master layout; the equisdots config uses dwindle.
- **niri status**: different model. niri has no named monocle layout, but the
  behavior exists through `maximize-column` (column fills the view),
  `fullscreen-window`, `toggle-windowed-fullscreen` (Since 25.05) and the
  `default-column-display "tabbed"` mode with all windows in one tabbed column.
- **Impact**: a "one window at a time" workflow is achievable but configured
  differently.
- **Recommended workaround**: bind `maximize-column` and `fullscreen-window`; for
  true monocle, set `default-column-width { proportion 1.0; }` and use tabbed
  columns. Record the mapping.

## 15. Named bezier curves

- **Hyprland concept**: `hl.curve("overshot", { type = "bezier", points = {{0.13,0.99},{0.29,1.15}} })`
  then referenced by name.
- **niri status**: different model. niri has no named curves. It offers fixed
  curves (`ease-out-quad`, `ease-out-cubic`, `ease-out-expo`, `linear`) and
  `cubic-bezier x1 y1 x2 y2` (Since 25.08), plus springs.
- **Impact**: every named Hyprland curve must be inlined as `cubic-bezier` or a
  spring; curve names in the config lose meaning.
- **Recommended workaround**: convert each named curve's control points to
  `curve "cubic-bezier" <x1> <y1> <x2> <y2>`, or approximate with springs for
  movement. `overshot` (which overshoots) is best approximated with an
  underdamped spring (`damping-ratio < 1.0`).

## 16. Workspace pinned to a monitor at boot

- **Hyprland concept**: `hl.workspace_rule({ workspace = "1", monitor = "desc:...", default = true })`
  pins workspace N to a physical monitor at startup.
- **niri status**: different model. Workspaces belong to monitors dynamically and
  are sorted by name on auto-placement. There is no `monitor =` rule for
  workspaces, but **named** workspaces accept `open-on-output` (Since 0.1.6,
  multiple since next release), and `output { focus-at-startup }` picks the
  initial focus.
- **Impact**: the equisdots "laptop = 1, externals leftwards 2/3/4" boot layout
  cannot be expressed with numeric pins.
- **Recommended workaround**: declare named workspaces with `open-on-output`
  (matched by connector, or manufacturer/model/serial Since 0.1.9) and set
  `focus-at-startup` on the primary output. Workspaces then stick to their
  output. For dynamic multi-monitor profiles, use `kanshi`.

## 17. `on_created_empty` scratchpad autostart

- **Hyprland concept**: `workspace_rule({ workspace = "special:files", on_created_empty = "nautilus" })`
  lazily launches an app when the empty special workspace is created.
- **niri status**: none. There is no lazy "on empty workspace created" hook and
  no special workspaces.
- **Impact**: lazy scratchpad launches are lost.
- **Recommended workaround**: start the app eagerly with `spawn-at-startup` and
  place it on a named workspace, or launch it on first use from a bind (the bind
  spawns the app, then focuses its workspace). Logic that waits for an event can
  be built on the `niri msg event-stream`.

## 18. Window swallowing

- **Hyprland concept**: `misc.enable_swallow` + `misc.swallow_regex` hides a
  window (e.g. terminal) while its child window (e.g. file viewer) is open.
- **niri status**: none.
- **Impact**: the equisdots `swallow_regex = "^(kitty)$"` behavior is lost.
- **Recommended workaround**: none within niri. A script could listen to the
  event stream and move/minimize the parent, but there is no minimize and no
  swallow, so this is effectively dropped. Record it.

## 19. Tearing / `immediate`

- **Hyprland concept**: `general.allow_tearing` plus `window_rule({ immediate = true })`
  to allow tearing for fullscreen games.
- **niri status**: none. niri exposes no tearing control.
- **Impact**: no async-tearing option for games; presentation is always vsynced
  by the compositor.
- **Recommended workaround**: run games in fullscreen and accept vsync, or use
  `gamescope` for a game-specific presentation path. Record the gap.

## 20. Floating snap / `resize_on_border` / `extend_border_grab_area`

- **Hyprland concept**: `general.snap { enabled, monitor_gap, window_gap }`,
  `resize_on_border`, `extend_border_grab_area`.
- **niri status**: none / partial. niri resizes with `Mod` + right mouse
  (`resize-window`) and moves with `Mod` + left mouse. There is no snapping
  engine and no configurable border grab area.
- **Impact**: floating windows no longer snap to edges/gaps/each other; edge
  resize handles are absent (especially with `prefer-no-csd`).
- **Recommended workaround**: accept manual floating placement, or add
  `device`-independent client-side snapping (e.g. a Quickshell/toolkit feature).
  Keep `prefer-no-csd` off if edge resize handles are required.

## 21. Active/inactive opacity pair

- **Hyprland concept**: `decoration.active_opacity` and
  `decoration.inactive_opacity`, plus per-window `opacity = "active inactive"`.
- **niri status**: partial. niri has a single `opacity` property (window and
  layer rules). There is no global active/inactive opacity setting.
- **Impact**: the equisdots 0.85/0.80 pair and the per-app pairs must be split.
- **Recommended workaround**: one rule for the inactive state
  (`match is-active=false`) and per-app `opacity` for the active state. niri
  applies opacity on top of the window's own alpha, so values may need retuning.

## 22. `follow_mouse` / `mouse_refocus`

- **Hyprland concept**: `input.follow_mouse` (0/1/2/3) and `input.mouse_refocus`.
- **niri status**: partial. niri has `focus-follows-mouse` (with optional
  `max-scroll-amount`). There is no `mouse_refocus`.
- **Impact**: fine-grained follow-mouse modes (e.g. focus without raising) are
  not configurable; the refocus-on-window-open nuance is gone.
- **Recommended workaround**: use `focus-follows-mouse` and, if edge-trigger
  scrolling is a problem, `focus-follows-mouse max-scroll-amount="0%"`. Drop
  `mouse_refocus`.

## 23. `no_hardware_cursors` / `no_warps`

- **Hyprland concept**: `cursor.no_hardware_cursors` and `cursor.no_warps`
  disable hardware cursor planes and automatic cursor warps.
- **niri status**: none. niri has no toggle for hardware cursors and no warp
  suppression; `warp-mouse-to-focus` is the *opt-in* opposite. There is a
  `disable-cursor-plane` **debug** option for VRR cursor issues, but it is not a
  general replacement.
- **Impact**: cursor rendering/warp tuning is unavailable.
- **Recommended workaround**: leave defaults. If VRR causes low-framerate cursor
  motion, use the `disable-cursor-plane` debug option. Record the gap.

## 24. Global `vrr` toggle

- **Hyprland concept**: `misc.vrr` (global) and per-window VRR.
- **niri status**: partial. niri configures `variable-refresh-rate` per output,
  optionally `on-demand=true` (Since 0.1.9) driven by a
  `variable-refresh-rate true` window rule. There is no single global toggle.
- **Impact**: a global on/off VR setting becomes per-output config, and
  on-demand VR is expressed via window rules rather than Hyprland's global flag.
- **Recommended workaround**: set `variable-refresh-rate on-demand=true` on each
  output and add `window-rule { match app-id="^mpv$"; variable-refresh-rate true }`
  for content that needs it.

## 25. `xwayland:force_zero_scaling`

- **Hyprland concept**: `xwayland { force_zero_scaling = true }` renders Xwayland
  without fractional scaling to avoid blurry X11 apps.
- **niri status**: none. X11 is delegated to `xwayland-satellite`, which niri
  spawns automatically (Since 25.08). There is no `force_zero_scaling` option.
- **Impact**: X11 app scaling behavior differs; some X11 apps may be blurry under
  fractional scale.
- **Recommended workaround**: prefer native Wayland for apps that support it
  (Electron flags, `MOZ_ENABLE_WAYLAND`, `PROTON_ENABLE_WAYLAND`). For stubborn
  X11 tools, run them in a nested compositor (`labwc`, `cage`, `gamescope`) or
  accept the scaling. See the Xwayland wiki page.

## 26. `hyprctl setcursor`

- **Hyprland concept**: `hyprctl setcursor <theme> <size>` at runtime.
- **niri status**: partial. niri sets the cursor theme/size via the static
  `cursor { xcursor-theme; xcursor-size }` config (also exports `XCURSOR_THEME`/
  `XCURSOR_SIZE`). There is no runtime setcursor IPC.
- **Impact**: runtime cursor switching must become a config edit + live reload.
- **Recommended workaround**: put theme/size in `cursor {}`; for toggling, write
  an `include`d KDL file and save. Note that already-running clients may not
  update until restarted.

## 27. Bind flags `locked` / `repeating` / `submap`

- **Hyprland concept**: `hl.bind(..., { locked = true, repeating = true })` and
  submaps.
- **niri status**: partial. niri has `allow-when-locked=true` (Since 0.1.5, for
  `spawn`) and `allow-inhibiting=false`; binds repeat by default (Since 0.1.8) and
  can be disabled with `repeat=false`; `cooldown-ms` rate-limits. There is no
  submap.
- **Impact**: `locked` maps cleanly only for spawns; other locked bind semantics
  may differ. Submap-based modes are lost.
- **Recommended workaround**: use `allow-when-locked=true` on lock-screen binds
  (volume/brightness/screenshot), rely on default repeat behavior, and redesign
  submaps as modifier chords or a client-side mode.

## 28. `hyprlock` / `hypridle` / `hyprpaper` / `hyprpicker`

- **Hyprland concept**: the Hyprland-family tools, including the equisdots
  quickshell lock invoked by `hypridle.conf`.
- **niri status**: partial / none. `hyprpaper` (none, Hyprland-only),
  `hyprlock` (not part of niri; use `swaylock`, `gtklock`, or an ext-session-lock
  locker), `hypridle` (partial; `swayidle` is the documented path, with
  `niri msg action power-off-monitors` for DPMS), `hyprpicker` (partial; niri has
  a built-in picker via `niri msg pick-color`).
- **Impact**: the entire lock/idle/wallpaper/picker stack must be replaced.
- **Recommended workaround**: `swaylock` (bind with `allow-when-locked=true` for
  recovery), `swayidle` as a systemd unit, `swaybg`/`wbg` for wallpaper, and
  `niri msg pick-color` for color picking. The quickshell lock may work if it
  uses `ext-session-lock-v1`; verify.

## 29. Animated border gradients (`borderangle`)

- **Hyprland concept**: `hl.animation({ leaf = "borderangle", style = "loop" })`
  animates a border gradient continuously.
- **niri status**: none. niri supports static `active-gradient`/`inactive-gradient`
  on `border`, `focus-ring` and `tab-indicator`, but no animation of the border.
- **Impact**: the animated border look is lost.
- **Recommended workaround**: use a static gradient, or move the animation into a
  client (Quickshell panel/border overlay). niri cannot animate borders.

## 30. Compositor-specific environment variables

- **Hyprland concept**: `HYPRLAND_LOG_WLR`, `HYPRLAND_INSTANCE_SIGNATURE`,
  `XDG_CURRENT_DESKTOP=Hyprland`, and the global `GDK_BACKEND`, plus
  `xwayland:force_zero_scaling`-adjacent vars.
- **niri status**: none. Those variables are meaningless on niri; niri-session
  sets `XDG_CURRENT_DESKTOP=niri`/`XDG_SESSION_TYPE=wayland` itself. The docs
  explicitly warn that a global `GDK_BACKEND` breaks the screencast portal.
- **Impact**: scripts/env relying on Hyprland variables break, and a leftover
  global `GDK_BACKEND` can disable screencasting.
- **Recommended workaround**: remove `HYPRLAND_LOG_WLR`, the hardcoded
  `XDG_*DESKTOP` values and the global `GDK_BACKEND`. Use `$NIRI_SOCKET` for
  socket discovery and let niri-session manage session env.

## 31. Bar/shell built against `hyprctl` (Quickshell glass)

- **Hyprland concept**: the equisdots Quickshell shell reads `hyprctl` output and
  listens on `.socket2.sock`; layer blur provides the glass effect.
- **niri status**: partial. Quickshell itself runs on niri via layer-shell, and
  niri can blur the same namespaces (26.04). But the shell's data layer and
  controls must switch from `hyprctl`/socket2 to `niri msg`/event-stream, and any
  runtime "settings" that patched the compositor must be redesigned (see entry 2).
- **Impact**: the shell will start but show wrong/empty data until ported; the
  Window Controls and panel Settings pages lose their live-patch path.
- **Recommended workaround**: port the IPC layer (Phase 12 of the checklist) to
  `niri msg --json` and `niri msg --json event-stream`; keep layer namespaces so
  the Phase 9 layer rules apply unchanged; rewrite compositor-mutating controls
  to write KDL and reload.

## 32. `xdg-desktop-portal-hyprland`

- **Hyprland concept**: the Hyprland portal backend for screenshots and
  screencasting.
- **niri status**: different model. niri uses `xdg-desktop-portal-gnome` for
  screencasting (plus `gtk` as fallback and a Secret backend), configured via
  `niri-portals.conf`. Portals require running niri as a session.
- **Impact**: the Hyprland portal must be removed and the niri portal set
  installed and configured, otherwise Flatpak and screencast features break.
- **Recommended workaround**: remove `xdg-desktop-portal-hyprland`; install
  `xdg-desktop-portal-gnome`, `xdg-desktop-portal-gtk`, and `gnome-keyring` (or
  `oo7-portal`); install `niri-portals.conf`; always start via `niri-session` or
  a display manager.

## 33. Configurable touchpad gestures

- **Hyprland concept**: `hl.gesture({ fingers = 3, direction = "horizontal", action = "workspace" })`
  binds a swipe to an arbitrary action, including workspace switching.
- **niri status**: none (built-in, fixed). niri's touchpad gestures are hardcoded:
  three-finger vertical swipe switches workspaces, three-finger horizontal swipe
  moves the view, four-finger vertical swipe toggles the Overview (Since 25.05).
  The `gestures {}` block configures only DnD edge scrolling (Since 25.02) and
  hot corners (Since 25.05); it cannot bind a swipe to a chosen action.
- **Impact**: the equisdots three-finger **horizontal** workspace swipe becomes a
  three-finger **vertical** swipe; the axes cannot be remapped.
- **Recommended workaround**: adopt the built-in mapping. Users who must keep
  horizontal workspace swipes can use mouse middle-drag (`Mod` + middle mouse
  vertical drag) or keys instead. Record the axis change.

---

## Decision log

For every entry that changes daily behavior, record the outcome:

| Gap | Decision (approximate / drop) | ADR |
| --- | --- | --- |
| | | |

## See also

- `migration-checklist.md` - the ordered steps that consume this register.
- `verification.md` - how to confirm each workaround actually works.
