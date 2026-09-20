import { Result } from "effect"
import { describe, expect, it } from "vitest"

import { compare } from "@/modules/trajectory/core/domain/PlanVariance"
import { project } from "@/modules/trajectory/core/domain/ProjectionEngine"
import { averageMonthlyNet } from "@/modules/trajectory/core/domain/Shortfall"
import {
  curveOf,
  plotted,
  TICK_COUNT,
  ticks
} from "@/modules/trajectory/core/domain/TrajectoryCurve"
import * as CashFlow from "@/shared/domain/CashFlow"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import * as YearMonth from "@/shared/domain/YearMonth"

const euros = (value: number) => Result.getOrThrow(Money.fromEuros(value))
const ym = (iso: string) => Result.getOrThrow(YearMonth.parse(iso))

const monthly = (from: string, count: number, amount: number, kind = "salary") =>
  Array.from({ length: count }, (_, index) =>
    CashFlow.make({
      date: LocalDate.lastDayOf(YearMonth.addMonths(ym(from), index)),
      amount: euros(amount),
      sourceId: kind,
      sourceKind: kind
    })
  )

const steady = () =>
  project({
    cashFlows: monthly("2026-01", 24, 1_000),
    startingCapital: Money.zero,
    target: euros(6_000),
    from: ym("2026-01")
  })

describe("the trajectory curve", () => {
  it("rises in equal steps when the monthly net is equal (TRJ-07)", () => {
    const curve = curveOf(steady(), ym("2026-01"))
    const savings = curve.points.map((point) => Money.toEuros(point.savings))

    // Straight, not convex: no investment return is modelled, so a curve that
    // bent upward here would be telling the household their money compounds.
    const steps = savings.slice(1).map((value, index) => value - savings[index]!)
    expect(new Set(steps)).toStrictEqual(new Set([1_000]))
  })

  it("bends only where an event lands", () => {
    const withTax = project({
      cashFlows: [...monthly("2026-01", 12, 1_000), ...monthly("2026-03", 1, -500, "tax")],
      startingCapital: Money.zero,
      target: euros(20_000),
      from: ym("2026-01")
    })

    const savings = curveOf(withTax, ym("2026-01")).points.map((point) =>
      Money.toEuros(point.savings)
    )
    const steps = savings.slice(1).map((value, index) => value - savings[index]!)

    expect(new Set(steps)).toStrictEqual(new Set([1_000, 500]))
  })

  it("marks months up to today as recorded and the rest as forecast", () => {
    const curve = curveOf(steady(), ym("2026-03"))

    expect(curve.points.filter((point) => point.recorded)).toHaveLength(3)
    expect(curve.points.filter((point) => !point.recorded)).toHaveLength(3)
  })

  it("marks where the forecast crosses the goal", () => {
    const curve = curveOf(steady(), ym("2026-01"))

    expect(curve.crossesAt).toBe(ym("2026-06"))
  })

  it("has no crossing where the goal is never reached", () => {
    const falling = project({
      cashFlows: monthly("2026-01", 12, -400, "rent"),
      startingCapital: euros(1_000),
      target: euros(50_000),
      from: ym("2026-01")
    })

    expect(curveOf(falling, ym("2026-01")).crossesAt).toBeUndefined()
  })

  it("includes the goal in its range, so the goal line is always on the chart", () => {
    const curve = curveOf(steady(), ym("2026-01"))

    expect(Money.isGreaterThanOrEqualTo(curve.highest, curve.target)).toBe(true)
  })
})

describe("plotting the curve", () => {
  const area = { width: 600, height: 200 }

  it("spreads the months evenly across the width", () => {
    const plots = plotted(curveOf(steady(), ym("2026-01")), area)
    const gaps = plots.slice(1).map((plot, index) => plot.x - plots[index]!.x)

    expect(new Set(gaps.map((gap) => Math.round(gap)))).toHaveLength(1)
  })

  it("keeps every point inside the plot area", () => {
    const plots = plotted(curveOf(steady(), ym("2026-01")), area)

    // The range spans the starting balance and the goal as well as the
    // points, so the goal line and the opening figure are always on the chart.
    expect(Math.max(...plots.map((plot) => plot.y))).toBeLessThanOrEqual(area.height)
    expect(Math.min(...plots.map((plot) => plot.y))).toBeGreaterThanOrEqual(0)
  })

  it("draws a flat line rather than dividing by zero when nothing moves", () => {
    const flat = project({
      cashFlows: [],
      startingCapital: euros(5_000),
      target: euros(5_000),
      from: ym("2026-01")
    })

    const plots = plotted(curveOf(flat, ym("2026-01")), area)
    expect(plots.every((plot) => Number.isFinite(plot.y))).toBe(true)
  })

  it("uses the same number of ticks whatever the data, so two charts compare", () => {
    expect(ticks(curveOf(steady(), ym("2026-01")))).toHaveLength(TICK_COUNT)
  })
})

describe("the monthly shortfall", () => {
  it("is the average, not the last month, so one tax payment does not distort it", () => {
    const withTax = project({
      cashFlows: [...monthly("2026-01", 5, 1_000), ...monthly("2026-05", 1, -4_000, "tax")],
      startingCapital: Money.zero,
      target: euros(100_000),
      from: ym("2026-01")
    })

    // Four months of +€1,000 then one of −€3,000 averages to €200. Reporting
    // the last month instead would claim a €3,000 monthly shortfall.
    expect(averageMonthlyNet(withTax)).toBe(euros(200))
  })

  it("is negative where the household is losing ground (TRJ-09)", () => {
    const falling = project({
      cashFlows: monthly("2026-01", 12, -400, "rent"),
      startingCapital: euros(1_000),
      target: euros(50_000),
      from: ym("2026-01")
    })

    expect(averageMonthlyNet(falling)).toBe(euros(-400))
  })
})

describe("ahead of or behind plan", () => {
  it("reads €29,500 expected against €28,000 actual as €1,500 behind (TRJ-05)", () => {
    const variance = compare(euros(29_500), euros(28_000), ym("2028-10"), ym("2028-11"))

    expect(variance.standing).toBe("behind")
    expect(Money.toEuros(variance.difference)).toBe(-1_500)
  })

  it("states the movement in months as well as in money", () => {
    const variance = compare(euros(29_500), euros(28_000), ym("2028-10"), ym("2028-11"))

    expect(variance.monthsMoved).toBe(1)
  })

  it("reports being ahead as a positive difference and an earlier date", () => {
    const variance = compare(euros(29_500), euros(31_000), ym("2028-10"), ym("2028-08"))

    expect(variance.standing).toBe("ahead")
    expect(variance.monthsMoved).toBe(-2)
  })

  it("says on-plan rather than picking a side when they match exactly", () => {
    expect(compare(euros(29_500), euros(29_500), ym("2028-10"), ym("2028-10")).standing).toBe(
      "on-plan"
    )
  })

  it("has no movement to report when either projection reaches no date", () => {
    expect(
      compare(euros(29_500), euros(28_000), ym("2028-10"), undefined).monthsMoved
    ).toBeUndefined()
  })
})
