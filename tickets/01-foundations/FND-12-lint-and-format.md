---
id: FND-12
title: Lint and format
epic: foundations
status: done
size: S
depends_on: [FND-01]
spec: []
---

## Story

As a **developer**, I want **linting and formatting configured and runnable per file** so that **the coding harness has something to call**.

## Acceptance criteria

- [x] `pnpm lint` and `pnpm format` run across the project
- [x] Both accept a single file path, so a hook can run them on one edit
- [x] Lint covers unused code, import order and restricted imports
- [x] Formatting is not negotiable per-file — one config, no overrides
- [x] Both run in CI

## Notes

Prerequisite for FND-13. The per-file invocation is the part that matters — a hook that lints the whole tree on every edit is unusable.
