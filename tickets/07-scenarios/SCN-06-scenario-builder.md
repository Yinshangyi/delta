---
id: SCN-06
title: Scenario builder
epic: scenarios
status: done
size: L
depends_on: [SCN-05, SHL-05]
spec: ["§34", "§36"]
---

## Story

As a **household member**, I want **to stack hypothetical changes and see the effect** so that **I can weigh a decision before committing to it**.

## Acceptance criteria

- [x] It is unmistakable throughout that nothing here is real yet
- [x] Changes are added from the seven override types and individually removable
- [x] Current and simulation shown side by side with assumptions, target date and months remaining
- [x] The time delta is the outcome, decomposed where several changes are stacked
- [x] Three exits: discard, preview, apply
- [x] The hypothetical marking survives greyscale
- [ ] It can be opened in context from a commitment, income source or holding, pre-filling the first change

## Notes

`size: L` — split into the change stack, the comparison view, and the exits.

## Notes

One criterion is not done: opening the builder in context from a commitment,
income source or holding with the first change pre-filled. The builder itself
takes a pre-filled stack without any change — it is handed a `Scenario` — so
this is the entry points on the other three screens, which each need a control
and a route carrying the override. Left for a follow-up rather than half-built.

The hypothetical marking is a dashed border, the word, and a hatch glyph:
three signals, none of them colour.
