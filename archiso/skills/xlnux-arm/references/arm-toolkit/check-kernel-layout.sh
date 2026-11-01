#!/usr/bin/env bash
# Inspect the boot layout of an ALARM kernel package.
# Usage: ./check-kernel-layout.sh linux-aarch64-*.pkg.tar.xz
set -euo pipefail

PKG="${1:?usage: $0 <kernel-package>}"
[[ -f "$PKG" ]] || { echo "missing: $PKG" >&2; exit 1; }

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
bsdtar -xf "$PKG" -C "$TMP"

echo "== boot files =="
find "$TMP/boot" -maxdepth 2 -mindepth 1 -printf '  %P\n' 2>/dev/null | LC_ALL=C sort | head -80

echo "== pkgbase =="
find "$TMP/usr/lib/modules" -name pkgbase -print -exec cat {} \; 2>/dev/null || echo "  no pkgbase file"

echo "== mkinitcpio preset =="
find "$TMP/etc/mkinitcpio.d" -maxdepth 1 -type f -print -exec sed -n '1,25p' {} \; 2>/dev/null || true

echo "== module directory =="
find "$TMP/usr/lib/modules" -maxdepth 1 -mindepth 1 -type d -printf '  %P\n' 2>/dev/null
