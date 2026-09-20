---
id: CAP-04
title: Update a bank balance
epic: capital
status: done
size: S
depends_on: [CAP-03]
spec: ["§71", "§74"]
---

## Story

As a **household member**, I want **to record an account's current balance** so that **the projection restarts from what is actually there**.

## Acceptance criteria

- [x] A dated amount recorded as a new snapshot, leaving history intact
- [x] The prior value is shown so the user corrects rather than recalls
- [x] Total capital and the target date recalculate on save
- [x] A future-dated snapshot is refused with a clear reason
