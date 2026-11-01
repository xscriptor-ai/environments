#!/usr/bin/env bash
# Boot an aarch64 ISO in QEMU virt with edk2-aarch64.
# Usage: ./qemu-aarch64.sh <iso> [disk.qcow2]
set -euo pipefail

ISO="${1:?usage: $0 <iso> [disk.qcow2]}"
DISK="${2:-/tmp/x-aarch64.qcow2}"
EFI="${X_QEMU_EFI:-/usr/share/edk2/aarch64/QEMU_EFI.fd}"
VARS_SRC="${X_QEMU_VARS:-/usr/share/edk2/aarch64/QEMU_VARS.fd}"
VARS="$(mktemp /tmp/AAVMF_VARS.XXXXXX.fd)"

cleanup() {
    rm -f "$VARS"
}
trap cleanup EXIT

[[ -f "$ISO" ]] || { echo "missing ISO: $ISO" >&2; exit 1; }
[[ -f "$EFI" ]] || { echo "missing firmware: $EFI (install edk2-aarch64)" >&2; exit 1; }
[[ -f "$VARS_SRC" ]] || { echo "missing firmware vars: $VARS_SRC" >&2; exit 1; }
command -v qemu-system-aarch64 >/dev/null 2>&1 || { echo "install qemu-system-aarch64" >&2; exit 1; }

cp "$VARS_SRC" "$VARS"
[[ -f "$DISK" ]] || qemu-img create -f qcow2 "$DISK" 32G

qemu-system-aarch64 \
    -M virt \
    -cpu "${X_QEMU_CPU:-max}" \
    -smp "${X_QEMU_SMP:-4}" \
    -m "${X_QEMU_RAM:-4096}" \
    -drive if=pflash,format=raw,readonly=on,file="$EFI" \
    -drive if=pflash,format=raw,file="$VARS" \
    -drive if=none,id=cdrom,media=cdrom,readonly=on,file="$ISO" \
    -device virtio-scsi-pci \
    -device scsi-cd,drive=cdrom \
    -drive if=virtio,format=qcow2,file="$DISK" \
    -netdev user,id=n0 \
    -device virtio-net-pci,netdev=n0 \
    -nographic
