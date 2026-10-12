# Color picking, screenshots and screen recording under niri

niri has a native color-picker query, native screenshot actions and a built-in
screenshot UI. `grim`, `slurp`, `wf-recorder` and `wl-clipboard` keep working
because they use protocols niri implements (`wlr-screencopy`,
`ext-image-copy-capture`, `wlr-layer-shell`).

Baseline: **niri 26.04** (2026-04-25).

## Color picker: `hyprpicker` -> `niri msg pick-color`

Hyprland used `hyprpicker` (`hl.dsp.exec_cmd("hyprpicker -a")` in the equisdots
`keybinds.lua`, bound to `SUPER+SHIFT+C`, auto-copy). niri has a native request:

```sh
niri msg pick-color
# click a pixel; prints {"rgb":[r,g,b]} with each channel in 0.0..=1.0
niri msg --json pick-color | jq -c .rgb
# [0.10196078431372549,0.10196078431372549,0.10196078431372549]
```

To reproduce `hyprpicker -a` (pick and copy a hex color to the clipboard):

```sh
#!/usr/bin/env bash
set -euo pipefail
read -r r g b < <(niri msg --json pick-color | jq -r '.rgb | map((.*255)|round) | @tsv')
printf '#%02x%02x%02x' "$r" "$g" "$b" | wl-copy
notify-send "Color" "$(wl-paste -n)"
```

Bind the script (keep the conversion in the script, not in a bind one-liner):

```kdl
binds {
    Mod+Shift+C { spawn "pick-color.sh"; }
}
```

Note the units: niri returns floats `0.0..=1.0`, not `0..255` and not hex. Convert
before copying or displaying.

About the screenshot UI's color pick: the interactive screenshot UI is primarily a
capture/annotate editor. Use `niri msg pick-color` for color; do not depend on the
UI providing an eyedropper (verify per release, and prefer the dedicated query).

## Screenshots: `hyprshot` -> native actions / `grim`+`slurp`

### niri-native screenshot actions

| Action | Behavior |
| --- | --- |
| `screenshot` | Opens the built-in interactive screenshot UI |
| `screenshot-screen` | Screenshots the focused output |
| `screenshot-window` | Screenshots the focused window (or `--id N`) |

Flags (26.04): `--write-to-disk <bool>` (default true), `--show-pointer <bool>`,
`--path <absolute>`. In the interactive UI, `Space` saves, `Escape` cancels, and
`Ctrl+C` copies to the clipboard without writing to disk.

```sh
niri msg action screenshot              # interactive UI
niri msg action screenshot-screen       # focused output + clipboard + disk
niri msg action screenshot-screen --write-to-disk=false --show-pointer=false
niri msg action screenshot-window --id 12 --path /tmp/win.png
```

Disk writes go to the `screenshot-path` config option, formatted with
`strftime(3)`:

```kdl
screenshot-path "~/Pictures/Screenshots/Screenshot from %Y-%m-%d %H-%M-%S.png"
// or disable disk writes entirely:
// screenshot-path null
```

When a screenshot is saved, the event stream emits
`ScreenshotCaptured {"path": "..."}` (`null` if clipboard-only). A bar can show a
toast from that.

Binds (niri defaults are `Print`, `Alt+Print`, `Ctrl+Print`):

```kdl
binds {
    Print     { screenshot; }
    Alt+Print { screenshot-window; }
    Ctrl+Print { screenshot-screen; }
    // 25.05+: hide pointer
    Print { screenshot show-pointer=false; }
    // 26.04+: show pointer on window shots when over the window
    Alt+Print { screenshot-window show-pointer=true; }
}
```

### `grim` + `slurp`

The equisdots `screenshot.sh` uses `grim` for direct capture and `satty` for
annotation. Both work on niri: `grim` uses `wlr-screencopy`, `slurp` and `satty`
use `wlr-layer-shell`.

```sh
grim ~/shot.png                      # all outputs
grim -o DP-1 ~/shot.png              # one output
grim -g "$(slurp)" ~/shot.png        # interactive region
grim -g "$(slurp)" - | satty --filename - --output-filename ~/annotated.png
```

The existing `screenshot.sh` QR path (`grim -g ... | zbarimg`) and the
`--geometry` path keep working unchanged; only the compositor-specific reset calls
are unnecessary. Prefer the native `screenshot` UI where you used `hyprshot`,
because it gives clipboard + disk + annotation without extra binaries.

## Screen recording

| Tool | Protocol | Works on niri |
| --- | --- | --- |
| `wf-recorder` | `wlr-screencopy` | Yes |
| OBS Studio | portal + PipeWire | Yes (needs `xdg-desktop-portal-gnome` + `niri-session`) |
| `wl-mirror` | `ext-image-copy-capture` | Yes (mirrors into a window) |
| `wayvnc` | `ext-image-copy-capture` | Yes |
| `xdg-desktop-portal-wlr` | `wlr-screencopy` / `ext-image-copy-capture` | Yes |
| `gpu-screen-recorder` (equisdots) | `wlr-screencopy` / driver | Yes; same engine as Hyprland, self-contained in the niri repo |

`wf-recorder` examples:

```sh
wf-recorder -o DP-1 -f ~/Videos/recording.mp4
wf-recorder -g "$(slurp)" -f ~/Videos/region.mp4
wf-recorder --audio -f ~/Videos/with-audio.mp4      # capture default audio
```

OBS uses the screencast portal; select "niri Dynamic Cast Target" or an output/
window. Since 25.05 niri exposes a dynamic cast target that you can point with
`set-dynamic-cast-window` / `set-dynamic-cast-monitor` / `clear-dynamic-cast-target`,
and it marks the target window with the `is-window-cast-target=true` rule.

Screencast state is available in IPC:

```sh
niri msg --json casts | jq '.'          # active screencasts
niri msg action stop-cast --session-id N
```

For the equisdots recorder: `gpu-screen-recorder` is the same engine Hyprland
uses and it works on niri through `wlr-screencopy` (direct capture, not the
portal). equisdots ships a self-contained recorder in the `niri` repo
(`scripts/niri_record.sh`): `Super+Alt+R` toggles a full-screen recording and
`Super+Alt+Shift+R` records a region chosen with `slurp`; it writes the pid
cache (`~/.cache/quickshell/recording/rec_pid`) the bar indicator reads. Use
direct capture (`-w screen` / `-w region`); avoid GSR's portal mode, which hangs
on some setups. `wf-recorder` and OBS remain alternatives.

## Version gating

- `screenshot` / `screenshot-screen` / `screenshot-window` actions: present in
  26.04; `write-to-disk=false` Since 25.02; `show-pointer=false` Since 25.05;
  `show-pointer=true` on window shots Since 26.04.
- `niri msg pick-color`: present in 26.04 (interactive query).
- Dynamic cast target: Since 25.05.
- `is-window-cast-target` window rule: Since 25.02.
- Interactive screenshot UI: Since 25.05 (per Getting-Started; check the exact
  release before wiring binds that assume the editor).
