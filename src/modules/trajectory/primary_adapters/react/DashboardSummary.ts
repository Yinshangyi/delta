/**
 * The small derived figures the dashboard header states, as pure functions so
 * they are testable without a screen (APP-03).
 *
 * None of this is domain arithmetic — it is counting and phrasing what other
 * queries already answered. Anything that needed a rule rather than a count
 * would belong in `core`.
 */
import { kindOf } from "@/modules/capital/core/domain/Holding"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as YearMonth from "@/shared/domain/YearMonth"

import type { ValuedHolding } from "@/modules/capital/core/domain/TotalCapital"

export interface Composition {
  readonly accounts: number
  readonly assets: number
}

export const compositionOf = (holdings: ReadonlyArray<ValuedHolding>): Composition => ({
  accounts: holdings.filter((valued) => kindOf(valued.holding) === "BankAccount").length,
  assets: holdings.filter((valued) => kindOf(valued.holding) === "PhysicalAsset").length
})

/**
 * The most recent valuation across every holding — what "updated" means on
 * this screen. Absent until something has been recorded, which is an ordinary
 * first-run state and not an error.
 */
export const lastUpdated = (
  holdings: ReadonlyArray<ValuedHolding>
): LocalDate.LocalDate | undefined =>
  holdings
    .map((valued) => valued.valuation?.asOf)
    .filter((date): date is LocalDate.LocalDate => date !== undefined)
    .reduce<LocalDate.LocalDate | undefined>(
      (latest, date) => (latest === undefined || LocalDate.isAfter(date, latest) ? date : latest),
      undefined
    )

/** Never negative: a target already reached is nought months away, not minus two. */
export const monthsRemaining = (
  target: YearMonth.YearMonth | undefined,
  from: YearMonth.YearMonth
): number | undefined =>
  target === undefined ? undefined : Math.max(0, YearMonth.monthsBetween(from, target))
