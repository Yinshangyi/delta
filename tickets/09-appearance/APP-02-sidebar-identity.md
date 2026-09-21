---
id: APP-02
title: Sidebar identity and icons
epic: appearance
status: todo
size: S
depends_on: [APP-01]
spec: []
---

## Story

As a **household member**, I want **the sidebar to name the app and show where I am** so that **the navigation reads as part of the product**.

## Acceptance criteria

- [ ] The wordmark is "Delta" at text weight, with "LOCAL" beside it as a quiet eyebrow
- [ ] Each of the six sections carries an icon, drawn inline, not from an icon font
- [ ] The current section is marked by fill and weight, and stays legible in greyscale
- [ ] A footer block shows total capital and its composition
- [ ] The footer figure comes from the same query as the Capital screen, never a second one

## Notes

"LOCAL" is the one place the privacy claim appears without being asked for, and
it is worth the pixels: it is the product's whole premise (spec §1).

The footer is a read, not a summary the sidebar maintains — it reads
`capitalOverviewAtom`, which is already the Capital screen's source. Two answers
to one question is the thing worth avoiding.
