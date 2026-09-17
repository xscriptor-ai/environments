# Hyprland Pack — agents, skills and docs (September 2026)

Pack de agentes, skills, comandos y documentación para OpenCode sobre el estado ACTUAL de Hyprland (v0.56.x, era de config Lua).

## Contenido

- `agents/` — 12 agentes subagente especializados (frontmatter opencode, permisos allow).
- `skills/` — 3 skills deep-reference (`hyprland`, `hyprland-qml`, `hyprland-tools`) con `references/`.
- `commands/` — 2 comandos: `/hypr-config`, `/hypr-diag`.
- `docs/` — estado del ecosistema 2026 (versiones, cambios, mapa de fuentes).

## Instalación

```bash
# Agentes (copia plana, como espera opencode)
cp agents/*.md ~/.config/opencode/agents/
# Skills (carpeta por skill)
cp -r skills/* ~/.config/opencode/skills/
# Comandos
cp commands/*.md ~/.config/opencode/commands/
```

Después reinicia opencode. Los agentes ya traen `permission` allow-all (sin prompts al delegar), igual que el resto del pack instalado.

## Hallazgos clave que corrige este pack (frente a documentación vieja)

1. **Config en Lua desde Hyprland 0.55** (2026-05): `~/.config/hypr/hyprland.lua` con API `hl.config/hl.bind/hl.dsp.*/hl.on/...`. `.conf` hyprlang está deprecado (aviso desde 0.56.1). No existe "Hyprland 1.0"; la línea sigue en 0.x (v0.56.2, 2026-08-05).
2. **Wiki movida y versionada**: https://wiki.hypr.land/ (snapshots por release; legacy hyprlang → páginas 0.54).
3. **Reglas de ventana reescritas en 0.53** (sintaxis nueva; `windowrulev2` no existe).
4. **UI oficial ≠ QML**: la dirección oficial es hyprtoolkit (C++); Qt/QML solo periférico (hyprland-qt-support = estilo "Hyprland" de Qt Quick Controls; hyprland-qtutils archivado → hyprland-guiutils).
5. **QML real en Hyprland = Quickshell** (v0.3.1, org quickshell-mirror). HyprPanel está archivado (2026-04) → sucesor Wayle (Rust/GTK4). AGS/Astal (GTK/TS) y Waybar+SwayNC siguen vivos.
6. **hyprpm ahora es in-tree** en hyprwm/Hyprland (repo standalone eliminado).

Fuentes primarias: github.com/hyprwm/Hyprland (releases), wiki.hypr.land, quickshell.outfoxxed.me, wayle.app, aylur.github.io/ags.
