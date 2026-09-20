/**
 * What a change costs in months (spec §36).
 *
 * **Always a diff of two projections, never a formula.** There is no constant
 * anywhere converting money into time, because the conversion depends on the
 * whole trajectory: €11,500 costs two months for one household and six for
 * another, and the same €11,500 costs a different amount next year.
 *
 * Where changes are stacked, each is attributed the months it added on top of
 * the ones before it — "the holiday costs 1 month; the rate rise buys 4 back".
 * That decomposition is the most useful thing the product says, so it is built
 * in rather than bolted on: the caller runs the projection once per prefix of
 * the list and hands the target dates here in order.
 */
import { Data } from "effect"

import * as YearMonth from "@/shared/domain/YearMonth"

import type { OverrideId } from "@/modules/scenarios/core/domain/Scenario"

export class ChangeCost extends Data.Class<{
  readonly override: OverrideId
  /** Negative is sooner. Absent where either side reaches no date at all. */
  readonly months: number | undefined
}> {}

export class TimeCost extends Data.Class<{
  readonly baseline: YearMonth.YearMonth | undefined
  readonly simulated: YearMonth.YearMonth | undefined
  /** The whole effect, negative for sooner. */
  readonly months: number | undefined
  /** One per override, in the order they are stacked. */
  readonly perChange: ReadonlyArray<ChangeCost>
}> {}

const between = (
  from: YearMonth.YearMonth | undefined,
  to: YearMonth.YearMonth | undefined
): number | undefined =>
  from === undefined || to === undefined ? undefined : YearMonth.monthsBetween(from, to)

/**
 * `targets` are the target dates after each prefix of the override list:
 * `targets[0]` is the baseline, `targets[i + 1]` includes overrides 0..i.
 *
 * An unreachable step yields `undefined` for its own cost rather than a
 * number invented from nothing (SCN-05) — "it never gets there" is not
 * "it costs 0 months".
 */
export const timeCostOf = (
  overrides: ReadonlyArray<OverrideId>,
  targets: ReadonlyArray<YearMonth.YearMonth | undefined>
): TimeCost => {
  const baseline = targets[0]
  const simulated = targets.at(-1)

  return new TimeCost({
    baseline,
    simulated,
    months: between(baseline, simulated),
    perChange: overrides.map(
      (override, index) =>
        new ChangeCost({ override, months: between(targets[index], targets[index + 1]) })
    )
  })
}
