---
id: SHL-04
title: UI primitives
epic: shell
status: done
size: M
depends_on: [SHL-02]
spec: []
---

## Story

As a **developer**, I want **accessible base components** so that **dialogs, menus and switches behave correctly without hand-rolling them**.

## Acceptance criteria

- [x] Button, dialog, switch, input, select, table, tooltip and popover in place
- [x] Dialogs trap focus, close on escape, and lock scroll
- [x] Every component restyled to the project's tokens, with no library defaults left visible
- [x] Components live in `dsl/` and are imported from there, never from a vendor path in feature code

## Notes

shadcn copy-in over Radix. Add `@internationalized/date`-backed date and number fields; §56 rules out anything that hands back a `Date`.

Built on native elements rather than shadcn/Radix: `<dialog showModal()>` gives
focus trapping, Escape, the top layer and an inert background; the Popover API
gives light dismiss and anchor positioning; `<select>` and
`<input type="checkbox" role="switch">` carry their own keyboard behaviour.
Verified in Chrome 152 before choosing. No component dependency was added, so
"no library defaults left visible" holds by construction.
