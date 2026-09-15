---
id: SHL-04
title: UI primitives
epic: shell
status: todo
size: M
depends_on: [SHL-02]
spec: []
---

## Story

As a **developer**, I want **accessible base components** so that **dialogs, menus and switches behave correctly without hand-rolling them**.

## Acceptance criteria

- [ ] Button, dialog, switch, input, select, table, tooltip and popover in place
- [ ] Dialogs trap focus, close on escape, and lock scroll
- [ ] Every component restyled to the project's tokens, with no library defaults left visible
- [ ] Components live in `dsl/` and are imported from there, never from a vendor path in feature code

## Notes

shadcn copy-in over Radix. Add `@internationalized/date`-backed date and number fields; §56 rules out anything that hands back a `Date`.
