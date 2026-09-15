---
id: TRJ-09
title: Unreachable goal
epic: trajectory
status: todo
size: S
depends_on: [TRJ-04, SHL-06]
spec: ["§32"]
---

## Story

As a **household member**, I want **to be told plainly when the goal cannot be reached** so that **an honest answer beats a misleading date**.

## Acceptance criteria

- [ ] A negative trajectory returns `not-reachable` and never loops
- [ ] The dashboard presents this as an answer, not an error
- [ ] It says why — the monthly shortfall — and suggests simulating a change
- [ ] The horizon cap is respected and its reaching is distinguishable from a negative trajectory
- [ ] Reachable again after a change, with no reload
