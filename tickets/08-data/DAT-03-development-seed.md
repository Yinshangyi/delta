---
id: DAT-03
title: Development seed
epic: data
status: todo
size: M
depends_on: [FND-06]
spec: ["§41", "§42", "§50", "§51"]
---

## Story

As a **developer**, I want **realistic data to develop against** so that **screens can be built without typing a household in each time**.

## Acceptance criteria

- [ ] Covers a household, two people, freelance and salary income, recurring expenses, a debt, tax liabilities, holdings and a goal
- [ ] Seeding is explicit and development-only — production never seeds automatically
- [ ] Idempotent: running it twice creates no duplicates
- [ ] Seed code is isolated from domain logic
- [ ] No seed value appears anywhere in application source as a constant
