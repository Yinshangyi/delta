---
id: SHL-02
title: Design tokens and themes
epic: shell
status: todo
size: M
depends_on: [FND-01]
spec: []
---

## Story

As a **household member**, I want **a light and a dark theme** so that **the app is comfortable whatever my system is set to**.

## Acceptance criteria

- [ ] Palette defined once as CSS custom properties, never as literals in components
- [ ] Dark is a designed palette, not an inversion
- [ ] Follows the system setting by default, with an explicit override in Settings
- [ ] Figures use tabular numerals everywhere by default
- [ ] Contrast meets WCAG AA in both themes

## Notes

Ink #0E1116, accent #2A5BD7, positive #0E7C5A, negative #B4413C. Semantic colour touches figures only — never a button, never a card background.
