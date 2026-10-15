# Python tooling recipes (Hyprland/Quickshell stack)

Templates adapted to the equisdots contracts. Verified 2026-10-15 (theme-sync package layout, palette schema, `settings.json` handling).

## 1. hyprctl bridge

```python
import json, subprocess

class HyprError(RuntimeError): ...

def hyprctl(*args: str, instance: str | None = None, timeout: float = 5.0):
    cmd = ["hyprctl", "-j"]
    if instance:
        cmd += ["-i", instance]
    try:
        out = subprocess.run([*cmd, *args], capture_output=True, text=True, timeout=timeout)
    except subprocess.TimeoutExpired as e:
        raise HyprError(f"hyprctl {' '.join(args)}: timed out") from e
    if out.returncode != 0:
        raise HyprError(f"hyprctl {' '.join(args)}: {out.stderr.strip()}")
    return json.loads(out.stdout)

# examples
focused = next(m["name"] for m in hyprctl("monitors") if m["focused"])
clients = hyprctl("clients")                       # list of dicts
```

Batch control calls when more than one change runs together (`hyprctl --batch`); apply compositor state with `hyprctl eval 'hl.*'`, e.g.:
```python
def set_border(hex_active: str, hex_inactive: str) -> None:
    code = (f'hl.config({{ general = {{ col = {{ '
            f'active_border = "{hex_active}", inactive_border = "{hex_inactive}" }} }} }})')
    subprocess.run(["hyprctl", "eval", code], check=True, timeout=5)
```

## 2. socket2 event client (debounce + backoff)

```python
import json, os, time, socket, select
from pathlib import Path

def socket_path() -> Path:
    base = Path(os.environ.get("XDG_RUNTIME_DIR", f"/run/user/{os.getuid()}")) / "hypr"
    newest = max(base.iterdir(), key=lambda p: p.stat().st_mtime)  # instance signature
    return newest / ".socket2.sock"

INTERESTING = {"openwindow", "closewindow", "workspacev2", "focusedmonv2", "activespecialv2"}

def listen(on_dirty, debounce_ms: int = 50):
    delay = 1.0
    while True:                                     # reconnect loop (compositor restarts)
        try:
            sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
            sock.connect(str(socket_path()))
            delay = 1.0
            buf, pending, last = b"", False, 0.0
            while True:
                r, _, _ = select.select([sock], [], [], debounce_ms / 1000)
                if r:
                    chunk = sock.recv(4096)
                    if not chunk:
                        raise ConnectionResetError
                    buf += chunk
                    while b"\n" in buf:
                        line, buf = buf.split(b"\n", 1)
                        if line.split(b">>", 1)[0].decode() in INTERESTING:
                            pending = True
                            last = time.monotonic()
                if pending and (time.monotonic() - last) * 1000 >= debounce_ms:
                    on_dirty()
                    pending = False
        except (FileNotFoundError, ConnectionResetError, OSError):
            time.sleep(delay)
            delay = min(delay * 2, 30.0)            # capped backoff
```

## 3. Atomic write + validation (the file contract)

```python
import json, os, re
from pathlib import Path

HEX = re.compile(r"^#[0-9a-fA-F]{6}$")

def atomic_write_json(path: Path, data: dict) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
                   encoding="utf-8")
    os.replace(tmp, path)                           # atomic on the same filesystem

def merge_preserving(path: Path, patch: dict) -> None:
    data = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    data.update(patch)                              # unknown keys survive the round-trip
    atomic_write_json(path, data)

def validate_palette(pal: dict) -> None:
    for key, value in pal.get("base16", {}).items():
        if not HEX.match(value):
            raise ValueError(f"base16.{key}: expected #rrggbb, got {value!r}")
```

## 4. theme-sync target module (contract)

```python
# themesync/targets/kitty.py
NAME = "kitty"
DESCRIPTION = "kitty terminal colors"

def available(env) -> bool:
    return env.which("kitty") and (env.config / "kitty").exists()

def apply(env) -> None:
    lines = [f"background {env.palette.get('background')}", ...]
    env.write_managed_block(env.config / "kitty" / "kitty.conf", "kitty", lines)
```

Runner rules: iterate targets, call `available()` then `apply()`, **collect failures per target** and continue; final exit code `1` if any failed, printing the list to stderr. Managed blocks are marker-delimited (`equisdots theme-sync`) and must be rewritten idempotently.

## 5. Palette generator skeleton (own binary)

```python
def generate(source: Path, slug: str, out_dir: Path, index: Path,
             dry_run: bool = False) -> int:
    palette = build_base16(source)                  # your algorithm; roles are optional overrides
    validate_palette(palette)                       # #rrggbb for every slot
    doc = {"name": slug.upper(), "slug": slug, "category": "user",
           "base16": palette, "background": palette["color0"], "foreground": palette["color7"]}
    if dry_run:
        print(json.dumps(doc, indent=2)); return 0
    atomic_write_json(out_dir / f"{slug}.json", doc)
    merge_index(index, slug)                        # append/update the index entry atomically
    notify(f"Palette {slug} installed")             # hyprctl notify / notify-send
    return 0
```
Rules: never write `settings.json` (activation is the shell's/editor's job), keep `x` intact, lowercase hex, and support `--dry-run` for testing.

## 6. Packaging tree + wrapper

```
equisdots/theme-sync/
  theme-sync.sh            # thin wrapper: exec python3 -m themesync "$@"
  themesync/               # cli.py, core.py, runner.py, targets/*
  check.sh                 # deps/report helper (their repos ship one)
```

```bash
#!/usr/bin/env bash
# theme-sync.sh — stable entry point used by Colors.qml hooks and reload.sh
exec python3 -m themesync "$@"
```

## 7. pytest example (file contracts)

```python
def test_merge_preserves_unknown_keys(tmp_path):
    f = tmp_path / "settings.json"
    f.write_text('{"bar": {"font": "Hack Nerd Font"}, "custom": {"keep": 1}}')
    merge_preserving(f, {"glass": {"enabled": True}})
    data = json.loads(f.read_text())
    assert data["custom"] == {"keep": 1}
    assert data["glass"]["enabled"] is True

def test_invalid_hex_rejected():
    with pytest.raises(ValueError):
        validate_palette({"base16": {"color1": "fc618d"}})   # missing '#'
```

## 8. Compositor-citizenship checklist for Python tools

1. argv + `-j` + `timeout` for `hyprctl`; batch; `-i` for instances; never `shell=True`.
2. Startup <50 ms when hooked; no import-time side effects; logs to stderr.
3. State via `hl.*` + persist to `settings.json` only when the UI expects it.
4. Atomic writes, hex validation, unknown-key preservation, `x` fallback.
5. Event clients: debounce (50/250 ms), dedupe, reconnect with capped backoff.
6. Failures isolated per target; exit codes meaningful; `--dry-run` supported.
7. Installed under `~/.local/share/equisdots` + wrapper in `~/.local/bin`; stdlib-first for release.
