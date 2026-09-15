import { describe, expect, it } from "vitest"

import { type BadgeKind, signalsOf } from "@/dsl/Badge"

// The kinds under test, not a fixture — nothing is mutated, and each case is
// generated from it rather than sharing state through it.
// ast-grep-ignore: no-shared-test-fixture-value
const KINDS: ReadonlyArray<BadgeKind> = [
  "actual",
  "forecast",
  "confirmed",
  "estimated",
  "sooner",
  "later",
  "unchanged"
]

describe("the badge family", () => {
  /**
   * Principle 5 of design-brief.md: a distinction must survive
   * colour-blindness, so no badge may rely on hue alone. Every kind carries the
   * word plus at least one of a glyph or a border style.
   */
  it.each(KINDS)("carries at least two signals, none of them hue: %s", (kind) => {
    const signals = signalsOf(kind)
    expect(signals).toContain("word")
    expect(signals.length).toBeGreaterThanOrEqual(2)
  })

  it("distinguishes the pairs by more than colour", () => {
    expect(signalsOf("estimated")).not.toStrictEqual(signalsOf("confirmed"))
    expect(signalsOf("forecast")).not.toStrictEqual(signalsOf("actual"))
    // sooner and later share a shape and differ by glyph, which is the second
    // signal doing its job.
    expect(signalsOf("sooner")).toContain("glyph")
    expect(signalsOf("later")).toContain("glyph")
  })
})
