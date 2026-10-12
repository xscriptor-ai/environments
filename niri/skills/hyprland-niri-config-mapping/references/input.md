# Input and devices

Baseline: Hyprland 0.55+ Lua, niri 26.04. This maps Hyprland `input {}` and
per-device `device {}` to niri `input {}`.

The critical limitation: niri 26.04 configures input **per device type**
(`keyboard`, `touchpad`, `mouse`, `trackpoint`, `trackball`, `tablet`,
`touch`), not per named device. There is no equivalent of Hyprland's
`device "name" {}`. Writing a `device "..."` node in `config.kdl` is not a
recognized section and fails `niri validate`. Per-device tuning is planned
upstream but not available in the documented baseline.

## input -> input

| Hyprland `input` | niri | Notes |
| --- | --- | --- |
| `kb_layout` | `input { keyboard { xkb { layout "..." } } }` | Direct. |
| `kb_variant` | `xkb { variant "..." }` | Direct. |
| `kb_model` | `xkb { model "..." }` | Direct. |
| `kb_options` | `xkb { options "..." }` | Direct. |
| `kb_rules` | `xkb { rules "..." }` | Direct. |
| `kb_file` | `xkb { file "~/.config/keymap.xkb" }` | Since: 25.02. Overrides all other xkb settings. |
| `repeat_rate` / `repeat_delay` | `keyboard { repeat-rate N; repeat-delay N }` | Rate in chars/sec, delay in ms. |
| `follow_mouse` | `input { focus-follows-mouse }` | Flags differ; see below. |
| `mouse_refocus` | none | No equivalent. |
| `sensitivity` | `accel-speed N` | Both in the `-1.0..1.0` range, default `0.0`. |
| `accel_profile` | `accel-profile "adaptive"` or `"flat"` | Direct. |
| `force_no_accel` | `accel-profile "flat"` plus `accel-speed 0` | Approximate. |
| `float_switch_override_focus` | none | n/a. |
| `numlock_by_default` | `keyboard { numlock }` | Since: 25.05. |
| `scroll_method` | `scroll-method "..."` | `no-scroll`, `two-finger`, `edge`, `on-button-down`. |
| `scroll_button` | `scroll-button N` | Since: 0.1.10. |
| `natural_scroll` | `natural-scroll` (flag) | Direct. |
| `disable_while_typing` | `dwt` (flag) | Direct. |
| `tap-to-click` | `tap` (flag) | Hyprland `tap_to_click` -> niri `tap`. |
| `tap-and-drag` | `drag true/false` | Since: 25.05. |
| `drag_lock` | `drag-lock` (flag) | Since: 25.02. |
| `scroll_factor` | `scroll-factor N` | Since: 0.1.10; `vertical=`/`horizontal=` overrides Since: 25.08. |
| `left_handed` | `left-handed` (flag) | Direct. |
| `middle_button_emulation` | `middle-emulation` (flag) | Direct. |
| `clickfinger_behavior` | `click-method "clickfinger"` | Direct; niri values `button-areas`/`clickfinger`. |
| `disable_while_typing` on mouse | `mouse { }` has no dwt | dwt/dwtp are touchpad-only in niri. |

Hyprland's touchpad values live under `input.touchpad` in the Lua API
(`hl.config({ input = { touchpad = { ... } } })`). They map to niri's
`input { touchpad { ... } }`.

### follow_mouse mapping

Hyprland `follow_mouse` is an integer:

- `0` = disabled -> omit `focus-follows-mouse`.
- `1` = full -> `focus-follows-mouse`.
- `2` = only when entering the window -> no exact niri equivalent; approximate
  with `focus-follows-mouse max-scroll-amount="0%"` (avoids scroll-on-focus).
- `3` = only when entering the window and only on the same monitor -> no exact
  equivalent; approximate with `focus-follows-mouse max-scroll-amount="0%"`.

`max-scroll-amount` (Since: 0.1.8) is a percentage of the working area; it
stops focus-follows-mouse from scrolling the view when the target is off-screen.

```kdl
input {
    focus-follows-mouse max-scroll-amount="10%"
}
```

## Before / after

```lua
-- settings.lua (Hyprland)
hl.config({
    input = {
        kb_layout  = "es",
        kb_options = "grp:alt_shift_toggle",
        follow_mouse  = 1,
        mouse_refocus = false,
        sensitivity   = 0,
        accel_profile = "flat",
        touchpad = {
            natural_scroll       = true,
            disable_while_typing = true,
            tap_to_click         = true,
            drag_lock            = false,
            scroll_factor        = 1.0,
        },
    },
})
```

```kdl
// input.kdl (niri)
input {
    keyboard {
        xkb {
            layout "es"
            options "grp:alt_shift_toggle"
        }
        // repeat-delay 600
        // repeat-rate 25
    }

    touchpad {
        tap
        dwt
        natural-scroll
        accel-speed 0.0
        accel-profile "flat"
        scroll-factor 1.0
        // drag-lock
    }

    mouse {
        accel-speed 0.0
        accel-profile "flat"
    }

    focus-follows-mouse max-scroll-amount="0%"
}
```

If the `xkb {}` block is empty, niri fetches the layout from systemd-localed
(`org.freedesktop.locale1`) over D-Bus, which is what installers set. To control
it yourself, write the block explicitly as above.

## Per-device `device {}` has no equivalent

Hyprland accepts any number of `device "name" {}` blocks, each overriding a
subset of `input` for one physical device:

```lua
-- Hyprland
hl.device({ name = "logitech-usb-keyboard", sensitivity = 0.1 })
hl.device({ name = "elan-touchpad", tap_to_click = false })
```

niri 26.04 rejects this. There is no `device` section, and adding one makes
`niri validate` fail with an unknown-node error. Settings apply to every device
of that type.

What to do instead:

1. **Set the type defaults.** Configure `keyboard`, `touchpad`, and `mouse`
   blocks with the values you want for the common case. This covers most
   multi-device setups where each type has one primary device.
2. **Differentiate by capability.** Because niri has separate sections per
   type, an external mouse and the built-in trackpoint can hold different
   `accel-speed` values without per-device matching.
3. **Disable a device when it is not wanted.** There is no per-device `off`
   selectable by name, but `disabled-on-external-mouse` (touchpad) suppresses
   the touchpad while an external pointer is connected:

   ```kdl
   input {
       touchpad {
           disabled-on-external-mouse
       }
   }
   ```

4. **Handle truly unique devices outside niri.** For a single problematic
   device, use udev rules (`/etc/udev/rules.d/`) or `libinput`-shipped quirks,
   or a startup script that calls `libinput` tooling, accepting that these are
   not compositor config.
5. **Disable a device at the session level** with a `spawn-at-startup` script
   that unplugs/remaps it if the device causes problems.

Never copy a Hyprland `device "..."` block verbatim into `config.kdl`; it will
break the parse. Convert it to type-level settings and note the divergence in
an ADR.

## Gestures

Hyprland's `hl.gesture` configures a gesture action:

```lua
-- Hyprland: 3-finger horizontal swipe switches workspaces
hl.gesture({ fingers = 3, direction = "horizontal", action = "workspace" })
```

niri gestures are built in and not user-mapped the same way:

- Horizontal touchpad swipe scrolls the view (columns) with the
  `horizontal-view-movement` animation.
- Vertical touchpad swipe switches workspaces in the overview, animated by
  `workspace-switch`.
- The `gestures {}` section only configures **drag-and-drop edge scrolling**
  and **hot corners**, not arbitrary gesture-to-action mappings.

| Hyprland `hl.gesture` | niri |
| --- | --- |
| `fingers` / `direction` / `action` mapping | No equivalent; gestures are fixed. |
| (none) | `gestures { dnd-edge-view-scroll { ... } }` (Since: 25.02) |
| (none) | `gestures { dnd-edge-workspace-switch { ... } }` (Since: 25.05) |
| (none) | `gestures { hot-corners { ... } }` (Since: 25.05) |

So a Hyprland 3-finger workspace swipe is covered implicitly by niri's built-in
horizontal view scroll; there is nothing to write. If you depended on a custom
gesture action, it must be redesigned or dropped.

```kdl
// niri: only DnD edge scrolling and hot corners are configurable.
gestures {
    dnd-edge-view-scroll {
        trigger-width 30
        delay-ms 100
        max-speed 1500
    }

    hot-corners {
        top-left
    }
}
```

Keyboard layout switching across multiple layouts can be bound:

```kdl
binds {
    Mod+Space { switch-layout next; }
}
```

See `references/general-decoration.md` for the `cursor {}` block (theme and
size), which replaces Hyprland's `cursor` category and `hyprctl setcursor`.
