# Hyprland to niri migration checklist

Baseline: source **Hyprland 0.55+/0.56 Lua config**, target **niri 26.04**
(2026-04-25). niri is versioned by date, not semver. All niri options referenced
here exist in 26.04 unless a `Since:` tag says otherwise. Where a Hyprland
feature has no niri equivalent the item is marked **(gap)** and cross-referenced
to `gap-register.md`.

Run every step in order. Do not delete the Hyprland config until the last phase
completes. Every checkbox names the exact file or command and the result that
proves it worked.

## Phase 0 - Pre-migration inventory

- [ ] Record the Hyprland version and validate the source config.
  Command: `hyprctl version` and `hyprctl configerrors`.
  Result: a version line (e.g. `Hyprland, built from branch ... 0.56.x`) and
  an empty error list from `configerrors`.

- [ ] Snapshot the full source tree.
  Command: `find ~/.config/hypr -type f | sort > /tmp/hypr-config-files.txt`.
  Result: a complete file list to diff the migration against later.

- [ ] Enumerate every compositor-specific touchpoint in the config and scripts.
  Command:
  `rg -n "hyprctl|socket2|HYPRLAND_INSTANCE_SIGNATURE|hl\\.|hyprlock|hypridle|hyprpaper|hyprpicker|xdg-desktop-portal-hyprland" ~/.config/hypr`.
  Result: a classified list (portable as-is / needs adaptation / needs a rewrite).
  For the equisdots tree the known touchpoints are `hyprctl`, `hl.*`,
  `hypridle.conf`, the Quickshell lock, `hyprpicker`, `restore-monitors.sh` and
  the `xdg-desktop-portal-hyprland` package.

- [ ] Capture the live hardware and window state for later comparison.
  Commands: `hyprctl monitors all`, `hyprctl clients`, `hyprctl workspaces -j`.
  Result: saved output (connector names, EDID descriptions, positions, scales,
  refresh rates) to seed the niri `output` blocks.

- [ ] Record the session environment and the scaling story.
  Command: `env | sort`.
  Result: especially `GDK_BACKEND`, `QT_QPA_PLATFORM`, `GBM_BACKEND`,
  `LIBVA_DRIVER_NAME`, `XCURSOR_*`, `SDL_VIDEODRIVER`, `PATH`.

- [ ] List the packages that implement compositor-adjacent services.
  Command (Arch): `pacman -Qq | rg -i "hypr|quickshell|waybar|sway|wl-|rofi|kitty|nautilus|firefox|polkit|keyring"`.
  Result: the replacement list for Phase 1.

- [ ] Write the ADR for every "no equivalent" decision found in Phase 0.
  File: `docs/adr/NNNN-<topic>.md` (one per gap that changes behavior).
  Result: a recorded decision, referenced from `gap-register.md`.

## Phase 1 - Install niri and companions

- [ ] Install niri and its session/integration binaries.
  Arch:
  `sudo pacman -Syu niri xwayland-satellite xdg-desktop-portal-gnome xdg-desktop-portal-gtk xdg-desktop-portal pipewire wireplumber`.
  Fedora:
  `sudo dnf install niri xwayland-satellite xdg-desktop-portal-gnome xdg-desktop-portal-gtk`.
  Debian/Ubuntu 25.10+:
  `sudo apt install niri xwayland-satellite xdg-desktop-portal-gnome xdg-desktop-portal-gtk`.
  Result: `niri --version` prints a version at or above `26.04`.

- [ ] Install `xwayland-satellite` >= 0.7 (needed for the built-in Xwayland
  integration introduced in 25.08).
  Command: `xwayland-satellite --version`.
  Result: version `>= 0.7`. niri creates the X11 socket and spawns it on demand;
  do **not** start it manually from the config.

- [ ] Install the Secret portal backend.
  Arch: `sudo pacman -S gnome-keyring` (or `oo7-portal`).
  Result: `systemctl --user status gnome-keyring-daemon` is available; the
  Secret portal resolves.

- [ ] Install the authentication agent for polkit prompts.
  Arch: `sudo pacman -S polkit-kde-agent` (or `polkit-gnome`).
  Result: a polkit agent binary exists at a path the session will start.

- [ ] Install `nautilus` if using the provided `niri-portals.conf`.
  Result: `nautilus` on `PATH`; otherwise file choosers fail because
  `xdg-desktop-portal-gnome` uses nautilus as the chooser since 47.0, or set
  `org.freedesktop.impl.portal.FileChooser=gtk;` in the portals conf.

- [ ] Install a lock/idle/wallpaper stack (see Phases 13-14).
  Command: `sudo pacman -S swayidle swaybg` (or `swaylock`, `gtklock`, `wbg`).
  Result: binaries on `PATH`.

- [ ] Verify the portal services can start on demand.
  Command: `systemctl --user status xdg-desktop-portal xdg-desktop-portal-gnome`.
  Result: both `active (running)` or `inactive (dead)` but activatable after
  login through a niri session (portals **require** `niri-session` or a DM).

## Phase 2 - Back up the Hyprland configuration

- [ ] Copy the whole source tree out of the way.
  Command: `cp -a ~/.config/hypr ~/.config/hypr.bak.$(date +%F)`.
  Result: `~/.config/hypr.bak.<date>` exists and is a byte copy.

- [ ] Back up the scripts directory separately if it is not under `~/.config/hypr`.
  Command: `cp -a ~/.config/hypr/scripts ~/.config/hypr.scripts.bak.$(date +%F)`.
  Result: scripts preserved for line-by-line porting.

- [ ] Commit the backup to version control (if the dotfiles repo is under git).
  Command: `git -C ~/.config status` then `git -C ~/.config add -A && git -C ~/.config commit -m "backup: hyprland config before niri migration"`.
  Result: a restore point exists. Do not proceed without it.

## Phase 3 - Create a minimal niri config

- [ ] Let niri create the default config on first run.
  Command: run `niri` once (nested window is fine) or copy the embedded default:
  `niri validate` will use `~/.config/niri/config.kdl`; if missing, niri writes it.
  Result: `~/.config/niri/config.kdl` exists and parses.

- [ ] Replace it with a minimal skeleton to start from.
  File: `~/.config/niri/config.kdl`.
  Content: a `binds {}` block (this section is **not** auto-filled - see the
  warning in the key-bindings docs), plus empty section placeholders.
  Result: `niri validate` prints no parse-error lines and exits 0.

- [ ] Note that niri live-reloads on file save. There is no `hyprctl reload`.
  Command: edit and save `~/.config/niri/config.kdl`.
  Result: changes apply immediately; a parse error shows a config notification.
  **(gap: hyprctl keyword/eval - see `gap-register.md`.)**

- [ ] Validate after every subsequent edit instead of reloading.
  Command: `niri validate -c ~/.config/niri/config.kdl`.
  Result: exit status `0`, no parse errors printed.

## Phase 4 - Translate outputs (formerly monitors.lua)

- [ ] List the real connectors, modes and capabilities.
  Command: `niri msg outputs`.
  Result: names such as `eDP-1`, `HDMI-A-1`; exact mode strings such as
  `1920x1080@144.001`; `scale`, `vrr_supported`, `serial`.

- [ ] Drop the Hyprland wildcard monitor line.
  Old source: `hl.monitor({ output = "", mode = "highrr", position = "auto", scale = "auto" })`.
  niri enables all connected outputs with preferred modes by default; nothing is
  required. To force the highest refresh rate, set an explicit `mode`.
  Result: all monitors on with preferred modes after login.

- [ ] Write one `output` block per connector (or per EDID description).
  File: `~/.config/niri/config.kdl`.
  Pattern:
  ```kdl
  output "eDP-1" {
      mode "1920x1080@144.001"
      scale 1
      position x=0 y=0
      focus-at-startup
      variable-refresh-rate on-demand=true
  }
  output "Some Company P27FBB-RGGL 5275600003570" {
      mode "2560x1440@60.000"
      scale 1
      position x=1920 y=0
  }
  ```
  niri matches by connector or by manufacturer/model/serial separated by single
  spaces (Since: 0.1.9). `mode` must match `niri msg outputs` exactly to three
  decimals.
  Result: `niri validate` passes; monitors appear at the intended positions.

- [ ] Map Hyprland positioning rules.
  `position "auto"` -> omit `position` (niri auto-places using logical sizes);
  `position "1920x0"` -> `position x=1920 y=0`;
  `scale "auto"` -> omit `scale` (niri guesses from physical size, Since 0.1.6).
  Result: positions/scales behave as in Hyprland.

- [ ] Handle `xwayland:force_zero_scaling` and per-monitor Xwayland scaling.
  **(gap)** niri delegates X11 to `xwayland-satellite`; there is no
  `force_zero_scaling`. See `gap-register.md` and cross-reference the Xwayland
  wiki page.
  Result: decision recorded; X11 apps checked in Phase 12/verification.

- [ ] Move any dynamic per-monitor switching to `kanshi`.
  niri has no monitor manager. Use `kanshi` launched via
  `spawn-at-startup "/usr/bin/kanshi"` with profiles keyed on output name.
  Result: `kanshi` applies the right profile as monitors connect/disconnect.

## Phase 5 - Translate input (formerly settings.lua `input {}`)

- [ ] Translate the keyboard block.
  Old: `kb_layout = "es"`, `kb_options = "grp:alt_shift_toggle"`.
  New:
  ```kdl
  input {
      keyboard {
          xkb {
              layout "es"
              options "grp:alt_shift_toggle"
          }
      }
  }
  ```
  xkb strings pass straight to libxkbcommon, same as Hyprland.
  Result: Spanish layout and Alt+Shift group toggle work.

- [ ] Translate pointer speed and profile.
  Old: `sensitivity = 0`, `accel_profile = "flat"`.
  New: `mouse { accel-speed 0.0; accel-profile "flat" }`.
  Result: flat acceleration, matching Hyprland.

- [ ] Translate follow-mouse.
  Old: `follow_mouse = 1`, `mouse_refocus = false`.
  New: `focus-follows-mouse` (optionally `max-scroll-amount="0%"`).
  There is no `mouse_refocus` equivalent. **(gap.)**
  Result: pointer focus enters windows without stealing on refocus side effects.

- [ ] Translate the touchpad block.
  Old: `natural_scroll`, `disable_while_typing`, `tap_to_click`, `drag_lock`.
  New: `touchpad { natural-scroll; dwt; tap; drag-lock; }`.
  Result: touchpad behavior matches.

- [ ] Note the per-device configuration gap.
  niri configures input **by device type only** (`keyboard`, `touchpad`, `mouse`,
  `trackpoint`, `trackball`, `tablet`, `touch`); per-device sections are planned
  but not available. Any Hyprland `device {}` block must be collapsed or dropped.
  **(gap: per-device input sections.)**
  Result: decision recorded in `gap-register.md`.

- [ ] Translate cursor warp behavior.
  Old: `cursor { no_hardware_cursors = true; no_warps = true }`.
  niri has no `no_hardware_cursors` or `no_warps`. `warp-mouse-to-focus` is the
  inverse control (it *enables* warping) and is off by default. **(gap.)**
  Result: leave unwarped default; record decision.

- [ ] Translate cursor theme/size.
  Old: `hl.env("XCURSOR_THEME", ...)`, `hyprctl setcursor`.
  New: top-level `cursor { xcursor-theme "Bibata-Modern-Classic"; xcursor-size 24 }`.
  Result: cursor theme and size apply to Wayland and Xwayland clients.

- [ ] Translate gestures.
  Old: `hl.gesture({ fingers = 3, direction = "horizontal", action = "workspace" })`.
  niri touchpad gestures are built in and **not configurable**: three-finger
  vertical swipes switch workspaces, three-finger horizontal swipes move the
  view, and four-finger vertical swipes toggle the Overview (Since 25.05). The
  top-level `gestures {}` block only configures DnD edge scrolling (Since 25.02)
  and hot corners (Since 25.05). The axis mapping therefore changes: the old
  horizontal workspace swipe becomes a vertical swipe. **(gap: gesture
  remapping.)**
  Result: vertical swipe switches workspaces; horizontal swipe scrolls columns.

- [ ] Translate mouse binding behavior.
  Hyprland `follow_mouse`/`mouse_refocus` have no exact match; niri
  `focus-follows-mouse` is the equivalent primitive.
  Result: behavior documented; validation passes.

## Phase 6 - Translate layout (formerly settings.lua `general`/`decoration`)

- [ ] Translate gaps.
  Old: `general.gaps_in = 16`, `gaps_out = 25`.
  New: `layout { gaps 16; struts { left -9; right -9; top -9; bottom -9 } }`.
  niri has a single `gaps` value; emulate inner/outer difference with negative
  `struts` (Since: 0.1.8). Compute `struts = -(gaps_out - gaps_in)`.
  Result: inner 16 / outer 25 reproduction.

- [ ] Translate border and focus ring.
  Old: `border_size = 2`, `col.active_border`, `col.inactive_border`.
  New:
  ```kdl
  layout {
      border {
          width 2
          active-color "#..."
          inactive-color "#..."
      }
      // or focus-ring { width 2; active-color "#..." }
  }
  ```
  niri border affects layout (windows shrink); focus-ring overlays. Pick one.
  Result: 2 px border with the X palette colors.

- [ ] Translate rounded corners.
  Old: `decoration.rounding = 20`.
  New: a window rule:
  ```kdl
  window-rule {
      geometry-corner-radius 20
      clip-to-geometry true
  }
  ```
  Result: all windows rounded at 20 logical px.

- [ ] Translate shadows.
  Old: `decoration.shadow { enabled; range; render_power; color; offset }`.
  New:
  ```kdl
  layout {
      shadow {
          on
          softness 35
          offset x=0 y=10
          color "rgba(0,0,0,0.8)"
      }
  }
  ```
  Result: window shadows render; compare visually against the Hyprland screenshot.

- [ ] Translate window opacity.
  Old: `active_opacity = 0.85`, `inactive_opacity = 0.80`.
  New: niri has no global active/inactive opacity setting. Use two window rules:
  ```kdl
  window-rule { match is-active=false; opacity 0.80 }
  ```
  and per-app rules for active opacity. **(gap: decoration variants.)**
  Result: acceptable approximation or documented drop.

- [ ] Translate `dim_inactive` / `dim_strength`.
  **(gap)** niri has no dim. Approximate with a lower `opacity` on
  `match is-active=false` or drop it.
  Result: decision recorded.

- [ ] Drop the Hyprland layout selector.
  Old: `general.layout = "dwindle"` plus `dwindle`/`master` blocks.
  niri has one scrollable layout (`layout {}`). Preset width/height, tabbed
  columns and maximize replace dwindle/master behavior. **(gap: dwindle/master.)**
  Result: the scrollable mental model adopted; record decision.

- [ ] Translate `resize_on_border`, `extend_border_grab_area`, `snap`.
  niri resizes by `Mod` + right mouse (`resize-window`); floating resize handles
  and snapping to edges/gaps have no direct equivalent. **(gap.)**
  Result: recorded; users resize via binds or the mouse bind.

- [ ] Translate `prefer-no-csd`.
  Old: implicit CSD. New: top-level `prefer-no-csd` (see also Phase 6 rounding).
  Result: windows rectangular; borders drawn around them; restart apps to apply.

## Phase 7 - Translate binds (formerly keybinds.lua)

- [ ] Choose the modifier strategy.
  Hyprland `SUPER` -> niri `Super`, or `Mod` (which is `Super` on a TTY and
  `Alt` nested). Keep `Super` for the equisdots parity.
  Result: `Super+Return` etc. behave identically on a TTY session.

- [ ] Translate every `hl.dsp.*` dispatcher string.
  `exec_cmd` -> `spawn` (argv-split) or `spawn-sh` (shell string, Since 25.08);
  `exit` -> `quit`; `window.kill` -> `close-window`; `window.float toggle` ->
  `toggle-window-floating`; `focus direction l/r/u/d` ->
  `focus-column-left/right` + `focus-window-up/down`; `window.move` ->
  `move-column-left/right` + `move-window-up/down`; `window.center` ->
  `center-window` (or `center-column` for tiling); `workspace.toggle_special`
  -> **(gap)**; `window.pin` -> **(gap)**; `workspace.swap_monitors` -> **(gap)**.
  Run `niri msg action` for the authoritative action catalog.
  Result: each old dispatcher has a mapped action or a recorded gap.

- [ ] Translate all application spawns.
  Old `hl.bind(mod .. "Return", hl.dsp.exec_cmd(V.terminal))` with `kitty`.
  New: `Super+Return { spawn "kitty"; }`. Use `spawn-sh` when the old command
  relied on shell expansion/pipes (e.g. the `qs_manager.sh` wrappers).
  Result: every app launches.

- [ ] Translate locked and repeating flags.
  Old `{ locked = true }` -> `allow-when-locked=true` (Since: 0.1.5).
  Binds repeat by default (Since: 0.1.8); disable with `repeat=false`.
  Rate-limit with `cooldown-ms=<n>`.
  Result: volume/brightness binds work on the lock screen and repeat.

- [ ] Translate mouse binds.
  Old `mouse:272` (drag) and `mouse:273` (resize) are niri defaults (`Mod` + left
  / right). Optional explicit binds: `Super+MouseLeft`, `Super+MouseRight`.
  Result: drag/resize works.

- [ ] Translate screenshots.
  Old `scripts/screenshot.sh` -> niri built-ins: `screenshot` (interactive),
  `screenshot-screen`, `screenshot-window`; properties `write-to-disk=false`,
  `show-pointer` (26.04). Set top-level `screenshot-path`.
  Result: Print / Alt+Print / Ctrl+Print behave as before.

- [ ] Translate the reload bind.
  Old `hyprctl reload`. New: config auto-reloads; validate with
  `niri validate`. Bind a validation script if useful.
  Result: no reload bind needed; drop it.

- [ ] Translate workspace and monitor navigation.
  `focus-workspace`, `focus-workspace-up/down`, `move-workspace-up/down`,
  `move-column-to-workspace-up/down`, `focus-monitor-left/right/up/down`,
  `move-column-to-monitor-*`, `focus-workspace "name"`.
  Result: navigation works; static `Super+1..0` needs the workspace model
  decision from Phase 8.

- [ ] Translate color picker bind.
  Old `hyprpicker -a`. niri has a built-in picker: `niri msg pick-color` prints
  `{"rgb": [...]}` (each channel `0.0..=1.0`). `hyprpicker` may still work via
  wlroots screencopy, but the built-in command is the supported path.
  Result: color picking works via `niri msg pick-color`.

## Phase 8 - Translate window rules (formerly windowrules.lua)

- [ ] Translate the match keys.
  Hyprland `match.class` -> niri `match app-id`; `match.title` -> `match title`.
  Both are regexes matched anywhere in the string. Find IDs with
  `niri msg pick-window`.
  Result: rules target the same windows.

- [ ] Translate floating/centering/size rules.
  `float = true` -> `open-floating true`; `center = true` -> floating windows
  open centered by default (or set `default-floating-position`); `size = {W,H}`
  -> `default-column-width { fixed W; }` + `default-window-height { fixed H; }`.
  Result: dialogs open floating at the right size.

- [ ] Translate opacity rules.
  Old `opacity = "0.95 0.95"` (active/inactive pair) -> `opacity 0.95`. niri
  takes one value; use `match is-active=false` for a separate inactive value.
  Result: translucency matches.

- [ ] Translate workspace assignment rules.
  Old `workspace = "2"` -> `open-on-workspace "2"`. Because niri workspaces are
  dynamic, prefer **named workspaces** (`set-workspace-name` or config) so the
  assignment is stable. **(gap: static workspace index identity.)**
  Result: apps open on their intended workspace by name.

- [ ] Translate fullscreen, immediate, and game rules.
  `fullscreen = true` -> `open-fullscreen true`; `immediate` and tearing have no
  niri equivalent. **(gap.)**
  Result: games open fullscreen; tearing decision recorded.

- [ ] Translate Picture-in-Picture rules.
  Old title `^(Picture-in-Picture)$` float/pin/size/move.
  New: `match title="^Picture-in-Picture$"` with `open-floating true`,
  `default-column-width { fixed 640; }`, `default-window-height { fixed 360; }`,
  `default-floating-position x=... y=... relative-to="bottom-right"`. `pin` has
  no equivalent. **(gap.)**
  Result: PiP floats at the bottom-right; pin dropped.

- [ ] Translate swallow.
  Old `enable_swallow` + `swallow_regex`. niri has no window swallowing.
  **(gap.)**
  Result: decision recorded.

- [ ] Translate the screencast block-out behavior.
  Hyprland has no equivalent; niri adds `block-out-from "screencast"` as an
  improvement. Add for password managers.
  Result: optional privacy win.

## Phase 9 - Translate layer rules (formerly layers.lua, the glass surfaces)

- [ ] List layer namespaces.
  Command: `niri msg layers`.
  Result: namespaces such as `quickshell`, `qs-master`, `qs-popups`,
  `qs-floating-overlay`, `qs-widget-*` (these come from the shell).

- [ ] Translate each `hl.layer_rule({ namespace = ..., blur = true })`.
  New:
  ```kdl
  layer-rule {
      match namespace="^quickshell$"
      background-effect { blur true }
  }
  ```
  Layer rules exist Since: 25.01; `background-effect` Since: 26.04. Blur is
  enabled per-surface; enabling it in `layout` does not affect layers.
  Result: shell panels blur the wallpaper behind them.

- [ ] Translate `ignore_alpha`.
  **(gap)** Hyprland's `ignore_alpha` has no niri knob. niri blurred shapes
  follow the surface geometry/the `ext-background-effect` shape. Transparent
  padding may or may not blur. Record and evaluate visually.
  Result: decision recorded; adjust shell background alpha if needed.

- [ ] Translate backdrop/wallpaper layers.
  If the wallpaper tool uses a `background` layer and should appear in the
  Overview, add `place-within-backdrop true` (Since: 25.05) to its layer rule.
  Result: wallpaper visible in the Overview backdrop.

- [ ] Translate notification and popup blur.
  For notification surfaces and layer pop-ups use the `popups` sub-block:
  ```kdl
  layer-rule {
      match namespace="^qs-popups$"
      popups { background-effect { blur true } }
  }
  ```
  Result: notification/popup menus blur.

## Phase 10 - Translate animations (formerly animations.lua)

- [ ] Translate the global enable flag.
  Old `animations.enabled = true` -> `animations { on }` (omit `off`).
  Result: animations run.

- [ ] Recreate named bezier curves as `cubic-bezier`.
  Hyprland named beziers have no portable names. niri supports `ease-out-quad`,
  `ease-out-cubic`, `ease-out-expo`, `linear` and `cubic-bezier x1 y1 x2 y2`
  (Since: 25.08). Convert each named curve's control points, e.g.
  `easeOutExpo {0.16,1},{0.3,1}` -> `curve "cubic-bezier" 0.16 1 0.3 1`.
  Result: identical-looking easing without named curves.

- [ ] Map animation leaves.
  `windowsIn` -> `window-open`; `windowsOut` -> `window-close`; `windowsMove` ->
  `window-movement`; `workspaces` -> `workspace-switch`; `fadeIn`/`fadeOut`
  fold into `window-open`/`window-close`. `fadeSwitch`, `fadeShadow`, `fadeDim`,
  `border`, `borderangle`, `specialWorkspace` have no leaf. **(gap: animation
  leaf names.)**
  Result: mapped animations present; dropped leaves recorded.

- [ ] Map `speed` to `duration-ms`/springs.
  Hyprland `speed` is inverse-ish (higher = faster); niri easings use
  `duration-ms` and movers use springs (`damping-ratio`, `stiffness`,
  `epsilon`). Springs cannot take a duration. Tune by feel.
  Result: animations tuned; no invented options.

- [ ] Map `style` values.
  `popin 80%`, `slide`, `slidevert`, `loop` have no niri text equivalent. niri
  open/close can use `custom-shader` for pop-in effects (Since 0.1.6); movement
  styles are fixed. **(gap.)**
  Result: defaults used or custom shaders written; `style` dropped.

- [ ] Validate.
  Command: `niri validate -c ~/.config/niri/config.kdl`.
  Result: exit 0.

## Phase 11 - Translate autostart and environment

- [ ] Move every `hl.on("hyprland.start", ...)` command to niri startup.
  Options: top-level `spawn-at-startup "cmd" "arg"`, `spawn-sh-at-startup "shell line"`
  (Since: 25.08), a systemd user unit, or an XDG autostart desktop entry. Prefer
  systemd for daemons so they can be restarted and monitored.
  Result: each old startup line has a niri home.

- [ ] Translate the keyring and polkit agent.
  `gnome-keyring-daemon` via `spawn-sh-at-startup` or a systemd unit;
  polkit agent likewise. If a polkit unit is used on Fedora, add
  `After=graphical-session.target` via `systemctl --user edit`.
  Result: secrets unlock and polkit prompts appear.

- [ ] Remove the Hyprland portal environment imports.
  `dbus-update-activation-environment`/`systemctl --user import-environment` are
  handled by `niri-session`, which imports the login-shell environment. Keep only
  custom variables.
  Result: portals resolve without manual imports.

- [ ] Translate `hl.env(...)` to the top-level `environment {}` block.
  ```kdl
  environment {
      QT_QPA_PLATFORM "wayland;xcb"
      QT_QPA_PLATFORMTHEME "qt6ct"
      LIBVA_DRIVER_NAME "nvidia"
      XCURSOR_SIZE "24"
      MOZ_ENABLE_WAYLAND "1"
      DISPLAY null
  }
  ```
  Remove `XDG_SESSION_DESKTOP`/`XDG_CURRENT_DESKTOP` (niri-session sets them) and
  `HYPRLAND_LOG_WLR`. **Remove the global `GDK_BACKEND`** - the docs explicitly
  warn it breaks the screencast portal.
  Note: `environment {}` does not propagate to systemd services; variables that
  daemons must see belong in the login shell (e.g. `~/.bash_profile`) because
  `niri-session` imports them.
  Result: apps see the needed variables; the portal still works.

- [ ] Translate the NVIDIA variables.
  Keep `GBM_BACKEND=nvidia-drm`, `__GLX_VENDOR_LIBRARY_NAME=nvidia`,
  `LIBVA_DRIVER_NAME=nvidia`, `NVD_BACKEND=direct`; also apply the NVIDIA heap
  fix from the niri Nvidia page and ensure `nvidia-drm.modeset=1`.
  Result: niri starts on NVIDIA without a black screen.

- [ ] Translate cursor/theme init commands.
  `hyprctl setcursor` -> top-level `cursor {}`. `gsettings` calls stay as
  `spawn-sh-at-startup` or systemd.
  Result: theme/cursor initialized.

- [ ] Translate the monitor-restore daemon.
  `scripts/restore-monitors.sh` is Hyprland-specific (`hyprctl`). Replace with
  static `output` blocks plus `kanshi` (Phase 4). **(gap: runtime monitor manager.)**
  Result: layout restored by niri/kanshi.

- [ ] Translate clipboard history and applets.
  `wl-paste --watch cliphist store` (text and image), `nm-applet`, `blueman-applet`
  run unchanged on Wayland; move them to `spawn-sh-at-startup` or systemd units.
  Result: clipboard history, network and Bluetooth applets run.

- [ ] Translate the shell (Quickshell) autostart.
  Quickshell uses layer-shell and works on niri; keep the process-kill cleanup and
  launch lines, but the Kanshi/wallpaper/monitor bits change. Ensure the QML shell
  targets niri IPC (`niri msg`) rather than `hyprctl` (Phase 12).
  Result: the bar/shell starts on niri.

## Phase 12 - Port scripts and IPC

- [ ] Inventory every `hyprctl` call.
  Command: `rg -n "hyprctl" ~/.config/hypr/scripts ~/.config/hypr/scripts/quickshell`.
  Result: a mapping list.

- [ ] Replace query commands.
  | Hyprland | niri |
  | --- | --- |
  | `hyprctl monitors -j` | `niri msg --json outputs` |
  | `hyprctl clients -j` | `niri msg --json windows` |
  | `hyprctl activewindow -j` | `niri msg --json focused-window` |
  | `hyprctl activeworkspace -j` | `niri msg --json workspaces` (filter `is_focused`) |
  | `hyprctl workspaces -j` | `niri msg --json workspaces` |
  | `hyprctl layers` | `niri msg layers` |
  | `hyprctl version` | `niri --version` / `niri msg version` |
  Result: scripts parse the niri JSON shapes.

- [ ] Replace dispatch commands.
  `hyprctl dispatch <x>` -> `niri msg action <kebab-case-action>`. Confirm each
  action with `niri msg action`; use `--print-request` (next release) or
  `niri msg raw-request` for direct socket calls.
  Result: every dispatch maps to an action or a recorded gap.

- [ ] Replace live `hyprctl keyword` patching.
  **(gap)** niri has no keyword/eval. Rewrite config and save (live-reload). For
  runtime toggles niri exposes specific actions and `include` files; the
  Window Controls / Settings widget model must be redesigned to write KDL and let
  niri reload, or to use niri actions where they exist.
  Result: a rewrite plan for the widget's runtime overrides.

- [ ] Replace the event socket.
  Old `.socket2.sock` / `HYPRLAND_INSTANCE_SIGNATURE` -> `$NIRI_SOCKET` and
  `niri msg --json event-stream` (Since: 0.1.9). The stream emits full state
  first (`WorkspacesChanged`, `WindowsChanged`, ...) then deltas, so listeners do
  not need extra queries.
  Result: bars/indicators update from niri events.

- [ ] Replace any cursor-position query.
  Old `hyprctl cursorpos` -> **(gap)** niri exposes no pointer coordinate query.
  Mascot/overlay scripts that track the pointer need a different design (e.g.
  layer-shell input tracking, not direct pointer reads).
  Result: decision recorded.

- [ ] Replace `hyprctl setcursor` and `hyprctl reload`.
  Cursor -> `cursor {}` config; reload -> none (auto). Remove stale calls.
  Result: no `hyprctl` remains in scripts.

- [ ] Smoke-test the event stream.
  Command: `niri msg event-stream` (Ctrl-C to stop).
  Result: initial state lines then live events on window/workspace changes.

## Phase 13 - Lock and idle

- [ ] Replace the lock command.
  Old `hyprlock` / Quickshell `Lock.qml` invoked from `hypridle.conf`.
  New: `swaylock`, `gtklock`, `swaylock-effects`, or a Quickshell/ext-session-lock
  locker that supports niri. Bind it with `allow-when-locked=true` so the red
  locked screen can be recovered (see FAQ).
  Result: `loginctl lock-session` locks the screen; the bind works when locked.

- [ ] Replace idle management.
  Old `hypridle.conf` (600 s lock, 1200 s suspend, before-sleep lock).
  New: `swayidle` as a systemd unit, e.g.
  `ExecStart=/usr/bin/swayidle -w timeout 600 'loginctl lock-session' timeout 1200 'systemctl suspend' before-sleep 'loginctl lock-session'`.
  To turn monitors off, use `niri msg action power-off-monitors`.
  Result: idle locks then suspends; wake works.

- [ ] Recreate the idle-mode toggle.
  Old `scripts/idle-mode.sh` (awake = keep hypridle stopped). New: enable/disable
  the `swayidle.service` unit, or toggle a user flag the unit reads.
  Result: `Super+P` toggles idle behavior.

- [ ] Recreate the after-sleep DPMS-on behavior.
  Old `hyprctl eval 'hl.dispatch(hl.dsp.dpms({action="on"}))'`. niri has no
  documented power-on action; displays come back automatically on input. If they
  do not, wake via a key press or move the mouse. The only documented DPMS action
  is `niri msg action power-off-monitors`.
  Result: displays resume after sleep or on input.

## Phase 14 - Wallpaper and background

- [ ] Choose the wallpaper mechanism.
  niri draws only a flat `layout { background-color }`; use a layer-shell tool:
  `swaybg`, `wbg`, or `xwww` if it is Wayland-generic. Start it via systemd or
  `spawn-at-startup`.
  Result: a wallpaper renders on every output.

- [ ] Put the wallpaper in the Overview backdrop if desired.
  Add a layer rule with `place-within-backdrop true` for the wallpaper namespace.
  Result: Overview shows the wallpaper.

- [ ] Verify the wallpaper tool is compositor-independent.
  `hyprpaper` is Hyprland-specific and will not work. Confirm `xwww-daemon`
  (equisdots) speaks plain wlr-layer-shell; otherwise replace with `swaybg`/`wbg`.
  Result: no Hyprland-only wallpaper daemon remains.

## Phase 15 - Portals and screencasting

- [ ] Remove `xdg-desktop-portal-hyprland`.
  Command: `pacman -Rns xdg-desktop-portal-hyprland` (or distro equivalent).
  Result: no Hyprland portal backend remains.

- [ ] Install and configure the niri portal set.
  Install `xdg-desktop-portal-gtk`, `xdg-desktop-portal-gnome`, and the Secret
  backend; install `resources/niri-portals.conf` to
  `/usr/share/xdg-desktop-portal/` (or `~/.config/xdg-desktop-portal/`).
  Result: `systemctl --user status xdg-desktop-portal` is active after login.

- [ ] Run niri as a session, not a bare binary.
  Portals **require** `niri-session` (systemd/dinit) or a display manager; a bare
  `niri` process will not start portals correctly.
  Result: D-Bus session, PipeWire, and portals are available.

- [ ] Verify screencasting.
  Open OBS or Firefox and pick a monitor/window; confirm
  "niri Dynamic Cast Target" is selectable and `set-dynamic-cast-window` works.
  Result: screencast and window capture work.

- [ ] Verify the file chooser.
  Open a Flatpak/GTK app's Open dialog.
  Result: `nautilus` (or the GTK chooser per the portals conf) appears.

## Phase 16 - Session and systemd integration

- [ ] Start niri through the session script.
  Command: `niri-session` from a TTY (or select Niri in the display manager).
  Result: `systemctl --user status niri.service` is active and
  `graphical-session.target` is reached.

- [ ] Attach session services.
  Commands:
  `systemctl --user add-wants niri.service swayidle.service`,
  `systemctl --user add-wants niri.service swaybg.service`,
  `systemctl --user add-wants niri.service mako.service` (if used),
  `systemctl --user add-wants niri.service quickshell.service` (if used).
  File: units under `~/.config/systemd/user/`, bound with `PartOf=graphical-session.target`.
  Result: services start and stop with niri.

- [ ] Ensure the shell/apps see the right environment.
  Because `environment {}` does not reach systemd, put shared variables in the
  login shell (`~/.bash_profile`); `niri-session` imports them.
  Result: launchers started by systemd see the variables.

- [ ] Confirm Xwayland integration.
  Command: `journalctl --user-unit=niri -b | rg "X11 socket"`.
  Result: `listening on X11 socket: :0`, and `echo $DISPLAY` prints `:0`.

## Phase 17 - Validate

- [ ] Validate the final config.
  Command: `niri validate -c ~/.config/niri/config.kdl`.
  Result: no errors, exit `0`.

- [ ] Validate a live session.
  In a running niri: `niri validate`.
  Result: same clean parse; no config notification appears.

- [ ] Check the journal for startup errors.
  Command: `journalctl --user-unit=niri -b`.
  Result: no `ERROR`/`WARN` about config, shaders, outputs or Xwayland (see
  `verification.md` for the healthy log shape).

## Phase 18 - Test in parallel

- [ ] Run niri nested before switching sessions.
  Command: `niri` inside the current Hyprland session (windowed; `Mod` = `Alt`).
  Result: window opens; binds work with Alt; validate the visual result.

- [ ] Keep Hyprland as the default session until parity.
  Result: the display manager still boots Hyprland; niri is selectable.

- [ ] Exercise the daily workflow end to end in niri.
  Checklist: launch apps, workspace navigation, floating dialogs, PiP, lock,
  idle, wallpaper, screenshots, screencast, X11 app, multi-monitor, scaling.
  Result: every item passes `verification.md` or is a documented gap.

- [ ] Diff achieved behavior against the Phase 0 inventory.
  Result: each old touchpoint is migrated or explicitly dropped in the ADR.

## Phase 19 - Cut over

- [ ] Make niri the default session.
  File: display-manager entry (e.g. GDM session list) or
  `~/.config/uwsm/` / `niri-session` in the login shell.
  Result: login lands in niri.

- [ ] Re-run the full verification suite once under niri as the real session.
  Result: all healthy checks pass.

- [ ] Announce/commit.
  Command: `git -C ~/.config add -A && git -C ~/.config commit -m "feat: niri 26.04 session"`.
  Result: the new state is captured.

## Phase 20 - Cleanup

- [ ] Remove Hyprland-only services and daemons.
  Commands: `systemctl --user disable --now hypridle.service hyprpaper.service`
  (and any Hyprland portal/keyring units); remove `xdg-desktop-portal-hyprland`.
  Result: no Hyprland daemon runs.

- [ ] Remove Hyprland-only scripts and binds.
  Delete `restore-monitors.sh` Hyprland logic, `hyprctl` calls, `hyprpicker`
  binds if replaced, and `gd` global `GDK_BACKEND`.
  Result: `rg -n "hyprctl|HYPRLAND_INSTANCE_SIGNATURE|socket2" ~/.config` returns
  nothing (except intentional references).

- [ ] Remove now-unused packages.
  Command: `pacman -Rns hyprlock hypridle hyprpaper hyprpicker hyprland`
  (only after confirming no fallback is wanted). Keep the Phase 2 backup.
  Result: disk and units cleaned.

- [ ] Keep the backup and ADRs.
  Result: `~/.config/hypr.bak.<date>` and `docs/adr/` remain for rollback and
  rationale.

## Rollback

- [ ] To revert: restore `~/.config/hypr.bak.<date>` over `~/.config/hypr`,
  reinstall Hyprland + `xdg-desktop-portal-hyprland`, select the Hyprland session,
  and remove the `niri.service` wants symlinks.
  Result: the previous session is back within one login cycle.

## See also

- `gap-register.md` - every Hyprland concept with weak or no niri equivalent.
- `verification.md` - exact commands and healthy results for each subsystem.
