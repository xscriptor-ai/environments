# Debug options, validation, logging, and config notifications

The `debug {}` section, config validation, and logging. Baseline: niri 26.04
(2026-04-25).

> The `debug {}` options are not covered by the config breaking-change policy.
> They are experimental, may have known issues, and can change or stop working
> at any point with little notice. Prefer a targeted debug flag for a specific
> hardware/driver bug, then remove it once resolved.

## Validate and reload

```sh
niri validate                          # parse the default config, print errors
niri validate -c /path/to/config.kdl   # parse a specific file
niri msg action load-config-file --path /path/to/config.kdl   # Since: 26.04
```

Parse errors are logged at `warn!` level and, in a session, announced by the
screen reader. A save with an error keeps the previous config running.

## Logging levels

niri uses [`tracing`](https://lib.rs/crates/tracing):

| Level | Meaning |
| --- | --- |
| `error!` | Recoverable programming error/bug. An `ERROR` in the niri log always indicates a **bug**. |
| `warn!` | Something bad but possible, e.g. config parse errors, weird hardware. |
| `info!` | Most important normal-operation messages. |
| `debug!` | Less important normal-operation messages. |
| `trace!` | Everything useful for debugging; too spammy/perf-intensive. Compiled out of release builds. |

Raise verbosity with `RUST_LOG`, for example `RUST_LOG=niri=debug`. The intended
steady state is `RUST_LOG=niri=info`, which should be quiet enough for normal use.

```sh
RUST_LOG=niri=debug niri
journalctl --user-unit=niri -b
```

## Config notification

<sup>Since: 25.08</sup>

niri notifies about config creation and parse failures. Disable the failure
notification (for example, if you have your own) with:

```kdl
config-notification {
    disable-failed
}
```

## `debug {}` options at a glance

```kdl
debug {
    preview-render "screencast"
    // preview-render "screen-capture"
    enable-overlay-planes
    disable-cursor-plane
    disable-direct-scanout
    restrict-primary-scanout-to-matching-format
    force-disable-connectors-on-resume
    render-drm-device "/dev/dri/renderD129"
    ignore-drm-device "/dev/dri/renderD128"
    ignore-drm-device "/dev/dri/renderD130"
    force-pipewire-invalid-modifier
    disable-pipewire-dmabuf
    dbus-interfaces-in-non-session-instances
    wait-for-frame-completion-before-queueing
    emulate-zero-presentation-time
    disable-resize-throttling
    disable-transactions
    keep-laptop-panel-on-when-lid-is-closed
    disable-monitor-names
    strict-new-window-focus-policy
    honor-xdg-activation-with-invalid-serial
    skip-cursor-only-updates-during-vrr
    deactivate-unfocused-windows
    disable-10bit-output
}
```

## Option reference

"Safe" marks options used as targeted workarounds that generally do not change
core compositing behavior. "Advanced" marks options that alter rendering,
synchronization, or protocols and can cause visual or performance regressions.

| Option | Since | Class | Purpose |
| --- | --- | --- | --- |
| `preview-render "screencast"` / `"screen-capture"` | - | Advanced | Render monitors as a screencast/capture would; preview `block-out-from`. |
| `enable-overlay-planes` | - | Advanced | Direct scanout into overlay planes; may drop frames in some animations. Primary-plane scanout is always on. |
| `disable-cursor-plane` | - | Safe | Render the cursor with the frame; work around driver cursor bugs. |
| `disable-direct-scanout` | - | Advanced | Disable direct scanout to primary and overlay planes. |
| `restrict-primary-scanout-to-matching-format` | - | Advanced | Only scan out to the primary plane when the buffer matches the composition swapchain format; may stop some clients (mpv) from scanning out. |
| `force-disable-connectors-on-resume` | 26.04 | Advanced | Force-disable all outputs on resume (TTY switch/wake); causes a modeset/blank. Try if rendering is corrupted or monitors do not light up after a TTY switch. |
| `render-drm-device "/dev/dri/renderD129"` | - | Safe | Override the DRM device used for all rendering (pick a different primary GPU). See hybrid-GPU lag in `faq.md`. |
| `ignore-drm-device "/dev/dri/renderD128"` | 25.11 | Safe | Ignore a DRM device; useful for GPU passthrough. Repeatable. |
| `force-pipewire-invalid-modifier` | 25.01 | Advanced | Force PipeWire screencast to use the invalid modifier even when DRM offers others; for testing. |
| `disable-pipewire-dmabuf` | next release (post-26.04) | Advanced | Force shared-memory buffers for PipeWire screencasts; for testing shm screencasting. |
| `dbus-interfaces-in-non-session-instances` | next release (post-26.04) | Advanced | Create D-Bus interfaces even when not running `--session`; for testing screencasting without relogin. The main instance reclaims the interfaces when the new instance quits. |
| `wait-for-frame-completion-before-queueing` | - | Advanced | Wait for each frame to finish rendering before handing it to DRM; synchronization/perf diagnosis. |
| `emulate-zero-presentation-time` | - | Advanced | Emulate zero (unknown) presentation time; test NVIDIA-proprietary-driver behavior. |
| `disable-resize-throttling` | 0.1.9 | Advanced | Send resizes as fast as possible; bypasses resize transactions' throttling. |
| `disable-transactions` | 0.1.9 | Advanced | Disable resize and close transactions; breaks synchronized resizing. Do not use with `disable-resize-throttling`. |
| `keep-laptop-panel-on-when-lid-is-closed` | 0.1.10 | Safe | Keep the internal panel on when the lid closes (default is to disable it). |
| `disable-monitor-names` | 0.1.10 | Safe | Ignore make/model/serial from EDID; workaround for a 0.1.9/0.1.10 crash with two identical monitors. |
| `strict-new-window-focus-policy` | 25.01 | Safe | Disable heuristic auto-focus; only valid xdg-activation tokens focus a window. |
| `honor-xdg-activation-with-invalid-serial` | 25.05 | Safe | Honor invalid-serial activation tokens; makes Discord/Telegram focus when clicking tray icons/notifications. Control behavior with the `on-xdg-activate` window rule. |
| `skip-cursor-only-updates-during-vrr` | 25.08 | Advanced | Do not redraw from cursor input during VRR; can make rendering appear frozen when nothing else redraws. |
| `deactivate-unfocused-windows` | 25.08 | Safe | Drop the Activated state for unfocused windows; fixes Chromium/Electron (Teams, Slack) notification/IME bugs. |
| `disable-10bit-output` | next release (post-26.04) | Safe | Disable 10-bit color output; workaround for Intel + NVIDIA mixed-GPU black/white screens until fixed in Smithay. |

## Debug key bindings

These live in `binds {}`, not `debug {}`, but are debug tooling:

| Binding | Since | Effect |
| --- | --- | --- |
| `toggle-debug-tint` | - | Tint all surfaces green unless directly scanned out; check whether direct scanout works. |
| `debug-toggle-opaque-regions` | 0.1.6 | Tint opaque regions blue and the rest red; inspect opaque-region marking. |
| `debug-toggle-damage` | 0.1.6 | Tint damaged regions red. |

```kdl
binds {
    Mod+Shift+Ctrl+T { toggle-debug-tint; }
    Mod+Shift+Ctrl+O { debug-toggle-opaque-regions; }
    Mod+Shift+Ctrl+D { debug-toggle-damage; }
}
```

## Removed options

- `wait-for-frame-completion-in-pipewire` (Until: 25.08) fixed NVIDIA screencast
  flickering; it was removed because the problem was fixed in niri. On 26.04 it
  will fail to parse.

## Related

- `niri-configuration` - where `debug {}` sits in the config and every other
  top-level option.
- The `niri-session-integration` skill's `references/nvidia.md` - NVIDIA-specific
  flags and the VRAM workaround.
