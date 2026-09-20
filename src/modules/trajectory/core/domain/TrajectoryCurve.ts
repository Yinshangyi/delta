/**
 * The projection as points on a chart (TRJ-07), computed rather than drawn.
 *
 * **The curve is linear between events, and that is a correctness matter, not
 * a styling one.** A smooth convex curve tells the household their money
 * compounds. It does not: Delta models no investment return, so every bend in
 * this line comes from a debt being paid off or a tax payment landing. Joining
 * the monthly points with straight segments is the only honest shape.
 *
 * Past and future are separated here rather than in the component so the
 * distinction survives into a test: recorded months are solid, forecast months
 * are not, and the split is a property of the data.
 */
import { Data, Result } from "effect"

import * as Money from "@/shared/domain/Money"
import * as YearMonth from "@/shared/domain/YearMonth"

import type { ProjectionResult } from "@/modules/trajectory/core/domain/ProjectionResult"

export class CurvePoint extends Data.Class<{
  readonly month: YearMonth.YearMonth
  readonly savings: Money.Money
  /** True up to and including the month the household is currently in. */
  readonly recorded: boolean
}> {}

export class TrajectoryCurve extends Data.Class<{
  readonly points: ReadonlyArray<CurvePoint>
  readonly target: Money.Money
  /** The month the forecast crosses the goal line, where it does. */
  readonly crossesAt: YearMonth.YearMonth | undefined
  readonly lowest: Money.Money
  readonly highest: Money.Money
}> {}

const crossing = (
  points: ReadonlyArray<CurvePoint>,
  target: Money.Money
): YearMonth.YearMonth | undefined =>
  points.find((point) => Money.isGreaterThanOrEqualTo(point.savings, target))?.month

export const curveOf = (result: ProjectionResult, today: YearMonth.YearMonth): TrajectoryCurve => {
  const points = result.months.map(
    (month) =>
      new CurvePoint({
        month: month.month,
        savings: month.endingSavings,
        recorded: !YearMonth.isAfter(month.month, today)
      })
  )

  const savings = points.map((point) => point.savings)
  const all = [...savings, result.targetAmount, result.startingSavings]

  return new TrajectoryCurve({
    points,
    target: result.targetAmount,
    crossesAt: crossing(points, result.targetAmount),
    lowest: all.reduce(Money.min, all[0] ?? Money.zero),
    highest: all.reduce(Money.max, all[0] ?? Money.zero)
  })
}

export class Plot extends Data.Class<{
  readonly x: number
  readonly y: number
}> {}

export interface PlotArea {
  readonly width: number
  readonly height: number
}

/**
 * Points into chart coordinates. Separated from the SVG so the geometry — not
 * the markup — is what a test checks.
 */
export const plotted = (curve: TrajectoryCurve, area: PlotArea): ReadonlyArray<Plot> => {
  const count = curve.points.length
  const span = Money.toCents(curve.highest) - Money.toCents(curve.lowest)

  return curve.points.map((point, index) => {
    const ratio =
      span === 0 ? 0.5 : (Money.toCents(point.savings) - Money.toCents(curve.lowest)) / span
    return new Plot({
      x: count <= 1 ? 0 : (index / (count - 1)) * area.width,
      y: area.height - ratio * area.height
    })
  })
}

export const plotOfAmount = (
  curve: TrajectoryCurve,
  amount: Money.Money,
  area: PlotArea
): number => {
  const span = Money.toCents(curve.highest) - Money.toCents(curve.lowest)
  const ratio = span === 0 ? 0.5 : (Money.toCents(amount) - Money.toCents(curve.lowest)) / span
  return area.height - ratio * area.height
}

/**
 * Ticks at a fixed count rather than a data-dependent one, so every instance
 * of the chart carries the same interval (TRJ-07) and two charts can be read
 * against each other.
 */
export const TICK_COUNT = 5

export const ticks = (curve: TrajectoryCurve): ReadonlyArray<Money.Money> => {
  const low = Money.toCents(curve.lowest)
  const step = (Money.toCents(curve.highest) - low) / (TICK_COUNT - 1)

  return Array.from({ length: TICK_COUNT }, (_, index) =>
    Money.fromCents(Math.round(low + step * index))
  ).flatMap((result) => {
    const value = Result.getOrUndefined(result)
    return value === undefined ? [] : [value]
  })
}
