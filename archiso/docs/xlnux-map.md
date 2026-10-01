# X Linux (xlnux) — mapa del proyecto y cobertura del pack

Verificado contra los repos locales el **2026-10-01**. Este documento conecta cada pieza de X con los recursos del pack y marca lo que falta. Estado de sesión: `/home/x/Documents/repos/xlnux/ESTADO-GENERACIONES.md`.

## Mapa componente → cobertura

| Componente | Qué es | Recursos del pack | Hueco |
|---|---|---|---|
| `x/` perfil + `x-installer` | ISO archiso, instalador Bash, subvols, gen 0001 | `agents/xlnux-installer`, `archiso-profile`, `archiso-build`; skills `archiso`, `distro-boot` | Validación VM e2e (P0) |
| `scripts/` generaciones | `x gen`, home gens, hooks, migraciones, tests | `agents/xlnux-generations`; skill `xlnux` refs `generations.md`, `known-issues.md` | Prefijo subvol (P0), btrfs real (P0) |
| `scripts/` provisioning | `x setup`, usuario, hardware, temas, Hyprland | `archiso-branding`, `archiso-desktop`; skill `distro-installers` | — |
| `xpm` | gestor de paquetes Rust | `agents/xlnux-packages`; skill `xlnux` ref `xpm-xpkg.md` | Resolver/local install (P2) |
| `xpkg` | constructor Rust + repo-add | ídem | `.files` DB, history hyiene, xpm E2E |
| `x-repo` | repo `[x]` en GitHub Pages + portal | `agents/xlnux-packages`, `archiso-packages`; skill `arch-packaging` | Firma del repo (P1) |
| `wsl/` + `wsl-scripts/` | rootfs WSL + provisioning | `agents/xlnux-wsl`; skill `xlnux` ref `wsl.md`; nueva ref genérica `distro-release/references/wsl-images.md` | install.ps1 sin probar, legacy `x/` |
| `web/`, `wiki/` | portal y docs bilingües | fuera del alcance del pack (packs web/TS) | Mantener espejos es/en |
| Generaciones boot | entradas SB/GRUB, `x-rescue`, UKI futuro | `distro-boot` (bootloaders, initramfs/UKI, secureboot) | UKI/SB/multi-kernel (roadmap) |
| Seguridad de cadena | firmas de paquetes/repo/ISO | `arch-packaging`, `distro-release` | `TrustAll` actual (P1) |
| Legal/identidad | marca, licencias, os-release | `docs/distro-blueprint.md` (sección cumplimiento), `archiso-branding` | LICENSE en `scripts/`, auditoría de marca |

## Cobertura del pack archiso (genérico + X)

- **Genérico (aplicable ya)**: perfil y build (archiso 91), bootmodes, packaging y repos firmados, boot/UKI/Secure Boot/TPM, instaladores (Calamares/archinstall como alternativas), branding/first-boot, storage (btrfs/LUKS/snapper/hibernación), desktop, CI/QEMU/release, blueprints, estado del mundo 2026 con versiones y mitos.
- **Específico de X (nuevo)**: skill `xlnux` (arquitectura, contrato de generaciones, xpm/xpkg, WSL, issues priorizados), 4 agentes (`xlnux-generations`, `xlnux-installer`, `xlnux-packages`, `xlnux-wsl`), comandos `/xlnux-validate` y `/xlnux-vm`, este mapa.

## Huecos genéricos cerrados en esta pasada

1. **WSL**: nueva referencia `distro-release/references/wsl-images.md` (rootfs importable, `wsl.conf`, default user, systemd, higiene de machine-id, imagen oficial Arch WSL).
2. **Cumplimiento y licencias**: sección nueva en `distro-blueprint.md` (0BSD de sources Arch, GPL de paquetes, marca Arch, atribución, política de privacidad/telemetría).
3. **Vulnerabilidades**: sección nueva de tracking (security tracker de Arch, arch-audit, feeds CVE, `checkrebuild`).
4. **Accesibilidad**: nota en el blueprint y en el agente de desktop (speech/brltty/espeakup, patrón `accessibility=on` que X ya usa).

## Huecos del proyecto X que el pack no puede cerrar (requieren trabajo en xlnux)

Ver `skills/xlnux/references/known-issues.md` (20 ítems priorizados). Los bloqueantes:

1. VM e2e del instalador (P0) — `/xlnux-vm` guía el procedimiento.
2. `X_GEN_SUBVOL_PREFIX` (P0).
3. Payload `x-scripts` desactualizado (P0) — sin `x gen` el instalador no crea la gen 0001.
4. `generations-btrfs.sh` con root (P0).
5. Restore traversal + root flags (P1), firma del repo (P1), CI (P2), resolver xpm (P2).

## Orden recomendado (sprint actual)

1. Rebuild del payload (`x-scripts` pkgrel+1) y reemplazo en `x/airootfs/root/x-installer/packages/`.
2. `sudo bash scripts/test/generations-btrfs.sh` y arreglos.
3. `sudo x/xbuild.sh` + `x/vm.sh --seed` con `xauto=1`; assert gen 0001 + rollback.
4. Fix `X_GEN_SUBVOL_PREFIX=/@snapshots` en instalador/hooks/setup/update.
5. CI mínimo (`validate.sh` + cargo) y firma del repo `[x]`.

## Cómo usar el pack

```bash
# instalación
cp agents/*.md ~/.config/opencode/agents/
cp -r skills/* ~/.config/opencode/skills/
cp commands/*.md ~/.config/opencode/commands/
```

- Antes de tocar generaciones: cargar skill `xlnux` y leer `references/generations.md` + `known-issues.md`.
- Para validar: `/xlnux-validate` (sin root) y `/xlnux-vm` (root, QEMU).
- Para dudas de plataforma (archiso/pacman/boot): skills genéricas.
