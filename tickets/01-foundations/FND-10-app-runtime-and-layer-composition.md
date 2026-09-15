---
id: FND-10
title: App runtime and layer composition
epic: foundations
status: done
size: M
depends_on: [FND-05, FND-09]
spec: ["§53"]
---

## Story

As a **developer**, I want **one place where every module's layers are composed** so that **wiring is explicit and testable rather than scattered**.

## Acceptance criteria

- [ ] Each module exports `<module>AdaptersLayer` and `<module>UseCasesLayer` from `Dependencies.ts`
- [x] `bootstrap/runtime` composes them into a single application runtime
- [x] React reaches the runtime through atoms only, never directly
- [x] A test can swap any adapter layer for a stub without touching module code
