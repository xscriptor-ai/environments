# Bring-up findings: equisdots on niri

Real gotchas hit while actually bringing the equisdots desktop up on niri 26.04
after porting it from Hyprland. Each entry is symptom -> cause -> fix. These are
things that looked like niri bugs, shell bugs, or theming bugs but had concrete
root causes.

Baseline: **niri 26.04** (2026-04-25), config at `~/.config/niri/config.kdl`.

## 1. Gray background + "Important Hotkeys" overlay at startup

- **Symptom**: the session starts with niri's stock gray backdrop and the
  "Important Hotkeys" help overlay, as if none of the equisdots config applied.
- **Cause**: a one-line KDL block made the whole config invalid, so niri rejected
  it and fell back to its compiled-in default config. A block written on a single
  line (for example `layout { gaps 8; }`) is not valid KDL in the way it was
  emitted and aborts the parse.
- **Fix**: emit multi-line blocks, or terminate each node properly with `;`.
  Always run `niri validate` after generating or hand-editing config, and check
  the `config-notification-open-close` notification for parse errors before
  assuming a theming problem.

## 2. Shell fails to load only under niri ("Cannot assign to non-existent default property")

- **Symptom**: the Quickshell shell loads fine under Hyprland but errors under
  niri with `Cannot assign to non-existent default property`.
- **Cause**: a `Connections { }` object was declared as a child of a `QtObject`
  singleton. `QtObject` has no default property, and niri's backend path happened
  to instantiate that singleton where the Hyprland path did not, exposing the
  error only under niri.
- **Fix**: do not nest `Connections` as a child of a `QtObject`. Hold it as a
  property instead, for example `property Connections conn: Connections { ... }`.

## 3. Compositor detection picks the wrong backend

- **Symptom**: under niri the shell still selects the Hyprland backend, so
  workspace/focus/keyboard data is empty or wrong.
- **Cause**: backend selection only checked a value that the niri session did not
  match, or the probe ran before the session environment was in place.
- **Fix**: select the niri backend when either `XDG_CURRENT_DESKTOP` contains
  `niri` (case-insensitive) **or** `NIRI_SOCKET` is set. niri sets both for its
  children, so checking both is robust. Example:

  ```qml
  readonly property bool isNiri:
      (Quickshell.env("XDG_CURRENT_DESKTOP") || "").toLowerCase().indexOf("niri") !== -1
      || Quickshell.env("NIRI_SOCKET") !== ""
  ```

## 4. Live window border colour never applied

- **Symptom**: the shell pushes active/inactive border colours, but the window
  borders keep their old colours (or never change).
- **Cause**: a filename mismatch. The shell wrote
  `~/.config/niri/generated/borders.kdl`, but the niri config included
  `generated/theme-colors.kdl`. niri kept parsing the stale file, so the writes
  had no effect.
- **Fix**: include the file the writer actually writes. Keep the writer and the
  `include` in sync, ideally by having a single shared name constant. Verify with
  `niri validate` and by inspecting the `include`d file after a change.

## 5. Translucent windows tinted red

- **Symptom**: translucent windows show a red tint behind their content.
- **Cause**: `draw-border-with-background` defaults to `true`, so niri paints a
  solid rectangle in the border colour behind each window. With a translucent
  window that colour shows through and tints everything.
- **Fix**: set `draw-border-with-background false` in the `layout {}` block so the
  border is drawn without the opaque backing rectangle.

## 6. Full-screen blur sheet when opening panels

- **Symptom**: opening a panel or popup produces a blur that covers the full
  screen height (or the whole surface rectangle) instead of hugging the panel.
- **Cause**: forced layer blur with no `ignore_alpha`. niri blurs the whole
  surface rectangle, including transparent areas, and has no per-surface alpha
  threshold. See the gap register entry "Per-namespace layer blur".
- **Fix**: drop the forced `background-effect { blur true }` on large transparent
  surfaces and let the shell request blur through `ext-background-effect` (which
  carries the real blur region). Only force blur on small, fully opaque surfaces.

## 7. Old SystemMonitor / inconsistent notifications under niri

- **Symptom**: the niri session runs a stale SystemMonitor widget or shows
  notifications inconsistent with the Hyprland session.
- **Cause**: the shared `shell` clone on disk was stale, and `dotsniri` did not
  update it before deploying, so the niri session loaded an old checkout.
- **Fix**: make the `dotsniri` meta pull the shared `shell`/`nyx` bases before
  deploying. Treat the shared clones as a prerequisite step of the deploy, not an
  optional manual update.

## 8. Notifications not following the palette

- **Symptom**: notifications render with default colours instead of the active
  theme/palette under niri.
- **Cause**: a competing `mako`/`dunst` daemon was running and won the
  `org.freedesktop.Notifications` D-Bus name, so it rendered the notifications
  instead of the Quickshell shell.
- **Fix**: the shell owns notifications and must be the only notification server.
  Do not install or run `mako`/`dunst`; if one is running, stop it. See the
  tooling skill's "Rules that prevent breakage".
