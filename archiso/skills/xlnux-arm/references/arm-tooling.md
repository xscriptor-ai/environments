# ARM tooling: xpkg, xpm and x-repo

Goal: build, sign and serve aarch64 packages without breaking the x86_64 repository.

Repositories involved:

- `xpkg`: Rust package builder (XBUILD/PKGBUILD to `.xp`).
- `xpm`: Rust package manager (ALPM format and native `.xp`).
- `x-repo`: pacman `[x]` repository, `.xp` endpoint and web portal.
- `scripts/packaging`: `x-scripts` artifact (`any`).

## xpkg

### What already works

`xpkg/crates/xpkg-core/src/recipe/validate.rs:37` accepts:

```rust
let valid_arches = ["x86_64", "aarch64", "i686", "armv7h", "any"];
```

`XBUILD` supports:

```toml
arch = ["x86_64", "aarch64"]
```

The PKGBUILD parser extracts `arch=()`. The builder downloads sources, verifies checksums, runs `prepare`, `build`, `check` and `package`, and creates a `.xp` archive (tar.zst) with `.PKGINFO`, `.BUILDINFO` and `.MTREE`.

### What is missing

- No `--target` or `--arch` option. The build uses the host architecture.
- `CARCH` and `CHOST` come from the environment; there is no built-in matrix.
- The `arch` validation is metadata-only; it does not verify the host.

### Building for aarch64

Native (recommended):

```bash
# On an ALARM aarch64 host
uname -m                     # aarch64
export CARCH=aarch64
export CHOST=aarch64-unknown-linux-gnu
xpkg build -f XBUILD -o out/
xpkg lint out/pkg-1.0-1-aarch64.xp
xpkg sign out/pkg-1.0-1-aarch64.xp --key <fpr>
```

ALARM chroot with binfmt:

```bash
sudo pacman -S qemu-user-static qemu-user-static-binfmt
# /srv/alarm-aarch64 is an ALARM rootfs
sudo systemd-nspawn -D /srv/alarm-aarch64 --arch=aarch64 \
  /bin/bash -lc 'cd /work && CARCH=aarch64 xpkg build -f XBUILD'
```

Multi-architecture container:

```bash
docker run --rm --platform linux/arm64 -v "$PWD:/work" -w /work \
  ghcr.io/equislinux/xpkg-builder:latest xpkg build -f XBUILD
```

The image must be based on ALARM aarch64. The host needs `qemu-user-static` or buildx with binfmt.

### CARCH values

| Target | CARCH | CHOST |
|---|---|---|
| x86_64 | `x86_64` | `x86_64-unknown-linux-gnu` |
| aarch64 | `aarch64` | `aarch64-unknown-linux-gnu` |
| armv7h | `armv7h` | Check ALARM `makepkg.conf` for the exact triplet |

Do not reuse an x86_64 `makepkg.conf` for ARM.

### X recipes

| Recipe | Current arch | ARM plan |
|---|---|---|
| `x-release` | `any` | Rebuild; one artifact for both architectures |
| `x-dev` | `any` | Rebuild; audit helpers |
| `x-scripts` | `any` | Reuse the x86_64 artifact |
| `xpm` | Rust, source | Build on aarch64 |
| `xpkg` | Rust, source | Build on aarch64 |
| `xfetch` | prebuilt x86_64 | Publish an aarch64 asset or compile |
| `xtop` | Rust, source | Build on aarch64 |
| `opencode-bin` | prebuilt x86_64 | Find `linux-arm64` or exclude |

## xpm

### Architecture resolution

`xpm/src/main.rs:119-128`:

```rust
let arch = config
    .options
    .architecture
    .clone()
    .unwrap_or_else(|| std::env::consts::ARCH.to_string());
```

Rust values:

| Host | `std::env::consts::ARCH` |
|---|---|
| x86_64 | `x86_64` |
| aarch64 | `aarch64` |
| armv7h | `arm` |

The `arm` value is a bug for repositories published under `x/armv7h`. Normalise:

```rust
fn pacman_arch() -> String {
    match std::env::consts::ARCH {
        "arm" => "armv7h".to_string(),
        other => other.to_string(),
    }
}
```

Allow an explicit override:

```toml
[options]
architecture = "armv7h"   # or "aarch64"
```

### Default repository

`XpmConfig::default()` already uses:

```rust
server: vec!["https://equislinux.github.io/x-repo/x/$arch".into()]
```

This works for aarch64 when `x/aarch64` exists. For armv7h, fix the `arm` mapping first.

### ALARM repositories in xpm

`xpm` can read ALARM repositories if needed:

```bash
xpm repo add alarm-core http://mirror.archlinuxarm.org/$arch/core
xpm repo add alarm-extra http://mirror.archlinuxarm.org/$arch/extra
xpm repo add alarm-alarm http://mirror.archlinuxarm.org/$arch/alarm
```

`xpm` does not replace `pacman` for the base system. Its main use is `[x]` and `.xp`.

### Download targets

Review `xpm/docs/FETCH_TARGETS.md`. Add `aarch64-unknown-linux-gnu` and `aarch64-unknown-linux-musl` only after checking real `xfetch` release assets. Do not promise targets that upstream does not publish.

## x-repo

### Current layout

```text
public/
|-- repo/x86_64/     # pacman [x]
`-- x/x86_64/        # .xp endpoint for xpm
```

Hardcoded:

```bash
# x-repo/build-packages.sh:30-31
REPO_DIR="public/repo/x86_64"
XPM_DIR="public/x/x86_64"
```

### Proposed layout

```text
public/
|-- repo/
|   |-- x86_64/
|   `-- aarch64/
|-- x/
|   |-- x86_64/
|   `-- aarch64/
`-- ...
```

Benefits:

- `$arch` in pacman and xpm resolves automatically.
- One architecture can be published without touching the other.
- Separate databases and `SHA256SUMS` per architecture.
- The Next.js portal can serve both under the same domain.

### Architecture-aware build script

```bash
ARCH="${X_ARCH:-$(uname -m)}"
case "$ARCH" in
  x86_64|aarch64|armv7h) ;;
  *) echo "build-packages: unsupported arch '$ARCH'" >&2; exit 1 ;;
esac

REPO_DIR="public/repo/$ARCH"
XPM_DIR="public/x/$ARCH"
mkdir -p "$REPO_DIR" "$XPM_DIR"
```

Build packages:

```bash
if [[ "$BUILD" == "1" ]]; then
    echo "== Building packages locally for $ARCH =="
    build_pkgbuild x-release
    build_pkgbuild x-dev
    if [[ "$ARCH" == "x86_64" ]]; then
        build_pkgbuild opencode-bin
        build_pkgbuild xfetch
    fi
    build_pkgbuild xtop
else
    echo "== Skipping local builds (--index-only) =="
fi
```

Copy artifacts:

```bash
for dir in x-release x-dev xtop; do
    for pkg in packages/$dir/*.pkg.tar.zst; do
        [ -f "$pkg" ] || continue
        cp "$pkg" "$REPO_DIR/"
        rm -f "$pkg"
    done
done

if [[ "$ARCH" == "x86_64" ]]; then
    for dir in opencode-bin xfetch; do
        for pkg in packages/$dir/*.pkg.tar.zst; do
            [ -f "$pkg" ] || continue
            cp "$pkg" "$REPO_DIR/"
            rm -f "$pkg"
        done
    done
fi
```

`x-scripts` is `any`. Import it into both architectures:

```bash
for pkg in ../scripts/packaging/x-scripts-*.pkg.tar.zst; do
    [ -f "$pkg" ] || continue
    cp -f "$pkg" "$REPO_DIR/"
    rm -f "$pkg"
done
```

### Signing

- Use the same project key for both architectures. The fingerprint stays stable.
- Run `repo-add -s -k "$X_REPO_SIGN_KEY"` in each directory.
- Copy `trustedkeys.gpg` and `signing.pub` into each directory.
- If a separate key per architecture is ever used, document the keyring distribution and rotation. Not recommended for v1.

### CI

Current check:

```yaml
# x-repo/.github/workflows/build.yml:37-38
test -f public/repo/x86_64/x.db && echo "pacman repo db present"
test -f public/repo/x86_64/x-release-*.pkg.tar.zst && echo "x-release package present"
```

Proposed:

```yaml
- name: Verify repository files
  run: |
    for arch in $(echo "${X_REPO_ARCHES:-x86_64 aarch64}" | tr ' ' '\n'); do
      test -f "public/repo/$arch/x.db"
      test -f public/repo/$arch/x-release-*.pkg.tar.zst
      test -f "public/x/$arch/x.db.tar.gz"
    done
```

Add an ARM build job separately; see [Testing and CI](arm-testing.md).

### `history.json` and portals

`x-repo` generates `public/x/<arch>/history.json`. Verify that:

- The `arch` field is `aarch64`.
- The portal can show both architectures.
- Download links do not assume x86_64.
- The `.xp` endpoint and the pacman endpoint stay in sync.

## Release metadata

Current `web/data/releases.json` only has an x86_64 ISO. Proposed schema:

```json
{
  "latest_by_arch": {
    "x86_64": "2026.10.18",
    "aarch64": "2026.11.01"
  },
  "releases": [
    {
      "version": "2026.10.18",
      "arch": "x86_64",
      "name": "x-2026.10.18-x86_64.iso",
      "url": "https://sourceforge.net/projects/equislinux/files/iso/x-2026.10.18-x86_64.iso/download",
      "sig": "https://sourceforge.net/projects/equislinux/files/iso/x-2026.10.18-x86_64.iso.sig/download",
      "sha256": "..."
    },
    {
      "version": "2026.11.01",
      "arch": "aarch64",
      "name": "x-2026.11.01-aarch64.iso",
      "url": "https://sourceforge.net/projects/equislinux/files/iso/x-2026.11.01-aarch64.iso/download",
      "sig": "https://sourceforge.net/projects/equislinux/files/iso/x-2026.11.01-aarch64.iso.sig/download",
      "sha256": "..."
    }
  ]
}
```

Do not break the current `releases[0]` consumer. Either keep `releases[0]` as "latest" or add `latest_by_arch` and update the page.

## Publishing an ISO

`x-repo/scripts/publish-iso.sh` currently resolves the newest `x/out/x-*.iso`, uploads it to SourceForge, removes previous versions, and updates `web/data/releases.json`.

Changes needed:

- Accept `--arch <arch>` and select the matching ISO.
- Do not delete the other architecture's ISO.
- Add `arch` to `releases.json`.
- Keep the same signature key.
- Verify the remote hash.
- Update the stable URL per architecture or make `/download/latest/` a selector.

## Web changes

- `web/components/Install.tsx:39`: replace the hardcoded `x-<version>-x86_64.iso` with an architecture selector.
- `web/components/Landing.tsx:42`: use `$arch` in the repository snippet.
- `web/data/releases.json`: multi-architecture schema.
- `web/content/en/x/`: ARM pages, if the project publishes a web mirror.
- `web/lib/docs.ts`: add the ARM pages to the `x` section file list.

## Source safety

- Keep the signing secret key offline, as today.
- Do not publish the secret key in the repository.
- `trustedkeys.gpg` and `signing.pub` are public material.
- The ARM repository uses the same trust root; no client keyring change is needed.
- ALARM packages are signed by the ALARM build key; the `[x]` key only covers X packages.

## Checklist

- [ ] `x-repo/build-packages.sh` accepts `X_ARCH`.
- [ ] `public/repo/aarch64` and `public/x/aarch64` exist.
- [ ] `x-release`, `x-dev`, `x-scripts` are published for aarch64.
- [ ] `xpm` and `xpkg` aarch64 binaries are published.
- [ ] `xfetch`/`opencode` are resolved or explicitly excluded.
- [ ] `repo-add -s` signs both databases.
- [ ] `SHA256SUMS` and signatures verify.
- [ ] `xpm sync` works against `x/aarch64`.
- [ ] CI checks both architectures.
- [ ] `releases.json` has an `arch` field.
- [ ] The web download page handles both architectures.

## References

- `xpkg/crates/xpkg-core/src/recipe/validate.rs:37`
- `xpm/crates/xpm/src/main.rs:119-128, 346-348, 634-636`
- `x-repo/build-packages.sh:30-31, 167`
- `x-repo/.github/workflows/build.yml:37-38`
- `x-repo/docs/en/repo-layout.md`, `publishing.md`, `signing.md`
- `web/lib/docs.ts`, `web/data/releases.json`
