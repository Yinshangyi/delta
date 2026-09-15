---
id: CAP-03
title: Add a bank account
epic: capital
status: todo
size: S
depends_on: [CAP-01, CAP-02]
spec: ["§69", "§71", "§72"]
---

## Story

As a **household member**, I want **to add a bank account with its current balance** so
that **it counts toward our total capital**.

## Acceptance criteria

- [ ] Name, optional institution, opening balance, balance date
- [ ] Included in capital by default
- [ ] The opening balance is stored as a `BalanceSnapshot` with `basis: "actual"`
- [ ] Total capital increases by the balance immediately on save
- [ ] The projection's starting balance updates, and the target date recalculates
- [ ] A zero or negative balance is accepted — overdrafts are real
- [ ] A household with one account behaves exactly as the single-savings model did

## Notes

The account itself holds no amount; its value at any date comes from its snapshots (§71).
That is what lets §2.3 apply per holding rather than per household.
