#!/usr/bin/env bash
# Collect host or target logs for an ARM bug report.
# Usage: ./collect-logs.sh [output-dir]
set -euo pipefail

OUT="${1:-/tmp/x-arm-report-$(date +%Y%m%d-%H%M%S)}"
mkdir -p "$OUT"

run() {
    local name="$1"
    shift
    { "$@" 2>&1 || true; } >"$OUT/$name.txt"
}

run uname uname -a
run cmdline sh -c 'cat /proc/cmdline'
run lsblk lsblk -f
run blkid blkid
run efibootmgr efibootmgr -v
run bootctl bootctl status
run systemctl sh -c 'systemctl --failed --no-pager'
run journal journalctl -b --no-pager
run dmesg dmesg
run xgen sh -c 'x gen status'
run xkernel sh -c 'x kernel list'
run packages sh -c 'pacman -Q linux-aarch64 grub efibootmgr archlinuxarm-keyring 2>/dev/null'

ARCHIVE="$OUT.tar.gz"
tar -czf "$ARCHIVE" -C "$(dirname "$OUT")" "$(basename "$OUT")"
echo "$ARCHIVE"
echo "Review the archive for secrets before sharing."
