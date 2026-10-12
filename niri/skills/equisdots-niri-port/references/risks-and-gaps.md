# Risks and gaps

Risk register for the Hyprland -> niri port of equisdots. Baseline: niri 26.04
(2026-04-25). Impact and likelihood are qualitative (high/medium/low) and
reflect user-visible effect and probability of hitting the issue.

## Feature gaps and risks

| Risk | No-niri-equivalent detail | Impact | Likelihood | Mitigation |
| --- | --- | --- | --- | --- |
| Dwindle/master layouts | niri is a scrollable column tiler; no dwindle/master, no per-layout knobs (`settings.lua` layout options, `layoutmsg`). | Medium | Certain | Accept the scrollable model; express intent with `default-column-width`, `preset-column-widths`, `default-column-display`, `open-maximized`. Document the change; no parity target. |
| `hyprctl eval` live config patching | niri has no arbitrary runtime eval; only `niri msg output` sets anything at runtime. | Medium | Certain | Write KDL includes and reload (`niri msg action load-config-file`). niri reload of `layout` does not restart windows, so the "preview while dragging, persist on close" split in `HyprEffects.qml` collapses to one write per change. Keep debounce. |
| Scratchpads / special workspaces | niri has no `special:*` workspaces or `on_created_empty`. | Medium | Certain | Use named workspaces (`workspace "files" {}`) + `window-rule { open-on-workspace "files" }`, toggled with `niri msg action focus-workspace "files"`. Floating scratch behavior needs a rule, not a special workspace. |
| Static workspace identity | niri workspaces are dynamic; `id` is opaque, `idx` changes. `settings.json -> workspaceCount`, `SUPER+1..9`, `unifiedDesktops` and window-rule workspace assignments assume fixed `1..N`. | High | High | Commit to **named workspaces** for the slots the user pins (stable identity), and render a dynamic list otherwise. Redesign `ws-desktops-lib.sh` unified mode around output + named workspace. This is the largest behavioral redesign. |
| Live border/gap/effect knobs | Hyprland reads/writes individual options via `hyprctl getoption/eval`; niri has no partial live setter. | Low | High | Generate a `layout {}` KDL include, reload. Acceptable because niri reload is smooth. Validate every write with `niri validate`. |
| Animation leaf names | Hyprland's 12 leaves (`windowsIn`, `border`, `borderangle`, `fadeDim`, `specialWorkspace`, ...) do not map 1:1. niri exposes `workspace-switch`, `window-open`, `window-close`, `horizontal-view-movement`, `window-movement`, `window-resize`, `config-notification-open-close`, `overview-open-close`, and a few more. | Low | Certain | Remap in `persist-niri`/`niri-effects`: `windowsIn/Out -> window-open/close`, `workspaces -> workspace-switch`, `windowsMove -> window-movement/resize`. Drop `borderangle` (no equivalent). The Animations page keeps `enabled` + `slowdown` only. |
| Layer blur by namespace | niri **does** support it: `layer-rule { match namespace="^qsmaster$"; background-effect { blur true } }`. | Low | Low | Near-1:1 port of `layers.lua`. Watch the `prefer-no-csd` interaction and non-xray cost. |
| Cursor position | niri has **no** cursor-position IPC request (`cursorpos` does not exist). `nyx` eye tracking polls `hyprctl cursorpos`. | Medium | Certain | Reduced-fidelity redesign: track pointer via surface hover where the overlay receives events, or drop eye tracking, or use `ext-image-copy-capture`-based tracking (heavier). Do not assume parity. |
| Monitor mirroring | Hyprland `monitor(..., mirror=...)`; niri 26.04 has no documented output mirror option. | Medium | Medium | Validate; if absent, drop mirroring from `Config.qml`/`MonitorsTab` or document a manual workaround. This is an open question. |
| HDR / color management / bit depth | Hyprland exposes `cm`, `bitdepth`, `sdrBrightness`, `sdrSaturation`; niri 26.04 color management is limited. | Medium | Medium | Map what niri exposes (`max-bpc`, backdrop/color options if any); hide/disable the rest in `MonitorsTab`/xturing. Validate on HDR hardware. |
| Per-device keyboard layout | Hyprland `switchxkblayout <device> next`; niri `switch-layout next` is global (with optional per-window `track-layout`). | Low | Low | `niri msg action switch-layout next`. If multi-keyboard separation matters, accept the global behavior or use `track-layout "window"`. |
| VRR semantics | Hyprland `vrr` 0/1/2 (2 = fullscreen-only); niri `variable-refresh-rate` is on/off. | Low | Medium | Expose a boolean in the UI; drop the "fullscreen-only" state. |
| Window-rule matching | Hyprland matches `class`; niri matches `app-id` (Wayland) and needs remapping for XWayland windows, plus per-app differences. | Medium | High | Re-author `windowrules.lua` as KDL `window-rule`s; identify each app with `niri msg pick-window`. |
| Idle daemon | `hypridle` is Hyprland-specific (`.socket2` listeners). | Medium | Certain | Use `swayidle` (idle-hint based) or a niri-aware idle tool started via `spawn-at-startup`; keep `idle-mode.sh` semantics (`awake` stops it). |
| Lock screen | `hyprlock` is Hyprland-specific; the shell's `Lock.qml` uses `WlSessionLock` (compositor-agnostic) but `lock.sh`/PAM assume the flow. | Low | Low | Keep `Lock.qml` via `WlSessionLock` (niri supports it) or use `swaylock`/`gtklock`. Verify PAM service (`/etc/pam.d/quickshell`) works from niri. |
| Color picker | `hyprpicker` is Hyprland-specific. | Low | Low | `niri msg action pick-color` (26.04) or an independent picker. |
| NVIDIA env / session | Hyprland-specific env in `env.lua` (`GBM_BACKEND`, `LIBVA_DRIVER_NAME`, etc.). | Medium | Medium | Port the generic Wayland parts; follow niri's NVIDIA guidance. Validate the Optimus `gpu-mode.sh` switch under niri. |
| Portal | `xdg-desktop-portal-hyprland` is replaced. | Low | Certain | Install `xdg-desktop-portal-gtk`/`-gnome` + `xdg-desktop-portal-wlr`/niri portal; update `hooks/dots`. |
| `.socket2.sock` consumers | Every `.socket2` reader (workspaces, nyx, focus daemon) must move to `niri msg --json event-stream`. | Medium | Certain | Rewrite consumers; remember the full-state-up-front contract and that output events are absent in 26.04. |
| Output hotplug reconciliation | niri 26.04 emits no output events; `restore-monitors.sh` polls `hyprctl monitors`. | Medium | Medium | Poll `niri msg --json outputs` on a low cadence + on a manual trigger; keep the display-config format or switch to KDL. |
| `hyprctl` in `Config.qml` monitor canvas | Field shapes differ (`mirrorOf`, `currentFormat`, `availableModes` strings, transforms). | Medium | High | Rewrite the reader against `niri msg --json outputs`; re-validate the layout canvas and `display-config` round-trip. |

## Unknowns and assumptions to validate

| Item | Assumption | How to validate |
| --- | --- | --- |
| `layout {}` deep-merge via `include` | A generated include can override gaps/borders without clobbering the main `layout` | Author a two-file config and run `niri validate`; toggle a value at runtime |
| Global border via `layout` include | The equisdots "window border" concept maps to `layout { border { active-color } }` | Visual check under niri; confirm active vs inactive |
| `XDG_CURRENT_DESKTOP` value | The niri session sets a value containing `niri` | Print it inside the session; keep a probe fallback |
| `niri msg output` runtime set | Good enough for a first monitor manager before KDL | Apply at runtime, then inspect `niri msg outputs` |
| Quickshell layer behavior | `WlrLayershell` exclusive zones, masks and `WlSessionLock` behave under niri | Run the bar, nyx notch reserve and `Lock.qml` under niri |
| Event-stream re-emit loop cost | Re-emitting on every event is cheap enough | Profile window drag/resize with the daemon running |
| Mirror support | niri can or cannot mirror outputs | Check `niri msg --json outputs` and upstream docs |
| HDR/color management | niri covers enough of `cm`/`bitdepth` for the UI | Test on HDR hardware; hide unsupported knobs |
| `prefer-no-csd` need | Borders/blur look right without extra flags | Toggle and compare with the Hyprland look |
| Theme-sync target paths | All targets resolve the neutral/preserved root correctly | Run `theme-sync --dry-run` under the chosen strategy |

## Rollback posture

Keep the Hyprland config and backend present through phase 6. Both compositors
read the same `settings.json` and palette store under Strategy A, so a broken
niri session can log back into Hyprland without data changes. Only remove the
Hyprland payload after the parallel-run window and an explicit ADR.
