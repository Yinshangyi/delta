---
id: CAP-02
title: Valuation history
epic: capital
status: todo
size: M
depends_on: [CAP-01]
spec: ["§71", "§2.3"]
---

## Story

As a **developer**, I want **dated valuations per holding** so that **reality overrides estimates for each holding independently**.

## Acceptance criteria

- [ ] `BalanceSnapshot` carries holding, date, amount and basis
- [ ] Bank balances are `actual`; asset valuations are `estimated`
- [ ] The latest snapshot for a holding is its value
- [ ] History is retrievable, and snapshots are editable and deletable
- [ ] A household with one account behaves exactly as the old single-savings model

## Notes

This generalises the original `SavingsSnapshot`. §2.3 now applies per holding.
