---
id: CAP-11
title: Net worth read model
epic: capital
status: todo
size: S
depends_on: [CAP-10, CMT-06]
spec: ["§77"]
---

## Story

As a **household member**, I want **to see capital net of what we still owe** so that **a financed asset does not make me look richer than I am**.

## Acceptance criteria

- [ ] `net worth = capital − Σ outstanding debt balances`
- [ ] Computed for display only; never reaches `CapitalSources` or the engine
- [ ] Shown beneath the headline where debts exist, and hidden entirely where none do
- [ ] Capital is the headline because it drives the target date
- [ ] Test: a €15,000 asset against €9,500 outstanding shows €5,500 of net equity
