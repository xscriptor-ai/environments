# niri FAQ

High-value answers from the official FAQ, restructured for lookup. Baseline:
niri 26.04 (2026-04-25).

## Configuration

### Everything looks like the default niri config even though I wrote a config. Why?

niri only reports a parse failure in a notification and the log; it keeps the
previous config, or falls back to the built-in default when no valid config has
loaded yet. Symptoms of the fallback are a plain gray background and the
"Important Hotkeys" overlay at startup.

Run `niri validate` (or `niri validate -c <path>`) to find the failing node, fix
it, and save. The most common cause is a one-line block whose last child is not
terminated (see the KDL strictness gotcha in the `niri-configuration` skill).
Diagnose with:

```sh
journalctl --user-unit=niri -b
niri msg --json event-stream
```

## Decoration, borders, and shapes

### How do I disable client-side decorations / make windows rectangular?

Uncomment the top-level `prefer-no-csd` setting and restart your apps:

```kdl
prefer-no-csd
```

niri then asks windows to omit client-side decorations and tells them they are
being tiled (which makes some windows rectangular even if they cannot drop the
decorations).

Note: this currently prevents edge window resize handles from showing. You can
still resize by holding `Mod` and the right mouse button.

### Why are transparent windows tinted, or why does the border/focus ring show through semitransparent windows?

Set `prefer-no-csd` (see above) and restart the apps. niri draws focus rings and
borders *around* windows that agree to omit their client-side decorations.

By default the focus ring and border are rendered as a solid background
rectangle behind windows, so they show through semitransparent windows. This is
because windows using client-side decorations can have an arbitrary shape.

Override this with the `draw-border-with-background` window rule when you want
the border drawn without that filled background.

### How do I enable rounded corners for all windows?

```kdl
window-rule {
    geometry-corner-radius 12
    clip-to-geometry true
}
```

### Why do Firefox and Thunderbird have a 1 px smaller border?

They draw their own 1 px dark border around the window, which obscures one pixel
of niri's border. If you dislike it:

```kdl
window-rule {
    clip-to-geometry true
}
```

## Layout behavior

### Why do windows not overflow the monitor?

niri is a **scrollable** tiling compositor and has no global X11-style
coordinate system: windows live on an infinite strip per monitor and the view
scrolls to whatever is focused, rather than windows floating freely past the
screen edge. Consequences:

- A window or popup larger than the screen is aligned in the **top-left
  corner**, so the important top-left area stays visible.
- Focusing an off-screen column scrolls it into view; with the default
  `center-focused-column "never"`, it scrolls to the left or right screen edge.
- There is no action that moves a window beyond the monitor into another
  coordinate space; use another workspace, column, or a floating window instead.

This is by design, not a limitation to work around.

### How do I hide the "Important Hotkeys" pop-up at startup?

```kdl
hotkey-overlay {
    skip-at-startup
}
```

### How do I stop moving the mouse against a monitor edge from focusing the next window?

This happens with `focus-follows-mouse`: client-side decoration resize margins
sit *outside* the window geometry and "peek out" of the monitor edges, so
crossing them triggers focus-follows-mouse. Fixes:

```kdl
input {
    focus-follows-mouse max-scroll-amount="0%"
}
```

or set `prefer-no-csd`, which generally makes clients remove those margins.

### Why does Firefox/Bitwarden not open as floating?

Firefox first opens the Bitwarden window with a generic Firefox title and only
later changes it to Bitwarden, so an `open-floating` window rule cannot target
it reliably. Use a script (search niri discussions for Bitwarden) instead.

### Can I open a window directly in the current column?

No. Script it over IPC: listen to the event stream for a new window, then call
`consume-or-expel-window-left`. Adding it natively is design-sensitive and not
implemented.

## Screencasting and screen sharing

The primary screencast interface is **portals + PipeWire**, supported by OBS,
Firefox, Chromium, Electron, Telegram, and others; both monitors and individual
windows can be cast.

Requirements:

- a working D-Bus session,
- PipeWire,
- `xdg-desktop-portal-gnome`,
- niri running **as a session** (`niri-session` or a display manager).

On mainstream distributions this works out of the box. You can also use tools
based on `ext-image-copy-capture` or the older `wlr-screencopy`.

Related features:

- **Block out windows** from a screencast with the `block-out-from "screencast"`
  window rule (and the same on layer rules, e.g. for notifications).
- **Dynamic cast target** (Since: 25.05): pick "niri Dynamic Cast Target" in the
  dialog, then switch with `set-dynamic-cast-window`, `set-dynamic-cast-monitor`,
  `clear-dynamic-cast-target`.
- **Indicate cast windows** (Since: 25.02) with the
  `is-window-cast-target=true` window rule.

### How do I mirror an output?

niri has no built-in output mirroring; use `wl-mirror`:

```kdl
binds {
    Mod+P repeat=false { spawn-sh "wl-mirror $(niri msg --json focused-output | jq -r .name)"; }
}
```

Focus the output to mirror, press the bind, move the `wl-mirror` window to the
target output, and fullscreen it.

## X11 and applications

### How do I run X11 apps like Steam or Discord?

Use `xwayland-satellite`. Many Electron apps (VSCode, Discord) can run natively
on Wayland with the right flags instead. See `application-issues.md`.

### Why doesn't niri integrate Xwayland like other compositors?

Because integrating Xwayland means implementing parts of an X11 window manager,
appeasing X11 windowing ideas, providing a global coordinate system niri does
not have, and absorbing an endless stream of X11 bugs. Few X11-only clients
remain, and `xwayland-satellite` handles them well.

Since: 25.08 niri has seamless built-in `xwayland-satellite` integration that
largely matches built-in Xwayland in other compositors.

## Effects and feature status

### Can I enable blur behind semitransparent windows?

Since: 26.04, yes. See the `blur {}` section and window effects documentation.

### Can I make a window sticky / pinned / always on top / on all workspaces?

Not yet. You can emulate it with an IPC script (for example `nirius`'s
`toggle-follow-mode`).

## Displays and GPUs

### Why is there lag on an external monitor connected to a hybrid-GPU laptop?

Hybrid-GPU laptops usually wire the external monitor to the discrete GPU while
the internal panel is on the integrated GPU, which renders by default to save
battery. niri renders external content on the integrated GPU and copies it to
the discrete GPU, which can lag or stutter.

Fixes:

1. If the laptop has a MUX switch (UEFI GPU toggle), switch to the discrete GPU.
2. Otherwise render on the discrete GPU with:

   ```kdl
   debug {
       render-drm-device "/dev/dri/renderD129"
   }
   ```

   Using the discrete GPU for rendering drains battery much faster.

### How do I change output configuration based on connected monitors?

Use Kanshi, launched from niri:

```kdl
spawn-at-startup "/usr/bin/kanshi"
```

Example Kanshi profile:

```
profile {
	output eDP-1 enable scale 1.0
}

profile {
	output HDMI-A-1 enable scale 1.0 position 0,0
	output eDP-1 enable scale 1.25 position 1920,0
}
```

## Session recovery

### How do I recover from a dead screen locker or a red screen?

A red screen is niri's locked-session background when the locker died. Recover by
spawning a new locker. Either switch to another TTY (`Ctrl+Alt+F3`) and run:

```sh
WAYLAND_DISPLAY=wayland-1 swaylock
```

Or set `allow-when-locked=true` on your locker bind so you can press it on the
red screen:

```kdl
binds {
    Super+Alt+L allow-when-locked=true { spawn "swaylock"; }
}
```
