---
id: DAT-03
title: Development seed
epic: data
status: done
size: M
depends_on: [FND-06]
spec: ["§41", "§42", "§50", "§51"]
---

## Story

As a **developer**, I want **realistic data to develop against** so that **screens can be built without typing a household in each time**.

## Acceptance criteria

- [x] Covers a household, two people, freelance and salary income, recurring expenses, a debt, tax liabilities, holdings and a goal
- [x] Seeding is explicit and development-only — production never seeds automatically
- [x] Idempotent: running it twice creates no duplicates
- [x] Seed code is isolated from domain logic
- [x] No seed value appears anywhere in application source as a constant

## Notes

Every figure is the specification's own fictional seed, not anybody's finances.
That is what makes the file committable: the repository is public, and a seed
built from real figures would either leak them or be gitignored, leaving the
seed non-reproducible for anyone else and for CI. The household's real numbers
stay in `seed.local.md`.

Inserted through the ordinary use cases, so the seed meets the same validation
a person typing would — which caught its own bug: valuations dated in the
future were refused, and the seed died after the commitments and before the
goal.
