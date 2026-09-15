---
id: SCN-04
title: Overridden capital sources
epic: scenarios
status: todo
size: S
depends_on: [SCN-01, CAP-10]
spec: ["§75"]
---

## Story

As a **developer**, I want **capital overrides applied the same way** so that **"what if we sold the watches?" costs no new machinery**.

## Acceptance criteria

- [ ] Wraps the live capital source and applies holding overrides
- [ ] Exclude-holding and change-holding-value both honoured
- [ ] Stored inclusion flags and valuations are never mutated
- [ ] Excluding every holding yields €0 and an unreachable projection
