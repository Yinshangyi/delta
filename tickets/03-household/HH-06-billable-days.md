---
id: HH-06
title: Billable days
epic: household
status: todo
size: M
depends_on: [HH-05]
spec: ["§11"]
---

## Story

As a **freelancer**, I want **a default number of billable days with per-month exceptions** so that **holidays and quiet months are reflected in the forecast**.

## Acceptance criteria

- [ ] A default applies to every month unless overridden
- [ ] Per-month overrides — August 12, December 10
- [ ] Overridden months are visually distinguished from the default
- [ ] An override can be cleared back to the default
- [ ] Zero billable days is valid and yields no revenue for that month
