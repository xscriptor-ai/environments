#!/usr/bin/env bash
# Verify that a package or directory contains only AArch64 ELF binaries.
# Usage: ./check-elf.sh <dir|package.pkg.tar.zst>
set -euo pipefail

TARGET="${1:?usage: $0 <dir|package.pkg.tar.zst>}"

if [[ ! -e "$TARGET" ]]; then
    echo "missing: $TARGET" >&2
    exit 1
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

if [[ -f "$TARGET" ]]; then
    bsdtar -xf "$TARGET" -C "$TMP"
    ROOT="$TMP"
elif [[ -d "$TARGET" ]]; then
    ROOT="$TARGET"
else
    echo "not a directory or package: $TARGET" >&2
    exit 1
fi

bad=0
while IFS= read -r -d '' file; do
    desc="$(file -b "$file" 2>/dev/null || true)"
    case "$desc" in
        *ELF*)
            case "$desc" in
                *"ARM aarch64"*) ;;
                *)
                    echo "NON-AARCH64: $file :: $desc"
                    bad=1
                    ;;
            esac
            ;;
    esac
done < <(find "$ROOT" -type f -print0)

if [[ "$bad" -eq 0 ]]; then
    echo "all ELF files are AArch64"
fi
exit "$bad"
