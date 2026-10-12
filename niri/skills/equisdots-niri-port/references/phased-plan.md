# Phased migration plan

Ordered, incremental plan. Each phase is independently shippable and reversible.
Baseline: niri 26.04 (2026-04-25). Path strategy A (keep `~/.config/hypr`) is
assumed; switch to Strategy B only in phase 6 if desired.

## Phase 0 - Audit and baseline capture

- **Scope:** freeze the coupling inventory and the contracts before touching
  anything. No functional change.
- **Files:** read-only over the tree. Add `equisdots-niri-port` docs.
- **Deliverables:**
  - Confirmed list of every `hyprctl`/`.socket2`/`HYPRLAND_INSTANCE_SIGNATURE`
    call site (already enumerated in `component-matrix.md`).
  - A captured baseline of live state: `hyprctl -j monitors`,
    `hyprctl -j workspaces`, `hyprctl -j activewindow`, the current
    `settings.json`, `display-config`, `idle-settings.json`.
  - A `niri --version` / `niri validate` smoke run on a scratch `config.kdl`.
- **Verification:** `rg -n 'hyprctl|socket2|HYPRLAND_INSTANCE' shell hyprland nyx xturing`
  output matches the matrix; no unexplained call sites.
- **Rollback:** none needed (read-only).

## Phase 1 - Compositor backend and KDL config

- **Scope:** make the shell start under niri and drive basic bar data. Stand up
  a minimal niri config; do not yet replace every bypass.
- **Files:**
  - New: `shell/core/compositors/Niri.qml`,
    `shell/core/scripts/niri-workspaces.sh`,
    `~/.config/niri/config.kdl` + `modules/` (from the `hyprland` repo's KDL
    successor).
  - Edit: `shell/core/Compositor.qml` (backend selector on
    `XDG_CURRENT_DESKTOP`).
  - New repo payload (in `hyprland` or a new `niri` repo): `config/niri/*.kdl`
    covering `input`, `output`, `binds`, `layout`, `animations`, `window-rule`,
    `layer-rule`, `spawn-at-startup`.
- **Deliverables:** shell starts under niri; bar workspaces/keyboard/focus
  populate through the adapter; borders render from a generated include.
- **Verification:**
  - `niri validate` passes for the assembled config.
  - Under niri: `quickshell -p .../Shell.qml` shows the bar; workspace pills
    update on `Mod+1..9`; keyboard pill changes on `switch-layout`; focus pill
    tracks `niri msg --json focused-window`.
  - `niri msg action load-config-file` after a border write updates borders
    with no window restart.
- **Rollback:** switch `Compositor.qml` back to `Hyprland {}`; log out to
  Hyprland. The niri config is additive.

## Phase 2 - Replace hyprctl bypasses

- **Scope:** remove direct `hyprctl` calls from the shell and the coupled
  scripts so the UI no longer depends on the Hyprland backend.
- **Files:**
  - `shell/core/Config.qml` (monitors -> `niri msg --json outputs` + `output`
    KDL; keybind/startup writers -> `binds.kdl`/`spawn-at-startup`).
  - `shell/core/HyprEffects.qml` + `shell/core/scripts/hypr-effects.sh`
    (rewrite as `niri-effects` reading/writing `layout {}` KDL).
  - `shell/ui/bar/editor/{HyprlandPage,InputPage}.qml`, `persist-hypr.sh`,
    `sysinfo.sh`.
  - `shell/ui/bar/popups/applauncher/appLauncher.qml`,
    `shell/ui/settings/tabs/KeybindTab.qml`,
    `shell/ui/panels/{scale/ScalePicker,davincix/DavincixPicker}.qml`.
  - `hyprland/scripts/{scale-menu,monitor-manager,persist-display-config}.sh`.
  - `xturing/src/{monitors,actions,app,catalog}.rs`.
- **Deliverables:** no `hyprctl` in the running path; settings panel edits
  persist as KDL and survive a restart.
- **Verification:** `rg -n 'hyprctl' shell xturing` returns only comments/docs;
  apply a monitor layout from the panel and from xturing and confirm
  `niri msg --json outputs` matches the written KDL after `niri validate`.
- **Rollback:** keep the Hyprland implementations behind the adapter; revert the
  edited files from git.

## Phase 3 - Event stream

- **Scope:** replace `.socket2.sock` consumers with the niri event stream; make
  the workspace daemon push-driven.
- **Files:**
  - `shell/core/scripts/niri-workspaces.sh` (connect once, receive full state,
    apply deltas).
  - `hyprland/scripts/{workspaces,ws-desktops-lib,qs_manager}.sh` niri branches.
  - `shell/ui/panels/focustime/focus_daemon.py` (event stream + focused-window).
  - `nyx/front/MascotsOverlay.qml` (moods from window events; cursor redesign
    deferred or reduced-fidelity).
- **Deliverables:** workspace pills, focus daemon and mascots react to
  `niri msg --json event-stream` without polling.
- **Verification:** open/close/move windows and confirm pills and moods update;
  kill and restart the stream and confirm it rebuilds from the full snapshot
  (`WorkspacesChanged`/`WindowsChanged`).
- **Rollback:** the daemon can fall back to a low-cadence poll; revert the
  script and QML.

## Phase 4 - Idle, lock, portal, capture

- **Scope:** replace the Hyprland-specific session tooling.
- **Files:**
  - `hyprland/config/hypr/hypridle.conf` -> niri-compatible idle config
    (e.g. `swayidle` or a niri-aware daemon) driven by `spawn-at-startup`.
  - `hyprland/scripts/{idle-mode,lock,exit}.sh`.
  - `dots/dots` `doctor`/`system` package checks
    (`xdg-desktop-portal-hyprland` -> `xdg-desktop-portal-gtk`/`-gnome`).
  - `hyprland/scripts/{screenshot,scenes,wallpapers}.sh` where they touch
    `hyprctl`.
- **Deliverables:** idle/auto-lock, manual lock, screenshots/recording and
  portals work under niri; `idle-mode.sh` honors `idle-settings.json`.
- **Verification:** idle to lock; `SUPER+L` locks; a screenshot lands in the
  configured dir; a portal-using app (screenshot picker, file dialog) works.
- **Rollback:** re-enable `hypridle`/`hyprlock` only when back on Hyprland;
  niri keeps its own config, so Hyprland's files can stay untouched.

## Phase 5 - Installer, dots, session

- **Scope:** make installation and updates niri-first while keeping the stack
  deployable.
- **Files:**
  - `dots/dots` (`REPOS`, `sync_repo`, `doctor`, `system`).
  - `hyprland/install.sh` / a new `niri` repo installer (packages, session
    registration, PAM, SDDM session file).
  - `hyprland/uninstall.sh`.
  - wrapper generation unchanged.
- **Deliverables:** a fresh machine can `dots setup` into a niri session;
  `dots doctor` reports niri + quickshell; updates re-apply the KDL config.
- **Verification:** on a VM/clean user, run the install, select the niri session
  in SDDM, confirm the bar starts and `dots doctor` is green.
- **Rollback:** keep the Hyprland session registered alongside; uninstall only
  removes the niri payload.

## Phase 6 - Cleanup and parallel run

- **Scope:** remove dead Hyprland branches, document, and run both compositors
  side by side to shake out regressions.
- **Files:**
  - Docs: `shell/docs/*`, `hyprland/docs/*`, `web/content/docs/*` updated for
    niri.
  - Dead code: `hyprland/config/hypr/*.lua`, `Hyprland.qml` kept only if
    parallel-run is desired; otherwise remove.
  - Optional: execute Strategy B (neutral root + `EQUISDOTS_*`).
- **Deliverables:** a documented, single-source niri setup; both backends green
  in the parallel-run window; a decision recorded (ADR) on whether to drop
  Hyprland.
- **Verification:** full manual QA of the daily workflow under both
  compositors; `niri validate`; `scripts/check.sh` in `shell`, `hyprland`,
  `theme-sync`; `cargo test` in `xturing`.
- **Rollback:** the Hyprland payload and backend remain until the ADR says
  otherwise; git tags at each phase allow a clean revert.
