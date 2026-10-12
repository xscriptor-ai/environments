# Dynamic workspaces

How niri's dynamic workspaces behave, how they move between monitors, and how to
work with them. Baseline: niri 26.04 (2026-04-25).

## The model

Each monitor contains an independent set of workspaces arranged vertically. You
switch between them on a monitor with `focus-workspace-down` and
`focus-workspace-up` (bound to Mod+Wheel and, commonly, arrow keys).

- Empty workspaces "in the middle" automatically disappear when you switch away
  from them.
- There is always one empty workspace at the end (the bottom) of every monitor.
  Opening a window on that empty workspace immediately creates a new empty
  workspace further below.
- To put a window on a new workspace "in the middle", put it on the last (empty)
  workspace, then move that workspace up to where you need it with
  `move-workspace-up`.

A monitor with three workspaces (two populated plus the trailing empty) looks
like this:

```
  +----------------+     +----------------+
  |  workspace A   |     |  workspace X   |
  |  (windows)     |     |  (windows)     |
  +----------------+     +----------------+
  |  workspace B   |     |  (empty)       |
  |  (windows)     |     +----------------+
  +----------------+
  |  (empty)       |
  +----------------+
     monitor 1              monitor 2
```

Each monitor only shows the workspace you switch it to. Switching a monitor to
`workspace A` or `B` does not affect the other monitor.

## `empty-workspace-above-first`

Since: 25.01. By default there is one empty workspace at the *end* of every
monitor. Set `empty-workspace-above-first` to also always keep an empty
workspace at the very start (top). This is a layout option, so it lives in the
top-level `layout {}` block and can be overridden per output:

```kdl
layout {
    empty-workspace-above-first
}
```

```kdl
output "DP-2" {
    layout {
        empty-workspace-above-first
    }
}
```

It is an output-level concept and is not allowed inside a named workspace's
`layout {}` block.

## Moving workspaces between monitors

Move the focused workspace to another monitor with
`move-workspace-to-monitor-left/right/up/down` (directional, based on monitor
`position`) or `move-workspace-to-monitor-next/previous` (in niri's sorted output
order).

When you disconnect a monitor, its workspaces automatically move to a different
monitor. They also **remember** their original monitor, so when you reconnect it,
the workspaces automatically move back. Moving a workspace explicitly to another
monitor updates that remembered location.

## Recommended mental model

From another tiling WM you may think: "These are all my workspaces. I can show
workspace X on my first monitor and workspace Y on my second monitor."

In niri, invert it:

> My first monitor contains these workspaces, including X and Y. My second
> monitor contains those other workspaces. I can switch my first monitor to X or
> Y, and I can move Y to my second monitor to show it there.

Workspaces belong to a monitor; you switch and rearrange within and between
monitors rather than assigning global numbers.

## Workspace actions

| Action | Argument | Notes |
| --- | --- | --- |
| `focus-workspace-down` / `focus-workspace-up` | none | Move to the workspace below/above on the focused monitor. |
| `focus-workspace` | index or name | Focus an addressed workspace. |
| `focus-workspace-previous` | none | Focus the previously focused workspace. (Since: 25.11) |
| `move-window-to-workspace-down` / `-up` | `focus=true` | Move the focused window; `focus=false` keeps focus behind. |
| `move-window-to-workspace` | index or name, `focus=true` | Move the focused window to an addressed workspace. |
| `move-column-to-workspace-down` / `-up` | `focus=true` | Move the focused column. |
| `move-column-to-workspace` | index or name, `focus=true` | Move the focused column to an addressed workspace. |
| `move-workspace-up` / `move-workspace-down` | none | Reorder the focused workspace on its monitor. |
| `move-workspace-to-index` | index, `reference=` | Move a workspace to a specific position. |
| `move-workspace-to-monitor-left` / `-right` / `-up` / `-down` | none | Move the focused workspace directionally. |
| `move-workspace-to-monitor-next` / `-previous` | none | Move in sorted output order. |

```kdl
binds {
    Mod+Down       { focus-workspace-down; }
    Mod+Up         { focus-workspace-up; }
    Mod+1          { focus-workspace 1; }
    Mod+B          { focus-workspace "browser"; }
    Mod+Shift+Down { move-column-to-workspace-down; }
    Mod+Ctrl+Down  { move-window-to-workspace-down focus=false; }
    Mod+Ctrl+Up    { move-workspace-up; }
}
```

```sh
niri msg action focus-workspace 2
niri msg action focus-workspace "browser"
niri msg action move-column-to-workspace 1
niri msg action move-window-to-workspace "chat" --focus false
niri msg action move-workspace-to-monitor-right
```

## Example workflow

A productive pattern:

1. Keep the browser on the topmost workspace.
2. Use one workspace per project or "thing" you are working on.
3. On a single workspace keep one or two windows that fit the monitor and that
   you switch between often, plus extra windows scrolled off-screen for rare or
   temporary use.
4. When you need another permanent window, put it on a new workspace.
5. Actively move workspaces up and down as you work, so frequently paired things
   sit next to each other. For example, keep the browser directly above whatever
   you are doing, so one `focus-workspace-up/down` reaches it.

This mirrors the upstream author's own described workflow and is the intended
way to use dynamic workspaces instead of numbered slots.
