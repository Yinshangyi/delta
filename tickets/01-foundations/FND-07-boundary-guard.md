---
id: FND-07
title: Boundary guard
epic: foundations
status: done
size: M
depends_on: [FND-01]
spec: []
---

## Story

As a **developer**, I want **the hexagon enforced mechanically** so that **the architecture stays real rather than aspirational**.

## Acceptance criteria

- [x] `core/**` may not import adapters, React, or any reactivity primitive
- [x] `primary_adapters/**` may not import `secondary_adapters/**`
- [x] `secondary_adapters/**` may import `core/ports/secondary/**` only
- [x] No cycles, within or between modules
- [x] `pnpm lint:boundaries` fails on a violation and runs in CI
- [x] A deliberate violation is added in a test and confirmed to fail

## Notes

dependency-cruiser only. Skip the eslint-plugin-boundaries gate — measured at 54s in the reference project, and not worth it at this size.
