---
id: CAP-01
title: Holding persistence
epic: capital
status: todo
size: M
depends_on: [FND-06, FND-10]
spec: ["§68", "§69", "§70"]
---

## Story

As a **developer**, I want **the holding tagged union stored and retrieved** so that **accounts and assets share one seam**.

## Acceptance criteria

- [ ] `Holdings` port with a live SQLite implementation
- [ ] `BankAccount | PhysicalAsset` round-trip without loss
- [ ] Adding a holding type later requires no engine change
- [ ] Co-located stub exposing `{ layer, inspect }`
