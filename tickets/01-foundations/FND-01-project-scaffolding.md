---
id: FND-01
title: Project scaffolding
epic: foundations
status: done
size: M
depends_on: []
spec: ["§3"]
---

## Story

As a **developer**, I want **a Vite, React and TypeScript project with pnpm and strict compiler settings** so that **every later ticket has somewhere to land**.

## Acceptance criteria

- [x] `pnpm dev` serves the app; `pnpm build` produces a static bundle
- [x] TypeScript strict mode on, no implicit any, no unchecked indexed access
- [x] Effect pinned to an exact version, not a range
- [x] Tailwind configured with theme tokens as CSS custom properties
- [x] Path alias `@/` resolves to `src/`
- [x] README records how to run, build and test

## Notes

No Next.js, no SSR, no router framework. Browser-first; desktop packaging is deferred.
