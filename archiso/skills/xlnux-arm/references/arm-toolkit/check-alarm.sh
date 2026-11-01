#!/usr/bin/env bash
# Download the ALARM databases for an architecture and verify package names.
# Usage: ./check-alarm.sh [arch] [package ...]
# Default arch: aarch64. Writes to /tmp/alarmdb-<arch> unless ALARMDB_DIR is set.
set -euo pipefail

ARCH="${1:-aarch64}"
if [[ $# -gt 0 ]]; then
    shift
fi

DBDIR="${ALARMDB_DIR:-/tmp/alarmdb-$ARCH}"
mkdir -p "$DBDIR"

for repo in core extra alarm aur; do
    curl -fsSL "http://mirror.archlinuxarm.org/$ARCH/$repo/$repo.db.tar.gz" \
        -o "$DBDIR/$repo.db.tar.gz"
    mkdir -p "$DBDIR/$repo"
    tar -xzf "$DBDIR/$repo.db.tar.gz" -C "$DBDIR/$repo"
done

python3 - "$DBDIR" "$@" <<'PY'
import re
import sys
from pathlib import Path

db = Path(sys.argv[1])
wanted = sys.argv[2:]
have = {}

for repo in ("core", "extra", "alarm", "aur"):
    for desc in (db / repo).glob("*/desc"):
        text = desc.read_text()
        name = re.search(r"%NAME%\n(.+)", text)
        version = re.search(r"%VERSION%\n(.+)", text)
        arch = re.search(r"%ARCH%\n(.+)", text)
        if name:
            have[name.group(1)] = (
                repo,
                version.group(1) if version else "?",
                arch.group(1) if arch else "?",
            )

print(f"{len(have)} packages indexed from {db}")
if not wanted:
    print("pass package names to check specific entries")
for package in wanted:
    if package in have:
        repo, version, arch = have[package]
        print(f"{package}: {repo} {version} ({arch})")
    else:
        print(f"{package}: MISSING")
PY
