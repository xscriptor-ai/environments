# Hyprland — estado del ecosistema, septiembre 2026

Compilado el 2026-09-09 verificando fuentes primarias (releases de GitHub hyprwm, wiki.hypr.land, quickshell.outfoxxed.me, wayle.app, AUR). Útil para fechar conocimiento y detectar desactualización.

## Versiones verificadas

| Componente | Última | Fecha |
|---|---|---|
| Hyprland | v0.56.2 | 2026-08-05 |
| hyprutils | v0.14.2 | 2026-09-05 |
| hyprlang | v0.6.8 | 2026-01 (mantenimiento) |
| hyprwayland-scanner | v0.4.6 | 2026-04 |
| hyprgraphics | v0.5.1 | 2026-04 |
| hyprcursor | v0.1.13 | 2025-07 |
| hyprlock | v0.9.6 | 2026-07 |
| hypridle | v0.1.8 | 2026-07 |
| hyprpaper | v0.8.4 | 2026-04 |
| hyprpicker | v0.4.7 | 2026-05 |
| xdg-desktop-portal-hyprland | v1.4.1 | 2026-07 |
| hyprland-guiutils | v0.2.2 | activo (sucesor de hyprland-qtutils, archivado) |
| hyprland-qt-support | v0.1.0 | activo |
| Quickshell | v0.3.1 | 2026-08 |
| Wayle | v0.7.0 | 2026-07 |
| AGS (Astal+Gnim) | v3.1.2 | 2026-04 |
| Waybar | v0.15.0 | 2026-02 |
| SwayNC | v0.12.6 | 2026-03 |
| hyprshot (comunidad) | 1.3.0 | 2024-06 (dormido) |
| cliphist | 0.7.0 | 2025-10 |

## Cronología de cambios que rompen conocimiento viejo

- v0.42 (2024-08): wlroots fuera → Aquamarine.
- v0.49 (2025-05): Permission Manager; hyprpm con sudo.
- v0.50 (2025-07): primer test-suite (hyprtester); sintaxis monitor v2.
- v0.51 (2025-09): gestos configurables; `hyprctl getprop`.
- v0.52 (2025-11): qtutils → guiutils (`misc:disable_hyprland_guiutils_check`).
- v0.53 (2025-12): **reescritura de windowrules** (mayor ruptura de la era hyprlang).
- v0.54 (2026-02): togglesplit/swapsplit eliminados; hyprpm integración nix.
- v0.55 (2026-05): **Lua config por defecto + API de layouts Lua + springs + glows**; hyprlang deprecado.
- v0.56 (2026-07): REPL Lua en hyprctl; full-reload; gestos custom Lua; aviso de deprecación `.conf` (0.56.1).

## Hoja de ruta visible

- Milestone abierto 0.57 (sin fecha). Sin 1.0 en ningún milestone.
- hyprwire + hyprtavern (protocolo de IPC nuevo + session bus): en desarrollo temprano; hoy siguen vigentes los dos sockets UNIX.
- UI oficial: hyprtoolkit (C++) + hyprlauncher/hyprpolkitagent/hyprpwcenter/hyprshutdown. QML oficial = hyprland-qt-support (estilo Qt Quick Controls "Hyprland").

## Mapa de documentación actual

- Wiki: https://wiki.hypr.land/ — versionada; paths lowercase: `configuring/core/*` (config-options, binds, dispatchers, rules/*, animations, environment-variables, advanced-configuration/using-hyprctl, lua-utilities, events), `configuring/layouts/*` (dwindle, master, scrolling, monocle, custom-layouts), `hypr-ecosystem/*`, `plugins/`, `ipc/`, `nix/`.
- Snapshots por release vía selector de versión (p. ej. `/0.56.0/`); la sintaxis hyprlang solo vive en las páginas 0.54.
- Noticias: https://hypr.land/news (RSS hypr.land/rss.xml); blog.hyprland.org caído/irrelevante.
- Quickshell: quickshell.outfoxxed.me (docs 0.3.1); repo quickshell-mirror/quickshell.
- Wayle: wayle.app. AGS: aylur.github.io/ags y /astal.

## Trampas de conocimiento (2023-2024 → 2026)

1. `wiki.hyprland.org/Configuring/Variables` ya no existe → `wiki.hypr.land/configuring/core/config-options/`.
2. `exec-once =`, `env =`, `windowrule =`, `animation = bezier` → API Lua (solo válido ≤ 0.54).
3. HyprPanel como barra QML → nunca lo fue (AGS/GJS) y está archivado; sucesor Wayle.
4. "Quickshell en quickshell.outfoxxed.dev" → `.me`; org GitHub quickshell-mirror.
5. hyprland-qtutils → archivado (2025-11); no tiene módulos QML "QtScreenManager/QmlUtils".
6. Módulos QML en el bar de vaxry: vaxry usa Quickshell (config personal), no código oficial de hyprwm.
7. Eventos socket2 que NO existen: trayicon*, groupopen, screenresize, lockactivegroup.
8. `misc.vfr` → `debug.vfr` (0.55); `decoration.shadow.ignore_window` eliminado (0.55); `render.cm_fs_passthrough` eliminado; `master.center_master_slaves_on_right` → `center_master_fallback`.
