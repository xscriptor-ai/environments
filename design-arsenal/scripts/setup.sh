#!/usr/bin/env bash
# Create a local venv for the design pack's Python helpers.
set -euo pipefail
SELF="$(readlink -f "${BASH_SOURCE[0]}")"
ROOT="$(cd "$(dirname "$SELF")/.." && pwd)"
VENV="$ROOT/.venv"

printf '%s\n' "Design pack setup"
python3 -m venv "$VENV"
"$VENV/bin/pip" install --quiet --upgrade pip
"$VENV/bin/pip" install --quiet -r "$ROOT/scripts/requirements.txt"
printf '  ok: %s\n' "$VENV"

missing=()
for cmd in magick ffmpeg rsvg-convert jq; do
  command -v "$cmd" >/dev/null 2>&1 || missing+=("$cmd")
done
if ((${#missing[@]})); then
  printf '  missing system tools: %s\n' "${missing[*]}"
  printf '  Arch: sudo pacman -S --needed imagemagick ffmpeg librsvg jq\n'
fi

printf '\nVerification:\n'
"$ROOT/scripts/wallpaper" doctor || true
printf '\nOptional tools: libvips, realesrgan-ncnn-vulkan, exiftool, oxipng.\n'
printf 'See docs/toolchain-2026.md for the full setup.\n'
