---
name: hyprland-to-niri
description: Use when migrating a Hyprland setup to niri: translating hyprland.lua or hyprlang config to config.kdl, mapping hyprctl and socket2 IPC to niri msg and event-stream, replacing hyprlock hypridle hyprpaper hyprpicker, and porting bars/shells and scripts. Includes the equisdots port plan and effort estimate.
---

# Skill: hyprland-to-niri

This skill drives a structured migration from Hyprland (0.55+ Lua config era) to
niri (26.04). It is documentation and methodology, not an automated converter:
some concepts have no niri equivalent and must be redesigned.

## Mental model shift

| Hyprland | niri |
| --- | --- |
| Static workspaces 1..N, special/scratchpad | Dynamic workspaces, vertical, per monitor; named workspaces for persistence |
| Dwindle/master tilers | Scrollable columns on an infinite horizontal strip |
| Full config evaluated by the compositor, live `hyprctl eval` | KDL config, live-reloaded on file save; no arbitrary runtime eval |
| `hyprctl` single-shot commands | `niri msg` / `niri msg action` |
| `.socket2.sock` event stream | `niri msg --json event-stream` |
| Layer-rule blur by namespace | `layer-rule { background-effect { blur true } }` |
| Lua override files (`user-*.lua`) | KDL `include "user-*.kdl"` |

## Migration workflow

1. Inventory the Hyprland config and scripts. Find every compositor-specific
   touchpoint: `hyprctl`, `hl.` Lua API, `socket2`, `HYPRLAND_INSTANCE_SIGNATURE`,
   `hyprlock`, `hypridle`, `hyprpaper`, `hyprpicker`, `xdg-desktop-portal-hyprland`.
2. Classify each touchpoint as: portable as-is, needs adaptation, or needs a
   rewrite. Use `skills/equisdots-niri-port/references/component-matrix.md` as a
   worked example.
3. Translate config section by section using
   `skills/hyprland-niri-config-mapping/`.
4. Translate IPC and scripts using `skills/hyprland-niri-ipc-mapping/`.
5. Replace the surrounding tooling (lock, idle, wallpaper, picker, portals) using
   `skills/hyprland-niri-tooling-mapping/`.
6. Run the migration checklist in
   `skills/hyprland-to-niri/references/migration-checklist.md`.
7. Keep Hyprland working in parallel until niri reaches feature parity for the
   daily workflow.

## What does not translate cleanly

- Dwindle/master layout knobs and per-layout options.
- `hyprctl eval` live patching of arbitrary options.
- Scratchpad/special-workspace semantics.
- Hyprland decoration variability (blur variants, layer blur by namespace).
- Animation leaf names and dispatcher strings.
- Direct pointer-position queries (used by some mascot overlays).
- Static workspace indices as identity.

For each of these, the migration must decide between approximating the behavior
with niri primitives or dropping it. Record the decision in an ADR.

## Skills

- `hyprland-to-niri` - this overview and the checklist.
- `hyprland-niri-config-mapping` - Hyprland config to KDL, section by section.
- `hyprland-niri-ipc-mapping` - hyprctl and socket2 to niri msg and event-stream.
- `hyprland-niri-tooling-mapping` - lock, idle, wallpaper, picker, portals.
- `equisdots-niri-port` - the concrete equisdots port plan and effort estimate.

## References

- `references/migration-checklist.md` - ordered, verifiable steps.
- `references/gap-register.md` - catalog of features with no direct equivalent.
- `references/verification.md` - how to prove a migrated setup works.
