# Blueprint — construir una distro basada en Arch de cero a release

Documento de arquitectura de referencia. Cada fase lista decisiones, herramientas actuales (2026) y criterios de salida. Los agentes del pack ejecutan cada bloque.

## Fase 0 — Definir alcance

| Decisión | Opciones 2026 | Recomendación |
|---|---|---|
| Base | archiso puro / fork archiso (EndeavourOS) / framework Manjaro-lineage (Garuda, Artix artools) / toolchain propio (archboot) | archiso puro para empezar; fork solo si necesitas tocar mkarchiso |
| Instalador | Calamares (GUI), archinstall (TUI oficial), propio (CachyOS New-Cli) | Calamares offline + archinstall como fallback |
| Público | rolling / snapshot mensual / LTS-like | rolling con ISO mensual fechada |
| Arquitecturas | x86_64, x86_64_v3, aarch64 | x86_64_v3 si tu base de usuarios es moderna |
| Identidad | ID=arch vs ID_LIKE=arch | `ID_LIKE=arch` (spec-clean); `ID=arch` maximiza compatibilidad AUR/tooling |
| Repos | solo official / + propio / + chaotic / AUR en build | repo propio firmado; AUR solo en build con chroot limpio |

Criterio de salida: documento de alcance de 1 página + nombre, `ID`, canales (nightly/beta/stable) y política de actualizaciones.

## Fase 1 — Bootstrap del árbol

```text
distro/
├── profiles/
│   └── mi-distro/            # perfil archiso (copia de /usr/share/archiso/configs/releng)
│       ├── profiledef.sh
│       ├── packages.x86_64
│       ├── pacman.conf       # build-time (mirrors + repo propio)
│       ├── airootfs/
│       ├── efiboot/loader/{loader.conf,entries/}
│       ├── syslinux/
│       └── grub/
├── packages/                 # PKGBUILDs propios (mi-distro-*)
├── repo/                     # repo binario firmado (repo-add)
├── ci/                       # workflows
└── scripts/                  # build.sh, release.sh, test-iso.sh
```

Salida: `mkarchiso -v -w work -o out profiles/mi-distro` produce ISO arrancable (aunque sea fea).

## Fase 2 — Capa de paquetes

- Construir paquetes propios con `pkgctl build` (imita a Arch) o `makechrootpkg`; firmar con `GPGKEY`.
- Repo propio: `repo-add -s -k KEY repo/mi-distro.db.tar.zst repo/*.pkg.tar.zst` + `.files`, symlinks `*.db`/`*.files`.
- Consumo en perfil: `[mi-distro]` **arriba** de official en `pacman.conf`, `Server = file:///srv/repo` (build-time) y copia de `pacman.conf`+keyring en `airootfs/etc` + `airootfs/usr/share/pacman/keyrings/` (runtime live).
- Si reemplazas paquetes oficiales: `provides` + `conflicts`, y `replaces` para takeover; `IgnoreGroup`/`IgnorePkg` para holdear.
- Kernel propio: renombrar `pkgbase` (p. ej. `linux-midistro`), **nunca** `provides=('linux')`; headers a juego; entradas de boot actualizadas.

Salida: repo firmado y reproducible; ISO instala paquetes de tu repo.

## Fase 3 — Boot y seguridad

- Bootmodes: `bios.syslinux` (si soportas legacy) + `uefi.systemd-boot` (default 2026). GRUB solo si necesitas loopback/cifrado de `/boot`.
- UKI x86_64 (opcional pero recomendado): preset `uki` + `ukify`, salida `EFI/Linux/*.efi`; systemd-boot las autodescubre.
- Secure Boot: shim+GRUB firmados por Microsoft (máxima compatibilidad), claves propias con `sbctl` (control total), o PreLoader (más simple). Al menos: documentar cómo desactivar SB.
- Firma de artefactos: GPG detached (`iso.sig`, `sha256sums.txt`, `b2sums.txt`) + torrent con webseeds.
- `linux-firmware` explícito (split): incluye `-amdgpu -intel -nvidia -realtek -other`; añade wifi/storage usados en instalación.

Salida: ISO bootea en UEFI (y BIOS si aplica), con Secure Boot documentado, artefactos firmados.

## Fase 4 — Instalador y first-boot

- Calamares offline: módulos `partition → mount → unpackfs → machineid → fstab → locale → keyboard → localecfg → initcpiocfg → initcpio → users → networkcfg → displaymanager → packages@offline → hwclock → bootloader → services-systemd → umount`; branding propio en `/etc/calamares/branding/<id>`.
- `unpackfs` extrae `airootfs.sfs` del propio ISO a `${ROOT}`.
- archinstall como alternativa TUI: `archinstall --config config.json --creds creds.json --silent`.
- First boot: `systemd-firstboot` interactivo o `ConditionFirstBoot=yes`; limpiar `/etc/machine-id` antes de publicar; `/etc/skel` para defaults de usuario.

Salida: instalación completa offline en VM sin intervención manual (modo automatizado).

## Fase 5 — Branding y experiencia

- `/etc/os-release` (NAME, ID, ID_LIKE, PRETTY_NAME, LOGO, HOME_URL, SUPPORT_URL, BUG_REPORT_URL, DEFAULT_HOSTNAME, RELEASE_TYPE).
- Plymouth (`splash` + hook `plymouth` antes de `encrypt`/`sd-encrypt`), tema propio.
- fastfetch config, MOTD, `/etc/issue`, wallpapers, GRUB/syslinux con nombre de distro.
- Live session: autologin (`getty@tty1.service.d/autologin.conf`), CoW por defecto (`cow_spacesize=4G`), iwd/NetworkManager, sshd opcional.

Salida: identidad coherente en boot, live e instalado.

## Fase 6 — CI, testing y release

- CI: contenedor `archlinux:base-devel` (o tag fechada para reproducibilidad) + `mkarchiso`; cache de `/var/cache/pacman/pkg`; matriz `{releng-like, minimal} × {iso, netboot}`; validación estática (`xorriso -report_el_torito`, `unsquashfs -l`, `mcopy -i efiboot.img`, `gpg --verify`).
- Smoke test QEMU UEFI headless: pflash OVMF + `-display none -serial mon:stdio -no-reboot`, esperar login/SSH/QGA, ejecutar una orden; variante BIOS; opcional Secure Boot.
- Release: checksums, firmas, torrent (`mktorrent -l 19` + webseeds), rsync a mirror, `latest` symlink, retention N releases, notas de release generadas.
- Reproducibilidad: `SOURCE_DATE_EPOCH`, TZ=UTC, listas ordenadas, `--source-date-epoch` en container builds; gate opcional con `diffoscope`.

Salida: pipeline nightly + release firmado y testeado.

## Fase 7 — Operación

- Canales: nightly → beta → stable (ISO fechada); avisar de cambios que rompen (partial upgrades, keyring).
- Monitorizar mirror status, tamaño del ISO y nº de paquetes contra builds previos (regresión barata).
- Mantener `archiso`, `mkinitcpio`, `grub`, `systemd`, `calamares` al día: son la superficie de boot.
- Seguridad de cadena de suministro: firmar paquetes, SLSA/provenance si el CI lo permite, revisar AUR (incidente 2026-06-12).

## Presupuesto de tiempo realista (primer ISO usable)

| Hito | Esfuerzo |
|---|---|
| ISO releng rebrandeada | 1 día |
| Perfil propio + paquetes propios | 1-2 semanas |
| Repo firmado + CI de build | 1 semana |
| Calamares offline funcional | 1-2 semanas |
| Secure Boot + UKI | 1 semana |
| Smoke tests QEMU en CI | 2-4 días |
| Release reproducible y firmada | 1 semana |

## Cumplimiento, licencias y marca

- **Sources de Arch**: los PKGBUILD oficiales son 0BSD (RFC40) y pasan REUSE (RFC52); puedes bifurcarlos legalmente, pero conserva avisos de copyright de los parches upstream y de los sources (GPL/MIT/etc.).
- **Paquetes propios**: cada PKGBUILD necesita `license=` correcto y, si empaqueta binarios, el texto de licencia en `/usr/share/licenses/<pkg>/`. GPL exige oferta de fuente (publica tus PKGBUILDs y sources).
- **Marca**: "Arch Linux" y su logo son marcas registradas (política de términos de Arch); no los uses para promocionar tu derivada. Crea tu propio logo/nombre y usa `ID_LIKE=arch` (o `ID=arch` solo por compatibilidad, documentándolo).
- **Atribución**: reconoce a Arch, upstream y contribuidores en el README/página de descargas; incluye el texto de licencia del ISO y de los artefactos.
- **Privacidad/telemetría**: si añades telemetría, sé explícito y opt-in; publica política. Si no, decláralo ("sin telemetría").
- **Export/control**: si tu distro se distribuye en países con regulaciones de exportación/crypto (LUKS), revisa el aviso correspondiente.

## Seguimiento de vulnerabilidades (distro propia)

- **Arch Security Tracker**: `https://security.archlinux.org/` (JSON/API por paquete) — monitoriza los paquetes que recompaquetas o pineas.
- `arch-audit` (paquete `arch-audit`) sobre el sistema instalado; en CI, comparar lista de paquetes del perfil contra advisories abiertos.
- **CVE**: NVD/MITRE feeds + `cve-bin-tool`/OSV-scanner para tus paquetes propios; GitHub Advisory DB para dependencias del toolchain.
- Rebuild policy: al actualizar una librería compartida, `checkrebuild`/`rebuild-detector` y reconstruye tus paquetes propios; para kernels/loader, re-firma tras cada update.
- Suscripciones: `arch-security` mailing list/RSS y los canales de tus upstreams; documenta SLA de parcheo (p. ej. crítico ≤72 h) si publicas una distro.

## Accesibilidad (patrón ISO)

- Consolas de arranque: entradas "speech" con `accessibility=on` (releng la incluye) + `espeakup`/`brltty`; servicios activados bajo `sound.target.wants`.
- Live: lector de pantalla disponible (Orca en GNOME), contraste/tema alto, fuentes legibles; el instalador (Calamares) tiene QML accesible/teclado.
- Instalado: no rompas los defaults de accesibilidad del DE elegido; verifica navegación por teclado y foco en el instalador.
- Prueba real: arranca el ISO con `accessibility=on` y valida que el instalador sea operable sin pantalla.
