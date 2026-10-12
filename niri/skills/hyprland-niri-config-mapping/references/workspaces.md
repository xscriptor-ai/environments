# Workspaces and scratchpads

Baseline: Hyprland 0.55+ Lua, niri 26.04. This maps Hyprland's static
workspaces, `workspace_rule`, and special/scratchpad workspaces to niri's
dynamic and named workspaces.

This is a model change, not a syntax change. Read the whole file before writing
rules.

## The model shift

Hyprland workspaces have stable global identities (`1`, `2`, `3`, `special:x`).
They exist independently of monitors and are assigned to monitors by rules. A
script can say "go to workspace 6" and that always means the same workspace.

niri workspaces are per-monitor, vertical and dynamic. There is always an empty
workspace at the bottom of each monitor. Empty workspaces in the middle
disappear. `focus-workspace 2` means "the workspace currently at position 2 on
the focused monitor", not "the workspace named 2". A workspace only has a
permanent identity if it is **named**.

| Hyprland | niri |
| --- | --- |
| Global static workspaces 1..N | Per-monitor dynamic workspaces, vertical |
| Workspaces persist by index | Unnamed workspaces disappear when empty |
| `workspace_rule` assigns a workspace to a monitor | `workspace "name" { open-on-output "..." }` |
| `special:name` scratchpads | No special workspaces; named workspaces approximate |
| `persistent = true` | Named workspaces always exist (Since: 0.1.6) |
| `default = true` boot workspace | Named workspace ordering + `open-on-output` |
| `on_created_empty = "cmd"` | No equivalent; spawn on startup or on a bind |
| `workspace_back_and_forth` | `input { workspace-auto-back-and-forth }` |
| `allow_workspace_cycles` | none (different model) |

## workspace_rule -> named workspace

The equisdots `workspaces.lua` pins a workspace per monitor at boot:

```lua
-- workspaces.lua (Hyprland)
local MON_LEFT3 = "desc:Xiaomi Corporation P27FBB-RGGL 5275600003570"
hl.workspace_rule({ workspace = "3", monitor = MON_LEFT3, default = true })
```

In niri, make it a named workspace that opens on that output:

```kdl
// workspaces.kdl (niri)
workspace "three" {
    open-on-output "Xiaomi Corporation P27FBB-RGGL 5275600003570"
}
```

Named workspaces always exist, so they replace Hyprland's `persistent = true`
for free. They initially appear in the order declared in the config. Since:
25.02, a named workspace sticks to its original output; explicitly moving it
still updates that output.

### Emulating fixed workspace assignments

Create workspaces named `one` through `nine` and bind them by name. This gives
each a stable identity close to Hyprland's static indices.

```kdl
workspace "one"
workspace "two"
workspace "three"

binds {
    Mod+1 { focus-workspace "one"; }
    Mod+2 { focus-workspace "two"; }
    Mod+3 { focus-workspace "three"; }

    Mod+Shift+1 { move-window-to-workspace "one"; }
    Mod+Shift+2 { move-window-to-workspace "two"; }
    Mod+Shift+3 { move-window-to-workspace "three"; }
}
```

Caveat: even named workspaces can be moved up and down and between monitors, so
the numeric bind does not lock a workspace to a screen position. If you want the
"niri way", prefer focusing up/down and moving workspaces, and use fewer
workspaces because scrollable columns pack more into one.

### Index-based binds

If you keep the dynamic model, `focus-workspace N` still works, but the target
is positional:

```kdl
binds {
    Mod+1 { focus-workspace 1; }
    Mod+2 { focus-workspace 2; }
    Mod+Shift+1 { move-column-to-workspace 1; }
    Mod+Shift+2 { move-column-to-workspace 2; }
}
```

`move-column-to-workspace N focus=false` keeps focus behind, like Hyprland's
`movetoworkspacesilent`.

## Scratchpads and special workspaces

Hyprland `special:name` workspaces with `togglespecialworkspace` have **no niri
equivalent**. There is no hidden workspace layer and no toggle primitive.

Closest approximations:

1. **Named workspace toggle by hand.** Declare a named workspace and bind focus
   to it and back to the previous one.

   ```kdl
   workspace "scratch"

   binds {
       Mod+A { focus-workspace "scratch"; }
       Mod+Shift+A { move-window-to-workspace "scratch"; }
       Mod+Tab { focus-workspace-previous; }
   }
   ```

   This is a normal workspace, so it is visible in the workspace list; it does
   not float above the current one.

2. **Floating window approximation.** A floating window with a fixed position
   behaves like a single-window scratchpad overlay:

   ```kdl
   window-rule {
       match app-id="^dropdown$"
       open-floating true
       default-floating-position x=0 y=0 relative-to="top"
       default-column-width { proportion 0.8; }
       default-window-height { proportion 0.5; }
   }
   ```

   Toggle it with `close-window`/`spawn`, or focus-floating plus tiling toggle.

3. **Scripted toggle.** A bind can run a script that focuses the named workspace
   if the app is running, or spawns it otherwise, then focuses back. This
   recreates the toggle but lives outside compositor config.

The equisdots `on_created_empty = "kitty --class scratchpad-terminal"` maps to
spawning the app via `spawn-at-startup` or from the toggle script, plus a window
rule that places it on the named workspace:

```kdl
window-rule {
    match app-id="^scratchpad-terminal$"
    open-on-workspace "scratch"
}
```

## Pitfalls for scripted setups

The equisdots config switches workspaces through `scripts/qs_manager.sh` and has
a unified-desktops mode in `scripts/ws-desktops-lib.sh`. Both assume Hyprland's
model. Watch for:

- **`workspaceCount` / fixed counts.** niri has no fixed workspace count. Any
  script that enumerates `1..N`, or treats `workspace N` as an identity, breaks.
  Replace it with `niri msg --json workspaces` (which returns real workspace
  objects, including named ones) and act on names or ids, not assumed counts.
- **Unified desktops.** The equisdots unified mode computes
  `workspace = (desktop-1)*4 + rank` to switch all monitors at once. niri has no
  global desktop number; each monitor has its own list. There is no single
  "desktop 3" shared across screens. Reimplement as either:
  - per-monitor named workspaces that you move with
    `move-workspace-to-monitor-*`, or
  - a script that issues one `focus-workspace "name"` per monitor using
    `niri msg action focus-workspace ...` with output-qualified targets.
  Expect this to be a redesign, not a port.
- **Index reordering.** Moving a workspace changes what `focus-workspace N`
  means. Scripts that cache indices across calls will drift.
- **Empty-workspace cleanup.** niri removes empty middle workspaces. Scripts
  that expect a workspace to stay put after its last window closes must use
  names.
- **`workspace-auto-back-and-forth`.** Enable it in `input {}` to get
  Hyprland-like "press the same number twice to go back":

  ```kdl
  input {
      workspace-auto-back-and-forth
  }
  ```

- **No `special_scale_factor`.** The `dwindle`/`master` scratchpad scale knob
  is gone; floating scratch windows use normal floating sizing.

## Querying the workspace model

```sh
# All workspaces, with names and focus flags.
niri msg --json workspaces

# Move the focused workspace to a specific output.
niri msg action move-workspace-to-monitor "HDMI-A-1"

# Name / unname the focused workspace at runtime (Since: 25.01).
niri msg action set-workspace-name "project"
niri msg action unset-workspace-name
```

See `references/window-rules.md` for `open-on-workspace` and
`references/keybinds-dispatchers.md` for the workspace action table.
