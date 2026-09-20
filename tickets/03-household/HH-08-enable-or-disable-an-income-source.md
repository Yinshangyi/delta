---
id: HH-08
title: Enable or disable an income source
epic: household
status: done
size: S
depends_on: [HH-05, HH-07]
spec: ["§8", "§12", "§40"]
---

## Story

As a **household member**, I want **to switch an income source off without deleting it** so that **I can model a contract ending without losing its record**.

## Acceptance criteria

- [x] A disabled source produces no cash flows
- [x] It stays visible, visibly inert, with its history intact
- [x] Toggling recalculates the projection immediately
- [x] The state persists across restarts
