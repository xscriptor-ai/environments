# Secure Boot, TPM2 and signing (2026)

## Routes

1. **shim + pre-signed loader** — Microsoft-signed shim (`shimx64.efi`) → `grubx64.efi`/`BOOTX64.EFI` you sign. Works on stock firmware; shim review lag; MOK enrollment for your keys (`mokutil --import`).
2. **Own keys (sbctl/efitools)** — take ownership of PK/KEK/db; `sbctl enroll-keys -m` keeps Microsoft certs (safer for dual boot). Enroll via firmware setup or MOK.
3. **PreLoader + HashTool** — no key ownership; hash each binary manually.

Official Arch ISOs: none of these (SB added 2013, removed 2016, absent 2026). `mkarchiso` signs nothing. `run_archiso -s` is a test-only firmware flag.

## sbctl 0.18

```sh
sbctl status
sbctl create-keys                 # /var/lib/sbctl: db/KEK/PK (+TPM key option)
sbctl enroll-keys -m -f           # keep MS/OEM certs; -f accept risk
sbctl verify
sbctl sign -s /boot/EFI/BOOT/BOOTX64.EFI
sbctl sign -s /boot/vmlinuz-linux
sbctl sign -s /usr/lib/systemd/boot/efi/systemd-bootx64.efi
```

- Pacman hook auto-signs kernel/systemd/bootloader updates; mkinitcpio post-hook signs UKIs.
- 0.15 added landlock sandbox + `/var/lib/sbctl` layout; 0.18 added YubiKey key backend.
- Manual equivalent: `sbsign --key db.key --cert db.crt --output out in`; verify `sbverify --cert db.crt in`.

## PCR / TPM2 (2026 landmines)

| PCR | Contents |
|---|---|
| 7 | Secure Boot state + certs |
| 11 | UKI |
| 12 | cmdline/credentials overrides |
| 14 | shim MOK |
| 15 | LUKS volume key (measured by systemd-cryptsetup) |

- **mkinitcpio 42 `systemd-pcrosseparator` changed PCRs 0-7, 9, 12-14** → re-enroll TPM2 LUKS (Arch news 2026-09-22).
- systemd 262 requires signed PCR policies inside the UKI for NvPCRs; mkinitcpio 42.2 UKIs can't satisfy this (ukify only).
- `systemd-cryptenroll`: always `--recovery-key`; `--tpm2-device=auto`; prefer `--tpm2-public-key-policyref=initrd` (signed policy) over raw `--tpm2-pcrs=7`; `--tpm2-pcrs=7+15:sha256=0000…` (empty 15) as a stable alternative; FIDO2/PKCS#11 supported.
- Requires mkinitcpio `systemd` + `sd-encrypt` hooks (order matters) or dracut `tpm2-tss`.
- systemd 262 adds Argon2id-hardened TPM2 PINs and a first-boot enrollment wizard.

## ISO-specific

- Repack plan: swap `EFI/BOOT/BOOTX64.EFI` for shim → your signed loader; keep El Torito/GPT options; re-verify with `xorriso -report_el_torito`.
- Ship your certificate + `mokutil` instructions; document how to disable SB for unsupported firmware.
- Ventoy: own shim/CA; since 1.1.14 (2026-06-24) users must enroll the new CA at first boot (`VTOY_SECURE_BOOT_POLICY`); warn about opaque boot chain (Arch Wiki security note).

## Testing

- Stock Arch `OVMF_CODE.secboot.4m.fd` ships **without keys**; use Fedora's `edk2-ovmf-fedora` (AUR) to test enrollment realistically.
- QEMU: pflash pair + `-machine q35,smm=on`; `run_archiso -s` for a quick check.
- Verify every artifact after upgrades: `sbverify`, `bootctl status` (Secure Boot: enabled), `systemd-cryptenroll --tpm2-device=list`.

## Release signing vs Secure Boot

Distinct concerns:
- **Secure Boot** signs binaries the firmware verifies (loader, kernel, UKI).
- **Release signing** signs artifacts users verify: `gpg --detach-sign` (ISO, checksums), torrents, repo DBs (`repo-add -s`).
- Package signing uses `makepkg` `BUILDENV sign` + `GPGKEY`; Arch is moving package signing infrastructure to **Signstar**.
- Publish fingerprints in docs; use keyring packages for repo keys in airootfs (`<name>.gpg`, `<name>-trusted`).
