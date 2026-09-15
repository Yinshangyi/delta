---
id: CMT-13
title: Commitment cash flows query
epic: commitments
status: todo
size: S
depends_on: [CMT-06, CMT-07, CMT-08]
spec: ["§17", "§29"]
---

## Story

As a **developer**, I want **one query returning every outflow as dated cash flows** so that **the projection never branches on commitment type**.

## Acceptance criteria

- [ ] Returns negative `CashFlow[]` over a date range for every enabled commitment
- [ ] No `if (type === "tax")` anywhere downstream of this query
- [ ] Adding a commitment type requires no change outside this module
- [ ] Each cash flow carries its source id and type for drill-down
