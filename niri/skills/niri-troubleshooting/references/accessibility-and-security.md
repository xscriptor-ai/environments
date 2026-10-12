# Accessibility and security model

Orca screen-reader integration and a concise summary of niri's security model.
Baseline: niri 26.04 (2026-04-25).

## Screen readers (Since: 25.08)

niri has basic screen-reader support (specifically Orca) when running as a full
desktop session, i.e. started through a display manager or `niri-session`. To
avoid conflicts with an already running compositor, niri does **not** expose
accessibility interfaces when started as a nested window or as a plain
`/usr/bin/niri` on a TTY.

What niri implements:

- the `org.freedesktop.a11y.KeyboardMonitor` D-Bus interface, so Orca can listen
  to and grab keyboard keys;
- exposure of the main niri UI elements via [AccessKit](https://accesskit.dev).

niri announces:

- workspace switching (for example, "Workspace 2");
- the exit confirmation dialog (`Super+Shift+E` by default);
- the Alt+Tab window switcher's selected window title (Since: 25.11);
- entering the screenshot UI and the overview (that they are focused; not their
  contents);
- whenever a config parse error occurs;
- the important hotkeys list (`Super+Shift+/` by default), as one large
  announcement without tab navigation.

### Using Orca

Make sure Xwayland works, then run `orca`. The default config binds
`Super+Alt+S` to toggle Orca (the standard key binding).

### Limitations

- No bind to move focus to layer-shell panels (needs consensus with LXQt/Xfce
  on the exact behavior).
- A screen must be connected and enabled; without one, niri gives focus to no
  window.
- Working EGL (hardware acceleration) is required.
- No screen curtain functionality yet.

### Advice for accessibility-focused distributions

Consider these default-config changes:

- Replace the default terminal (Alacritty) with one that supports screen
  readers, e.g. GNOME Console or GNOME Terminal.
- Replace the launcher and locker with screen-reader-friendly ones, e.g.
  `xfce4-appfinder` for the launcher.
- Add a `spawn-at-startup` command that plays a sound indicating niri finished
  loading.
- Add `spawn-at-startup "orca"` to start Orca automatically.

### Desktop zoom

No built-in zoom exists yet; use a third-party tool such as `wooz`.

## Security model

niri assumes that programs running **unsandboxed on the host are trusted**. This
is reasonable because such programs already have many ways to gain full access
independently of niri: `$LD_PRELOAD` in shell rc files, replacing binaries in
`$PATH`, interposing sockets in `$XDG_RUNTIME_DIR` (Wayland keylogging or screen
recording), scanning the filesystem for secrets, and connecting to an unlocked
keyring.

### What access to niri grants

Anything with access to niri's **Wayland socket** can:

- record the screen via `ext-image-copy-capture` or `wlr-screencopy`;
- track the cursor image and position via `ext-image-copy-capture`;
- emulate input via `wlr-virtual-pointer` and `virtual-keyboard`;
- read the clipboard via `wlr-data-control` / `ext-data-control`;
- create arbitrary fullscreen `wlr-layer-shell` surfaces that steal input,
  impersonate a password prompt, or lock the user out;
- kill a running lockscreen, create a new lock surface, and tell niri to unlock
  the session.

Anything with access to niri's **IPC socket** can spawn a Wayland client, which
can then do everything in the list above.

Anything with access to niri's **D-Bus interfaces** can record the screen through
the screencast interface and fully listen to and emulate keyboard input through
the accessibility interface.

X11 is worth calling out: while niri does not directly integrate Xwayland,
anything with access to the X11 `$DISPLAY` (a socket on disk and an abstract
socket in the network namespace) can intercept and emulate all input and record
the contents of any X11 windows on the same `$DISPLAY` (but not Wayland windows).

### Running untrusted clients

For untrusted clients, use a proper sandbox that:

1. removes niri's IPC socket,
2. prevents D-Bus access to host services,
3. uses a filtered Wayland socket.

For the filtered Wayland socket, niri implements the
[`security-context`](https://wayland.app/protocols/security-context-v1)
protocol; all unsafe protocols are inaccessible through a filtered socket.

One sandbox satisfying all criteria is **Flatpak**. Filtering only the Wayland
socket while leaving unrestricted D-Bus access is **not enough** to prevent
untrusted clients from doing bad things.

### Lock screen

When the session is locked via `ext-session-lock`, most actions (keybindings) are
automatically disabled; only a very small set of safe actions is allowed.
Spawning does not work, except for binds explicitly configured with
`allow-when-locked=true`.

<sup>Until: next release</sup>

The **quit** action is allowed, so you can always quit niri even on a lock
screen. Be careful: if you allow quit, or your locker can exit niri, ensure that
quitting does not drop you into an unprotected TTY command line. A display
manager such as GDM handles this by returning to a safe password prompt.

Other than quitting, the only way out of a lock screen is for the lock-screen
client to tell niri to unlock the session. If the locker crashes, the session
stays locked with a solid red background; another lock-screen client can take
over, so you can start a fresh locker and still unlock.
