# Named workspaces

Named workspaces give dynamic workspaces a stable identity you can address by
name. Baseline: niri 26.04 (2026-04-25).

```kdl
workspace "browser"

workspace "chat" {
    open-on-output "Some Company CoolMonitor 1234"
}
```

Since: 0.1.6. Declare named workspaces at the top level of the config.

## Behavior

Contrary to normal dynamic workspaces, named workspaces **always exist**, even
when they have no windows. Otherwise they behave like any other workspace: you
can move them up/down, move them to another monitor, and so on.

- `focus-workspace` and the `move-window-to-workspace` /
  `move-column-to-workspace` actions can reference a workspace by name, for
  example `focus-workspace "browser"`.
- An `open-on-workspace` window rule makes a window open on a specific named
  workspace.
- Workspace names are strings. Two named workspaces cannot share a name
  (comparison is case-insensitive), and a duplicate is a config error.

## `open-on-output`

Starts the workspace on a chosen output. Since 0.1.9 the value can be a
connector name (`"DP-2"`) or a manufacturer/model/serial string
(`"Some Company CoolMonitor 1234"`); before that only the connector name worked.

Since: next release (after 26.04) - multiple `open-on-output` lines are
supported as a fallback chain. If the first output is not connected, the
workspace opens on the second, and so on. The order is reevaluated whenever
outputs connect or disconnect, and connecting a higher-priority output moves the
workspace there. On the 26.04 baseline, only the first `open-on-output` line is
honored, so do not stack them.

```kdl
// 26.04: single target.
workspace "chat" {
    open-on-output "DP-2"
}
```

```kdl
// After 26.04: fallback chain.
workspace "browser" {
    open-on-output "DP-9"
    open-on-output "DP-4"
}
```

## Opening windows on a named workspace

Combine a declaration with an `open-on-workspace` window rule (see
`niri-layout-rules` for matching syntax):

```kdl
workspace "chat" {
    open-on-output "DP-2"
}

window-rule {
    match at-startup=true app-id=r#"^org\.gnome\.Fractal$"#
    open-on-workspace "chat"
}
```

## Declaring, reordering, and deleting

- Named workspaces initially appear in the order they are declared in the
  config.
- When you edit the config while niri is running, newly declared named
  workspaces appear at the very top of a monitor.
- If you delete a named workspace from the config, it becomes a normal (unnamed)
  workspace and is removed if empty.
- There is no way to give a name to an already existing workspace. Instead, move
  the windows you want onto a new empty named workspace.
- Since: 25.02 - named workspaces no longer update/forget their original output
  when a new window opens on them (unnamed workspaces still do). This makes them
  "stick" to their original output more reliably. Explicitly moving a named
  workspace to another monitor still updates its original output.

## `set-workspace-name`, `unset-workspace-name`

Since: 25.01. Rename or unname a workspace at runtime. Both take a workspace
reference (index or name); omitting it uses the focused workspace.

```kdl
binds {
    Mod+Shift+N { set-workspace-name "scratch"; }
    Mod+Shift+U { unset-workspace-name; }
}
```

```sh
niri msg action set-workspace-name "scratch"
niri msg action set-workspace-name "mail" --workspace "scratch"
niri msg action unset-workspace-name
niri msg action unset-workspace-name "scratch"
```

Persistence: only workspaces declared with `workspace "name" {}` in the config
survive a restart. A name assigned with `set-workspace-name` exists for the
current session only; to make it permanent, add a matching `workspace` block to
the config.

## Layout config overrides

Since: 25.11. A `layout {}` block inside `workspace "name" {}` overrides
top-level layout settings for that workspace only. It accepts every option from
the top-level `layout {}` block (see `niri-layout-rules`) except:

- `empty-workspace-above-first` - an output-level setting.
- `insert-hint` - drawn at the output level.

```kdl
workspace "aesthetic" {
    layout {
        gaps 32

        struts {
            left 64
            right 64
            bottom 64
            top 64
        }

        border {
            on
            width 4
        }
    }
}
```

To unset a globally enabled flag, write it with `false`:

```kdl
layout {
    always-center-single-column
}

workspace "uncentered" {
    layout {
        always-center-single-column false
    }
}
```

## Approximating a static workspace layout

You can emulate fixed slots by declaring workspaces named `"one"`, `"two"`,
`"three"`, ... and binding `focus-workspace "one"`, `focus-workspace "two"`, and
so on. This works to a degree, but the workspaces can still be moved up/down and
between monitors, so it can become confusing.

If you are coming from a static-workspace WM, prefer the dynamic model
(`focus-workspace-up/down` and `move-workspace-up/down`) instead. Scrollable
tiling generally needs fewer workspaces, and the dynamic model stays out of your
way. Use named workspaces for the few places where you genuinely need a stable
name (mail, chat, a specific output), not as a full 1..9 grid.
