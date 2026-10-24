#!/usr/bin/env bash
# Verify the EFI entry and required files in an aarch64 ISO.
# Usage: ./verify-iso.sh <iso>
set -euo pipefail

ISO="${1:?usage: $0 <iso>}"
[[ -f "$ISO" ]] || { echo "missing: $ISO" >&2; exit 1; }
command -v xorriso >/dev/null 2>&1 || { echo "install libisoburn (xorriso)" >&2; exit 1; }
command -v bsdtar >/dev/null 2>&1 || { echo "install libarchive (bsdtar)" >&2; exit 1; }

echo "== El Torito =="
if xorriso -report_el_torito as_mkisofs "$ISO" | grep -qi 'BOOTAA64'; then
    echo "BOOTAA64 EFI entry found"
else
    echo "no BOOTAA64 EFI entry" >&2
    exit 1
fi

echo "== required files =="
LIST="$(bsdtar -tf "$ISO")"
for path in EFI/BOOT/BOOTAA64.EFI arch/aarch64/airootfs.sfs; do
    if grep -qx "$path" <<<"$LIST"; then
        echo "found $path"
    else
        echo "missing $path" >&2
        exit 1
    fi
done

echo "== kernel and initramfs =="
grep -E 'arch/boot/aarch64/(Image|vmlinuz|initramfs)' <<<"$LIST" || true

echo "== hash =="
sha256sum "$ISO"
