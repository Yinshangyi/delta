---
name: react-leaf-container
description: Write or refactor a React component in Delta. Use when adding anything under primary_adapters/react/, when a component is about to read an atom, when a component needs data, or when a test is tempted to mock a hook.
---

# Leaf and container

Every component is one of two things. Mixing them is the mistake this split
exists to prevent.

**Leaf — `Foo.tsx`.** Props in, JSX out. No Effect, no atoms, no data fetching,
no hooks beyond local UI state (`useState` for an open/closed disclosure is
fine). It can be rendered in a test by calling it with props, and that is the
whole point.

**Container — `FooContainer.tsx`.** Reads atoms, forwards values down as props,
renders the leaf. It holds no markup of its own beyond passing things through.

Production callers import the **container**. Tests import the **leaf**.

## Consequences worth knowing

**Smart children arrive as `ReactNode` slot props.** A leaf that needs a live
child does not import a container — it takes `children`, or a named slot prop,
and the container supplies it. That keeps the leaf renderable with a stub.

**Copy is data.** UI text lives in `*Vocabulary.ts` and arrives as a `copy`
prop. Currency and date formatting are pure functions over that vocabulary, so
they are testable without rendering anything. The domain has no opinion about
`€` or about which locale groups thousands with a space, and neither does JSX.

**Formatting never happens in the domain.** `Money` is integer cents;
`toEuros` exists for charts and inputs only.

## The rule that follows from it

**No `vi.mock` of hooks. No `vi.hoisted`. No `createRoot`.**

A component that needs its hooks mocked is a component that should have been a
leaf taking props. If a test reaches for `vi.mock`, the fix is in the component,
not the test.

## Tests

`*.browser.unit.test.tsx`, in a real browser. Assert through roles and
accessible names — `screen.getByRole("heading", { name: /…/ })` — never through
DOM nodes, `container`, or test ids. Interactions go through `userEvent`, not
`fireEvent`, so the full event sequence a real person produces actually runs.
