---
id: TRJ-02
title: Cash flow aggregation
epic: trajectory
status: done
size: S
depends_on: [FND-03, FND-02]
spec: ["§29", "§30"]
---

## Story

As a **developer**, I want **dated cash flows grouped into months** so that **the engine works a month at a time**.

## Acceptance criteria

- [x] Groups `CashFlow[]` by `YearMonth`, summing positives and negatives separately
- [x] Months with no flows are present with zero, not absent
- [x] Each month retains its constituent flows for drill-down
- [x] Pure function, timezone-independent
