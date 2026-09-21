---
id: APP-01
title: Palette and type scale from the mock
epic: appearance
status: todo
size: M
depends_on: [SHL-02]
spec: []
---

## Story

As a **household member**, I want **the app to carry the mock's visual identity** so that **it reads as a made thing rather than a wireframe with data in it**.

## Acceptance criteria

- [ ] The ground is near-white and the surface is white, as in the mock — not the current blue-tinted grey
- [ ] The primary action is black on white, not blue
- [ ] Blue survives as the forecast's colour in the chart and nowhere else structural
- [ ] An eyebrow style exists: uppercase, letterspaced, small, muted
- [ ] The display size used for the target date is a named step in the scale, not a one-off
- [ ] Dark theme is redesigned to match, not inverted
- [ ] Every distinction still survives greyscale (design-brief principle 5)

## Notes

The mock's accent is *absence* of accent — black type, white ground, one blue
reserved for the forecast line. The current palette makes blue structural (the
primary button, the current nav item, links), which is what makes the two look
least alike at a glance even where the layout agrees.

Tokens already exist and components already use them rather than literals
(`src/index.css`), so this is a palette swap plus two new scale steps, not a
sweep through every component.

The mock is light-theme only. Dark is ours to design, and the existing dark
palette's reasoning — designed rather than inverted, every pair ≥4.5:1 — holds.
