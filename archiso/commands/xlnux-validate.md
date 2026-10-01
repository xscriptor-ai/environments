---
description: Validate the X Linux project (scripts generations suite, real-btrfs test, optional VM end-to-end)
agent: xlnux-generations
---

Validate X Linux (`/home/x/Documents/repos/xlnux`), current as of October 2026.

1. Non-root suite (from `scripts/`):
   ```bash
   bash scripts/test/validate.sh
   ```
   Expect: smoke + generations + generations-boot + pacman-hooks + generations-export + home-gens green; cargo tests for xpm/xpkg if present.
2. Real btrfs (requires password/root, loop device):
   ```bash
   sudo bash scripts/test/generations-btrfs.sh
   ```
   If it fails, capture the failing check and fix engine/tests; re-run until green.
3. Optional VM end-to-end (see `/xlnux-vm`): build ISO and run `xauto=1` install; assert generation `0001`, `x gen verify`, and a rollback round-trip.
4. Cross-check the current contract against `scripts/docs/es/generations.md` and `skills/xlnux/references/known-issues.md`; flag any drift between docs and code.
5. Report: commands run, pass/fail per suite, failing checks with evidence, and which P0/P1 items from known-issues were closed or remain.

$ARGUMENTS
