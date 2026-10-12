# Wallpaper and background under niri

niri draws only a flat background color per output (`output ... { layout {
background-color ... } }`, and the deprecated per-output `background-color`). It
has no wallpaper feature and no `hyprpaper`-style IPC. Wallpapers are external
`wlr-layer-shell` clients, exactly as they were on Hyprland.

Baseline: **niri 26.04** (2026-04-25).

## Tool map

| Hyprland | niri-era | Notes |
| --- | --- | --- |
| `hyprpaper` | `swaybg`, `awww` (swww fork), `wbg`, `xwww` (equisdots) | `hyprpaper` is Hyprland-specific (talks Hyprland IPC); it will not work on niri |
| `swww` | `awww` | `awww` is the maintained fork of `swww` |
| MPVPaper / video wallpaper | `mpvpaper`, or a layer-shell video tool | Works if it speaks `wlr-layer-shell` |
| Static per-output image | multiple `swaybg -o <output>` instances, or `awww`/`wbg` | See per-output below |

`swaybg`, `awww`, `wbg`, `mpvpaper` and the equisdots `xwww` all draw with
`wlr-layer-shell`, which niri implements. There is no niri-specific wallpaper API
to port to; the tools simply run.

## `hyprpaper` -> `swaybg` / `awww`

`hyprpaper` reads a Hyprland-specific config and uses Hyprland IPC for
per-output control. It cannot be pointed at niri. Replace it with:

```sh
# swaybg: one image, fill the screen.
swaybg -m fill -i "$HOME/Pictures/LakeSide.png"
```

```sh
# awww: daemon + set, supports transitions and per-output.
awww-daemon &
awww img "$HOME/Pictures/LakeSide.png" --outputs eDP-1 --transition-type grow
```

`swaybg` takes `-m <mode>` (`fill`, `stretch`, `fit`, `center`, `tile`) and
`-i <path>`, plus `-o <output>` to target one output. There is no runtime IPC; to
change the wallpaper you kill and restart it (or use a manager).

## Per-output wallpapers

`swaybg` and the equisdots `xwww` target outputs by niri output name. Get the
names from niri, not from `hyprctl`:

```sh
niri msg --json outputs | jq -r 'keys[]'
# eDP-1
# DP-1
# "Xiaomi Corporation P27FBB-RGGL 5275600003570"
```

Then run one instance per output:

```sh
swaybg -o eDP-1 -m fill -i ~/Pictures/laptop.png &
swaybg -o DP-1  -m fill -i ~/Pictures/monitor.png &
```

Because output names can change on hotplug, prefer a form of the name that
survives renames (`make model serial`, the string `niri msg outputs` prints as the
key) where the tool supports it; `swaybg -o` takes the connector name only.

## animated wallpapers (`mpvpaper`, `xwww`, GIFs)

Layer-shell video wallpaper tools keep working:

- `mpvpaper` renders an MPV video onto a layer surface. It works on niri; start it
  per output, e.g. `mpvpaper -o "no-audio loop" DP-1 video.mp4`.
- The equisdots `xwww` (MPVPaper-style, Quickshell-driven) is a `wlr-layer-shell`
  client. Confirm it does not use any Hyprland socket; if it only speaks
  layer-shell and XDG, it runs unchanged. Otherwise fall back to `mpvpaper`.

### xray / blur caveats

niri 26.04 has real background effects (`Window-Effects.md`), including blur,
xray, saturation and noise, configured per window/layer rule in
`background-effect {}`. The relevant caveats for animated backgrounds:

- **xray is on by default whenever any background effect is active.** With xray,
  niri blurs the wallpaper once and reuses it for every window. That is efficient
  for a **static** wallpaper.
- **With an animated wallpaper, xray must recompute the blur every frame.** The
  cost is paid once and shared across windows, but a full-screen animated
  background plus blur still keeps the GPU busy continuously. If you see heat or
  battery drain, this is the first suspect.
- **Non-xray effects are experimental** and are more expensive because niri
  recomputes them whenever a window moves or the content underneath changes.
  Avoid `xray false` with an animated background.
- Global blur controls live in the top-level `blur {}` block (Since: 26.04),
  including `off` to disable all background blur. If a video wallpaper plus blur
  is too heavy, disable blur globally or avoid blurring over it.
- A heavily blurred animated background is the worst case; prefer a static image
  for the wallpaper layer and reserve video wallpaper for setups without blur.

In short: niri's xray is the replacement for the "blur samples the wallpaper"
behavior, and it is the thing that makes animated wallpapers expensive.

## Overview backdrop

To make the wallpaper visible behind the Overview's zoomed-out workspaces, add a
layer rule matching the wallpaper tool's namespace (check the tool's namespace,
e.g. `swaybg` uses `wallpaper`):

```kdl
layer-rule {
    match namespace="^wallpaper$"
    place-within-backdrop true
}
```

`place-within-backdrop` is documented in the niri layer-rules wiki. Without it,
the wallpaper can render above the backdrop.

## Startup

Start the wallpaper tool from `spawn-at-startup`, `spawn-sh-at-startup`, a systemd
unit (`PartOf=graphical-session.target`, as in the niri systemd example), or the
equisdots launcher. The equisdots `wallpapers.sh` / `scenes.sh` / `init.sh`
drive the `davincix` CLI, which is compositor-agnostic; only ensure the underlying
apply step uses a layer-shell tool. No `hyprpaper` autostart should remain.

## Version gating

- Background effects / xray / top-level `blur {}`: **Since 26.04**. On older niri
  the animated-wallpaper caveats do not apply because there is no blur.
- `place-within-backdrop`: layer rule; verify against the target release before
  relying on it.
- `wlr-layer-shell` wallpaper tools: supported across niri's history.
