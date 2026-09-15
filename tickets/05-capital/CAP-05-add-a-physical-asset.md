---
id: CAP-05
title: Add a physical asset
epic: capital
status: todo
size: M
depends_on: [CAP-01, CAP-02]
spec: ["§70", "§78"]
---

## Story

As a **household member**, I want **to record something I own and could sell** so that **its resale value counts toward our capital**.

## Acceptance criteria

- [ ] Name, category, estimated resale value, valuation date, optional acquisition cost and date
- [ ] The form states the value means net proceeds — not purchase price, not listing price
- [ ] Acquisition cost is visually subordinate and never enters capital or the projection
- [ ] The valuation is stored with `basis: "estimated"`
- [ ] No gain or profit figure is derived or displayed anywhere

## Notes

§78 — an asset bought at €12,000 and carried at €15,000 expresses its gain through the valuation itself. A profit badge would invent a number that drives nothing.
