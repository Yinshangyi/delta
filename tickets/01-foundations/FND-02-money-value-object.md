---
id: FND-02
title: Money value object in integer cents
epic: foundations
status: done
size: S
depends_on: [FND-01]
spec: ["§55"]
---

## Story

As a **developer**, I want **money represented as integer cents with deterministic
rounding** so that **no projection ever drifts through floating-point error**.

## Acceptance criteria

- [x] `Money` is a branded type over integer cents; a non-integer is rejected at construction
- [x] Construction from euros and from cents, both total or returning a typed error
- [x] Add, subtract, multiply by a scalar, negate, compare
- [x] Multiplication rounds half-up to the nearest cent, deterministically
- [x] Formatting is not part of `Money` — it belongs to the presentation vocabulary
- [x] `€600.00` round-trips as `60_000` cents
- [x] Property test: addition is associative and commutative across a wide range

## Notes

Lives in `shared/domain/`. Pure TypeScript — no Effect runtime, no I/O.
Rounding only ever arises from the payout ratio (§9) and interest, so half-up is
sufficient. Do not add banker's rounding without a case that needs it.
