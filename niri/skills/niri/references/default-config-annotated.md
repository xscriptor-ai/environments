# Annotated upstream default config

A condensed, restructured walkthrough of
`resources/default-config.kdl` shipped with niri 26.04 (2026-04-25). It explains
what each block does and whether a given line is a real default or an inert
example. Values are grouped by section; it is not a verbatim copy.

How to read the shipped file:

- Uncommented nodes are the defaults that actually take effect.
- Nodes prefixed with `/-` are commented out entirely (many are examples).
- Options with `//` in front are disabled/inert examples.
- The file is embedded in the niri binary and written to
  `~/.config/niri/config.kdl` on first run if no config exists.

## `input {}` (defaults)

| Setting | Shipped value | Kind |
| --- | --- | --- |
| `keyboard { xkb {} }` | empty xkb block | default; empty means xkb settings come from `org.freedesktop.locale1` |
| `keyboard { numlock }` | enabled | default |
| `touchpad { tap }` | enabled | default |
| `touchpad { natural-scroll }` | enabled | default |

Everything else in `input` is commented out and is an **example**, not a
default: `dwt`, `dwtp`, `drag false`, `drag-lock`, `accel-speed`, `accel-profile`,
`pinch-sensitivity`, `scroll-method`, `disabled-on-external-mouse`, plus the
whole `mouse` and `trackpoint` sections. `warp-mouse-to-focus` and
`focus-follows-mouse max-scroll-amount="0%"` are commented out (off).

## `/-output "eDP-1" {}` (inert example)

The entire output block is commented out with `/-`, so no output is configured
by default. It is a template showing `off`, `mode`, `scale`, `transform`, and
`position x=1280 y=0`. Enabling it requires removing the `/-`.

## `layout {}` (defaults plus inert examples)

Active defaults:

| Setting | Value |
| --- | --- |
| `gaps` | `16` |
| `center-focused-column` | `"never"` |
| `preset-column-widths` | `0.33333`, `0.5`, `0.66667` (proportions) |
| `default-column-width` | `{ proportion 0.5; }` |
| `focus-ring.width` | `4` |
| `focus-ring.active-color` | `"#7fc8ff"` |
| `focus-ring.inactive-color` | `"#505050"` |
| `border.off` | border disabled |
| `border.width` | `4` |
| `border.active-color` | `"#ffc87f"` |
| `border.inactive-color` | `"#505050"` |
| `border.urgent-color` | `"#9b0000"` |
| `shadow` | disabled (no `on`) |
| `shadow.softness / spread / offset / color` | `30` / `5` / `x=0 y=5` / `"#0007"` |

Inert examples: `preset-window-heights {}`, `default-column-width {}` (let the
window choose), `focus-ring` gradients, `border` gradients, `shadow` `on` and
`draw-behind-window true`, and the `struts` block (all four sides commented).

Notes worth keeping:

- The focus ring and border render as a solid rectangle behind windows by
  default, so they show through semitransparent windows. `prefer-no-csd` (below)
  changes that.
- Gradients take precedence over solid colors. Gradient colors support an
  optional `angle` (default `180`, top-to-bottom) and `relative-to="workspace-view"`.

## Top-level options in the shipped file

| Option | Shipped state | Meaning |
| --- | --- | --- |
| `spawn-at-startup "waybar"` | **active** | The one autostart in the default config |
| `spawn-sh-at-startup "..."` | commented | Example shell autostart (Since: 25.08) |
| `hotkey-overlay { skip-at-startup }` | commented | Show the overlay at startup by default |
| `prefer-no-csd` | commented | Off by default; enabling needs app restarts |
| `screenshot-path "~/Pictures/..."` | **active** | Default screenshot path with `strftime` |
| `screenshot-path null` | commented | Alternative to disable saving to disk |
| `animations {}` with `// off` and `// slowdown 3.0` | empty | Animations on, normal speed |

The default config does not contain `environment`, `cursor`, `overview`,
`xwayland-satellite`, `clipboard`, `config-notification`, or `blur`, so those use
their built-in defaults. See `top-level-options.md` for those defaults.

## `animations {}` (defaults)

Empty except for comments. Animations are enabled at normal speed. To disable all
animations, add `off`; to slow them down, set `slowdown 3.0`.

## `window-rule {}` (two default rules, two inert examples)

Active rules:

1. WezTerm workaround: `match app-id=r#"^org\.wezfurlong\.wezterm$"#` with
   `default-column-width {}`, working around WezTerm's initial configure bug.
2. Firefox picture-in-picture: `match app-id=r#"firefox$"# title="^Picture-in-Picture$"`
   with `open-floating true`.

Inert examples (commented with `/-`):

- Block password managers from screen capture:
  `match app-id=r#"^org\.keepassxc\.KeePassXC$"#` and
  `match app-id=r#"^org\.gnome\.World\.Secrets$"#` with
  `block-out-from "screen-capture"` (or `"screencast"`).
- Rounded corners for all windows: `geometry-corner-radius 12` and
  `clip-to-geometry true`.

## `binds {}` (active; not defaulted)

This is the largest section and is **not** filled with defaults: if you delete
it, you lose all key bindings. The shipped binds are a working starting set, not
a fixed requirement. Grouped:

| Group | Examples |
| --- | --- |
| Help / programs | `Mod+Shift+Slash` hotkey overlay; `Mod+T` alacritty; `Mod+D` fuzzel; `Super+Alt+L` swaylock; `Super+Alt+S` orca toggle |
| Media / hardware keys | `XF86Audio*` via `wpctl`; `XF86Audio{Play,Pause,Stop,Prev,Next}` via `playerctl`; `XF86MonBrightness*` via `brightnessctl` (all `allow-when-locked=true`) |
| Overview / window | `Mod+O repeat=false` toggle-overview; `Mod+Q repeat=false` close-window |
| Focus / move | `Mod+H/J/K/L` and arrows for column/window focus and movement; `Mod+Ctrl+...` variants |
| Monitor movement | `Mod+Shift+...` focus monitor; `Mod+Shift+Ctrl+...` move column to monitor |
| Workspaces | `Mod+Page_Up/Down`, `Mod+U/I`; `Mod+Shift+...` move workspace; `Mod+1..9` focus index; `Mod+Ctrl+1..9` move column |
| Wheel scroll | `Mod+WheelScroll*` with `cooldown-ms=150`, plus `Mod+Shift+WheelScroll*` |
| Window/column management | consume/expel, `Mod+R` preset width, maximize, fullscreen, column width/height adjustments, floating toggle, tabbed display |
| Screenshots | `Print`, `Ctrl+Print`, `Alt+Print` |
| Escape/quitting | `Mod+Escape allow-inhibiting=false` keyboard-shortcuts inhibitor; `Mod+Shift+E` and `Ctrl+Alt+Delete` quit; `Mod+Shift+P` power-off-monitors |

Commented alternatives: `focus-window-or-workspace-*`, single-window monitor and
workspace moves (`move-window-to-*`), `focus-workspace-previous` on `Mod+Tab`,
`switch-layout "next"/"prev"` (do not also configure an xkb layout switch on the
same keys), and touchpad-scroll volume binds.

Bind properties demonstrated here: `hotkey-overlay-title="..."` (and `=null` to
hide), `allow-when-locked=true`, `repeat=false`, `cooldown-ms=150`, and
`allow-inhibiting=false`.

## Practical takeaways

- Copy the default config as your starting point; it is designed as the base.
- Enable a commented example by removing `//` or the `/-` prefix.
- The sections that actually carry defaults are `input`, `layout`, the two
  `window-rule`s, `spawn-at-startup`, `screenshot-path`, and `animations`.
- `binds` must be preserved in some form; everything else can be omitted to fall
  back to defaults.
- Validate after edits with `niri validate`.
