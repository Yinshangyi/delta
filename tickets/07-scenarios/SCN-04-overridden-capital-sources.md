---
id: SCN-04
title: Overridden capital sources
epic: scenarios
status: done
size: S
depends_on: [SCN-01, CAP-10]
spec: ["§75"]
---

## Story

As a **developer**, I want **capital overrides applied the same way** so that **"what if we sold the watches?" costs no new machinery**.

## Acceptance criteria

- [x] Wraps the live capital source and applies holding overrides
- [x] Exclude-holding and change-holding-value both honoured
- [x] Stored inclusion flags and valuations are never mutated
- [x] Excluding every holding yields €0 and an unreachable projection
