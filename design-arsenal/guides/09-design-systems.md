# 09 — Design systems, tokens and governance

## 1. Why this matters for visual work

A design system is a **shared language**. Even a solo project benefits:

- You stop re-deciding spacing, color and type every time.
- A series of wallpapers feels coherent without repeating layouts.
- You can hand off a recipe, not just a file.
- You can automate: tokens -> CSS -> templates -> renders.

## 2. Token architecture

```text
reference tokens      blue-500, space-4, radius-md, font-size-3
        |
semantic tokens       color-bg, color-surface, color-text, color-accent
        |
component tokens      button-bg, card-padding, wallpaper-title-size
        |
compositions          button, card, hero, wallpaper
```

This pack already provides reference + semantic layers:

- `assets/palettes/json/*.json` — raw palette + source + license.
- `assets/palettes/css/*.css` — variables per palette.
- `assets/palettes/css/role-tokens.css` — semantic roles per palette.
- `assets/palettes/css/all-palettes.css` — all palettes.
- Fonts: see `assets/fonts/README.md` for the upstream list.

## 3. Naming

- Purpose over appearance: `danger`, not `red`; `surface-raised`, not `gray-200`.
- Consistent order: `{category}-{role}-{state}-{variant}`.
- No abbreviations that only you understand.
- Keep a changelog; renaming tokens is a breaking change.
- Use kebab-case for CSS, camelCase for JS, snake_case only if the platform
  demands it.

## 4. Spacing and rhythm

- Base unit: 4 or 8 px.
- Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.
- Use fewer values, more consistently.
- For wallpapers, spacing is proportional to canvas: 4-10% margins.
- For UI, spacing encodes grouping: closer = related.

## 5. Color roles

Minimum set:

```text
background
surface
surface-raised
text
text-muted
border
accent
accent-contrast
danger
success
warning
focus
```

States: default, hover, active, focus, disabled, selected.

## 6. Typography tokens

```text
font-display
font-text
font-mono
size-1 ... size-7
leading-tight / normal / loose
tracking-tight / normal / wide
weight-regular / medium / bold
```

## 7. Documentation

For each component/pattern:

- What it is.
- When to use it.
- When **not** to use it.
- Anatomy.
- States.
- Accessibility notes.
- Content guidelines.
- Code example.
- Do/don't visual.

For a wallpaper series, document:

- Source policy (licenses).
- Canvas presets.
- Palette source.
- Extension method.
- Grain/vignette values.
- Typography scale.
- QA checklist.
- Naming convention.

## 8. Versioning

- `MAJOR` — breaking token/component changes.
- `MINOR` — new components/patterns.
- `PATCH` — fixes, docs.
- Keep a `CHANGELOG.md`.
- Freeze a palette/version for a project; do not let it drift mid-series.

## 9. Governance (even solo)

- One source of truth (this pack + project repo).
- One owner for tokens.
- A review checklist before shipping.
- An archive of deprecated tokens/components.
- A rule for exceptions: documented, named, reviewed.
- A cadence: audit every N projects; remove what is not used.

## 10. Applying it here

For wallpaper work:

1. Choose one palette + one type pairing.
2. Define 5-7 colors as roles.
3. Define 3 canvas sizes (desktop, ultrawide, mobile).
4. Define 2 extension methods (for example ambient blur + editorial panel).
5. Define grain/vignette/scrim defaults.
6. Define the title/label type scale.
7. Write a `series.md` with the recipe and constraints.
8. Generate variants; review against the checklist.

That is a design system for a series, not a bureaucracy.

See `../resources/design-systems.md` for the reference catalog.
