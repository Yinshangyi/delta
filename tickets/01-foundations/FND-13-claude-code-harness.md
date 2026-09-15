---
id: FND-13
title: Claude Code harness
epic: foundations
status: done
size: M
depends_on: [FND-07, FND-12]
spec: []
---

## Story

As a **developer**, I want **hooks that check and correct code the moment it is written** so that **mistakes are caught with full context instead of at review**.

## Acceptance criteria

- [x] `PostToolUse` on Edit and Write runs lint-fix, boundary-check and format-fix on the edited file
- [x] lint-fix auto-fixes what it can, then re-checks and **exits 2 on residual errors** so the agent must re-edit
- [x] boundary-check runs dependency-cruiser on the edited file and exits 2 on a hexagon violation
- [x] Every hook degrades gracefully when its tool is missing — a warning, never a blocked edit
- [x] `CLAUDE.md` records the conventions an agent needs: Effect v4 only, PascalCase files, snake_case directories, port naming, leaf/container split, no `vi.mock` of hooks, test-first
- [x] Verified by deliberately writing a violating import and confirming the hook rejects it

## Notes

Exit code 2 is the whole point — it turns the hooks from a linter into a feedback loop the agent cannot leave a violation behind in. Catching boundary violations at edit time rather than at pre-push is why this belongs in foundations: the deferred-distribution argument in `architecture.md` rests entirely on those boundaries holding.
