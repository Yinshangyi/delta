---
id: SCN-07
title: Scenario list
epic: scenarios
status: done
size: M
depends_on: [SCN-02, SCN-05]
spec: ["§34"]
---

## Story

As a **household member**, I want **to see the scenarios I am tracking** so that **standing decisions stay visible as circumstances change**.

## Acceptance criteria

- [x] Each row shows its name, its changes in summary, the resulting target date and the delta
- [x] Deltas are recomputed against today's plan on every view, never stored
- [x] Sooner and later differ by more than colour
- [x] The current baseline target is stated for comparison
- [x] Rows are deletable; an empty state explains what scenarios are for
- [x] No edit-date metadata — what matters is whether the answer is current
