---
id: CMT-09
title: Enable or disable a commitment
epic: commitments
status: done
size: S
depends_on: [CMT-02]
spec: ["§18", "§40"]
---

## Story

As a **household member**, I want **to switch a commitment off without deleting it** so that **I can model dropping an expense without losing the record**.

## Acceptance criteria

- [x] A disabled commitment produces no cash flows
- [x] It stays in the list, muted and struck, marked disabled
- [x] The row treatment carries the state; the toggle only confirms it
- [x] Toggling recalculates the projection immediately
