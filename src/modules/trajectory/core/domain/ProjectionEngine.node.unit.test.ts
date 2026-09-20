import { Result } from "effect"
import { describe, expect, it } from "vitest"

import { DEFAULT_HORIZON_MONTHS, project } from "@/modules/trajectory/core/domain/ProjectionEngine"
import { NotReachable, Reachable } from "@/modules/trajectory/core/domain/ProjectionResult"
import * as CashFlow from "@/shared/domain/CashFlow"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import * as YearMonth from "@/shared/domain/YearMonth"

const euros = (value: number) => Result.getOrThrow(Money.fromEuros(value))
const ym = (iso: string) => Result.getOrThrow(YearMonth.parse(iso))
const date = (iso: string) => Result.getOrThrow(LocalDate.parse(iso))

const flow = (iso: string, amount: number, kind = "salary") =>
  new CashFlow.CashFlow({
    date: date(iso),
    amount: euros(amount),
    sourceId: `${kind}-1`,
    sourceKind: kind
  })

const monthly = (from: string, count: number, amount: number, kind?: string) =>
  Array.from({ length: count }, (_, index) =>
    flow(`${YearMonth.toIso(YearMonth.addMonths(ym(from), index))}-01`, amount, kind)
  )

describe("the projection engine", () => {
  it("never subtracts outstanding debt from the opening balance (spec §77)", () => {
    const owed = 7_200
    const repayments = monthly("2026-01", 12, -600, "debt")
    const income = monthly("2026-01", 12, 2_000)

    const gross = project({
      cashFlows: [...income, ...repayments],
      startingCapital: euros(10_000),
      target: euros(20_000),
      from: ym("2026-01")
    })

    // What netting the balance off as well would have produced.
    const doubleCounted = project({
      cashFlows: [...income, ...repayments],
      startingCapital: euros(10_000 - owed),
      target: euros(20_000),
      from: ym("2026-01")
    })

    expect(gross.status._tag).toBe("Reachable")
    expect(doubleCounted.status._tag).toBe("NotReachable")
  })

  it("adds commitments rather than subtracting them, since they arrive negative", () => {
    const result = project({
      cashFlows: [flow("2026-01-15", 3_000), flow("2026-01-28", -1_200, "rent")],
      startingCapital: Money.zero,
      target: euros(1_800),
      from: ym("2026-01")
    })

    const first = result.months[0]
    expect(first?.income).toBe(euros(3_000))
    expect(first?.commitments).toBe(euros(-1_200))
    expect(first?.netCashFlow).toBe(euros(1_800))
    expect(first?.endingSavings).toBe(euros(1_800))
  })

  it("carries each month's ending savings into the next month's start", () => {
    const result = project({
      cashFlows: monthly("2026-01", 3, 1_000),
      startingCapital: euros(500),
      target: euros(3_500),
      from: ym("2026-01")
    })

    expect(result.months.map((month) => Money.toEuros(month.startingSavings))).toStrictEqual([
      500, 1_500, 2_500
    ])
    expect(result.months.map((month) => Money.toEuros(month.endingSavings))).toStrictEqual([
      1_500, 2_500, 3_500
    ])
  })

  it("stops at the first month that reaches the target, not the one after", () => {
    const result = project({
      cashFlows: monthly("2026-01", 12, 1_000),
      startingCapital: Money.zero,
      target: euros(3_000),
      from: ym("2026-01")
    })

    expect(result.months).toHaveLength(3)
    expect(result.status).toStrictEqual(
      new Reachable({ targetDate: date("2026-03-31"), monthsRemaining: 3 })
    )
  })

  it("treats exactly the target as reached, not as short by a cent", () => {
    const result = project({
      cashFlows: [flow("2026-01-01", 1_000)],
      startingCapital: Money.zero,
      target: euros(1_000),
      from: ym("2026-01")
    })

    expect(result.status._tag).toBe("Reachable")
  })

  it("keeps the flows that produced a month, not only its totals (spec §31)", () => {
    const result = project({
      cashFlows: [flow("2026-01-15", 3_000), flow("2026-01-28", -1_200, "rent")],
      startingCapital: Money.zero,
      target: euros(1_800),
      from: ym("2026-01")
    })

    expect(result.months[0]?.cashFlows.map((each) => each.sourceKind)).toStrictEqual([
      "salary",
      "rent"
    ])
  })

  it("reports a permanently negative trajectory as unreachable instead of looping", () => {
    const result = project({
      cashFlows: monthly("2026-01", 24, -400, "rent"),
      startingCapital: euros(1_000),
      target: euros(50_000),
      from: ym("2026-01")
    })

    expect(result.status).toStrictEqual(new NotReachable({ reason: "flows-exhausted" }))
  })

  it("stops once the flows run out rather than filling the horizon with empty months", () => {
    const result = project({
      cashFlows: monthly("2026-01", 6, 100),
      startingCapital: Money.zero,
      target: euros(50_000),
      from: ym("2026-01")
    })

    expect(result.months).toHaveLength(6)
  })

  it("honours a horizon shorter than the flows that would eventually get there", () => {
    const result = project({
      cashFlows: monthly("2026-01", 60, 1_000),
      startingCapital: Money.zero,
      target: euros(50_000),
      from: ym("2026-01"),
      horizonMonths: 12
    })

    expect(result.status).toStrictEqual(new NotReachable({ reason: "horizon" }))
    expect(result.months).toHaveLength(12)
  })

  it("defaults the horizon to fifty years", () => {
    expect(DEFAULT_HORIZON_MONTHS).toBe(50 * 12)
  })

  it("reaches the target in the opening month when the capital is already there", () => {
    const result = project({
      cashFlows: [],
      startingCapital: euros(30_000),
      target: euros(20_000),
      from: ym("2026-01")
    })

    expect(result.months).toHaveLength(1)
    expect(result.status._tag).toBe("Reachable")
  })

  it("passes through a month with no flows at all without losing the balance", () => {
    const result = project({
      cashFlows: [flow("2026-01-10", 1_000), flow("2026-03-10", 1_000)],
      startingCapital: Money.zero,
      target: euros(2_000),
      from: ym("2026-01")
    })

    expect(result.months.map((month) => Money.toEuros(month.endingSavings))).toStrictEqual([
      1_000, 1_000, 2_000
    ])
  })
})
