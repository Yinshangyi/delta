---
id: CAP-04
title: Update a bank balance
epic: capital
status: todo
size: S
depends_on: [CAP-03]
spec: ["§71", "§74"]
---

## Story

As a **household member**, I want **to record an account's current balance** so that **the projection restarts from what is actually there**.

## Acceptance criteria

- [ ] A dated amount recorded as a new snapshot, leaving history intact
- [ ] The prior value is shown so the user corrects rather than recalls
- [ ] Total capital and the target date recalculate on save
- [ ] A future-dated snapshot is refused with a clear reason
