# niri Pack — agents, skills and migration guides

Agent and skill pack for OpenCode covering the **niri** scrollable-tiling Wayland compositor, plus the **migration from Hyprland** layer.

Compositor baseline: **niri 26.04** (2026-04-25), KDL configuration (`~/.config/niri/config.kdl`). Migration source baseline: **Hyprland 0.56.x** (Lua config era, 0.55+).

## Contents

- `agents/` — 10 subagents with opencode frontmatter (allow permissions):
  - **niri core** — `niri-config-architect`, `niri-ipc-scripter`,
    `niri-layout-designer`, `niri-session-engineer`, `niri-shell-integrator`,
    `niri-troubleshooter`.
  - **Hyprland→niri migration** — `hyprland-niri-migrator`,
    `hyprland-niri-gap-analyst`, `niri-config-translator`,
    `equisdots-compositor-port`.
- `skills/` — 15 deep-reference skills with `references/`:
  - **niri core** (10) — `niri`, `niri-configuration`, `niri-keybindings`,
    `niri-layout-rules`, `niri-input-outputs`, `niri-workspaces`, `niri-ipc`,
    `niri-window-effects`, `niri-session-integration`, `niri-troubleshooting`.
  - **Hyprland→niri migration** (5) — `hyprland-to-niri`,
    `hyprland-niri-config-mapping`, `hyprland-niri-ipc-mapping`,
    `hyprland-niri-tooling-mapping`, `equisdots-niri-port`.

## Install

```bash
# Agents (flat copy, as opencode expects)
cp agents/*.md ~/.config/opencode/agents/
# Skills (one folder per skill)
cp -r skills/* ~/.config/opencode/skills/
```

Then restart opencode. The agents already ship with `permission` allow.

## Key findings this pack corrects

1. **niri is versioned by date, not semver.** Documented baseline: **26.04**
   (2026-04-25). Config in a single **KDL** file (`config.kdl`) that **hot-reloads**
   on save; there is no `hyprctl eval`: live changes are written as fragments and
   reloaded.
2. **KDL is strict**: a block whose last node does not end with `;` or a newline
   before `}` will not parse, and niri **falls back to its default config** (gray
   screen with the hotkey overlay, no error). Validate with
   `niri validate -c ~/.config/niri/config.kdl`.
3. **Scrollable tiling**: windows live in columns on an infinite horizontal strip
   per monitor; **workspaces are dynamic and independent per monitor** (named
   workspaces and `recent-windows` exist).
4. **layer-shell `exclusiveZone`** reserves 1 or 3 edges per surface (not all
   4); reserving an edge pushes the surfaces anchored to that edge.
5. **IPC**: `niri msg` (`--json`), `niri msg action`, and the **event-stream**
   (`niri msg --json event-stream`, socket at `NIRI_SOCKET`) replace
   `hyprctl` and `.socket2.sock`.
6. **Portals**: selection in `niri-portals.conf` (`gnome` + `gtk`);
   screencasting via `xdg-desktop-portal-gnome`. Do not set `GDK_BACKEND=wayland`
   globally (it breaks the screencast portal).
7. **X11**: `xwayland-satellite` (>= 0.7) for X11 apps.
8. **Migration (equisdots, Strategy A)**: the shared data root stays at
   `~/.config/hypr` and only the compositor config moves to
   `~/.config/niri`; the shell becomes compositor-neutral after a seam
   (`Compositor.qml` → `Niri.qml`). Estimate for the stack: ~**63% reuse**,
   ~25% adapt, ~12% rewrite.

Primary sources: `github.com/YaLTeR/niri` (releases and `docs/wiki`),
`wiki.archlinux.org` (niri, xwayland-satellite, portals).

## Recommended usage

1. `niri-config-architect` writes/validates `config.kdl`; `niri-configuration`
   describes where it is loaded from and how to validate it.
2. `niri-keybindings`, `niri-layout-rules`, `niri-input-outputs` and
   `niri-workspaces` cover binds, placement, input/output and workspaces.
3. `niri-ipc-scripter` builds bars/scripts on top of `niri msg` and the
   event-stream.
4. `niri-session-engineer` sets up the session, portals, Xwayland and NVIDIA.
5. For migrations: `hyprland-to-niri` (overview), the `hyprland-niri-*-mapping`
   skills (config, IPC, tooling), and `equisdots-compositor-port` for the
   equisdots shell backend.
