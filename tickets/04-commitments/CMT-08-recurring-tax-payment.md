---
id: CMT-08
title: Recurring tax payment
epic: commitments
status: done
size: S
depends_on: [CMT-01]
spec: ["§27", "§49"]
---

## Story

As a **freelancer**, I want **to record a monthly levy such as PAS** so that **current tax payments are separate from future liabilities**.

## Acceptance criteria

- [x] Name, amount, start date, optional end date, optional person
- [x] A rate change is modelled as ending one rule and starting another, preserving history
- [x] Produces one negative cash flow per active month
- [x] Kept distinct from `TaxLiability` in both model and UI
