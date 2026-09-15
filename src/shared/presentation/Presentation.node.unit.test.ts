import { Result } from "effect"
import { afterAll, describe, expect, it } from "vitest"

import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import * as YearMonth from "@/shared/domain/YearMonth"
import { day, month } from "@/shared/presentation/DateText"
import { againstPlan, signedMoney, targetDateShift } from "@/shared/presentation/DeltaText"
import { estimated, money } from "@/shared/presentation/MoneyText"

const euros = (value: number): Money.Money => Result.getOrThrow(Money.fromEuros(value))
const cents = (value: number): Money.Money => Result.getOrThrow(Money.fromCents(value))
const ym = (iso: string): YearMonth.YearMonth => Result.getOrThrow(YearMonth.parse(iso))
const date = (iso: string): LocalDate.LocalDate => Result.getOrThrow(LocalDate.parse(iso))

describe("money", () => {
  it("drops the decimals when the cents are zero", () => {
    expect(money(euros(1_280))).toBe("€1,280")
    expect(money(euros(150_000))).toBe("€150,000")
  })

  it("keeps them when they are not", () => {
    expect(money(cents(128_050))).toBe("€1,280.50")
  })

  it("puts the sign before the symbol on a negative amount", () => {
    expect(money(euros(-1_280))).toBe("-€1,280")
  })

  it("renders zero without a sign", () => {
    expect(money(Money.zero)).toBe("€0")
  })
})

describe("an estimate", () => {
  it("carries a tilde, which is never its only signal", () => {
    expect(estimated(euros(14_000))).toBe("~€14,000")
  })
})

describe("dates", () => {
  it("names a month in full, for target dates", () => {
    expect(month(ym("2028-10"))).toBe("October 2028")
  })

  it("renders an exact date compactly, for snapshots", () => {
    expect(day(date("2026-10-31"))).toBe("31 Oct 2026")
  })

  it("does not slip across a month boundary", () => {
    expect(month(ym("2026-01"))).toBe("January 2026")
    expect(day(date("2026-01-01"))).toBe("01 Jan 2026")
  })
})

describe("dates under any host timezone", () => {
  const original = process.env["TZ"]
  afterAll(() => {
    process.env["TZ"] = original
  })

  it("render identically, because Intl is pinned to UTC", () => {
    // Without timeZone: "UTC" on the formatter, a UTC-midnight date renders as
    // the previous day here — the drift LocalDate exists to prevent.
    const rendered = ["UTC", "America/Los_Angeles", "Pacific/Kiritimati"].map((zone) => {
      process.env["TZ"] = zone
      return { month: month(ym("2028-10")), day: day(date("2026-10-31")) }
    })

    for (const other of rendered.slice(1)) expect(other).toStrictEqual(rendered[0])
    expect(rendered[0]).toStrictEqual({ month: "October 2028", day: "31 Oct 2026" })
  })
})

describe("a moved target date", () => {
  it("says which way it moved", () => {
    expect(targetDateShift(-3)).toBe("3 months sooner")
    expect(targetDateShift(2)).toBe("2 months later")
  })

  it("stays singular for one month", () => {
    expect(targetDateShift(-1)).toBe("1 month sooner")
    expect(targetDateShift(1)).toBe("1 month later")
  })

  it("says so plainly when nothing moved", () => {
    expect(targetDateShift(0)).toBe("no change")
  })
})

describe("savings against the forecast", () => {
  it("reads as information rather than as failure", () => {
    expect(againstPlan(euros(-1_500))).toBe("€1,500 behind plan")
    expect(againstPlan(euros(1_500))).toBe("€1,500 ahead of plan")
  })

  it("never renders a bare minus sign as the signal", () => {
    expect(againstPlan(euros(-1_500))).not.toContain("-")
  })

  it("says on plan when they match", () => {
    expect(againstPlan(Money.zero)).toBe("on plan")
  })
})

describe("a signed figure", () => {
  it("carries its direction for tables and chart labels", () => {
    expect(signedMoney(euros(1_280))).toBe("+€1,280")
    expect(signedMoney(euros(-1_280))).toBe("-€1,280")
  })
})
