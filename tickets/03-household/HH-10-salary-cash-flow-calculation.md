---
id: HH-10
title: Salary cash flow calculation
epic: household
status: done
size: S
depends_on: [HH-07]
spec: ["§12", "§63"]
---

## Story

As a **developer**, I want **salary converted into dated cash flows** so that **the projection treats every income source alike**.

## Acceptance criteria

- [x] One positive cash flow per active month, net of income tax
- [x] Respects start and end dates and the enabled flag
- [x] Pure function
