---
id: FND-08
title: Test setup
epic: foundations
status: done
size: M
depends_on: [FND-01]
spec: ["§57"]
---

## Story

As a **developer**, I want **separate node and browser test projects** so that **domain tests never pay to boot a browser**.

## Acceptance criteria

- [x] `*.node.unit.test.ts` runs in node; `*.browser.unit.test.tsx` runs in a browser
- [x] `pnpm test`, `pnpm test:node` and `pnpm test:browser` all work
- [x] `@effect/vitest` available for effectful tests
- [x] Testing Library configured with automatic cleanup
- [x] A failing test fails CI

## Notes

FND-02 already added `vitest.config.ts` with the `node:unit` project and the
`test` / `test:node` / `test:watch` scripts, so that its property tests could
run. What is left here is the browser project, `@effect/vitest`, Testing
Library with automatic cleanup, and the CI gate.
