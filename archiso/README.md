# Archiso Pack — agents, skills, commands y docs (octubre 2026)

Pack de agentes, skills, comandos y documentación para OpenCode sobre la construcción de distribuciones basadas en Arch Linux: archiso/mkarchiso, packaging, boot y Secure Boot, instaladores, branding, CI, testing en QEMU y release engineering.

Todo el conocimiento está verificado contra fuentes primarias el **2026-10-01** (archiso **91-1**, pacman 7.1, mkinitcpio 42, archinstall 4.5, Calamares 3.4.3, systemd 262, GRUB 2.16).

## Contenido

- `agents/` — 19 subagentes: 15 genéricos + 4 de X Linux (`xlnux-generations`, `xlnux-installer`, `xlnux-packages`, `xlnux-wsl`).
- `skills/` — 6 skills deep-reference con `references/`:
  - `archiso` (perfil, bootmodes, live env)
  - `arch-packaging` (devtools/pkgctl, repos y firmas, AUR)
  - `distro-boot` (bootloaders, initramfs/UKI, Secure Boot)
  - `distro-installers` (Calamares, archinstall, first-boot/branding)
  - `distro-release` (CI, testing QEMU, release engineering, imágenes WSL)
  - `xlnux` (arquitectura de X, generaciones, xpm/xpkg, WSL, issues priorizados)
- `commands/` — 6 comandos: `/archiso-new`, `/archiso-build`, `/archiso-test`, `/archiso-diag`, `/xlnux-validate`, `/xlnux-vm`.
- `docs/` — estado del ecosistema 2026, blueprint de distro de cero a release, mapa de fuentes y mapa del proyecto X Linux con análisis de huecos.

## Capa X Linux (xlnux)

Este pack está pensado para trabajar sobre **X Linux** (`/home/x/Documents/repos/xlnux`), la distro basada en Arch de este workspace (perfil `x/` + instalador Bash, generaciones btrfs en `scripts/`, `xpm`/`xpkg`, WSL, `x-repo`). La capa específica vive en:

- skill `xlnux` — arquitectura real, contrato de generaciones, toolchain Rust, WSL y `known-issues.md` priorizado (P0–P2).
- agentes `xlnux-*` — generaciones, instalador/VM, packaging y WSL.
- comandos `/xlnux-validate` y `/xlnux-vm` — puertas de validación (suite sin root, btrfs real, e2e QEMU).
- `docs/xlnux-map.md` — mapa componente→cobertura y huecos abiertos.

Bloqueantes actuales de X (2026-10-01): validación VM e2e del instalador, `X_GEN_SUBVOL_PREFIX` en sistemas instalados, payload `x-scripts` desactualizado (sin `x gen`), y test btrfs con root. Detalle y plan en `skills/xlnux/references/known-issues.md`.

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

1. **archiso v91** (2026-09-27): los únicos bootmodes válidos son `bios.syslinux`, `uefi.systemd-boot` y `uefi.grub`. Los nombres granulares (`uefi-x64.systemd-boot.esp`, `bios.syslinux.eltorito`, …) están deprecados desde v86 y se remapean solos. `uefi.systemd-boot` y `uefi.grub` son mutuamente excluyentes.
2. **`customize_airootfs.sh` está deprecado** (aviso desde v91): el método soportado son hooks de pacman en `airootfs/etc/pacman.d/hooks/` marcados con `# remove from airootfs!`.
3. **mkarchiso puede correr sin root** vía `unshare` desde v89; desde v91 avisa si se ejecuta con sudo. `-r` borra el workdir (no es "reproducible"); `-m` son los build modes (`iso`, `netboot`, `bootstrap`), no mirrors. La reproducibilidad se ancla con `SOURCE_DATE_EPOCH`/`<work>/build_date`.
4. **El perfil `baseline` NO fue eliminado** (sigue en v91, 12 paquetes, erofs+lzma). **EROFS no es el default**: `airootfs_image_type` por defecto es `squashfs`; releng usa squashfs+xz.
5. **archiso no firma ni enrola Secure Boot**: el ISO oficial tampoco lo soporta. Hay que repackear con shim/PreLoader o firmar con claves propias (`sbctl` 0.18).
6. **No hay UKI nativo x86_64 en archiso**: v91 solo usa `ukify`/`stubble` para AArch64. Para un ISO UKI en x86_64 hay que añadir preset `uki` propio + entradas en `EFI/Linux/`.
7. **`linux-firmware` está dividido desde 2025-06-21**: ahora es un meta-paquete vacío; los ISOs pueden ahorrar cientos de MB eligiendo `linux-firmware-{amdgpu,intel,nvidia,realtek,other}`.
8. **El packaging oficial vive en Git** (migración SVN→Git completada 2023-05-21): `pkgctl repo clone`, sources 0BSD, `pkgctl build/release/db`. `asp` y `dbscripts` ya no existen; `offload-build` ya no es un binario (`pkgctl build --offload`).
9. **Calamares se mudó a Codeberg** (GitHub archivado 2025-08-18); última 3.4.3 (2026-09-10), Qt6/KF6 first-class. **No hay página de Calamares en la Arch Wiki** (404).
10. **mkinitcpio 42 cambió los PCRs** (aviso Arch 2026-09-22): los LUKS desbloqueados por TPM2 hay que re-enrolarlos. Con initramfs systemd (default desde mkinitcpio 40) `grub-btrfs-overlayfs` no sirve; la vía 2026 para snapshots booteables es Limine + `limine-snapper-sync`.

Fuentes primarias: `gitlab.archlinux.org/archlinux/archiso` (vía espejo GitHub), `wiki.archlinux.org/title/Archiso`, `archlinux.org/packages`, `man.archlinux.org`, `codeberg.org/Calamares`, `github.com/archlinux/archinstall`, `archboot.com`. Detalle completo en `docs/sources.md`.

## Flujo recomendado

1. `distro-architect` define alcance, base (archiso vs fork vs artools/garuda-tools) y roadmap.
2. `archiso-profile` + `archiso-build` crean y compilan el perfil.
3. `archiso-boot` / `archiso-secureboot` / `archiso-kernel` endurecen el arranque.
4. `archiso-calamares` o `archiso-archinstall` añaden el instalador.
5. `archiso-branding` y `archiso-desktop` dan identidad y sesión.
6. `archiso-ci` + `archiso-testing` automatizan build, smoke test y release.
7. `archiso-troubleshooting` entra cuando algo no arranca.
