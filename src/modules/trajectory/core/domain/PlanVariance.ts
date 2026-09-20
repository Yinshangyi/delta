/**
 * Whether the household is ahead of or behind what was forecast (TRJ-10), and
 * by how much in money and in time.
 *
 * Pure: two figures and two target dates in, a comparison out. Where those
 * come from is the use case's problem, which is what makes the arithmetic here
 * a unit test rather than a screenshot.
 *
 * `standing` is a word rather than a sign so the UI never has to decide what
 * a negative number means, and so ahead and behind differ by more than colour
 * wherever they are shown.
 */
import { Data } from "effect"

import * as Money from "@/shared/domain/Money"
import * as YearMonth from "@/shared/domain/YearMonth"

export type Standing = "ahead" | "behind" | "on-plan"

export class PlanVariance extends Data.Class<{
  readonly expected: Money.Money
  readonly actual: Money.Money
  /** Actual less expected: positive is ahead. */
  readonly difference: Money.Money
  readonly standing: Standing
  /** Negative is sooner. Absent when either projection reaches no date. */
  readonly monthsMoved: number | undefined
  readonly targetBefore: YearMonth.YearMonth | undefined
  readonly targetAfter: YearMonth.YearMonth | undefined
}> {}

const standingOf = (difference: Money.Money): Standing =>
  Money.isZero(difference) ? "on-plan" : Money.isPositive(difference) ? "ahead" : "behind"

export const compare = (
  expected: Money.Money,
  actual: Money.Money,
  targetBefore: YearMonth.YearMonth | undefined,
  targetAfter: YearMonth.YearMonth | undefined
): PlanVariance => {
  const difference = Money.subtract(actual, expected)

  return new PlanVariance({
    expected,
    actual,
    difference,
    standing: standingOf(difference),
    monthsMoved:
      targetBefore === undefined || targetAfter === undefined
        ? undefined
        : YearMonth.monthsBetween(targetBefore, targetAfter),
    targetBefore,
    targetAfter
  })
}
