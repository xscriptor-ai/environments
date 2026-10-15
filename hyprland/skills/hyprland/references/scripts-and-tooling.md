# Scripts & tooling — router (Bash and Python around Hyprland/Quickshell)

Verified **2026-10-15**. This file routes between the dedicated skills; it keeps only the cross-language facts that belong to neither:

- **Bash (the `.sh` files)** → skill **`hyprland-bash`** — script anatomy/strict mode, `caching.sh` env, hyprctl automation + persistence, socket2 daemons (debounce/dedupe/flock), watchers, Quickshell IPC, systemd units, rofi menus, anti-patterns.
- **Python (the `.py` tools)** → skill **`hyprland-python`** — theme-sync targets, palette/scheme generators, hyprctl JSON automation, socket2 clients, atomic file contracts, CLI/exit-code design, packaging under `~/.local/share/equisdots`, pytest.

## Language decision (one glance)

| Job | Language | Why |
|---|---|---|
| Compositor logic (binds, rules, events, timers) | **Lua** (`hl.*`) | in-process, no fork per event |
| UI state, widgets, animations | **QML** (Quickshell) | reactive, hot reload |
| One-shot glue, session plumbing, hooks, menus | **Bash** | ubiquitous, minimal deps |
| Structured data, JSON automation, generators, multi-step tooling | **Python** | stdlib data handling, testable |
| Long-running watchers/daemons | Bash or Python **as a systemd user unit** | supervision for free |
| Hot path (per-frame, per-keystroke) | *none of the above* | scripts are for events |

## Junction cookbook (escaping across languages)

| From → To | Rule |
|---|---|
| Lua → shell (`hl.dsp.exec_cmd`) | runs through `sh -c`; single-quote args; `hl.dsp.exec_raw` when no shell features needed |
| QML `Process` | prefer argv array; `["bash","-c","..."]` only when the shell is required; never interpolate untrusted strings |
| Bash → jq | `-r`, `@tsv`, `if has() then … else … end` (no `//` on booleans) |
| Bash/Python → hyprctl | `-j` + parse; `--batch` for control calls; `timeout`; `-i <instance>` |
| Lua config → files | `io.open` works (`colors.lua` reads `settings.json` + palettes; `lib/json.lua` decodes manifests) |
| Any writer → settings/palettes | atomic `tmp` + `mv`/`os.replace`, validate `#rrggbb`, preserve unknown keys, keep `x` fallback, never rewrite `settings.json` unnecessarily |

## Shared compositor-citizenship checklist

1. Never block: scripts return <50 ms when reachable from a bind/QML handler; otherwise they are supervised daemons.
2. `hyprctl` is synchronous with a 5 s cap: batch, `timeout 5`, rate-limit, never loop per event without debounce.
3. State changes through `hl.*` (`hyprctl eval`); persistence to `settings.json` only when the user expects "remember it".
4. Event-driven work: debounce (50 ms window churn / 250 ms file edits), dedupe, single instance (`flock`/pidfile), zombie cleanup.
5. Writes: atomic + validated + unknown keys preserved + fallback paths present.
6. Quality gates: `shellcheck`/`python -m py_compile`, `bash -n`, pytest for Python contracts, `Hyprland --verify-config` for config changes.

Logs to stderr, meaningful exit codes, no `pkill` in normal flows (use `qs ipc` / `qs kill -i`). Generic depth for these languages lives in the global `systems` and `python` skills; these two skills carry the stack conventions.
