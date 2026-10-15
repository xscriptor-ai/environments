# Quickshell debugging & operations (v0.3.x)

## Logs

- Per-instance log file: `log.qslog` under the instance's runtime dir (managed by Quickshell; `qs log` finds it automatically).
- `qs log [-t 200] [-f]` — last lines / follow. `-r <rules>` to filter, format is QT_LOGGING_RULES (`qs.*=true`, `qs.hyprland.debug=true`).
- Runtime verbosity: `-v` (INFO internal), `-vv` (DEBUG internal), `--log-times`, `--no-color` (or `NO_COLOR=1`).
- `qs list -a -j` — JSON inventory of instances (id, config, pid, log paths); `qs kill -i <id>`; `qs list --show-dead` to see crashed leftovers.

## Crashes

- Quickshell has a built-in crash handler: on crash it writes a dump and **relaunches** (refuses if it crashed <10s after launch to avoid crash loops).
- The handler prints the dump path: `QsPaths::crashDir(instanceId)` (under the shell's state/runtime dir). `qs list` shows dead instances.
- Disable for debugging (so it doesn't restart and stomp your session): `QS_DISABLE_CRASH_HANDLER=1`; point users elsewhere with `QS_CRASHREPORT_URL`.
- Qt 6.12 is supported since 0.3.2 — on older Qt expect breakage; the AUR `quickshell-git` warns when Qt updates invalidate the build (reinstall to fix).

## QML debugging (breakpoints, object tree)

```bash
qs -c mybar --debug 8080 --waitfordebug
# Connect Qt Creator (Attach to QML port 8080) or another QML debug client.
```
- `--waitfordebug` blocks startup until a debugger attaches — ideal for "it crashes 50 ms after launch" cases.
- For runtime introspection without a debugger: `qs ipc call`, and add an `IpcHandler` to the shell exposing `console.log` summaries or `Qt.objectName` dumps.
- `console.log()` from QML goes to stdout/log file. Prefer `console.log("[bar]", ...)` prefixes consumed via `-r`.

## qmlls (QML language server)

- Create an empty `.qmlls.ini` next to `shell.qml` (gitignore it); Quickshell fills it so qmlls resolves `import qs.*` and its types.
- Editors: VS Code "Official QML Support" extension + `qt-qml.qmlls.useQmlImportPathEnvVar`; Neovim `require("lspconfig").qmlls.setup {}`; Helix built-in; Emacs `qml-ts-mode` + lsp-mode/eglot (`qmlls` binary).
- Known limits: no docs for Quickshell types (`PanelWindow` cannot be resolved), and lints stop working when braces are unbalanced.

## Common runtime failures → causes

| Symptom | Usually |
|---|---|
| Window invisible / zero size | anchors unset on a PanelWindow or missing implicit width/height; check `Variants` delegate size |
| "hole" in a transparent window | QTBUG-137166: transparent Rectangle touching `border` props. Set `border.width: 0` |
| Window not translucent | created opaque; set `surfaceFormat.opaque = false` |
| No notifications received | something else owns org.freedesktop.Notifications (dunst/mako/swaync) |
| Tray icons missing/duplicated | two SNI hosts (Waybar tray + Quickshell, or two shells) |
| Shell restarts in a loop | crash within 10s of launch — run with `QS_DISABLE_CRASH_HANDLER=1` and read `qs log` |
| Broken layout after monitor unplug | `Variants` model churn; guard against null screens, use `ShellScreen` ids |
| Purple/black icon squares | `Quickshell.iconPath(name)` without fallback; use the fallback variant or empty string |
| High RAM | Loaders not used for hidden widgets; repeating expensive bindings; too many Processes |

## Performance & memory

- One process for the whole shell; a process-per-widget multiplies memory.
- `Loader` (Item-based) / `LazyLoader` (non-Item) for anything hidden or conditionally shown; destroy instead of hiding.
- `QS_DROP_EXPENSIVE_FONTS=1` / `//@ pragma DropExpensiveFonts` — woff/woff2 fonts are a known stutter source.
- Keep bindings cheap; use `Process`/`FileView`/`Timer` for data, and avoid re-evaluating big JS on every frame.
- Screencopy and BackgroundEffect are GPU-expensive; test on the target GPU (WSL/llvmpipe will be slow — expect low fps).
- `PanelWindow.exclusiveZone` and margins affect compositor struts; keep them stable to avoid Hyprland re-layout storms.

## Automated checks (CI / headless)

- `qs -c <cfg> -n` smoke-run under a headless compositor (skill `arch-wsl-headless` has recipes for Hyprland headless + wayvnc).
- Expose a health `IpcHandler` (e.g. `ping` returning version + screen count) and assert from scripts: `qs ipc call health ping`.
- `qs log -t 50 | grep -i "error"` after boot catches QML warnings; treat any `Type error`/`Binding loop` as a build failure in CI.
