---
name: niri-workspaces
description: Use when working with niri workspaces in config.kdl or at runtime, including dynamic workspaces, focus-workspace, focus-workspace-down/up, focus-workspace-previous, move-column-to-workspace, move-window-to-workspace, move-workspace-up/down, move-workspace-to-monitor, move-workspace-to-index, named workspace, workspace "name" {}, open-on-output, set-workspace-name, unset-workspace-name, open-on-workspace window rule, per-workspace layout overrides, and the recent-windows {} Alt-Tab switcher with next-window/previous-window and focus-window-previous.
---

# Skill: niri-workspaces

niri workspaces are **dynamic** (GNOME-like): each monitor owns an independent
vertical stack of workspaces, empty ones disappear, and workspaces can move
between monitors. Named workspaces add persistent, addressable anchors on top of
that model.

Baseline for this resource set: **niri 26.04** (2026-04-25). niri uses date
versioning. Config lives at `~/.config/niri/config.kdl`, is live-reloaded on
save, and is validated with `niri validate`.

## The dynamic model in one paragraph

Every monitor has its own vertical list of workspaces. There is always exactly
one empty workspace at the bottom; opening a window there creates a new empty
workspace below it. Empty workspaces in the middle vanish when you leave them.
Workspaces are addressed **by position** (`focus-workspace 2` means "the second
workspace on the focused monitor", whichever workspace that currently is), not
by a permanent identity. To get a permanent, nameable workspace, declare it with
`workspace "name" {}` or create one at runtime with `set-workspace-name`.

## Addressing: index vs name

| Form | Example | Meaning |
| --- | --- | --- |
| Index | `focus-workspace 2` | The workspace *currently* at position 2 on the focused monitor. |
| Name | `focus-workspace "browser"` | The named workspace `browser`, wherever it currently is. |

Because workspaces have no intrinsic index, moving the first workspace down
changes what `focus-workspace 1` targets. Named workspaces always exist, even
when empty, so name-based addressing is stable.

## The "niri way"

If you come from a static-workspace WM, do not try to recreate fixed slots 1..9.
Because the view scrolls horizontally, you generally need **fewer** workspaces
than on a traditional tiling WM. Prefer focusing and moving up/down and moving
workspaces to where you need them, rather than jumping by index. Named
workspaces can approximate static slots (for example `"one"`, `"two"`, ...) but
they can still be reordered and moved, which gets confusing; see
`references/named-workspaces.md` for guidance.

## Minimal shape

```kdl
binds {
    Mod+Up    { focus-workspace-up; }
    Mod+Down  { focus-workspace-down; }
    Mod+1     { focus-workspace 1; }
    Mod+B     { focus-workspace "browser"; }
    Mod+Shift+Down { move-column-to-workspace-down; }
}

workspace "browser" {
    open-on-output "DP-1"
}
```

```sh
niri msg action focus-workspace 2
niri msg action focus-workspace "browser"
niri msg action set-workspace-name "scratch"
```

## Index

| Topic | Reference |
| --- | --- |
| Dynamic behavior, empty workspaces, moving between monitors, mental model, actions | `references/dynamic-workspaces.md` |
| `workspace "name" {}`, `open-on-output`, persistence, `set-workspace-name`, per-workspace layout | `references/named-workspaces.md` |
| The recent-windows (Alt-Tab) switcher and MRU actions | `references/recent-windows.md` |

## References

- `references/dynamic-workspaces.md` - dynamic workspace rules, the always-empty
  workspace, `empty-workspace-above-first`, monitor reconnect memory, and a
  worked workflow.
- `references/named-workspaces.md` - named workspace declarations, placement,
  persistence, layout overrides, and how to approximate a static layout without
  fighting the model.
- `references/recent-windows.md` - `recent-windows {}` configuration,
  `next-window`/`previous-window`, and `focus-window-previous`.
