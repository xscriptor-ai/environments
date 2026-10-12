---
name: equisdots-niri-port
description: Use when planning, estimating, or executing the port of the equisdots dotfiles stack from Hyprland to niri 26.04. Covers Compositor.qml, the proposed Niri.qml backend, settings.json and palette path strategies, theme-sync, quickshell coupling, the percentage split of reuse vs adapt vs rewrite, the phased migration plan, and the compositor-api seam. Trigger keywords: equisdots, compositor-api, Compositor.qml, Niri.qml, settings.json, theme-sync, quickshell, port, migration, percentage.
---

# Skill: equisdots-niri-port

Concrete, repo-by-repo port plan for taking the equisdots desktop from Hyprland
(0.55+ Lua config) to niri 26.04. This is analysis and planning material: it
does not change the runtime repositories.

Baseline: **niri 26.04** (2026-04-25), config at `~/.config/niri/config.kdl`.
Source side: **Hyprland 0.56.x** (Lua config era, 0.55+).

## Goal

Move the whole equisdots stack to niri with the **user-visible surface intact**:
bar, popups, panels, widgets, palette theming, theme-sync, wallpapers,
mascots, timex, xturing and the settings panel keep working. Only the
compositor layer, a handful of scripts, and the installer are allowed to
change shape.

## The reuse seam: `Compositor.qml`

The shell already isolates the compositor behind one indirection:

- `/home/xscriptor/Documents/repos/xscriptor/equisdots/shell/core/Compositor.qml`
  is a singleton that exposes `backend`, `workspacesCommand`,
  `keyboardCommand`, `focusCommand`, `setWindowBorders(active, inactive)`,
  `switchWorkspace(name)` and `cycleKeyboardLayout()`.
- `/home/xscriptor/Documents/repos/xscriptor/equisdots/shell/core/compositors/Hyprland.qml`
  is the only implementation, selected with `readonly property var backend:
  Hyprland {}`.

Every widget that goes through the adapter survives the port unchanged. The
port adds a sibling `shell/core/compositors/Niri.qml` and selects between the
two. The full interface, semantics and a runnable QML skeleton are in
`references/compositor-api.md`.

Direct `hyprctl` callers bypass the seam. They are enumerated in
`references/component-matrix.md`; those are the files that must change.

## Two path strategies

Every component hard-codes the deployment root `~/.config/hypr` (settings.json,
`scripts/quickshell`, palettes, wallpapers, display-config, idle-settings). Two
ways to handle it:

| Strategy | Root | What changes | When to pick |
| --- | --- | --- | --- |
| A · keep the root | `~/.config/hypr/...` stays the data root | Almost nothing; paths keep working. Only the compositor config becomes niri's. Semantically odd but zero-risk. | Fastest, lowest-risk, side-by-side with Hyprland. Recommended for the first port. |
| B · neutral root | `~/.config/equisdots/...` + `EQUISDOTS_*` env vars | Every hard-coded path in settings.json, `Config.qml`, scripts, `theme-sync`, `davincix`, `xturing` and the installer. | Long-term cleanliness, one compositor-agnostic layout. Costs ~6-8 points of reuse. |

Details, the exact file list and the recommendation are in
`references/settings-and-paths.md`.

## Headline answer

Weighted effort split for Strategy A (keep `~/.config/hypr`):

- **~63% reuse unchanged**
- **~25% modify or adapt in place**
- **~12% rewrite from scratch**

Strategy B shifts roughly six to eight points from reuse into adapt. The full
methodology, the per-component table and the "is it worth it" verdict are in
`references/percentage-estimate.md`.

## References

- `references/architecture.md` - architecture map of the current stack: repos,
  layout, contracts (settings.json, palettes), theme propagation, wrapper and
  install model, and the compositor-coupling inventory with concrete paths.
- `references/component-matrix.md` - one row per repo/component with compositor
  coupling, reuse level (as-is/adapt/rewrite) and notes, plus the specific
  Hyprland-coupled files and their niri replacement.
- `references/compositor-api.md` - the compositor abstraction: interface
  semantics, proposed `shell/core/compositors/Niri.qml` with real niri commands,
  KDL-and-reload for borders, and `XDG_CURRENT_DESKTOP` backend selection.
- `references/percentage-estimate.md` - the headline deliverable: methodology,
  per-component effort/size, rolled-up reuse/adapt/rewrite split, assumptions
  and the worth-it assessment.
- `references/phased-plan.md` - ordered incremental plan (phase 0 audit through
  phase 6 cleanup/parallel-run) with scope, files, deliverables, verification
  and rollback.
- `references/settings-and-paths.md` - how to make settings.json, palettes,
  wallpapers, scripts, display-config and idle-settings path-agnostic.
- `references/risks-and-gaps.md` - risk register for features with no niri
  equivalent, each with impact, likelihood and mitigation, plus unknowns.
- `references/bringup-findings.md` - catalog of real gotchas hit while bringing
  equisdots up on niri 26.04, each as symptom -> cause -> fix (KDL fallback,
  QML singleton `Connections`, compositor detection, border include mismatch,
  translucent tint, blur sheets, stale shell clone, notification daemon).

## Related skills

- `../hyprland-to-niri/SKILL.md` - migration overview and checklist.
- `../hyprland-niri-config-mapping/SKILL.md` - Hyprland Lua/hyprlang to KDL.
- `../hyprland-niri-ipc-mapping/SKILL.md` - hyprctl and socket2 to
  `niri msg` and the event stream.
- `../../../niri/skills/niri/SKILL.md` - niri fundamentals.
