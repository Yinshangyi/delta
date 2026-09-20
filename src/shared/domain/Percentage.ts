/**
 * Basis points: hundredths of a percent, so 80% is 8000.
 *
 * The same reasoning as `Money`: `0.07 * 10000` is `700.0000000000001` as a
 * float, and the payout ratio multiplies every month of the projection (spec
 * §9). Integers keep `€12,000 × 80%` at exactly `€9,600`.
 *
 * The range is 0% to 100% inclusive. A payout ratio, a tax rate and a growth
 * rate all live inside it; anything outside is a typo, not a business case.
 */
import { Brand, Data, Order as Ord, Result } from "effect"

import * as Money from "@/shared/domain/Money"

export type Percentage = Brand.Branded<number, "Percentage">

export class InvalidPercentage extends Data.TaggedError("InvalidPercentage")<{
  readonly value: number
  readonly reason: "out-of-range" | "sub-basis-point" | "not-finite"
}> {}

const BASIS_POINTS_PER_UNIT = 10_000
const MAX_BASIS_POINTS = BASIS_POINTS_PER_UNIT

const fromBasisPoints = (
  basisPoints: number,
  offending: number
): Result.Result<Percentage, InvalidPercentage> =>
  basisPoints < 0 || basisPoints > MAX_BASIS_POINTS
    ? Result.fail(new InvalidPercentage({ value: offending, reason: "out-of-range" }))
    : Result.succeed(basisPoints as Percentage)

/** `80` means 80%. Finer than a basis point is rejected, not rounded. */
export const fromPercent = (percent: number): Result.Result<Percentage, InvalidPercentage> => {
  if (!Number.isFinite(percent)) {
    return Result.fail(new InvalidPercentage({ value: percent, reason: "not-finite" }))
  }
  if (Number(percent.toFixed(2)) !== percent) {
    return Result.fail(new InvalidPercentage({ value: percent, reason: "sub-basis-point" }))
  }
  return fromBasisPoints(Math.round(percent * 100), percent)
}

/** `0.8` means 80%. */
export const fromRatio = (ratio: number): Result.Result<Percentage, InvalidPercentage> => {
  if (!Number.isFinite(ratio)) {
    return Result.fail(new InvalidPercentage({ value: ratio, reason: "not-finite" }))
  }
  if (Number(ratio.toFixed(4)) !== ratio) {
    return Result.fail(new InvalidPercentage({ value: ratio, reason: "sub-basis-point" }))
  }
  return fromBasisPoints(Math.round(ratio * BASIS_POINTS_PER_UNIT), ratio)
}

export const zero: Percentage = 0 as Percentage

export const whole: Percentage = MAX_BASIS_POINTS as Percentage

export const toBasisPoints = (percentage: Percentage): number => percentage

/**
 * The inverse of `toBasisPoints`, for reading a stored column back. Validated
 * rather than cast: the column is data from outside the program, and a row
 * written by an older version could hold anything.
 */
export const fromStoredBasisPoints = (
  basisPoints: number
): Result.Result<Percentage, InvalidPercentage> =>
  Number.isInteger(basisPoints)
    ? fromBasisPoints(basisPoints, basisPoints)
    : Result.fail(new InvalidPercentage({ value: basisPoints, reason: "sub-basis-point" }))

export const toPercent = (percentage: Percentage): number => percentage / 100

export const toRatio = (percentage: Percentage): number => percentage / BASIS_POINTS_PER_UNIT

/**
 * Multiplies before dividing, so the whole calculation stays in integers and
 * the only rounding is the final one — half away from zero, matching
 * `Money.multiply`.
 */
export const applyTo = (money: Money.Money, percentage: Percentage): Money.Money => {
  const scaled = Money.toCents(money) * percentage
  const quotient = scaled / BASIS_POINTS_PER_UNIT
  const rounded = quotient < 0 ? -Math.round(-quotient) : Math.round(quotient)
  return (rounded === 0 ? 0 : rounded) as Money.Money
}

export const Order: Ord.Order<Percentage> = Ord.Number as Ord.Order<Percentage>

export const equals = (a: Percentage, b: Percentage): boolean => a === b

export const isLessThan = Ord.isLessThan(Order)
export const isGreaterThan = Ord.isGreaterThan(Order)

export const min = Ord.min(Order)
export const max = Ord.max(Order)
