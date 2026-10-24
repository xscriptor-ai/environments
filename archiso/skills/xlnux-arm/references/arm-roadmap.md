# ARM roadmap, decisions and risks

Scope: aarch64 with UEFI. Out of scope: armv7h, Raspberry Pi, generic SBCs, Asahi, WSL ARM, Secure Boot.

## Decision summary

| ID | Decision | Status |
|---|---|---|
| ADR-001 | Use Arch Linux ARM, not Arch x86_64, as the base | Proposed |
| ADR-002 | v1 supports aarch64 only | Proposed |
| ADR-003 | v1 is UEFI only | Proposed |
| ADR-004 | GRUB `arm64-efi` is the default bootloader; systemd-boot `AA64` is optional | Proposed |
| ADR-005 | Native ARM builds are the supported path; cross-builds are experimental | Proposed |
| ADR-006 | Multi-architecture repos share the same signing key | Proposed |
| ADR-007 | Kernel compatibility symlinks are acceptable for v1 | Proposed |
| ADR-008 | Raspberry Pi, SBCs and armv7h are out of v1 | Proposed |
| ADR-009 | WSL ARM is out of v1 | Proposed |
| ADR-010 | Secure Boot is out of v1 | Proposed |

## ADR-001: Arch Linux ARM as the base

**Context:** X is an Arch-based distribution. Arch x86_64 does not exist on ARM; ALARM is the official ARM port.

**Decision:** use ALARM `aarch64` for packages, kernels and keyrings.

**Consequences:**

- Repositories `core`, `extra`, `alarm`, `aur`.
- Mirror `mirror.archlinuxarm.org`.
- Kernel `linux-aarch64` (or `linux-rpi`).
- `archlinuxarm-keyring`.
- No `reflector`, `syslinux`, `memtest86+` or `rEFInd`.
- Rootfs tarballs instead of official ISOs.

**Alternatives rejected:** Manjaro ARM, EndeavourOS ARM (derivatives), Armbian (not Arch), Fedora (not Arch).

## ADR-002: aarch64 only in v1

**Context:** ALARM maintains both aarch64 and armv7h. Two userlands, toolchains and boot paths double the work.

**Decision:** v1 is aarch64 only. armv7h is v3 if demand and hardware exist.

**Consequences:**

- One ARM repository, one toolchain, one ISO family.
- Raspberry Pi 3/2 in ARMv7 are not supported by v1.
- Lower coverage of old SBCs.

## ADR-003: UEFI only in v1

**Context:** ARM has no BIOS. SBCs use U-Boot or firmware; servers and QEMU use UEFI. An archiso ISO only makes sense on UEFI.

**Decision:** v1 ISO is UEFI only (`uefi.grub` or `uefi.systemd-boot`).

**Consequences:**

- Remove `syslinux` and the BIOS path from ARM.
- Raspberry Pi and SBCs are separate image flows.
- The ARM e2e harness has only a `uefi` mode.

## ADR-004: GRUB `arm64-efi` by default

**Context:** X uses GRUB on x86. ALARM provides `grub 2:2.16-1` with `arm64-efi`. systemd-boot `AA64` also exists but is less common on ARM servers and board firmware.

**Decision:** GRUB `arm64-efi` by default; systemd-boot `AA64` as an option.

**Consequences:**

- Parity with the x86 installer and existing `grub.cfg`/`custom.cfg` logic.
- systemd-boot requires testing `BOOTAA64.EFI` and `loader/entries`.
- Firmware that ignores NVRAM entries can still use the `--removable` fallback.

## ADR-005: native ARM builds

**Context:** `mkarchiso` needs `chroot`, `mount`, `mknod`, `grub-mkstandalone` and `pacstrap`. Cross-builds need binfmt and are slow.

**Decision:** support native aarch64 builds on a host, VM or ARM runner. Cross-builds are experimental.

**Consequences:**

- CI needs an ARM runner or self-hosted Arch Linux ARM machine.
- Fewer qemu-user dependencies.
- Simpler reproducibility.

## ADR-006: shared signing key

**Context:** `[x]` publishes `repo/x86_64` and `x/x86_64`.

**Decision:** `public/repo/{x86_64,aarch64}` and `public/x/{x86_64,aarch64}`, same signing key.

**Consequences:**

- `$arch` resolves in pacman and xpm.
- `trustedkeys.gpg` and `signing.pub` are duplicated with the same key.
- `build-packages.sh` and CI must be architecture-aware.
- No client keyring change for ARM.

## ADR-007: kernel compatibility symlinks in v1

**Context:** ALARM `linux-aarch64` uses `/boot/Image` and `initramfs-linux.img`; X expects `/boot/vmlinuz-<pkgbase>` and `initramfs-<pkgbase>.img`.

**Decision:** in v1, create `vmlinuz-<pkgbase>` and `initramfs-<pkgbase>.img` symlinks. In v2, use a native kernel map.

**Consequences:**

- Minimal changes to `xgen`, `x kernel` and boot entries.
- Two names for the same file; document it.
- `x kernel remove` must clean both names.
- Raspberry Pi would also link `kernel8.img`.

## ADR-008: Raspberry Pi and SBCs out of v1

**Context:** Raspberry Pi and SBCs do not boot an ISO. They need `.img` files, firmware/U-Boot and DTBs.

**Decision:** v1 is UEFI; Raspberry Pi is v2; SBCs and armv7h are v3; Asahi is not supported.

**Consequences:**

- Smaller hardware surface in v1.
- Validation on QEMU `virt` and ARM servers.
- Raspberry Pi users get a separate image, not the ISO.

## ADR-009: WSL ARM out of v1

**Context:** WSL2 on Windows ARM64 needs an aarch64 rootfs; the WSL project is independent of the ISO.

**Decision:** not in v1; evaluate later with `pacman.aarch64.conf`.

**Consequences:**

- The main port stays focused.
- A WSL ARM rootfs can reuse the package configuration.

## ADR-010: no Secure Boot in v1

**Context:** archiso does not sign; ARM UEFI Secure Boot is not universal; shim or custom keys require work and hardware.

**Decision:** no Secure Boot in v1; document it.

**Consequences:**

- The ISO does not boot with Secure Boot enabled unless keys are enrolled.
- Can be added later with `sbctl` or a shim.

## Phases

### Phase 0: decisions and preparation (1-2 days)

Tasks:

- [ ] Approve v1 scope (aarch64 + UEFI).
- [ ] Choose default bootloader (GRUB recommended).
- [ ] Choose build strategy (native ARM recommended).
- [ ] Choose release metadata schema.
- [ ] Reserve ARM hardware or a VM.
- [ ] Create issues/PRs per phase.

Acceptance:

- Decision record approved.
- Target hardware matrix defined.
- An aarch64 test environment is available (`uname -m` = aarch64).

### Phase 1: architecture-aware profile (2-3 days)

Tasks:

- [ ] `profiledef.sh`: `arch` and `packages_file` from `X_ARCH`/`uname -m`.
- [ ] `profiledef.sh`: boot modes per architecture.
- [ ] `profiledef.sh`: `-Xbcj` per architecture.
- [ ] `xbuild.sh` and `x.sh`: `work/$ARCH`.
- [ ] `pacman.aarch64.conf`.
- [ ] ALARM mirrorlist for ARM.
- [ ] `packages.aarch64`.
- [ ] `bootstrap_packages.aarch64`.
- [ ] `airootfs/root/x-installer/packages.aarch64`.
- [ ] Remove `microcode` from ARM mkinitcpio hooks.
- [ ] Exclude `syslinux/` from the ARM profile.
- [ ] Adjust `grub.cfg`/`loopback.cfg` for `%ARCH%` and `Image`.
- [ ] Remove x86-only live packages.

Acceptance:

- `X_ARCH=aarch64 bash -n x/profiledef.sh`.
- `mkarchiso` reaches `pacstrap` without x86-only target errors.
- ISO contains `EFI/BOOT/BOOTAA64.EFI` and `arch/aarch64/airootfs.sfs`.
- `xorriso -report_el_torito` shows an AA64 EFI entry.

### Phase 2: packages and `[x]/aarch64` (3-5 days)

Tasks:

- [ ] Fix `packages.aarch64`.
- [ ] Make `x-repo/build-packages.sh` architecture-aware.
- [ ] Create `public/repo/aarch64` and `public/x/aarch64`.
- [ ] Build `x-release`, `x-dev`, `x-scripts`.
- [ ] Build `xpm`, `xpkg`, `xtop` for aarch64.
- [ ] Resolve `xfetch` and `opencode` ARM binaries.
- [ ] Sign the databases.
- [ ] Update repository docs.
- [ ] Update CI to verify both architectures.

Acceptance:

- `public/repo/aarch64/x.db` and `.sig` verify.
- `public/x/aarch64/x.db.tar.gz` and `history.json` exist with `arch=aarch64`.
- A clean ALARM system installs `x-release` and `x-scripts` from `[x]/aarch64`.
- `xpm sync` works against `x/aarch64`.

### Phase 3: installer (4-7 days)

Tasks:

- [ ] Architecture detection.
- [ ] Kernel default and validation.
- [ ] `archlinuxarm` keyring.
- [ ] `[x]` with `$arch`.
- [ ] GRUB `arm64-efi`.
- [ ] systemd-boot `AA64` names.
- [ ] `efibootmgr` paths.
- [ ] Kernel symlinks or native map.
- [ ] Remove `microcode` from mkinitcpio.
- [ ] Adjust `EXTRA`.
- [ ] Test UEFI install in QEMU `virt`.
- [ ] Test an existing ESP/dualboot case.

Acceptance:

- Full install to `/dev/vda` in QEMU `virt`.
- Target boots with GRUB or systemd-boot.
- `uname -m` = aarch64; `uname -r` is an ALARM kernel.
- `efibootmgr` shows an X entry.
- `x setup` and `x setup --user` complete.

### Phase 4: generations and kernels (3-5 days)

Tasks:

- [ ] ARM kernels in `xkernel_known`.
- [ ] `pkgbase` fallback via `pacman -Qoq`.
- [ ] `xkernel_image_name` and `xkernel_initramfs_name`.
- [ ] `xgen_capture_kernel` for `Image`/`kernel8.img`.
- [ ] `xgen_pick_pair` map.
- [ ] `kernels.tsv` with ARM names.
- [ ] Boot entries for `Image`.
- [ ] `x kernel list/install/remove`.
- [ ] ARM fixtures in `scripts/test/`.

Acceptance:

- `x gen new` creates `0001` and archives the ARM kernel.
- `x gen status/list/default` correct.
- `x gen rollback 0001` boots after reboot.
- `x kernel list` shows the ARM kernel and `remove` respects guards.
- Existing script tests pass on aarch64.

### Phase 5: ISO and e2e (4-6 days)

Tasks:

- [ ] Install archiso from source on aarch64.
- [ ] Build the ISO natively.
- [ ] Add `console=ttyAMA0` for ARM autoinstall.
- [ ] Adapt `e2e-autoinstall.py`.
- [ ] Increase TCG timeouts.
- [ ] Test `core` and `full`.
- [ ] Test LUKS (optional).
- [ ] Test GRUB and systemd-boot.
- [ ] Document results.

Acceptance:

- `e2e-autoinstall.py --arch aarch64 --mode uefi` passes.
- Install, reboot, generation `0001`, verify.
- `x gen rollback` passes.
- Serial log shows aarch64 and the ALARM kernel.

### Phase 6: docs and releases (1-2 days)

Tasks:

- [ ] Multi-architecture `releases.json`.
- [ ] Architecture selector on the download page.
- [ ] `$arch` in the landing page snippet.
- [ ] English ARM reference pages under `references/` in the skill pack.
- [ ] `README.md` ARM section.
- [ ] ARM host requirements in `ops/docs/requirements.md`.
- [ ] `publish-iso.sh --arch`.

Acceptance:

- The website shows both architectures without breaking x86_64.
- English docs are linked from the X index.
- `releases.json` validates.

### Phase 7: optional platforms

Raspberry Pi (v2):

- [ ] Separate `x-rpi-image.sh`.
- [ ] `packages.rpi`.
- [ ] `config.txt`/`cmdline.txt` with `PARTUUID`.
- [ ] Test on real Raspberry Pi 4/5.
- [ ] Generations with U-Boot or kernel file rewriting.

armv7h (v3):

- [ ] `xpm` `arm` to `armv7h`.
- [ ] `packages.armv7h`.
- [ ] armv7h toolchain.
- [ ] U-Boot/extlinux.
- [ ] Hardware tests.

SBCs (v3):

- [ ] Board/DTB detection.
- [ ] Per-board U-Boot.
- [ ] `.img` per family.

## Dependency order

```text
Phase 0 (decisions)
  -> Phase 1 (profile)
      -> Phase 2 (packages/repo)
          -> Phase 3 (installer)
              -> Phase 4 (generations)
                  -> Phase 5 (ISO/e2e)
                      -> Phase 6 (docs/releases)
                          -> Phase 7 (RPi/armv7h/SBC)
```

Do not skip Phase 2 to Phase 3: the installer cannot work without ARM packages and a repository.

## Effort estimate

| Phase | Estimate |
|---|---:|
| 0. Decisions | 1-2 days |
| 1. Profile | 2-3 days |
| 2. Packages/repo | 3-5 days |
| 3. Installer | 4-7 days |
| 4. Generations | 3-5 days |
| 5. ISO/e2e | 4-6 days |
| 6. Docs/releases | 1-2 days |
| 7. Raspberry Pi / armv7h | 5-10 days each |

Realistic v1 (aarch64/UEFI): 3-5 weeks for one person with ARM hardware or a VM, excluding board-specific support.

## Risk register

| ID | Risk | Probability | Impact | Mitigation |
|---|---|---|---|---|
| R1 | `archiso` is not in ALARM and the build is blocked | High | High | Install from source or package locally |
| R2 | `linux-aarch64` has no `pkgbase` and `x kernel` fails | High | High | `pacman -Qoq` fallback and symlinks |
| R3 | `Image`/`kernel8.img` do not match `vmlinuz-*` | High | High | Kernel map (ADR-007) |
| R4 | `xpm` looks for `x/arm` on armv7h | Medium | Medium | Normalise `arm` to `armv7h` |
| R5 | `reflector`/`edk2-shell`/`syslinux` are absent | High | Medium | Remove from the ARM manifest |
| R6 | `xfetch`/`opencode` have no ARM binary | Medium | Medium | Compile or exclude |
| R7 | Cross-build with binfmt is slow or unstable | High | Medium | Native builds (ADR-005) |
| R8 | x86_64 CI cannot validate ARM | High | High | ARM runner or self-hosted |
| R9 | `releases.json`/web assume x86_64 | High | Low | Multi-architecture schema |
| R10 | `publish-iso.sh` deletes the other architecture's ISO | Medium | High | Review cleanup logic |
| R11 | A separate signing key breaks clients | Low | High | Shared key (ADR-006) |
| R12 | `DatabaseRequired` fails on ALARM | Medium | Medium | `Required DatabaseOptional` |
| R13 | `any` packages contain x86 binaries | Low | Medium | Audit `x-scripts`/`x-dev` |
| R14 | Multi-kernel ARM collides on `initramfs-linux.img` | Medium | Medium | One kernel in v1; custom presets in v2 |
| R15 | Raspberry Pi firmware does not support generations | High | Medium | U-Boot or kernel file rewriting (v2) |
| R16 | ARM GPU does not accelerate Hyprland | Medium | Medium | `core` profile in v1; `full` only on tested hardware |
| R17 | Asahi breaks Mac boot | Low | Very high | Do not support |
| R18 | Upstream `opencode`/`xfetch` changes | Medium | Low | Pin versions and checksums |
| R19 | x86 `devtools` lacks ARM patches | Medium | Medium | Use `devtools-alarm` |
| R20 | Documentation drifts | High | Low | Link checks and release review |
| R21 | `x-keyring.service` does not populate ALARM | Medium | High | Explicit `pacman-key --populate archlinuxarm` |
| R22 | `efibootmgr` fails on some firmware | Medium | Medium | `--removable` and `BOOTAA64.EFI` |
| R23 | ISO too large | Medium | Low | Firmware splits and `core` profile |
| R24 | No ARM hardware for validation | High | High | QEMU `virt` plus one server or board |

## Open questions

1. Is full profile parity (`core` and `full`) required in v1, or only `core`?
2. Should the installer offer `linux-aarch64` and `linux-rpi` in the same menu, or select by platform?
3. Is the ARM release a separate ISO or a multi-architecture installer?
4. Should x86_64 keep `bios.syslinux` or move to UEFI-only over time?
5. Is the ISO signed with the same key and hosted on SourceForge, or on a different CDN?
6. Is the first ARM release "experimental" without board support?
7. Is armv7h needed for backward compatibility or declared end-of-life?
8. Are `opencode`/`xfetch` built from source or taken from upstream binaries?
9. Is systemd-boot the default on servers and GRUB on boards?
10. How will real hardware be tested without buying boards (cloud ARM, QEMU, borrowed hardware)?

## Definition of done for v1

- [ ] Signed `x-<version>-aarch64.iso` published.
- [ ] UEFI install reproducible on QEMU `virt`.
- [ ] UEFI install reproducible on at least one real ARM system.
- [ ] `[x]/aarch64` signed and consumable.
- [ ] `xpm` works with `x/aarch64`.
- [ ] `x gen` and `x kernel` work on ARM.
- [ ] ARM CI green.
- [ ] English documentation published with the x86_64 docs.
- [ ] Multi-architecture `releases.json`.
- [ ] Limitations documented (RPi, SBC, Asahi, Secure Boot).

## Success metrics

| Metric | Target |
|---|---|
| Native ARM ISO build | under 45 minutes on 8 cores |
| Native UEFI e2e | under 20 minutes |
| Package availability | at least 95% of the manifest |
| Test coverage | same `scripts/` tests as x86_64 |
| Install time | under 15 minutes in QEMU KVM |
| ISO size | at most 2.5 GiB |
| Boot failures in 10 attempts | 0 |

## Stop conditions

Pause and reconsider if:

- archiso cannot run on aarch64 after two days of attempts.
- `pacstrap` cannot resolve at least 90% of the manifest with ALARM.
- The ISO does not boot in QEMU `virt` after one week.
- `grub-install --target=arm64-efi` fails on the target hardware.
- No ARM host, VM or runner is available.
- Maintaining two architectures costs more than the expected value.

## References

- [ARM references](arm-references.md) for the full bibliography and verification commands.
- [Implementation plan](arm-implementation.md) for the PR sequence.
- [Test plan](arm-test-plan.md) for the release gates.
- ALARM: https://archlinuxarm.org/about, https://archlinuxarm.org/about/package-signing.
- archiso: https://github.com/archlinux/archiso.
- QEMU ARM virt: https://www.qemu.org/docs/master/system/arm/virt.html.
