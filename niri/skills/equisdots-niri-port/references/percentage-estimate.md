# Percentage estimate: Hyprland to niri

Headline deliverable. Baseline: niri 26.04 (2026-04-25), Hyprland 0.56.x.

## Methodology

1. **Enumerate components** (repos + cross-cutting subsystems) from the working
   tree, not from intent.
2. **Classify each component** into three bins by its own internal effort:
   - **reuse unchanged** - file compiles/runs under niri after at most a path
     change that a single env var covers;
   - **modify or adapt** - the logic stays, the compositor-facing calls or
     paths change;
   - **rewrite from scratch** - the artifact is replaced (Hyprland config to
     KDL, `hyprctl eval` semantics to KDL-and-reload).
3. **Weight each component** by relative port effort (size x churn), summing to
   100. Weights are judgment calls; the per-component fractions are what
   inspection actually measured.
4. **Multiply and roll up.** The result is the weighted average, not a file
   count. A file-count view is given for honesty because it diverges (few
   coupled files, high churn each).

Strategy assumed: **A - keep `~/.config/hypr` as the data root.** Strategy B
(neutral `~/.config/equisdots` root) shifts roughly six points from reuse into
adapt. See `settings-and-paths.md`.

## Per-component table (effort-weighted)

| Component | Weight | Reuse unchanged | Modify/adapt | Rewrite | Why |
| --- | ---: | ---: | ---: | ---: | --- |
| `shell` (Quickshell UI) | 32 | 82% | 13% | 5% | ~150 QML/JS files; only ~14 touch the compositor. `Config.qml` (monitors, keybind/startup writers) and the effects pair are the real work; lock/bar/popups/widgets are as-is. |
| `hyprland` (config + scripts + installer) | 18 | 20% | 40% | 40% | Every `*.lua` and `hypridle.conf` is a rewrite as KDL; about half the session scripts port (adapt), the utility scripts (screenshot, brightness, volume, gpu-mode) are reused. `install.sh` is large but mostly package/NVIDIA logic. |
| Session/idle/lock/portal/capture | 10 | 40% | 50% | 10% | `hypridle`/`hyprlock`/portal-hyprland are replaced by niri-compatible equivalents; capture stack largely reused. |
| `xturing` | 11 | 70% | 25% | 5% | settings.json, palettes, catalog and TUI are agnostic; `monitors.rs`, `actions.rs` paths and the Hyprland/Input/Idle pages change. |
| `dots` (meta installer) | 7 | 35% | 55% | 10% | Clone/deploy/wrapper/update logic reused; root path, repo list, `doctor` checks and `system` phase adapt. |
| `nyx` (mascots) | 4 | 45% | 40% | 15% | Visuals, dock and moods are as-is; cursor tracking (`hyprctl cursorpos`) has no niri equivalent and needs a redesign, events move to the niri stream. |
| `theme-sync` | 4 | 95% | 5% | 0% | Pure Python; only default paths. |
| `davincix` | 4 | 88% | 12% | 0% | Already env-overridable; only the default wallpaper dir string. |
| `palettes` | 3 | 100% | 0% | 0% | Data + schema. |
| `timex` | 3 | 98% | 2% | 0% | Engine + UI, no compositor calls. |
| `background` | 2 | 100% | 0% | 0% | xwww layer-shell scenes. |
| `login` | 1 | 100% | 0% | 0% | SDDM greeter, session-independent. |
| `web` | 1 | 70% | 30% | 0% | Docs need niri updates; no runtime coupling. |
| **Rolled up** | **100** | **62.8%** | **25.5%** | **11.7%** | |

Rounded headline:

> **~63% reuse unchanged · ~25% modify or adapt · ~12% rewrite from scratch.**

## Cross-check: file-count view

| Bucket | Approx files | Share |
| --- | ---: | ---: |
| Compositor-agnostic files kept as-is | all of `palettes`, `background`, `timex`, `login`, most of `shell/ui`, half of `hyprland/scripts` | ~80% |
| Files needing edits | ~14 shell files, ~12 scripts, `xturing` (3-4 rs), `dots`, 8-10 config/path files | ~14% |
| Files rewritten | 13 `*.lua` + `hypridle.conf` + installer session bits | ~6% |

File count flatters reuse (~80%); effort weighting deflates it (~63%) because
the rewritten config and the effects/Config adapter are dense. The weighted
number is the honest planning figure.

## Uncertainty and assumptions

- **Assumption:** the shell's `WlrLayershell`/`WlSessionLock` surfaces and the
  `dock/palettes` reader are compositor-agnostic (verified: no `hyprctl` in
  `ui/bar/Colors.qml`; `core/Theme.qml` only uses paths).
- **Assumption:** niri's `layout {}` deep-merge via `include` can carry the
  generated border/gaps values (verified in the KDL/include reference; the KDL
  writer must be validated with `niri validate`).
- **Uncertain:** how much of `Config.qml`'s monitor canvas and
  `restore-monitors.sh` reconciler can be reused. Hyprland `hyprctl monitors -j`
  and niri `niri msg --json outputs` differ enough (no `mirrorOf`, different
  scale/transform fields) that this subsystem may land closer to adapt/rewrite
  than the table shows. Budget +2-3 points of rewrite.
- **Uncertain:** niri workspace identity. If stable pills must be preserved,
  named workspaces add work; if a dynamic list is acceptable, the workspace
  daemon is a straight port. This can move up to 2 points either way.
- **Uncertain:** the NYX cursor-position gap (no niri IPC). A pointer-tracking
  redesign could be anywhere from trivial (accept reduced fidelity) to a real
  project (capture-based tracking). The estimate assumes the reduced-fidelity
  path.
- **Not counted:** a full visual-parity QA pass, and Hyprland-specific NVIDIA
  tuning that may not transfer. Add contingency if parity is a release gate.

## Strategy B delta

Under a neutral root (`~/.config/equisdots` + `EQUISDOTS_*`), every component
with a hard-coded path gets a mechanical edit: roughly `shell` -3 reuse/+3
adapt, `xturing` -5/+5, `theme-sync` -3/+3, `davincix` -2/+2, `dots` -10/+10,
`hyprland` scripts -5/+5. Weighted, that is about:

- **~56% reuse · ~32% adapt · ~12% rewrite**

The rewrite share is unchanged; only mechanical path churn moves.

## Is it worth it?

**Yes, with caveats.**

- The expensive, user-visible half of the stack is genuinely portable. The
  palette system, theme-sync, wallpapers, bar/popups/panels/widgets, timex,
  xturing and the settings panel survive. The maintainers clearly anticipated
  this: `Compositor.qml` already exists as the seam and the shell README calls
  the niri backend "a plan item".
- The rewrite is concentrated and bounded: the `hyprland` config repo (KDL),
  `hypr-effects`, `Config.qml` monitors and the installer session bits. There
  is no scenario where the UI is rewritten.
- The main real risks are behavioral, not volumetric: dynamic workspaces vs
  static pills, no live `hyprctl eval`, and no cursor-position IPC for nyx.
  Each has a mitigation (named workspaces, KDL-and-reload, redesigned pointer
  handling) but each costs fidelity.
- The decisive lever is the **path strategy**. Strategy A keeps the estimate at
  ~63/25/12 and enables safe side-by-side running. Strategy B costs ~6-8 points
  with no user-visible payoff for the first release.

Recommendation: port under Strategy A, ship the compositor backend and KDL
config first (phases 1-3), and defer the neutral root and the nyx cursor
feature to a later phase.
