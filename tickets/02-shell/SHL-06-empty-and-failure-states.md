---
id: SHL-06
title: Empty and failure states
epic: shell
status: done
size: S
depends_on: [SHL-01]
spec: []
---

## Story

As a **household member**, I want **to understand a screen with nothing on it** so that **an empty app does not look broken**.

## Acceptance criteria

- [x] First run, and a per-screen empty state for capital, commitments and scenarios
- [ ] Each says what to do next and offers the action
- [ ] A failed database read shows a recoverable message, not a blank page
- [x] No layout shift between an empty and a populated screen

## Notes

The component family and every section's copy are done, and both criteria above
are covered by tests. What is missing is the wiring, because the things being
wired do not exist yet: the action button lands with the ticket that can perform
it (CAP-03, CMT-02, SCN-02), and the failure state lands with the first screen
that reads the database.
