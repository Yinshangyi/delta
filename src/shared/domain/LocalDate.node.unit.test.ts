import { Result } from "effect"
import * as fc from "fast-check"
import { afterAll, describe, expect, it } from "vitest"

import * as LocalDate from "@/shared/domain/LocalDate"
import * as YearMonth from "@/shared/domain/YearMonth"

const date = (iso: string): LocalDate.LocalDate => Result.getOrThrow(LocalDate.parse(iso))

const failure = <A, E>(result: Result.Result<A, E>): E => Result.getOrThrow(Result.flip(result))

/** Built from parts rather than `fc.date`, so the tests use no `Date` either. */
const anyDate = fc
  .tuple(
    fc.integer({ min: 1900, max: 2200 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 31 })
  )
  .map(([year, month, day]) => {
    const inMonth = Result.getOrThrow(YearMonth.fromParts(year, month))
    const clamped = Math.min(day, YearMonth.daysInMonth(inMonth))
    return Result.getOrThrow(LocalDate.fromParts(year, month, clamped))
  })

describe("construction", () => {
  it("renders as a zero-padded ISO date", () => {
    expect(LocalDate.toIso(Result.getOrThrow(LocalDate.fromParts(2026, 9, 4)))).toBe("2026-09-04")
  })

  it("rejects a day the month does not have, rather than clamping it", () => {
    expect(failure(LocalDate.fromParts(2026, 2, 30)).reason).toBe("not-a-calendar-date")
    expect(failure(LocalDate.fromParts(2026, 4, 31)).reason).toBe("not-a-calendar-date")
    expect(failure(LocalDate.fromParts(2026, 13, 1)).reason).toBe("not-a-calendar-date")
  })

  it("accepts 29 February in a leap year and rejects it otherwise", () => {
    expect(LocalDate.toIso(Result.getOrThrow(LocalDate.fromParts(2024, 2, 29)))).toBe("2024-02-29")
    expect(failure(LocalDate.fromParts(2026, 2, 29)).reason).toBe("not-a-calendar-date")
  })

  it("rejects malformed strings", () => {
    expect(failure(LocalDate.parse("2026-9-4")).reason).toBe("malformed")
    expect(failure(LocalDate.parse("nonsense")).reason).toBe("malformed")
  })

  it("rejects a timestamp, which Temporal would silently truncate to its date", () => {
    expect(failure(LocalDate.parse("2026-09-14T10:00:00")).reason).toBe("malformed")
  })

  it("rejects a well-formed string that is not a real date", () => {
    expect(failure(LocalDate.parse("2026-02-30")).reason).toBe("not-a-calendar-date")
  })

  it("round-trips through its ISO form", () => {
    fc.assert(
      fc.property(anyDate, (value) => {
        expect(Result.getOrThrow(LocalDate.parse(LocalDate.toIso(value)))).toBe(value)
      })
    )
  })
})

describe("addMonths", () => {
  it("clamps 31 January to the last day of February", () => {
    expect(LocalDate.addMonths(date("2026-01-31"), 1)).toBe("2026-02-28")
    expect(LocalDate.addMonths(date("2024-01-31"), 1)).toBe("2024-02-29")
  })

  it("clamps going backwards too", () => {
    expect(LocalDate.addMonths(date("2026-03-31"), -1)).toBe("2026-02-28")
  })

  it("does not restore the original day once clamped", () => {
    // 31 Jan -> 28 Feb -> 28 Mar. Calendar arithmetic is not reversible.
    expect(LocalDate.addMonths(LocalDate.addMonths(date("2026-01-31"), 1), 1)).toBe("2026-03-28")
  })

  it("rolls over a year boundary", () => {
    expect(LocalDate.addMonths(date("2026-11-15"), 3)).toBe("2027-02-15")
  })

  it("is the identity for zero", () => {
    expect(LocalDate.addMonths(date("2026-09-04"), 0)).toBe("2026-09-04")
  })

  it("stays within the target month", () => {
    fc.assert(
      fc.property(anyDate, fc.integer({ min: -600, max: 600 }), (start, offset) => {
        const moved = LocalDate.addMonths(start, offset)
        const expected = YearMonth.addMonths(LocalDate.toYearMonth(start), offset)
        expect(LocalDate.toYearMonth(moved)).toBe(expected)
      })
    )
  })
})

describe("month boundaries", () => {
  it("converts to the containing month", () => {
    expect(LocalDate.toYearMonth(date("2026-09-04"))).toBe("2026-09")
  })

  it("finds the last day of a month", () => {
    expect(LocalDate.lastDayOf(Result.getOrThrow(YearMonth.parse("2026-09")))).toBe("2026-09-30")
    expect(LocalDate.lastDayOf(Result.getOrThrow(YearMonth.parse("2026-12")))).toBe("2026-12-31")
  })

  it("finds the last day of February in both leap and common years", () => {
    expect(LocalDate.lastDayOf(Result.getOrThrow(YearMonth.parse("2024-02")))).toBe("2024-02-29")
    expect(LocalDate.lastDayOf(Result.getOrThrow(YearMonth.parse("2026-02")))).toBe("2026-02-28")
  })

  it("always lands inside the month asked for, and is a real date", () => {
    fc.assert(
      fc.property(anyDate, (value) => {
        const containing = LocalDate.toYearMonth(value)
        const last = LocalDate.lastDayOf(containing)
        expect(LocalDate.toYearMonth(last)).toBe(containing)
        expect(Result.isSuccess(LocalDate.parse(LocalDate.toIso(last)))).toBe(true)
      })
    )
  })
})

describe("comparison", () => {
  it("orders chronologically", () => {
    expect(LocalDate.isBefore(date("2026-09-04"), date("2026-09-05"))).toBe(true)
    expect(LocalDate.isAfter(date("2027-01-01"), date("2026-12-31"))).toBe(true)
    expect(LocalDate.equals(date("2026-09-04"), date("2026-09-04"))).toBe(true)
  })

  it("sorts chronologically", () => {
    expect(
      [date("2026-10-01"), date("2026-02-28"), date("2025-12-31")].sort(LocalDate.Order)
    ).toStrictEqual(["2025-12-31", "2026-02-28", "2026-10-01"])
  })
})

describe("timezone independence", () => {
  const original = process.env["TZ"]
  afterAll(() => {
    process.env["TZ"] = original
  })

  // Ahead of UTC, behind it, and one that sits a whole calendar day ahead.
  const zones = ["UTC", "Asia/Manila", "America/Los_Angeles", "Pacific/Kiritimati"]

  /** A year of month-ends, the shape a projection walks. */
  const monthEnds = (): ReadonlyArray<string> => {
    const start = date("2026-01-31")
    return Array.from({ length: 14 }, (_, offset) =>
      LocalDate.toIso(LocalDate.addMonths(start, offset))
    )
  }

  it("produces identical results under every zone", () => {
    const results = zones.map((zone) => {
      process.env["TZ"] = zone
      return {
        months: monthEnds(),
        parsed: LocalDate.toIso(date("2026-03-01")),
        lastFeb: LocalDate.lastDayOf(Result.getOrThrow(YearMonth.parse("2024-02")))
      }
    })

    for (const other of results.slice(1)) {
      expect(other).toStrictEqual(results[0])
    }
  })

  it("never consults the host clock", () => {
    // A guard against someone reaching for Date.now() or new Date() later.
    expect(LocalDate.toIso(date("2026-03-01"))).toBe("2026-03-01")
    expect(monthEnds()[1]).toBe("2026-02-28")
  })
})
