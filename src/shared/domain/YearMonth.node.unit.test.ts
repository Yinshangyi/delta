import { Result } from "effect"
import * as fc from "fast-check"
import { describe, expect, it } from "vitest"

import * as YearMonth from "@/shared/domain/YearMonth"

const ym = (iso: string): YearMonth.YearMonth => Result.getOrThrow(YearMonth.parse(iso))

const failure = <A, E>(result: Result.Result<A, E>): E => Result.getOrThrow(Result.flip(result))

const anyYearMonth = fc
  .tuple(fc.integer({ min: 1900, max: 2200 }), fc.integer({ min: 1, max: 12 }))
  .map(([y, m]) => Result.getOrThrow(YearMonth.fromParts(y, m)))

describe("construction", () => {
  it("renders as a zero-padded ISO month", () => {
    expect(YearMonth.toIso(Result.getOrThrow(YearMonth.fromParts(2026, 9)))).toBe("2026-09")
    expect(YearMonth.toIso(Result.getOrThrow(YearMonth.fromParts(7, 1)))).toBe("0007-01")
  })

  it("rejects a month outside 1-12", () => {
    expect(failure(YearMonth.fromParts(2026, 0)).reason).toBe("out-of-range")
    expect(failure(YearMonth.fromParts(2026, 13)).reason).toBe("out-of-range")
  })

  it("rejects malformed strings", () => {
    expect(failure(YearMonth.parse("2026-9")).reason).toBe("malformed")
    expect(failure(YearMonth.parse("2026")).reason).toBe("malformed")
    expect(failure(YearMonth.parse("")).reason).toBe("malformed")
  })

  it("rejects a date, which Temporal would silently truncate to its month", () => {
    expect(failure(YearMonth.parse("2026-09-14")).reason).toBe("malformed")
  })

  it("rejects a well-formed string with an impossible month", () => {
    expect(failure(YearMonth.parse("2026-13")).reason).toBe("out-of-range")
  })

  it("round-trips through its ISO form", () => {
    fc.assert(
      fc.property(anyYearMonth, (value) => {
        expect(Result.getOrThrow(YearMonth.parse(YearMonth.toIso(value)))).toBe(value)
      })
    )
  })
})

describe("addMonths", () => {
  it("rolls over a year boundary", () => {
    expect(YearMonth.addMonths(ym("2026-11"), 3)).toBe("2027-02")
    expect(YearMonth.addMonths(ym("2026-02"), -3)).toBe("2025-11")
  })

  it("is the identity for zero", () => {
    expect(YearMonth.addMonths(ym("2026-09"), 0)).toBe("2026-09")
  })

  it("composes additively", () => {
    fc.assert(
      fc.property(anyYearMonth, fc.integer({ min: -600, max: 600 }), (start, offset) => {
        expect(YearMonth.addMonths(YearMonth.addMonths(start, offset), -offset)).toBe(start)
      })
    )
  })
})

describe("monthsBetween", () => {
  it("counts forward and backward", () => {
    expect(YearMonth.monthsBetween(ym("2026-01"), ym("2026-12"))).toBe(11)
    expect(YearMonth.monthsBetween(ym("2026-12"), ym("2026-01"))).toBe(-11)
    expect(YearMonth.monthsBetween(ym("2026-09"), ym("2026-09"))).toBe(0)
  })

  it("counts months, not years and months", () => {
    // Temporal's until() defaults to a largestUnit of years, which reports 2.
    expect(YearMonth.monthsBetween(ym("2026-01"), ym("2027-03"))).toBe(14)
  })

  it("inverts addMonths", () => {
    fc.assert(
      fc.property(anyYearMonth, fc.integer({ min: -600, max: 600 }), (start, offset) => {
        expect(YearMonth.monthsBetween(start, YearMonth.addMonths(start, offset))).toBe(offset)
      })
    )
  })
})

describe("range", () => {
  it("includes both ends", () => {
    expect(YearMonth.range(ym("2026-11"), ym("2027-02"))).toStrictEqual([
      "2026-11",
      "2026-12",
      "2027-01",
      "2027-02"
    ])
  })

  it("is a single month when both ends are equal", () => {
    expect(YearMonth.range(ym("2026-09"), ym("2026-09"))).toStrictEqual(["2026-09"])
  })

  it("is empty when the end precedes the start", () => {
    expect(YearMonth.range(ym("2026-09"), ym("2026-08"))).toStrictEqual([])
  })

  it("has one entry per month spanned", () => {
    fc.assert(
      fc.property(anyYearMonth, fc.integer({ min: 0, max: 600 }), (start, span) => {
        expect(YearMonth.range(start, YearMonth.addMonths(start, span))).toHaveLength(span + 1)
      })
    )
  })
})

describe("daysInMonth", () => {
  it("knows the length of each month", () => {
    expect(YearMonth.daysInMonth(ym("2026-01"))).toBe(31)
    expect(YearMonth.daysInMonth(ym("2026-04"))).toBe(30)
    expect(YearMonth.daysInMonth(ym("2026-02"))).toBe(28)
  })

  it("knows February in a leap year", () => {
    expect(YearMonth.daysInMonth(ym("2024-02"))).toBe(29)
    expect(YearMonth.daysInMonth(ym("2000-02"))).toBe(29)
    expect(YearMonth.daysInMonth(ym("1900-02"))).toBe(28)
  })
})

describe("comparison", () => {
  it("orders chronologically", () => {
    expect(YearMonth.isBefore(ym("2026-09"), ym("2026-10"))).toBe(true)
    expect(YearMonth.isAfter(ym("2027-01"), ym("2026-12"))).toBe(true)
    expect(YearMonth.equals(ym("2026-09"), ym("2026-09"))).toBe(true)
  })

  it("sorts chronologically, not lexically by accident", () => {
    expect([ym("2026-10"), ym("2026-02"), ym("2025-12")].sort(YearMonth.Order)).toStrictEqual([
      "2025-12",
      "2026-02",
      "2026-10"
    ])
  })

  it("agrees with monthsBetween", () => {
    fc.assert(
      fc.property(anyYearMonth, anyYearMonth, (a, b) => {
        expect(YearMonth.isBefore(a, b)).toBe(YearMonth.monthsBetween(a, b) > 0)
      })
    )
  })
})
