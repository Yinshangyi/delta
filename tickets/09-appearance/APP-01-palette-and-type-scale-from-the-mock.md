---
id: APP-01
title: Palette and type scale from the mock
epic: appearance
status: done
size: M
depends_on: [SHL-02]
spec: []
---

## Story

As a **household member**, I want **the app to carry the mock's visual identity** so that **it reads as a made thing rather than a wireframe with data in it**.

## Acceptance criteria

- [x] The ground is near-white and the surface is white, as in the mock — not the current blue-tinted grey
- [x] The primary action is black on white, not blue
- [x] Blue survives as the forecast's colour in the chart and nowhere else structural
- [x] An eyebrow style exists: uppercase, letterspaced, small, muted
- [x] The display size used for the target date is a named step in the scale, not a one-off
- [ ] Dark theme is redesigned to match, not inverted
- [x] Every distinction still survives greyscale (design-brief principle 5)

## Notes

**The display step is fluid, and lower than the mock's.** It was a flat 4rem,
taken from the mock at 1440, which overpowered the card holding it: "August
2028" is fourteen characters in a panel that is a fraction of the window. It is
now `clamp(2.25rem, 3.4vw, 3rem)` — 48px at 1440, 36px at 1024 — which keeps
the date roughly 1.6x the capital figure beside it. Principle 1 asks the date
to dominate, not to be as large as the scale allows.

**Dark is unticked.** The accent and forecast roles were re-pointed so dark
keeps the same meanings — the action is the lightest thing there, as it is the
darkest thing in light — but the ground, surface and ink are untouched and I did
not see dark rendered. Redesigning it against a mock that only exists in light
is its own decision, and guessing at it is how the two drifted the first time.

Two catches from `Palette.node.unit.test.ts`, both real: the new muted read
4.47:1 on the new ground, just under AA, and the forecast blue had to be
declared in both themes and darkened to 4.95:1 because the chart labels its
crossing month in it — it is text, not only a stroke.

The mock's accent is *absence* of accent — black type, white ground, one blue
reserved for the forecast line. The current palette makes blue structural (the
primary button, the current nav item, links), which is what makes the two look
least alike at a glance even where the layout agrees.

Tokens already exist and components already use them rather than literals
(`src/index.css`), so this is a palette swap plus two new scale steps, not a
sweep through every component.

The mock is light-theme only. Dark is ours to design, and the existing dark
palette's reasoning — designed rather than inverted, every pair ≥4.5:1 — holds.
