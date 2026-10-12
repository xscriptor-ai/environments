# niri Pack — agents, skills y guías de migración

Pack de agentes y skills para OpenCode sobre el compositor Wayland de
scrollable-tiling **niri**, más la capa de **migración desde Hyprland**.

Baseline del compositor: **niri 26.04** (2026-04-25), configuración en KDL
(`~/.config/niri/config.kdl`). Baseline del origen de la migración: **Hyprland
0.56.x** (era de config Lua, 0.55+).

## Contenido

- `agents/` — 10 subagentes con frontmatter de opencode (permisos allow):
  - **niri core** — `niri-config-architect`, `niri-ipc-scripter`,
    `niri-layout-designer`, `niri-session-engineer`, `niri-shell-integrator`,
    `niri-troubleshooter`.
  - **migración Hyprland→niri** — `hyprland-niri-migrator`,
    `hyprland-niri-gap-analyst`, `niri-config-translator`,
    `equisdots-compositor-port`.
- `skills/` — 15 skills deep-reference con `references/`:
  - **niri core** (10) — `niri`, `niri-configuration`, `niri-keybindings`,
    `niri-layout-rules`, `niri-input-outputs`, `niri-workspaces`, `niri-ipc`,
    `niri-window-effects`, `niri-session-integration`, `niri-troubleshooting`.
  - **migración Hyprland→niri** (5) — `hyprland-to-niri`,
    `hyprland-niri-config-mapping`, `hyprland-niri-ipc-mapping`,
    `hyprland-niri-tooling-mapping`, `equisdots-niri-port`.

## Instalación

```bash
# Agentes (copia plana, como espera opencode)
cp agents/*.md ~/.config/opencode/agents/
# Skills (carpeta por skill)
cp -r skills/* ~/.config/opencode/skills/
```

Después reinicia opencode. Los agentes ya traen `permission` allow.

## Hallazgos clave que corrige este pack

1. **niri se versiona por fecha, no semver.** Baseline documentado: **26.04**
   (2026-04-25). Config en un único **KDL** (`config.kdl`) que **recarga en
   caliente** al guardar; no existe `hyprctl eval`: los cambios en vivo se
   escriben como fragmentos y se recargan.
2. **KDL es estricto**: un bloque cuyo último nodo no termina con `;` o salto de
   línea antes de `}` no parsea, y niri **cae a su config por defecto** (pantalla
   gris con el overlay de atajos, sin error). Valida con
   `niri validate -c ~/.config/niri/config.kdl`.
3. **Scrollable tiling**: las ventanas viven en columnas sobre una tira
   horizontal infinita por monitor; los **espacios de trabajo son dinámicos e
   independientes por monitor** (existen los nombrados y `recent-windows`).
4. **`exclusiveZone` de layer-shell** reserva 1 o 3 bordes por superficie (no los
   4); la reserva de un borde empuja las superficies ancladas a ese borde.
5. **IPC**: `niri msg` (`--json`), `niri msg action`, y el **event-stream**
   (`niri msg --json event-stream`, socket en `NIRI_SOCKET`) sustituyen a
   `hyprctl` y a `.socket2.sock`.
6. **Portales**: selección en `niri-portals.conf` (`gnome` + `gtk`);
   screencasting vía `xdg-desktop-portal-gnome`. No poner `GDK_BACKEND=wayland`
   global (rompe el portal de screencast).
7. **X11**: `xwayland-satellite` (>= 0.7) para apps X11.
8. **Migración (equisdots, Estrategia A)**: la raíz de datos compartida se queda
   en `~/.config/hypr` y solo la config del compositor se mueve a
   `~/.config/niri`; el shell se hace neutral al compositor tras un seam
   (`Compositor.qml` → `Niri.qml`). Estimación para el stack: ~**63% reuso**,
   ~25% adaptar, ~12% reescribir.

Fuentes primarias: `github.com/YaLTeR/niri` (releases y `docs/wiki`),
`wiki.archlinux.org` (niri, xwayland-satellite, portales).

## Uso recomendado

1. `niri-config-architect` escribe/valida `config.kdl`; `niri-configuration`
   describe dónde carga y cómo validar.
2. `niri-keybindings`, `niri-layout-rules`, `niri-input-outputs` y
   `niri-workspaces` cubren binds, colocación, entrada/salida y espacios.
3. `niri-ipc-scripter` construye barras/scripts sobre `niri msg` y el
   event-stream.
4. `niri-session-engineer` monta la sesión, portales, Xwayland y NVIDIA.
5. En migraciones: `hyprland-to-niri` (visión), los `hyprland-niri-*-mapping`
   (config, IPC, tooling), y `equisdots-compositor-port` para el backend del
   shell de equisdots.
