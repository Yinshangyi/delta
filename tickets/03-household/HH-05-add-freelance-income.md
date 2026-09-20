---
id: HH-05
title: Add freelance income
epic: household
status: done
size: M
depends_on: [HH-03, FND-04]
spec: ["§8", "§9", "§10", "§44"]
---

## Story

As a **freelancer**, I want **to record my daily rate and payout ratio** so that **Delta can estimate what reaches me personally**.

## Acceptance criteria

- [x] Daily rate, payout ratio, start date and optional end date
- [x] The payout ratio is labelled an estimate in the UI, never presented as a guaranteed transfer
- [x] The ratio is configurable per income source, never a constant in code
- [x] An invalid rate or ratio returns a typed error and blocks saving

## Notes

§10 is emphatic that the transferable amount is an estimate. The label is a requirement, not decoration.
