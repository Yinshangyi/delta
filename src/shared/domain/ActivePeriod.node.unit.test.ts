import { Result } from "effect"
import { describe, expect, it } from "vitest"

import * as ActivePeriod from "@/shared/domain/ActivePeriod"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as YearMonth from "@/shared/domain/YearMonth"

const date = (iso: string) => Result.getOrThrow(LocalDate.parse(iso))
const ym = (iso: string) => Result.getOrThrow(YearMonth.parse(iso))
const period = (start: string, end?: string) =>
  Result.getOrThrow(ActivePeriod.make(date(start), end === undefined ? undefined : date(end)))

describe("an active period", () => {
  it("refuses to end before it starts", () => {
    expect(Result.isFailure(ActivePeriod.make(date("2026-06-01"), date("2026-05-31")))).toBe(true)
  })

  it("allows a period that starts and ends the same day", () => {
    expect(Result.isSuccess(ActivePeriod.make(date("2026-06-01"), date("2026-06-01")))).toBe(true)
  })

  it("counts the month it starts in, even part-way through", () => {
    expect(ActivePeriod.includes(period("2026-04-20"), ym("2026-04"))).toBe(true)
  })

  it("counts the month it ends in, even part-way through", () => {
    expect(ActivePeriod.includes(period("2026-01-01", "2026-03-15"), ym("2026-03"))).toBe(true)
  })

  it("excludes the month after it ends", () => {
    expect(ActivePeriod.includes(period("2026-01-01", "2026-03-15"), ym("2026-04"))).toBe(false)
  })

  it("runs on without an end date, bounded only by what is asked of it", () => {
    expect(ActivePeriod.monthsIn(period("2026-01-01"), ym("2026-01"), ym("2026-12"))).toHaveLength(
      12
    )
  })

  it("returns the months it overlaps, in order", () => {
    const months = ActivePeriod.monthsIn(
      period("2026-02-10", "2026-04-02"),
      ym("2026-01"),
      ym("2026-06")
    )

    expect(months.map(YearMonth.toIso)).toStrictEqual(["2026-02", "2026-03", "2026-04"])
  })
})
