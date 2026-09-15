---
id: FND-14
title: Project skills and structural rules
epic: foundations
status: done
size: M
depends_on: [FND-13]
spec: []
---

## Story

As a **developer**, I want **the project's conventions encoded where they are enforced automatically** so that **code comes out in house style without anyone remembering to ask**.

## Acceptance criteria

- [x] Skills in `.claude/skills/` covering hexagonal placement, the React leaf/container split, TypeScript style and testing strategy
- [x] ast-grep rules covering Effect usage, schema, control flow, domain modelling and test hygiene
- [x] `pnpm ast-grep` runs the rules; the harness runs them per edited file
- [x] Each rule carries a message explaining the why, not just the what
- [x] A rule fires on a deliberately bad sample and is confirmed to catch it

## Notes

Port and adapt from the reference project rather than writing from scratch. These fire on human edits too, so they are also how the conventions get learned.
