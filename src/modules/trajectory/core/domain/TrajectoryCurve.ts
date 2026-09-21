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
 *
 * **The vertical domain always includes nought.** A savings chart drawn from
 * its own minimum exaggerates every slope, because the first pixel of height
 * is already tens of thousands of euros. Anchoring at nought is what makes the
 * gradient mean what it looks like it means. A household in deficit still gets
 * a floor below its own lowest point, so nothing is clipped.
 */
import { Data } from "effect"

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

export interface RecordedPoint {
  readonly month: YearMonth.YearMonth
  readonly amount: Money.Money
}

/**
 * `recorded` are the balances the household actually typed in; the projection
 * supplies everything from today forward.
 *
 * They are kept apart because only the first kind is a fact. Running the
 * engine backwards to fill in history would reconstruct it from today's
 * configuration, and drawing *that* as a solid line would present a
 * reconstruction as a record.
 */
export const curveOf = (
  result: ProjectionResult,
  today: YearMonth.YearMonth,
  recorded: ReadonlyArray<RecordedPoint> = []
): TrajectoryCurve => {
  const past = recorded
    .filter((point) => YearMonth.isBefore(point.month, today))
    .sort((a, b) => YearMonth.Order(a.month, b.month))
    .map((point) => new CurvePoint({ month: point.month, savings: point.amount, recorded: true }))

  const points = [
    ...past,
    ...result.months.map(
      (month) =>
        new CurvePoint({
          month: month.month,
          savings: month.endingSavings,
          recorded: !YearMonth.isAfter(month.month, today)
        })
    )
  ]

  const savings = points.map((point) => point.savings)
  const all = [...savings, result.targetAmount, result.startingSavings, Money.zero]

  return new TrajectoryCurve({
    points,
    target: result.targetAmount,
    crossesAt: crossing(points, result.targetAmount),
    lowest: all.reduce(Money.min, all[0] ?? Money.zero),
    highest: all.reduce(Money.max, all[0] ?? Money.zero)
  })
}
