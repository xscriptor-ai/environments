---
description: Validate the X Linux project (rootless suite, real btrfs, optional VM end-to-end)
agent: xlnux-generations
---

Validate X Linux (`/home/x/Documents/repos/equislinux`), current as of October 2026.

1. Non-root suite (from `scripts/`):
   ```bash
   bash scripts/test/validate.sh
   ```
   Expect 362 checks green: smoke + generations + generations-boot + pacman-hooks + generations-export + home-gens; cargo tests for xpm/xpkg if present.
2. Real btrfs (root, loop device):
   ```bash
   sudo bash scripts/test/generations-btrfs.sh
   ```
   Fix engine/tests on failure; re-run until green.
3. Optional VM end-to-end (see `/xlnux-vm`): `python3 x/tests/e2e-autoinstall.py --mode uefi|bios`; assert `0001`, `x gen verify`, newest-generation default and reboot into it.
4. Cross-check the current contract against `scripts/docs/{es,en}/generations.md` and `skills/xlnux/references/known-issues.md`; flag any drift between docs and code.
5. Report: commands run, pass/fail per suite, failing checks with evidence, and which P1/P2 items were closed or remain.

$ARGUMENTS
