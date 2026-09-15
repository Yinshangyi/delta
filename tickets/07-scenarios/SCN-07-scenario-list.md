---
id: SCN-07
title: Scenario list
epic: scenarios
status: todo
size: M
depends_on: [SCN-02, SCN-05]
spec: ["§34"]
---

## Story

As a **household member**, I want **to see the scenarios I am tracking** so that **standing decisions stay visible as circumstances change**.

## Acceptance criteria

- [ ] Each row shows its name, its changes in summary, the resulting target date and the delta
- [ ] Deltas are recomputed against today's plan on every view, never stored
- [ ] Sooner and later differ by more than colour
- [ ] The current baseline target is stated for comparison
- [ ] Rows are deletable; an empty state explains what scenarios are for
- [ ] No edit-date metadata — what matters is whether the answer is current
