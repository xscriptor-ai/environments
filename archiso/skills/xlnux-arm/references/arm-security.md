# ARM security model

Purpose: define the trust chain, key handling, supply-chain checks and runtime assumptions for the ARM port.

The ARM port must not weaken the x86_64 security model. A new architecture adds new trust boundaries: firmware, DTBs, board-specific bootloaders, cross-builds and new binary sources.

## Trust chain

```text
Hardware firmware (UEFI or board firmware)
  -> bootloader (GRUB arm64-efi, systemd-boot AA64, U-Boot)
    -> kernel (Image, EFI stub)
      -> initramfs-linux.img
        -> root filesystem
          -> systemd
            -> X services, x-scripts, user session
```

Every stage must be verifiable or explicitly documented as unverified.

## Threats

| Threat | Example | Impact | Mitigation |
|---|---|---|---|
| Malicious firmware | Tampered board firmware | Full control | Prefer vendor-signed firmware; document trust |
| Tampered ISO | Modified download | Full control | Sign the ISO; publish SHA-256 |
| Tampered repository | Modified package or DB | Package compromise | Sign packages; `repo-add -s`; verify signatures |
| Key theft | X signing key stolen | Malicious updates | Offline key; rotation plan; revocation certificate |
| Mirror compromise | ALARM mirror serves bad package | Package compromise | ALARM package signatures; `SigLevel = Required` |
| Cross-build contamination | x86 host injects binaries | Wrong architecture or malware | Native ARM builds; verify ELF machine |
| `any` package with x86 binary | `x-scripts` or `x-dev` | Broken or malicious | Audit `any` packages; check ELF |
| Malicious package recipe | Build script exfiltration | Build host compromise | Review recipes; sandbox builds |
| Weak live credentials | Default password | Remote access | No default remote login; unique password |
| Unencrypted disk | Stolen device | Data exposure | Offer LUKS; document |
| Secure Boot disabled | Evil maid | Boot tampering | Document; plan Secure Boot |
| Secret in repo | Key or token committed | Full compromise | Secret scanning; offline keys |
| Supply-chain binary | `xfetch`/`opencode` prebuilt | Malware | Pin checksums; prefer source build |

## Key management

### X repository key

- Keep the private key offline or in a protected workspace keyring.
- Publish only `trustedkeys.gpg` and `signing.pub`.
- Sign packages, databases and `SHA256SUMS`.
- Keep a revocation certificate separate from the key.
- Rotate with cross-signing and a transition period.
- Never put the key in the ISO, the repository or a CI secret log.

### ALARM keyring

- `archlinuxarm-keyring` provides the ALARM build key.
- `pacman-key --populate archlinuxarm`.
- Trust the ALARM package signatures; the databases are not signed.
- Do not replace the ALARM keyring with the Arch x86_64 keyring.

### Live keyring

- `pacman-init.service` initializes the keyring on tmpfs.
- `x-keyring.service` adds and locally signs the X key.
- The live keyring is ephemeral; the target gets its own keyring.
- Verify the key fingerprint in logs and documentation.

## Supply chain

### Packages

- Prefer ALARM packages from `core`, `extra`, `alarm` and `aur`.
- Verify signatures with `pacman -U`/`pacman -S` and the ALARM keyring.
- For `[x]`, require signatures in the target.
- Inspect `any` packages for binaries:
  ```bash
  bsdtar -tf package.pkg.tar.zst | grep -E '\.(so|bin)$|/bin/'
  file path/to/binary
  ```
- Reject an `any` package that contains x86_64 ELF files.

### X binaries

- `xfetch-bin`, `xtop-git`, `opencode-bin` are prebuilt or compiled.
- Pin versions and checksums.
- Prefer source builds on ARM.
- Verify the ELF machine:
  ```bash
  file /usr/bin/xfetch
  readelf -h /usr/bin/xfetch | grep Machine
  ```
  Expected: `AArch64`.

### Build host

- Build on a trusted aarch64 host.
- Keep the host patched.
- Use a clean chroot or container for package builds.
- Do not build with root unless required.
- Record the toolchain version.

### Cross-build

- Cross-builds increase risk: binfmt, foreign toolchains, mixed sysroots.
- Use them only for experiments or smoke tests.
- Verify every output binary is AArch64.
- Prefer native ARM CI for releases.

## Secure Boot

v1 does not support Secure Boot.

Implications:

- The ISO does not boot with Secure Boot enabled unless keys are enrolled.
- Users must disable Secure Boot or use a custom enrollment flow.
- ARM UEFI Secure Boot is not universal; some boards do not expose it.
- A future version can use a Microsoft-signed shim or custom keys with `sbctl`.
- Do not claim Secure Boot support until it is tested on real hardware.

## Installer security

- Do not log passwords or LUKS keys.
- Do not write secrets to the ESP or the target root.
- Use `chpasswd` input carefully; avoid shell history.
- Verify the X repository key before `pacstrap`.
- Use `SigLevel = Required` on the target.
- Preserve an existing ESP in dualboot; never format another OS's partition.
- Document the live environment's SSH state. If SSH is enabled, require a unique password and no root login.
- Disable unnecessary live services after installation.

## Runtime hardening

Recommended for installed systems:

- Firewall: `nftables` or `ufw`.
- SSH: key-only, no root login, non-default port if exposed.
- `sudo`: only the `wheel` group.
- Kernel: `kernel.kptr_restrict`, `kernel.dmesg_restrict`, `kernel.yama.ptrace_scope`.
- Mount options: `noatime`, `nodev`, `nosuid`, `noexec` where appropriate.
- Automatic updates: define a policy; do not silently reboot.
- Audit: `auditd` optional.
- Firmware updates: document the vendor mechanism.

Do not bake aggressive hardening into the ISO without testing; it can break the installer.

## ARM-specific security considerations

- Device tree blobs are data, but they influence hardware access. Verify their source.
- U-Boot scripts (`boot.scr`) can execute arbitrary commands; treat them as bootloader code.
- Raspberry Pi `config.txt` can load overlays and firmware; review changes.
- Some SBCs require proprietary blobs; document them and their provenance.
- Cross-builds can silently produce x86 binaries; check ELF machine.
- `any` packages are the easiest place to hide a wrong-architecture binary.
- ARM firmware may ignore NVRAM entries; the removable fallback is a security trade-off, document it.

## Incident response

If a key, repository or ISO is compromised:

1. Stop the release.
2. Revoke the key if needed.
3. Publish a new key and cross-sign it.
4. Re-sign packages and databases.
5. Publish a security notice with affected versions.
6. Provide a recovery path (new ISO, keyring update).
7. Add a regression test or review gate.

## Security checklist

- [ ] X key offline and backed up.
- [ ] Revocation certificate stored separately.
- [ ] ALARM keyring populated.
- [ ] `[x]/aarch64` signed.
- [ ] ISO signed.
- [ ] SHA-256 published.
- [ ] No secrets in git.
- [ ] `any` packages audited for ELF machine.
- [ ] Cross-builds verified as AArch64.
- [ ] Secure Boot state documented.
- [ ] Live SSH state documented.
- [ ] Target `SigLevel = Required`.
- [ ] Incident contact and process documented.

## References

- [Tooling and repository](arm-tooling.md)
- [Release runbook](arm-runbook-release.md)
- [ALARM package signing](https://archlinuxarm.org/about/package-signing)
- [UAPI Boot Loader Specification](https://uapi-group.org/specifications/specs/boot_loader_specification/)
- `arm-references.md` for sources
