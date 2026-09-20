---
id: SHL-07
title: Settings screen
epic: shell
status: doing
size: M
depends_on: [SHL-01, HH-04, TRJ-01, DAT-01, FND-11]
spec: ["§39", "§40"]
---

## Story

As a **household member**, I want **one place for everything I configure rather than record** so that **setup and maintenance are separate from daily use**.

## Acceptance criteria

- [x] Household name and members, each with their income sources and a way to edit them
- [x] The financial goal: name, target amount, active state
- [ ] Export and import, given real visual weight rather than a buried link
- [x] Storage persistence state and usage
- [x] Theme preference: system, light or dark
- [x] Sections are visually distinct — this is a container, not a single form

## Notes

Assembles work owned by other epics. Schedule it after its dependencies rather than building placeholder sections.

Four sections are built and live: Household and members (HH-02 to HH-08), the
Goal (TRJ-01), Appearance, and Storage reading the real persistence state and
usage. Export and import is absent rather than stubbed — it belongs to DAT-01 —
because a section that cannot do anything is worse than one that is not there.
The ticket stays `doing` until it lands.
