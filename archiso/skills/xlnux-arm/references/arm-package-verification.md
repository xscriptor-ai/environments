# Package verification for aarch64

Purpose: verify that every package in the ARM plan is available, buildable, correctly labelled and installable before the first ISO is built.

The [package matrix](arm-packages.md) answers "does the name exist in ALARM?". This page answers "can we actually ship it?".

## Verification levels

| Level | Meaning |
|---|---|
| V0 | Name exists in the ALARM database |
| V1 | Package downloads from the mirror |
| V2 | Package signature verifies with the ALARM keyring |
| V3 | Package installs in a clean aarch64 rootfs |
| V4 | Package builds from source on aarch64 |
| V5 | Package is exercised by a smoke test |

Release gate: every required package must reach V3; X-owned packages must reach V5.

## Refresh the ALARM data

```bash
rm -rf /tmp/alarmdb && mkdir -p /tmp/alarmdb && cd /tmp/alarmdb
for r in core extra alarm aur; do
  curl -fsSL "http://mirror.archlinuxarm.org/aarch64/$r/$r.db.tar.gz" -o "$r.db.tar.gz"
  mkdir -p "$r" && tar -xzf "$r.db.tar.gz" -C "$r"
done
date -u
```

Record the `Last-Modified` of each database:

```bash
for r in core extra alarm aur; do
  printf '%s ' "$r"
  curl -sIL "http://mirror.archlinuxarm.org/aarch64/$r/$r.db.tar.gz" \
    | grep -i last-modified | tail -1
done
```

## Manifest verification

```bash
python3 - <<'PY'
import re
from pathlib import Path

manifest = Path('x/packages.aarch64').read_text().split()
have = {}
for repo in ('core', 'extra', 'alarm', 'aur'):
    for desc in Path(repo).glob('*/desc'):
        text = desc.read_text()
        name = re.search(r'%NAME%\n(.+)', text)
        arch = re.search(r'%ARCH%\n(.+)', text)
        if name:
            have[name.group(1)] = (repo, arch.group(1) if arch else '?')

missing = [p for p in manifest if p not in have]
print(f'{len(manifest)} total, {len(manifest) - len(missing)} present, {len(missing)} missing')
for p in missing:
    print(p)
PY
```

Expected: 135 total, 15 missing before counting the four X packages that must be published in `[x]/aarch64`, or 11 missing if the X packages are counted separately. Recompute against the current manifest.

## Download and signature verification

```bash
# Pick a package
d=/tmp/alarmdb/core/linux-aarch64-7.2.11-1
f=$(awk '/^%FILENAME%/{getline;print;exit}' "$d/desc")
curl -fsSL "http://mirror.archlinuxarm.org/aarch64/core/$f" -o "/tmp/$f"
tar -tf "/tmp/$f" | head
curl -fsSL "http://mirror.archlinuxarm.org/aarch64/core/$f.sig" -o "/tmp/$f.sig"
gpg --verify "/tmp/$f.sig" "/tmp/$f"
```

If `gpg` cannot verify, populate the ALARM keyring first:

```bash
gpg --import /usr/share/pacman/keyrings/archlinuxarm.gpg
```

## Install verification in a clean rootfs

On an aarch64 host:

```bash
mkdir -p /tmp/armroot
pacstrap -C /tmp/pacman.aarch64.conf /tmp/armroot \
  base linux-aarch64 grub efibootmgr archlinuxarm-keyring
arch-chroot /tmp/armroot uname -m
```

Expected: `aarch64`.

Check the kernel layout:

```bash
ls /tmp/armroot/boot
ls /tmp/armroot/usr/lib/modules
```

## ELF architecture check

For every binary in an X package:

```bash
bsdtar -xf package.pkg.tar.zst -C /tmp/pkg
find /tmp/pkg -type f -perm -u+x -exec file {} + | grep -v 'ARM aarch64'
```

Expected: only `ARM aarch64` executables and scripts. Any `x86-64` output is a defect.

For packages marked `any`:

```bash
bsdtar -tf package.pkg.tar.zst | grep -E '/(bin|sbin|lib|lib64)/'
```

Audit suspicious files.

## X-owned packages

### `x-scripts`

- `arch=('any')`.
- Pure Bash.
- Build on x86_64 and reuse on aarch64.
- Test: install in aarch64 rootfs, run `x --version`, `x setup --help`.

### `x-release`

- `arch=('any')`.
- Branding and hooks.
- Rebuild on aarch64; verify `x-release-apply`.
- Test: `/usr/lib/os-release` after install.

### `x-dev`

- `arch=('any')`.
- Contains shell helpers and downloads.
- Audit `nvidia.sh`, `qemu.sh`, `xfetch`, `xtop`.
- Test: install, run `x-dev-env` in a dry environment.

### `xpm`

- Rust.
- Build on aarch64:
  ```bash
  cargo build --release --manifest-path xpm/Cargo.toml
  file target/release/xpm
  ```
- Expected: `ARM aarch64`.

### `xpkg`

- Rust.
- Build on aarch64:
  ```bash
  cargo build --release --manifest-path xpkg/Cargo.toml
  file target/release/xpkg
  ```
- Expected: `ARM aarch64`.

### `xfetch`

- Upstream prebuilt.
- Check releases for an aarch64 asset:
  ```bash
  curl -fsSL https://api.github.com/repos/xfetch-cli/xfetch/releases/latest \
    | grep browser_download_url
  ```
- If missing, build from source or exclude from the ARM manifest.

### `xtop`

- Rust.
- Build on aarch64 with Cargo.
- Verify the binary and runtime.

### `opencode-bin`

- Upstream prebuilt.
- Check for a `linux-arm64` asset.
- If missing, exclude from the ARM release or build from source.

## Repository verification

```bash
cd x-repo
export X_ARCH=aarch64
./build-packages.sh
repo-query --dbpath public/repo/aarch64 -l
gpg --verify public/repo/aarch64/x.db.sig public/repo/aarch64/x.db
for p in public/repo/aarch64/*.pkg.tar.zst; do
  gpg --verify "$p.sig" "$p"
done
```

Check `history.json`:

```bash
python3 -m json.tool public/x/aarch64/history.json | head -40
```

Expected: `"arch": "aarch64"`.

## Record template

```yaml
package: linux-aarch64
version: 7.2.11-1
repo: core
arch: aarch64
database_snapshot: 2026-10-22
signature: verified
install_test: pass
elf_machine: aarch64
smoke_test: pass
notes: "No pkgbase file; preset uses initramfs-linux.img"
```

Store the records in the release evidence bundle.

## Acceptance

- [ ] Manifest names verified against a dated ALARM snapshot.
- [ ] Required packages reach V3.
- [ ] X-owned packages reach V5.
- [ ] No x86_64 ELF in an `any` package intended for ARM.
- [ ] Repository and package signatures verify.
- [ ] `history.json` arch is correct.
- [ ] All exceptions documented with a reason.

## References

- [Package matrix](arm-packages.md)
- [Tooling and repository](arm-tooling.md)
- [Release runbook](arm-runbook-release.md)
- https://archlinuxarm.org/packages
- https://archlinuxarm.org/about/package-signing
- `arm-references.md` for sources
