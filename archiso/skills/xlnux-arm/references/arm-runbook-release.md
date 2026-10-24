# Runbook: release an aarch64 ISO and repository

Purpose: publish a signed `x-<version>-aarch64.iso` and the matching `[x]/aarch64` repository without breaking x86_64.

This runbook assumes the build from [Build the ISO](arm-runbook-build.md) and the repository layout from [Tooling and repository](arm-tooling.md).

## Release gates

Do not publish until all gates pass:

- [ ] `[x]/aarch64` is built and signed.
- [ ] `xpm sync` works against `x/aarch64`.
- [ ] ISO is built on native aarch64 or a validated cross-build.
- [ ] QEMU `virt` e2e passes.
- [ ] At least one real UEFI ARM system boots.
- [ ] Install, reboot and generation `0001` pass.
- [ ] `x gen rollback` passes.
- [ ] x86_64 build and e2e are still green.
- [ ] ISO includes `BOOTAA64.EFI` and the expected kernel.
- [ ] Documentation is updated under `references/` in the skill pack.
- [ ] Release notes list the limitations.

## Versioning

- ISO name: `x-<YYYY.MM.DD>-aarch64.iso`.
- Use the same date scheme as x86_64.
- If both architectures are released together, use the same date and different `arch` values.
- Keep the previous ISO available until the new one is verified.
- Do not reuse a version for a rebuilt artefact; bump the date or release number.

## Build the repository

On an aarch64 host:

```bash
cd x-repo
export X_ARCH=aarch64
export X_REPO_SIGN_KEY="<fingerprint>"
./build-packages.sh
```

Verify:

```bash
test -f public/repo/aarch64/x.db
test -f public/repo/aarch64/x.db.sig
gpg --verify public/repo/aarch64/x.db.sig public/repo/aarch64/x.db
for p in public/repo/aarch64/*.pkg.tar.zst; do
  gpg --verify "$p.sig" "$p"
done
```

Check the package set:

```bash
repo-query --dbpath public/repo/aarch64 -l
```

Expected X packages:

- `x-release`
- `x-dev`
- `x-scripts`
- `xpm` (if published)
- `xpkg` (if published)
- `xfetch-bin` (if an aarch64 asset exists)
- `xtop-git`
- `opencode-bin` (if an aarch64 asset exists)

Do not publish a package with the wrong architecture label. `xz`/`zstd` archives can be inspected with `bsdtar -xOf pkg .PKGINFO`.

## Build the ISO

```bash
cd x
export X_ARCH=aarch64
export SOURCE_DATE_EPOCH="$(date +%s)"
sudo env X_ARCH=aarch64 SOURCE_DATE_EPOCH="$SOURCE_DATE_EPOCH" ./xbuild.sh
```

Collect:

- ISO.
- SHA-256.
- Signature.
- Build log.
- `profiledef.sh`, `packages.aarch64`, `pacman.aarch64.conf`.
- Package versions and commit hashes.

## Sign the ISO

Use the project key, offline or in the protected workspace keyring:

```bash
gpg --batch --yes --local-user "$X_REPO_SIGN_KEY" --detach-sign \
  out/x-<version>-aarch64.iso
gpg --verify out/x-<version>-aarch64.iso.sig out/x-<version>-aarch64.iso
sha256sum out/x-<version>-aarch64.iso > out/x-<version>-aarch64.iso.sha256
```

Do not upload a private key. Only the detached signature and the public key are published.

## Publish the repository

Commit only the intended files:

```bash
git status
git diff --stat
git add public/repo/aarch64 public/x/aarch64
git add packages/x-release packages/x-dev
git commit -m "release: x repository aarch64 <version>"
```

Do not mix the x86_64 repository in the same commit unless it is part of the same release.

Push only after review and approval. This runbook does not push anything by itself.

## Publish the ISO

Preferred layout on SourceForge:

```text
/home/frs/project/equislinux/iso/x86_64/x-<version>-x86_64.iso
/home/frs/project/equislinux/iso/aarch64/x-<version>-aarch64.iso
```

or flat names if the existing download page requires it:

```text
/home/frs/project/equislinux/iso/x-<version>-aarch64.iso
```

Upload:

```bash
rsync -avP --chmod=644 \
  out/x-<version>-aarch64.iso \
  out/x-<version>-aarch64.iso.sig \
  out/x-<version>-aarch64.iso.sha256 \
  xscriptor@frs.sourceforge.net:/home/frs/project/equislinux/iso/aarch64/
```

If `publish-iso.sh` supports `--arch`, use it and verify the remote hash.

## Update release metadata

`web/data/releases.json` must keep x86_64 working. Add the ARM release:

```json
{
  "version": "<version>",
  "arch": "aarch64",
  "name": "x-<version>-aarch64.iso",
  "url": "https://sourceforge.net/projects/equislinux/files/iso/aarch64/x-<version>-aarch64.iso/download",
  "sig": "https://sourceforge.net/projects/equislinux/files/iso/aarch64/x-<version>-aarch64.iso.sig/download",
  "sha256": "<sha256>"
}
```

Update `latest_by_arch.aarch64`.

Validate:

```bash
python3 -m json.tool web/data/releases.json >/dev/null
```

## Update the website

- Download page: add or verify the architecture selector.
- Landing page: the repository snippet uses `$arch`.
- Documentation: the English X section lists the ARM pages.
- Announcement: link the ISO, the signature and the checksum.
- Limitations: aarch64/UEFI only; RPi/SBC/Asahi/Secure Boot not supported.

## Post-release verification

```bash
# Download from the public URL
curl -fL -o /tmp/x-aarch64.iso "<public-url>"
sha256sum /tmp/x-aarch64.iso

# Verify signature
gpg --verify <public-sig-url> /tmp/x-aarch64.iso

# Boot the downloaded ISO
qemu-system-aarch64 -M virt -cpu max -smp 4 -m 4096 \
  -drive if=pflash,format=raw,readonly=on,file=/usr/share/edk2/aarch64/QEMU_EFI.fd \
  -drive if=pflash,format=raw,file=/tmp/AAVMF_VARS.fd \
  -drive if=none,id=cdrom,media=cdrom,readonly=on,file=/tmp/x-aarch64.iso \
  -device virtio-scsi-pci -device scsi-cd,drive=cdrom \
  -netdev user,id=n0 -device virtio-net-pci,netdev=n0 \
  -nographic
```

Verify the repository from a clean ALARM system:

```bash
sudo pacman -Sy --config /tmp/pacman.aarch64.conf x-release x-scripts
xpm sync
xpm info x-release
```

## Rollback and yank

If the release is broken:

1. Remove the new ISO from the download index.
2. Restore the previous `latest_by_arch.aarch64` entry.
3. Keep the old ISO and signature available.
4. Do not delete the previous repository database until clients can resolve the old state.
5. Publish a short incident note with the reason and the workaround.
6. If the repository is broken, restore the previous `public/repo/aarch64` and `public/x/aarch64` from git history.

Do not rewrite published history unless the key or a package was compromised.

## Key rotation

- Keep the project key offline.
- Cross-sign the new key with the old key.
- Publish both keys in `trustedkeys.gpg`.
- Re-sign the repository and `SHA256SUMS`.
- Keep the old key for at least one release cycle.
- For a compromise, publish the revocation certificate first, then the new key.

## Incident checklist

- [ ] Stop the release.
- [ ] Identify the affected artefact (ISO, package, database).
- [ ] Restore the previous metadata.
- [ ] Verify the previous artefact still boots.
- [ ] Publish the incident note.
- [ ] Rotate keys only if compromise is suspected.
- [ ] Add a regression test or gate.

## References

- [Tooling and repository](arm-tooling.md)
- [Build runbook](arm-runbook-build.md)
- [Debug runbook](arm-runbook-debug.md)
- [Checklists](arm-checklists.md)
- `x-repo/docs/en/signing.md`, `publishing.md`, `iso-releases.md`
- `arm-references.md` for ALARM and SourceForge sources
