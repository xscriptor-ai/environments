# CI pipelines for Arch ISOs (2026)

## Containers

- `archlinux:base-devel` / `base` / `multilib-devel`; `latest` == `base`; dated tags `base-YYYYMMDD.0.JOBID` daily; library official image updated weekly (Sunday 00:00 UTC); `repro` variant for reproducibility (keys stripped → `pacman-key --init && pacman-key --populate archlinux`).
- Always `pacman -Syu` right after `FROM` (rolling release).
- ISO builds: rootless via user namespaces since archiso v89 (needs kernel `unshare` support; `--security-opt seccomp=unconfined` or `--privileged` if blocked). `ext4+squashfs` and disk images (arch-boxes) need `--privileged` + loop devices.
- Cache: bind `/var/cache/pacman/pkg`; non-root builds download to `/tmp` unless ACLs set (`setfacl -m "u:$USER:rwX" /var/cache/pacman/pkg`).

## GitHub Actions skeleton

```yaml
name: iso
on: [push, pull_request, workflow_dispatch]
jobs:
  build:
    runs-on: ubuntu-24.04
    container:
      image: archlinux:base-devel
    strategy:
      fail-fast: false
      matrix:
        profile: [midistro, minimal]
        mode: [iso]
    steps:
      - uses: actions/checkout@v4
      - run: pacman -Syu --needed --noconfirm archiso shellcheck qemu-base edk2-ovmf
      - run: shellcheck scripts/*.sh profiles/**/customize*.sh || true
      - uses: actions/cache@v4
        with:
          path: /var/cache/pacman/pkg
          key: pacman-${{ hashFiles('profiles/**', 'repo/**') }}
      - run: mkarchiso -v -r -w /tmp/w -o out -m "${{ matrix.mode }}" "profiles/${{ matrix.profile }}"
      - run: |
          cd out
          sha256sum * > sha256sums.txt
          b2sum * > b2sums.txt
      - run: bash ci/static-validate.sh out
      - uses: actions/upload-artifact@v7
        with: { name: "${{ matrix.profile }}-${{ matrix.mode }}", path: out/, retention-days: 7 }
      - uses: softprops/action-gh-release@v3
        if: startsWith(github.ref, 'refs/tags/v')
        with: { files: "out/*", generate_release_notes: true }
```

Boot smoke test as a separate job on a KVM-capable runner (self-hosted or GitHub larger runner); hosted runners have no guaranteed KVM (TCG fallback is 10-20x slower).

## GitLab CI (what Arch itself uses)

- Stages `check` (shellcheck) + `build`; matrix `{releng,baseline} × {bootstrap, iso+netboot}`; `tags: vm` self-hosted runners; `interruptible`.
- Release builds run inside a VM with `ci-scripts/scripts/build_in_archiso_vm.sh` (`QEMU_BUILD_TIMEOUT=2400`, `QEMU_COPY_ARTIFACTS_TIMEOUT=120`, `QEMU_VM_MEMORY=3072`, `ARCHISO_COW_SPACE_SIZE=2g`).
- Artifacts: `output/metrics.txt` (ISO size, package count, EFI image size, initramfs sizes).

## Alternatives

- Forgejo Actions: GitHub-compatible syntax (`.forgejo/workflows/`, `container.image`, matrix, OIDC).
- SourceHut builds: full VM per job, SSH into failed builds.
- No official `archlinux/setup-arch` action; `container:` is the idiomatic path.
- `uraimo/run-on-arch-action` targets Arch Linux **ARM**, not x86_64.

## Waste-reduction tips

1. Cache pacman aggressively; pin dated container tags for reproducibility.
2. Build only changed profiles with path filters.
3. Keep a metrics baseline and fail on unexpected size/package drift.
4. Separate "build" (fast, every PR) from "boot test" (slower, nightly/tags).
5. Don't upload multi-GB ISOs as artifacts on GitHub — release assets or object storage.
