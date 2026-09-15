---
id: CMT-02
title: Recurring expense
epic: commitments
status: todo
size: S
depends_on: [CMT-01]
spec: ["§18", "§46"]
---

## Story

As a **household member**, I want **to record a monthly expense** so that **rent and subscriptions are in the forecast**.

## Acceptance criteria

- [ ] Name, amount, start date, optional end date
- [ ] Produces exactly one negative cash flow per active month
- [ ] No cash flow outside the active range
- [ ] A €1,280 monthly expense yields one €1,280 outflow per month, never two
