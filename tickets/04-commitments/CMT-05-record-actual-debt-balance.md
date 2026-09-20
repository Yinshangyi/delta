---
id: CMT-05
title: Record actual debt balance
epic: commitments
status: done
size: S
depends_on: [CMT-04]
spec: ["§21", "§23", "§2.3"]
---

## Story

As a **household member**, I want **to record what I actually still owe** so that **the forecast recalibrates from reality**.

## Acceptance criteria

- [x] A dated snapshot of the remaining amount
- [x] The projected balance is shown alongside for comparison
- [x] Future projections continue from the actual, not the forecast
- [x] €7,350 projected against €7,200 actual means €7,200 becomes the source of truth
- [x] Snapshot history is visible and editable
