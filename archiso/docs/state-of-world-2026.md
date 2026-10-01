# Arch ISO / distro building — estado del ecosistema, octubre 2026

Compilado el **2026-10-01** verificando fuentes primarias (paquetes de archlinux.org, wiki, man pages, repos upstream, espejos GitHub de GitLab Arch, Codeberg). Sirve para fechar conocimiento y detectar desactualización.

## Versiones verificadas

| Componente | Última | Fecha | Nota |
|---|---|---|---|
| archiso | **91-1** | 2026-09-27 | extra/any; `mkarchiso`, perfiles releng+baseline |
| ISO oficial | 2026.10.01 | 2026-10-01 | kernel 7.2.7, ~1.5 GB, BIOS+UEFI, sin Secure Boot |
| arch-install-scripts | 31-2 | 2026 | `pacstrap -N` (rootless), `arch-chroot` |
| devtools | 1:1.5.1-1 | 2026-06-21 | `pkgctl`, mkarchroot/makechrootpkg, `_v3` builds |
| pacman | 7.1.0.r9.g54d9411-2 | 2026-05-06 | 7.0 → 2024-07-14; 7.1 → 2025-11-01; sin 8.x |
| archlinux-keyring | 20260909-1 | 2026-09-09 | split con `voa-verifiers-arch` (OpenPGP/VOA) |
| mkinitcpio | **42.1-1** | 2026-09-28 | 42.2 en core-testing; default hooks systemd desde v40 |
| dracut | 111-1 | 2026-05-19 | marcado desactualizado 2026-08-02 |
| booster | 0.13-1 | 2026-06-21 | sin microcódigo embebido |
| systemd / systemd-boot / ukify | 262-1 | 2026-09-22 | UKI, NvPCRs, PCR policy |
| GRUB | 2:2.16-1 | 2026-09-22 | upstream movido a freedesktop GitLab |
| Limine | 12.9.1-1 | 2026-09-27 | favorito para UKI+snapshots (`limine-snapper-sync`) |
| rEFInd | 0.14.2-3 | 2026-05-30 | UEFI only; no bootea ISOs |
| syslinux (Arch) | 6.04.pre3.r3.g05acc…-5 | 2026-07-20 | upstream congelado en 6.03 (2014); solo BIOS |
| sbctl | 0.18-2 | 2026-08-10 | create/enroll/sign; backend YubiKey |
| linux-firmware | 20260916-1 | 2026-09-16 | **split** 2025-06-13; meta-paquete vacío |
| archinstall | 4.5-1 | 2026-09-29 | UI Textual desde 4.0; JSON config |
| Calamares | 3.4.3 | 2026-09-10 | Codeberg; Qt6/KF6 |
| erofs-utils | 1.9.4-1 | 2026-08-25 | solo baseline/opcional |
| qemu | 11.1.2 / qemu-desktop 11.1.1-4 | 2026-09-28 | `run_archiso` lo usa |
| libvirt | 1:12.8.0-1 | 2026-10-01 | alternativa a QEMU CLI |
| virt-install | 5.1.0-4 | 2026-07-19 | |
| Packer (+plugin qemu) | 1.16.1 / 1.1.7 | 2026 | builder qemu, cloud-init |
| contenedor archlinux | base-20260927.0.600689 | semanal (dom 00:00 UTC) | diario en quay/ghcr, etiqueta `repro` |
| Ventoy | 1.1.17 | 2026-07-24 | nueva CA Secure Boot desde 1.1.14 |
| fastfetch | 2.69.0 | 2026-09-25 | reemplazo de neofetch |
| artools (Artix) | 0.40.0 | 2026-09-11 | framework alternativo a archiso |
| archboot | rolling | 2026-09-30 | UKI, Secure Boot (shim Fedora), offline, reproducible |
| EndeavourOS ISO repo | activo | 2026-09-27 | fork de mkarchiso + fork de Calamares |
| CachyOS Live ISO | activo | 2026-09-30 | archiso + scripts Manjaro + cachyos-calamares |

## Cronología archiso que rompe conocimiento viejo

- v75 (2024-01): el ISO pasa a "Live/Rescue DVD" (>900 MiB).
- v77 (2024-04): **releng UEFI pasa de GRUB a systemd-boot**; `archisosearchuuid`; hook `microcode`.
- v78 (2024-05): ESP +8 MiB de margen; FAT32 si ≥36 MiB; initramfs xz -9e.
- v80 (2024-09): UUID vacío para EROFS; baseline con EROFS lzma.
- v82 (2024-11): `DownloadUser` comentado en el pacman.conf del perfil.
- v86 (2025-09): **bootmodes combinados** (`bios.syslinux`, `uefi.systemd-boot`, `uefi.grub`); `run_archiso` UEFI por defecto; plantillas `%ARCH%`.
- v87 (2025-10): **soporte multi-arch UEFI** (aarch64/riscv64/loongarch64, sin cross-build); `reflector.service` ya no se habilita; solo mirrors HTTPS.
- v88 (2026-03): bootstrap de baseline en xz.
- v89 (2026-07): **mkarchiso corre como usuario normal** vía `unshare`; validación de `install_dir` (`[a-z0-9]`, ≤30); systemd-boot y grub excluyentes; `ntfs-3g`→`ntfsprogs`.
- v90 (2026-09): BIOS se salta en no-x86 con aviso; `broadcom-wl` fuera.
- v91 (2026-09-27): AArch64 con `stubble`/DTB; `kernel_params_<arch>` y `%KERNEL_PARAMS%`; bootstrap lz4/pzstd; **`customize_airootfs.sh` deprecado**; eliminado el override de `linux.preset`; aviso al correr con sudo.

## Correcciones de mitos

1. `baseline` **no** fue eliminado (v91 lo trae: `configs/baseline`, 12 paquetes).
2. EROFS **no** es el default; releng usa squashfs+xz, baseline erofs+lzma.
3. Los nombres `uefi.systemd-boot.esp` / `uefi.grub.eltorito` **nunca existieron**; lo granular era `uefi-x64.*`/`uefi-ia32.*` (deprecado v86).
4. `mkarchiso -r` = borrar workdir; **no** es reproducible. La reproducibilidad es `SOURCE_DATE_EPOCH`/`build_date`.
5. `mkarchiso -m` = build modes, **no** mirrors.
6. `offload-build` ya no es binario independiente: `pkgctl build --offload` (host por defecto `build.archlinux.org`).
7. `dbscripts` y `asp` ya no existen: `pkgctl db` y `pkgctl repo clone`.
8. GRUB 2.16 ya no es GNU Savannah: desarrollo en `gnu-grub.freedesktop.org`.
9. `linux-firmware` es un meta vacío desde el split de 2025; listar subpaquetes explícitos.
10. Los ISOs oficiales no firman Secure Boot; `run_archiso -s` es solo para pruebas.

## Cambios externos que afectan a ISOs

- **pacman 7.0** (2024-07-14): descargador sandbox + `DownloadUser=alpm`; los repos locales deben ser legibles/ejecutables por `alpm` (`chown :alpm -R`). `ParallelDownloads` ON por defecto (5). **`CacheServer`** por repo.
- **Bases de datos oficiales sin firmar**: `core.db.sig`/`extra.db.sig` no existen (404); por eso `DatabaseOptional`. Los paquetes sí van firmados.
- **AUR malicioso** (incidente 2026-06-12): tratar AUR como input hostil; construir en chroot limpio; chaotic-aur es binario x86_64 no auditado.
- **Arch Linux Archive**: snapshots diarios en `https://archive.archlinux.org/repos/YYYY/MM/DD/$repo/os/$arch`; permite rebuilds pinneados (no mezclar con mirrors vivos).
- **mkinitcpio 42 + TPM2** (aviso 2026-09-22): `systemd-pcrosseparator` cambia PCRs 0-7, 9, 12-14 → re-enrolar LUKS TPM2; preferir políticas firmadas o PCR 15 vacío.
- **grub-btrfs + initramfs systemd**: `grub-btrfs-overlayfs` es hook busybox; incompatible. Ruta 2026: Limine + `limine-snapper-sync`.
- **Ventoy**: nueva CA Secure Boot desde 1.1.14 (enrolar al primer arranque); la Arch Wiki mantiene aviso de seguridad por blobs binarios sin procedencia.
- **systemd 262**: NvPCRs + política de PCR firmada dentro del UKI; solo `ukify` la genera hoy (mkinitcpio 42.2 lo documenta como limitación).

## Mapa de fuentes primarias

- archiso: `gitlab.archlinux.org/archlinux/archiso` (bloquea web scraping con Anubis; usar el espejo `github.com/archlinux/archiso`), `wiki.archlinux.org/title/Archiso`, `man.archlinux.org/man/mkarchiso.1`.
- Packaging: `wiki.archlinux.org/title/DeveloperWiki:Building_in_a_clean_chroot`, man pages de devtools/pkgctl, `wiki.archlinux.org/title/Pacman/Tips_and_tricks`.
- Boot: `wiki.archlinux.org/title/Arch_boot_process`, `/GRUB`, `/Systemd-boot`, `/Limine`, `/Unified_kernel_image`, `/Secure_Boot`.
- Instaladores: `github.com/archlinux/archinstall`, `codeberg.org/Calamares/calamares`.
- CI/releng: `.gitlab-ci.yml` de archiso/releng/arch-boxes/archlinux-docker (espejos GitHub), `github.com/pierres/archiso-manager`, `wiki.archlinux.org/title/Mirrors`.
- Distribuciones de referencia: EndeavourOS, CachyOS, Garuda, Artix, archboot (URLs en `sources.md`).

## Trampas de conocimiento (pre-2025 → 2026)

1. "edita `customize_airootfs.sh`" → deprecado: hooks pacman + `# remove from airootfs!`.
2. "bootmode `uefi.systemd-boot.esp`" → no existe; usa `uefi.systemd-boot`.
3. "archiso firma el ISO" → no; archiso solo genera artefactos y checksums/zsync en su CI. La firma es tuya (`gpg --detach-sign`).
4. "mkarchiso necesita root siempre" → desde v89 puede con `unshare`; desde v91 avisa con sudo.
5. "el kernel del ISO lleva `archisodevice`" → desde v77 es `archisosearchuuid=%ARCHISO_UUID%` y `%ARCHISO_SEARCH_FILENAME%` (grub).
6. "necesito `intel-ucode.img` aparte" → el hook `microcode` lo embebe (booster sí necesita initrd separado).
7. "`ParallelDownloads` es opcional" → es default 5 en pacman 7.
8. "Calamares está en GitHub/Arch Wiki" → Codeberg; página de wiki 404.
9. "archinstall tiene modo offline" → `--offline` solo desactiva servicios online, no instala sin red.
10. "`dbscripts` para gestionar mi repo" → usa `repo-add`/`repo-remove` o `pkgctl db` si eres Arch.
