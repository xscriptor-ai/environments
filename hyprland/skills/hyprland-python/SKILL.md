---
name: hyprland-python
description: Python tooling for the Hyprland/Quickshell stack (equisdots conventions). Covers theme-sync target modules, palette and scheme generators, hyprctl JSON automation with argv/timeout discipline, socket2 event clients with debounce/backoff, atomic file contracts (settings.json, palettes), CLI design, packaging under ~/.local/share/equisdots and pytest. Use when writing, reviewing or debugging any .py tool that talks to Hyprland, the shell, or their files.
---

# Python tooling for the Hyprland/Quickshell stack (verified 2026-10-15)

Sources: equisdots `theme-sync` (`themesync/` package: `cli.py`, `core.py`, `runner.py`, `targets/*`), `palettes`/`hyprland` repos (palette schema, `settings.json`), design contract in skill `quickshell` → `references/design-and-effects.md` section 2. Generic Python depth (typing, asyncio, packaging) lives in the global `python` skill — this skill is the stack's contract. Templates: `references/tooling-recipes.md`.

## Where Python fits (and where it does not)

| Use Python for | Do NOT use Python for |
|---|---|
| Theme-sync targets, palette/scheme generators | Hot paths (per-frame, per-keystroke) |
| Structured automation over `hyprctl -j` / settings | One-line glue already well served by bash |
| Event clients over `.socket2.sock` when logic is complex | Blocking anything reachable from a bind/QML handler |
| Data validation, migrations, CI checks | Replacing compositor logic that belongs in Lua (`hl.*`) |

Compositor-citizenship rules (same as bash, stricter on startup):
- `hyprctl`: argv lists, `-j`, `timeout=5`, no `shell=True`, batch control calls, target instances with `-i`. The socket is synchronous — never loop `hyprctl` per event without debounce.
- State changes go through the Lua API (`hl.monitor`, `hl.config`) via `hyprctl eval`; persistence goes to `settings.json`.
- Tools invoked from hooks must start in <50 ms, avoid import-time side effects, and never print to stdout unless the caller consumes it (logs to stderr).
- No `os.system`, no `subprocess.run(..., shell=True)` with interpolated strings.

## Contracts to respect (the stack, not invented)

1. **theme-sync target module**: one module per application with `NAME`, `DESCRIPTION`, `available(env)`, `apply(env)`; a failing target never aborts the rest (collect errors; exit code reflects them). Installed under `~/.local/share/equisdots/theme-sync` with a `~/.local/bin/theme-sync` wrapper; called by the shell palette hook and `reload.sh`.
2. **Generator contract** (palettes): input any source; output `dock/palettes/<slug>.json` + `index.json` entry; validate `#rrggbb`; **atomic writes** (`tmp` + `os.replace`); preserve unknown keys; never modify `settings.json` when only palette content changed; keep the `x` fallback palette intact.
3. **Settings edits**: same atomicity; read-modify-write with a JSON round-trip that keeps unknown keys; report success/failure so the calling script can notify the user.

## Standard library kit

```python
# hyprctl bridge — argv, JSON, timeout, instance-aware
def hyprctl(*args: str, instance: str | None = None, timeout: float = 5.0):
    cmd = ["hyprctl", "-j"]
    if instance: cmd += ["-i", instance]
    out = subprocess.run([*cmd, *args], capture_output=True, text=True, timeout=timeout, check=True)
    return json.loads(out.stdout)
```
- Files: `pathlib.Path`, `os.replace` for atomicity, `json.dump(..., ensure_ascii=False, indent=2, sort_keys=True)` for stable diffs.
- Paths: XDG (`XDG_DATA_HOME`, `XDG_STATE_HOME`, `XDG_RUNTIME_DIR`: runtime dirs under `/run/user/<uid>`); config under `~/.config/hypr/...` exactly as the shell/bash sides read them.
- Colors: `re.compile(r"^#[0-9a-fA-F]{6}$")` validation before any write; normalize to lowercase.
- Time: `datetime`/`zoneinfo` for clock tools; no naive UTC mixing.

## CLI conventions (release tools)

- `argparse` first (stdlib, zero deps for a tool that runs on every theme change); `--dry-run`, `--json`, `--targets a,b`, `--verbose`; unknown targets skipped with a warning.
- Exit codes: `0` all good, `1` partial (some targets failed; list them on stderr), `2` usage/config error. Print machine-readable results to stdout, human logs to stderr.
- Failure isolation: wrap each target/step in its own try/except, collect `(name, error)`, continue. One broken app must not leave the desktop half-themed.

## Packaging & install (equisdots pattern)

```
~/.local/share/equisdots/theme-sync/       # the package (core.py, runner.py, targets/)
~/.local/share/equisdots/theme-sync/theme-sync.sh   # thin bash wrapper (entry for reload.sh)
~/.local/bin/theme-sync                    # user-facing symlink/wrapper
```
- Deployed by `dots`; never into system Python; no `pip install` side effects required at runtime.
- Keep a `check.sh` in the repo for availability/deps reporting (their repos ship one).

## Testing

- Keep logic in importable pure functions (`core.py` style) — CLI is a thin shell.
- `pytest` with `tmp_path` for file contracts (atomic write, unknown-key preservation, invalid hex rejection).
- Fixtures: capture real `hyprctl -j` outputs as JSON files; parse them in tests so schema drift is caught early.
- For generators: golden-file tests of the emitted palette JSON; idempotency test (running twice = no diff).

## References

- `references/tooling-recipes.md` — ready templates: hyprctl helper, socket2 client with debounce/backoff, atomic write + validation, theme-sync target module, palette generator skeleton, packaging tree, pytest example.
