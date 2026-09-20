---
id: TRJ-09
title: Unreachable goal
epic: trajectory
status: done
size: S
depends_on: [TRJ-04, SHL-06]
spec: ["§32"]
---

## Story

As a **household member**, I want **to be told plainly when the goal cannot be reached** so that **an honest answer beats a misleading date**.

## Acceptance criteria

- [x] A negative trajectory returns `not-reachable` and never loops
- [x] The dashboard presents this as an answer, not an error
- [x] It says why — the monthly shortfall — and suggests simulating a change
- [x] The horizon cap is respected and its reaching is distinguishable from a negative trajectory
- [x] Reachable again after a change, with no reload
