---
id: FND-04
title: Percentage value object
epic: foundations
status: done
size: S
depends_on: [FND-02]
spec: ["§9", "§54"]
---

## Story

As a **developer**, I want **a percentage type that cannot hold a nonsense value** so that **a payout ratio or interest rate is never silently wrong**.

## Acceptance criteria

- [x] Constructed from a ratio or a percentage, rejecting values outside a stated range
- [x] Applying a percentage to `Money` rounds half-up to the nearest cent
- [x] `€12,000 × 80%` yields exactly `€9,600`
- [x] Invalid construction returns `InvalidPayoutRatio` or `InvalidPercentage`, never throws
