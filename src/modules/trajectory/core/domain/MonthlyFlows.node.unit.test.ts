import { Result } from "effect"
import { describe, expect, it } from "vitest"

import { groupByMonth, groupOver, netOf } from "@/modules/trajectory/core/domain/MonthlyFlows"
import * as CashFlow from "@/shared/domain/CashFlow"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import * as YearMonth from "@/shared/domain/YearMonth"

const euros = (value: number) => Result.getOrThrow(Money.fromEuros(value))
const ym = (iso: string) => Result.getOrThrow(YearMonth.parse(iso))
const date = (iso: string) => Result.getOrThrow(LocalDate.parse(iso))

const flow = (iso: string, amount: number, kind = "salary") =>
  CashFlow.make({
    date: date(iso),
    amount: euros(amount),
    sourceId: `${kind}-1`,
    sourceKind: kind
  })

describe("grouping cash flows into months", () => {
  it("sums positives and negatives separately (spec §30)", () => {
    const months = groupOver(
      [flow("2026-01-15", 3_000), flow("2026-01-28", -1_200, "rent")],
      ym("2026-01"),
      ym("2026-01")
    )

    expect(months.map((month) => Money.toEuros(month.income))).toStrictEqual([3_000])
    expect(months.map((month) => Money.toEuros(month.commitments))).toStrictEqual([-1_200])
  })

  it("adds them into a net, since commitments arrive negative", () => {
    const [month] = groupOver(
      [flow("2026-01-15", 3_000), flow("2026-01-28", -1_200)],
      ym("2026-01"),
      ym("2026-01")
    )

    expect(Money.toEuros(netOf(month!))).toBe(1_800)
  })

  it("keeps a month with nothing in it, as a zero rather than a gap (TRJ-02)", () => {
    const months = groupOver([flow("2026-03-15", 1_000)], ym("2026-01"), ym("2026-03"))

    expect(months.map((month) => YearMonth.toIso(month.month))).toStrictEqual([
      "2026-01",
      "2026-02",
      "2026-03"
    ])
    expect(months.map((month) => Money.toEuros(netOf(month)))).toStrictEqual([0, 0, 1_000])
  })

  it("keeps each month's own flows, so a row can be explained (spec §31)", () => {
    const months = groupOver(
      [flow("2026-01-15", 3_000), flow("2026-01-28", -1_200, "rent")],
      ym("2026-01"),
      ym("2026-01")
    )

    expect(months[0]?.flows.map((each) => each.sourceKind)).toStrictEqual(["salary", "rent"])
  })

  it("ignores flows outside the range asked for", () => {
    const months = groupOver(
      [flow("2025-12-31", 9_999), flow("2026-01-15", 3_000)],
      ym("2026-01"),
      ym("2026-01")
    )

    expect(months.map((month) => Money.toEuros(month.income))).toStrictEqual([3_000])
  })

  it("puts a flow in the month of its own date, whatever the host timezone", () => {
    const original = process.env["TZ"]
    try {
      const grouped = ["UTC", "America/Los_Angeles", "Pacific/Kiritimati"].map((zone) => {
        process.env["TZ"] = zone
        return [...groupByMonth([flow("2026-01-01", 1_000), flow("2026-12-31", 1_000)]).keys()]
      })

      for (const other of grouped.slice(1)) expect(other).toStrictEqual(grouped[0])
      expect(grouped[0]?.map(YearMonth.toIso)).toStrictEqual(["2026-01", "2026-12"])
    } finally {
      process.env["TZ"] = original
    }
  })
})
