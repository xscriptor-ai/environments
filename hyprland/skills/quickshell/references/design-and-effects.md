# Building modern interfaces — design, effects & theming (Quickshell + Hyprland)

Verified **2026-10-15**. Sources: quickshell.org docs v0.3.0 + source (layer namespace, `iconPath`, `RectangularShadow`); Hyprland wiki (layer rules, blur variants); **equisdots** `shell@branch/experimental` (Theme.qml, Bar.qml, ModulePill.qml, docs/themes.md, docs/bar.md), `nyx@branch/experimental`, `palettes`/`theme-sync` (own work); **Caelestia** `shell@main` + `tokens.hpp` (GPL-3.0 — values/patterns used as design reference only, no code copied). Base typeface: **Hack Nerd Font**. Structure tokens (Material-You shape/spacing/elevation/state/motion, see §1b): **equisdots** `shell/docs/design-language.md`.

Hard requirements for every design produced with this pack:
1. **Modern & dense — no dead space.** Layouts fill their region purposefully; leftover space is distributed, never left as holes.
2. **Friendly.** Comfortable targets, visible hover/active states, soft contrast, no tiny or harsh elements.
3. **No overlaps.** Buttons/controls never collide (hitboxes included), text never clips into icons, popups never cover unrelated controls accidentally.

## 1. Design tokens first (a Theme singleton)

Never hardcode colors/radii in widgets. The equisdots stack derives everything from the active **base16 palette** in `core/Theme.qml` + `ui/bar/Colors.qml`; keep that pattern (one singleton per consumer group, same derivation rules):

```qml
// Theme.qml — same read API as the bar's Colors.qml
pragma Singleton
import QtQuick
import Quickshell
import Quickshell.Io

Item {
  id: root
  readonly property string settingsFilePath: Quickshell.env("HOME") + "/.config/hypr/settings.json"
  readonly property string palettesDir: Quickshell.env("HOME") + "/.config/hypr/scripts/quickshell/dock/palettes"

  // identity / typography
  property string fontFamily: "Hack Nerd Font"
  property int borderRadius: 10
  readonly property int clampedBorderRadius: {
    const r = root.borderRadius;
    return Math.floor(r <= 24 ? r : 24 + Math.pow(r - 24, 0.55));   // caps silly-large radii smoothly
  }

  // base16 + derived roles (see §2 for the palette contract)
  property color base: "#1e1e2e"; property color mantle: "#181825"; property color crust: "#11111b"
  property color text: "#cdd6f4"; property color subtext0: "#a6adc8"; property color subtext1: "#bac2de"
  property color surface0: "#313244"; property color surface1: "#45475a"; property color surface2: "#585b70"
  property color overlay0: "#6c7086"; property color overlay1: "#7f849c"; property color overlay2: "#9399b2"
  property color blue: "#89b4fa"; property color sapphire: "#74c7ec"; property color peach: "#fab387"
  property color green: "#a6e3a1"; property color red: "#f38ba8"; property color mauve: "#cba6f7"
  property color pink: "#f5c2e7"; property color yellow: "#f9e2af"; property color maroon: "#eba0ac"
  property color teal: "#94e2d5"
  property color accent: red; property color accent2: mauve
  property color background: base; property color foreground: text

  // glass (settings.json "glass")
  property var glassSettings: ({})
  readonly property bool glassOn: glassSettings.enabled === true
  readonly property real glassOpacity: glassSettings.opacity !== undefined
      ? Math.max(0.2, Math.min(1.0, glassSettings.opacity)) : 0.85
  readonly property real glassAlpha: root.glassOn ? root.glassOpacity : 1.0

  // helpers (verbatim semantics of the bar's Colors.qml so every consumer agrees)
  function toRGB(hex) { /* "#rrggbb"|"#rrggbbaa" -> {r,g,b} 0..255; 8-digit drops alpha first */ }
  function mix(a, b, t) { /* linear blend -> "#rrggbb" */ }

  function applyPalette(c) {
    const b = c.base16;
    // backgrounds: explicit background/foreground win over color0/color7
    root.background = b.background || b.color0;
    root.foreground = b.foreground || b.color7;
    root.base = root.glassOn
      ? Qt.rgba(background.r, background.g, background.b, root.glassOpacity)  // alpha lets layer blur show
      : root.background;
    root.mantle  = root.mix(root.base, "#000000", 0.15);
    root.crust   = root.mix(root.base, "#000000", 0.30);
    root.text    = root.foreground;
    root.subtext0 = root.mix(root.text, root.base, 0.20);
    root.subtext1 = root.mix(root.text, root.base, 0.10);
    root.surface0 = root.mix(root.base, root.text, 0.06);
    root.surface1 = root.mix(root.base, root.text, 0.12);
    root.surface2 = root.mix(root.base, root.text, 0.20);
    root.overlay0 = root.mix(root.text, root.base, 0.45);
    root.overlay1 = root.mix(root.text, root.base, 0.35);
    root.overlay2 = root.mix(root.text, root.base, 0.25);
    // accents from base16, then per-palette `roles` overrides win
    // ... red=color1, green=color2, yellow=color3, peach=color4, mauve=color5, blue=color6, ...
  }
}
```

Rules of thumb: one accent + one accent2, 3 surface tiers (`surface0/1/2`), overlays only for text hierarchy, radii from `borderRadius` (+ clamped formula), spacing from the 4/8/12/16 scale. Consistency reads as "designed" more than any single effect.

## 1b. Material-You structure tokens (shape / spacing / elevation / state / motion)

Added **2026-10-15** (equisdots `shell@branch/experimental`; full spec in `docs/design-language.md`). Colour and type are unchanged (synced base16 palette + Hack Nerd Font) — these tokens add the **structure** so every panel, popup, tab and widget shares ONE dimension system. It is a separate layer **on top of** §1: the palette stays the source of colour; `surfaceContainer*`/`outline*` are derived from it.

Scales are live from `settings.json → appearance.{shapeScale,densityScale,motionScale}` (default `1`), editable from **Settings → Theme → Appearance** (three steppers, 0.60–1.60). `Theme` watches `settings.json`, so changing a scale re-applies everywhere immediately (verified: a widget's corner radius changes without a shell reload).

| Group | Tokens | Values (× scale) |
|---|---|---|
| Shape (corner radius) | `radiusXs/Sm/Md/Lg/Xl/Full` | 4 / 8 / 12 / 16 / 28 / pill |
| Spacing (4dp grid) | `gap2xs/Xs/Sm/Md/Lg/Xl` | 2 / 4 / 8 / 12 / 16 / 24 |
| Elevation (tonal surfaces) | `surfaceContainerLowest/Low/surfaceContainer/High/Highest` | `base` mixed toward `text` by 0 / .04 / .07 / .11 / .15 (alpha-aware → glass still shows through) |
| Outlines | `outline`, `outlineVariant` | `text` mixed onto `base` by .32 / .16 |
| State layers | `stateHover` .08, `statePress` .12, `stateLayer(c, amt)` | hover/press overlays (not colour swaps) |
| Motion | `durShort / durMedium / durLong` | 150 / 250 / 400 ms × motionScale |

Derivation helper: `Theme.tone(amount)` mixes `base` → `text` while keeping `base`'s alpha (so glass mode survives).

Application rules (what a "designed" page looks like — the pattern the equisdots settings/editor use):

- **Page**: inset `gapLg` on all sides; sections spaced `gapXl`; rows `gapMd`.
- **Card/section** = `surfaceContainerLow` fill + 1 px `outlineVariant` + `radiusLg`, **sized to content** — never force equal heights with `Layout.fillHeight` (that leaves voids).
- **Row** = label (`text`, s12) + hint (`subtext0`, s11) on the left, control on the right, `Layout.minimumHeight` ≈ 44; hover = `stateLayer(accent, stateHover)`. This is the unit both the settings tabs and the bar `Zones` page are built from.
- **Concentric corners**: an inner surface's radius ≤ outer radius − inset (so nested borders stay parallel).
- **No magic numbers** for radius/spacing/motion; **no element out of flow** — and never set `displayMarginBeginning/End` on a non-interactive list, it draws delegates over neighbouring cards (a real overlap bug fixed this way).
- **No overlap / a space for each thing** remains the hard requirement (§ intro + §5).

Shared surface primitive: **`core/GlassCard.qml`** (theme-free — colours passed in via `Theme.glassFill`/`hairline` or the surface tokens). It lives in `core/` because Quickshell's component loader does **not** resolve an implicit sibling-directory import; faces reach it through their existing `import "../../../core"`. New widget faces (`date`, `system`, `calendar`, `battery`, `countdown`) and the existing clock/music/image/visualizer faces all use it.

Migration reality (2026-10-15): the token layer is applied across the editor primitives + pages, the bar popups, the standalone panels, the desktop-widget faces, and the General/Keyboard/Monitors/Startup settings tabs (redesigned to the page-header + section + row scaffold above). The bar (`ModulePill`) keeps its own `bar.pillRadius()`/`bar.s()` scale — map it to the tokens only if the bar engine is touched. Palette sync (`theme-sync`) and Hack Nerd Font are untouched by design.

## 2. Theme contract for your own generator binary (no matugen)

The palette system is **base16 JSON files + a settings file**, read live by the shell. Your generator binary ("the change") just writes these files — the shell, Hyprland borders and `theme-sync` already consume them:

```
~/.config/hypr/settings.json            # global settings (watched, atomic tmp+mv writes)
~/.config/hypr/scripts/quickshell/dock/palettes/<slug>.json    # frozen shared path
~/.config/hypr/scripts/quickshell/dock/palettes/index.json     # ordered list for the editor
~/.local/state/quickshell/palette_backup/<slug>.json           # first-edit snapshot (reset)
```

`settings.json` keys the design layer reads:
```jsonc
{
  "uiScale": 1.0,                       // global scale; Scaler.s(v) multiplies by it
  "glass": { "enabled": true, "opacity": 0.85 },   // alpha clamp 0.2–1.0
  "shadows": { "enabled": true, "blur": 26, "spread": 0, "offsetX": 0, "offsetY": 6, "opacity": 0.5 },
  "bar": {
    "position": "top", "palette": "x", "thickness": 48, "edgeGap": 8,
    "roundness": 1.0, "pillBg": true, "pillSolid": false, "barBg": false, "barOpacity": 0.85,
    "borderWidth": 0, "borderColor": "surface1",
    "borderFollowPalette": true, "borderActive": "", "borderInactive": "",
    "font": "Hack Nerd Font", "timeFormat": "HH:mm:ss"
  }
}
```

Palette file schema (one file per palette; source of truth for color):
```jsonc
{
  "name": "X", "slug": "x", "author": "...", "category": "x",
  "base16": { "color0": "#1e1e2e", "...": "...", "color15": "#cdd6f4" },
  "background": "#1e1e2e", "foreground": "#cdd6f4",
  "roles": { "workspaceActive": "#eab308" }     // semantic overrides win over derivation
}
```

Live propagation (already proven in `core/Theme.qml`):
- `FileView { watchChanges: true }` on `settings.json` **and** on the active palette file (atomic `mv` writes kill inode watches — FileView follows the path).
- Content-compare choke points (`lastSettingsJson`, `paletteName|text`) so directory-watcher wakeups on unrelated files never cause redundant repaints.
- Window borders push live: `hyprctl eval 'hl.config({...})'` from `core/compositors/Hyprland.qml`; load-time defaults via `colors.lua` reading `settings.json` (`borderFollowPalette` → accent `color1` active / `color8` inactive).
- Cross-app propagation: `theme-sync.sh` (kitty, starship, vscode, nvim, browsers, rofi, cava, qt, gtk, opencode, xfetch…). Adding a target = one module in `themesync/targets/`.

Generator requirements (so the shell never breaks): write **atomically** (tmp + mv), validate `#rrggbb`, keep unknown keys, never write `settings.json` when only palette content changed, and provide the `x` palette as fallback. Shell-side rule: **no Matugen anywhere** — palettes are data, not a service.

## 3. Glass in practice (translucency + blur)

- `glass.enabled` + `glass.opacity` drive the alpha of every surface (`glassAlpha`); `Colors.qml`/`Theme.qml` multiply fill alphas by it (surface0 fill 0.4, hover surface1 0.6, barBg hover 0.28, solid fills 1.0).
- Compositor blur behind the shell: Hyprland **layer rules** on the shell's namespace. Quickshell's default layer namespace is `quickshell` (source-verified); set a stable one per surface group via the attached object so rules are precise:
  ```qml
  PanelWindow { WlrLayershell.namespace: "quickshell:bar" /* ... */ }
  ```
  Hyprland side (Lua era): `hl.layer_rule({ match = { namespace = "^(quickshell:bar)$" }, blur = true, ignore_alpha = 0.12 })`; check live with `hyprctl layers`.
- Push blur-rule updates **batched/cooldown** (Caelestia uses a 30 ms cooldown timer; their stack pushes from `layers.lua`/`syncWindowBorders`): never `hyprctl` per animation frame.
- In-shell backdrop blur for big popups: `Quickshell.Wayland.BackgroundEffect` where supported — always keep the translucent fallback.
- Performance: blur-on-blur and BackgroundEffect are the main GPU costs; on llvmpipe (WSL/VM) prefer flat translucency.

## 4. Elevation, shapes, borders

- Shadows for rectangular/rounded surfaces: **`RectangularShadow`** (Quickshell.Widgets) — already used for bar islands and the strip. Their tokens: `blur 26`, `spread 0`, `offset (0,6)`, `opacity 0.5` (settings.json `shadows`), padded into the bar so the shadow has room.
- Optional level system (Caelestia reference, MD3 dp): levels `[0,1,3,6,8,12]` with `blur=(dp*5)^0.7`, `spread=-dp*0.3+(dp*0.1)^2`, `offsetY=dp/2` — adopt **2–3 levels only** (islands / popups / dialogs), not the full table.
- Rounded media: `ClippingWrapperRectangle { radius: … }`. Arbitrary shapes/effects: `MultiEffect` (quantize usage).
- Borders: 1 px translucent outline (`surface1` role) beats solid on glass; accent border only for focus/active. `pillRadius(h) = round(h * 0.5 * roundness)` gives capsule→square continuum from one knob.
- Per-corner shapes (notch): `Region`.

## 5. Layout hygiene — dense, friendly, zero overlap

### No dead space (fill purposefully)
- Use `QtQuick.Layouts` everywhere; give exactly ONE element `Layout.fillWidth: true` per group (or a spacer) so leftover space is distributed, never left as a hole at the edge.
- Bar is full-width; `thickness` (48 default) + pill padding determine density: `pillHeight = barHeight - s(12)`, pills hug content (`padH = s(12)`, `padV = s(8)`).
- Zones (`start` / `center` / `end`) are data, not code — distribute modules across zones so no zone is a void; a single "center all" layout is a valid preset only if the user chooses it.
- Popups/OSDs size to content (Caelestia popout widths are a good reference range: 250–320 px; OSD slider `Tokens.sizes.osd.*`); clamp with min/max instead of fixed boxes with blanks.
- Lists fill their viewport; design an empty state (glyph + short text) instead of a blank panel.

### No overlaps (hitboxes count)
- **One MouseArea per control** (ModulePill = one pill, one MouseArea). Never stack clickable areas; separate adjacent pills with `spacing = s(8)`–`s(12)` so hitboxes don't collide. Hover scale (1.05) must not be the only visual difference — keep ≥4 px real gap.
- Text: elide + `Layout.maximumWidth`; a monospace font makes widths predictable but wide — budget explicitly.
- Center zone: anchor it to the bar's true center; side zones shrink (elide) at minimum width (test 1280 px) and never touch center.
- Popups open aligned to their island (`currentCenter` pattern in Bar.qml) with 6–8 px offset — never over the island that triggered them.
- Intentional overlaps (badges, pulse rings, mascots): keep them inside the parent's hitbox or behind it (`z: -1` like the pulse ring).
- Fractional scaling: verify at scale 1 / 1.25 / 1.5 / 2 **and** with `uiScale` ≠ 1 — rounding is the #1 overlap cause.

### Friendly (amigable)
- Targets: pill min height `s(34)` in vertical bars; ≥24 px in horizontal bars; `cursorShape: Qt.PointingHandCursor` on every clickable.
- States: hover swaps the fill role (surface0→surface1) + hover scale; right-click/wheel are supported affordances (documented in the module contract).
- Wheel actions (volume/brightness/workspace scroll) always bounded and clamped.
- Copy: short labels, sentence case; icon-only controls get tooltips.

## 6. Typography & iconography — Hack Nerd Font baseline

- `fontFamily` comes from `settings.json → bar.font` (default **Hack Nerd Font**); use it everywhere. Nerd glyphs double as icons (e.g. `󰅐` timex, `󰕾` volume, `󰒓` settings — see nyx `notch/defaults.json`).
- Hack has only **Regular / Bold / Italic** — avoid synthetic weights; differentiate with size/opacity.
- Monospace = fixed advance width: text is **wider**; elide early, budget widths, never let labels push controls.
- Fallback chain if a proportional font is ever mixed: `font.families: ["Inter", "Symbols Nerd Font"]` (Qt 6.4+).
- Sizes (Caelestia reference scale, MD3): `11 / 12 / 13 / 15 / 18 / 28`; the equisdots bar defaults live in the 12–15 range — keep ≤4 sizes per bar.
- `//@ pragma NativeTextRendering` often looks crisper for small UI text; `QS_DROP_EXPENSIVE_FONTS=1` keeps startup snappy (Nerd TTF unaffected; woff/woff2 skipped).
- `Quickshell.iconPath("name", true)` returns `""` when missing (avoid purple/black squares); wrap in `IconImage` for themed icons.

## 7. Motion & transitions (tokens, not ad-hoc numbers)

**Current equisdots values** (ModulePill/Zone) — already coherent, keep them as the base:

| Transition | Value |
|---|---|
| Pill fill color | 200 ms (`ColorAnimation`) |
| Pill size (width/height, collapse/expand) | 400 ms `OutQuint` |
| Pill opacity | 300 ms |
| Hover scale 1.05 | 250 ms `OutExpo` |
| Entrance: `y` from `s(15)` → 0 | 500 ms `OutBack` + 400 ms `OutCubic` opacity |
| Entrance cascade | `slotIndex * 50 ms` |
| Pulse ring (update/recording) | 1800 ms `OutCubic`, loop, opacity 0.25→0 |
| Suppression | `dragSuppress` disables all pill transitions while dragging |

**Caelestia/MD3-expressive reference** (design values only):

| Token family | Values |
|---|---|
| Durations — standard | small 200 / normal 400 / large 600 / extraLarge 1000 ms |
| Durations — spatial (morphing, elevation) | fast 350 / default 500 / slow 650 ms |
| Durations — effects (fades, colors) | fast 150 / default 200 / slow 300 ms |
| Curves | standard `(0.2,0,0,1)`; emphasized multi-point; expressive spatial `(0.38,1.21,0.22,1)` (overshoot — matches the OutBack feel) |
| State layers | hover overlay opacity 0.08; press ripple starts 0.1 and expands to cover |

**Adopt for release (without losses):**
1. Extract the current durations/easings into an `AnimTokens` singleton (one place; the Animation component selects by name like `Anim.SlowEffects`). Zero behavior change, big maintainability win.
2. Split tokens by intent: **effects** (150–300 ms: color, opacity, OSD) vs **spatial** (350–650 ms: pill size, entrance, morphs). Their current 200/250/300/400/500 already sits on that grid.
3. Keep Qt `Easing` types (`OutQuint`, `OutExpo`, `OutBack`) — they deliver the expressive feel without Caelestia's custom multi-segment bezier machinery (which requires their C++ plugin; **do not** take that dependency for release).
4. Overshoot (`OutBack`, 1.21 control point) only on entrances/morphs <500 ms; never on opacity alone.
5. Avoid Caelestia's git-only APIs: their shell requires `quickshell-git`; the equisdots stack targets tagged **Quickshell 0.3.x** for release stability. Design ideas yes; build dependencies no.
6. Suppression rules (like `dragSuppress`) on every model rewrite — the reliable way to avoid flicker without losing transitions.

## 8. Widget recipes (aligned with their dimensions)

| Widget | Recipe |
|---|---|
| Island pill | one `ModulePill`: fill `surface0 @0.4×glass`, hover `surface1 @0.6×glass`, `pillHeight = barHeight - s(12)`, `padH s(12)`/`padV s(8)`, capsule radius via `pillRadius`, hover scale 1.05 |
| Zone container | optional translucent capsule behind islands (`zoneBg` role), never while `unify` |
| Bar strip | `barBg` + `barOpacity 0.85`; surface padded by `shadowPad` so the strip shadow (`blur 26 / offsetY 6 / 0.5`) fits inside the exclusive zone |
| Popup | anchored to its island center with 6–8 px offset; width 250–320 px; glass fill; `HyprlandFocusGrab` |
| OSD | per-focused-monitor overlay; icon + slider (min 120 px) + right-aligned value; slide-in, auto-hide 1.5–2 s; effects-only durations (150–300 ms) |
| Notification card | 3 px accent left edge, icon, bold title + dim elided body, ≥28 px action row; stagger in |
| Launcher | Float window, search on top, `ListView` filling the rest, keyboard-first, ~8 visible rows, fuzzy highlight |
| Notch/island (nyx) | mascot + popover; keep the popover inside the island hitbox; MIT-licensed own code — safe to adapt freely |

## 9. Quality gate before shipping a look

1. Test matrix: blur off/on, animations off/on, `uiScale` 0.9/1/1.25, scales 1/1.25/1.5/2, 1 and 2 monitors, bar on each edge, min width 1280.
2. Density: no region >2× its content shows as blank; all leftover space distributed by a fill.
3. Overlap audit: rapid click sweep over every pill; hover-scale overlap check; open every popup and confirm nothing critical is covered.
4. Contrast: text ≥4.5:1 over its actual translucent background; state never color-only.
5. Palette integrity: switching palette and `glass.opacity` live never glitches (content-compare choke points hold); missing palette falls back to `x`.
6. Fonts: everything renders in Hack Nerd Font (or explicit fallback chain); no tofu, no synthetic weights.
7. GPU floor: shell usable on llvmpipe; blur/effects degrade gracefully; no per-frame `hyprctl`.
8. Licensing: ideas/values from Caelestia (GPL-3.0) are fine; its code is not, unless the target project is GPL-compatible. equisdots/nyx are own-work (nyx MIT).

Cross-refs: layer rules + blur variants → skill `hyprland` (`references/rules-animations.md`); **Bash glue (daemons, watchers, debounce)** → skill `hyprland-bash`; **Python tooling (generators, theme-sync)** → skill `hyprland-python`; lock/idle/wallpaper daemons → skill `hyprland-tools`; headless visual checks → skill `arch-wsl-headless`; glass optics theory (web-oriented) → skill `xglassmorphism`.
