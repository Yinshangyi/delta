---
id: FND-03
title: LocalDate and YearMonth value objects
epic: foundations
status: done
size: M
depends_on: [FND-01]
spec: ["§56"]
---

## Story

As a **developer**, I want **timezone-free date types** so that **the same inputs produce the same projection on any machine**.

## Acceptance criteria

- [x] `LocalDate` and `YearMonth` are branded types with no time or zone component
- [x] Month arithmetic clamps correctly — 31 Jan plus one month is 28 or 29 Feb
- [x] Comparison, ordering, difference in months, and iteration over a range
- [x] Parsing and serialising as ISO strings, total or returning a typed error
- [x] No use of the `Date` global anywhere in the implementation
- [x] Test: identical projections under TZ=UTC, TZ=Asia/Manila and TZ=America/Los_Angeles

## Notes

Back these with `@internationalized/date`'s `CalendarDate` — no React dependency, so it is legal inside `core/`. Writing month arithmetic by hand is a tarpit.
