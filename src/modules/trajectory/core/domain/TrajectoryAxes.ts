/**
 * The chart's geometry: points and amounts into coordinates, and the ticks
 * that label them (TRJ-07, APP-05).
 *
 * Separated from `TrajectoryCurve` so the markup has one place to read from
 * and the arithmetic has one place to be tested. Nothing here knows what an
 * SVG is.
 */
import { Data, Result } from "effect"

import * as Money from "@/shared/domain/Money"

import type { TrajectoryCurve } from "@/modules/trajectory/core/domain/TrajectoryCurve"
import type * as YearMonth from "@/shared/domain/YearMonth"

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

/**
 * A step a person would choose: 1, 2, 2.5 or 5 times a power of ten. An axis
 * labelled €63.8k · €94.3k · €124.8k is arithmetically correct and unreadable —
 * the label has to be a number the reader can hold while they look at the line.
 */
const niceStep = (rough: number): number => {
  if (rough <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const normalised = rough / magnitude

  const multiple = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 2.5 ? 2.5 : 5
  return multiple * magnitude
}

export const ticks = (curve: TrajectoryCurve): ReadonlyArray<Money.Money> => {
  const low = Money.toCents(curve.lowest)
  const high = Money.toCents(curve.highest)
  const step = niceStep((high - low) / (TICK_COUNT - 1))

  const first = Math.ceil(low / step) * step
  const values: Array<number> = []
  for (let value = first; value <= high; value += step) values.push(Math.round(value))

  return values.flatMap((value) => {
    const result = Result.getOrUndefined(Money.fromCents(value))
    return result === undefined ? [] : [result]
  })
}

export class MonthTick extends Data.Class<{
  readonly month: YearMonth.YearMonth
  /** Position in `points`, which is what turns it into an x coordinate. */
  readonly index: number
}> {}

/**
 * Month labels along the x axis, at a fixed count rather than every month —
 * a five-year projection has sixty points and no axis can carry sixty labels.
 *
 * The first and last points are always among them, so the axis states the span
 * it actually covers rather than an interior sample of it (APP-05).
 */
export const monthTicks = (curve: TrajectoryCurve, count: number): ReadonlyArray<MonthTick> => {
  const total = curve.points.length
  if (total === 0) return []
  if (total <= count) {
    return curve.points.map((point, index) => new MonthTick({ month: point.month, index }))
  }

  const step = (total - 1) / (count - 1)
  const indices = new Set(
    Array.from({ length: count }, (_, position) => Math.round(position * step))
  )

  return [...indices].flatMap((index) => {
    const point = curve.points[index]
    return point === undefined ? [] : [new MonthTick({ month: point.month, index })]
  })
}

/**
 * Where today sits along the axis — the last point flagged `recorded`, which
 * `curveOf` sets for every month up to and including the current one, not only
 * for months the household typed a balance into.
 *
 * So this is the boundary between what has happened and what is forecast, and
 * it exists as soon as the curve has a point. It is absent only for an empty
 * curve, where a rule would claim a boundary on nothing.
 */
export const recordedUpTo = (curve: TrajectoryCurve): number | undefined => {
  const recorded = curve.points.filter((point) => point.recorded).length
  return recorded === 0 ? undefined : recorded - 1
}
