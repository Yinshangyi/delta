/**
 * What a person earns, as a tagged union (spec §7, §8, §12).
 *
 * The two variants share only what every income source needs — who it belongs
 * to, when it runs, whether it is on. Everything else is the variant's own, and
 * a third variant (rental, dividends) is a new member here plus one translator,
 * with no change to the engine.
 */
import { Brand, Data } from "effect"

import type { PersonId } from "@/modules/household/core/domain/Household"
import type { ActivePeriod } from "@/shared/domain/ActivePeriod"
import type * as BillableDays from "@/shared/domain/BillableDays"
import type * as DailyRate from "@/shared/domain/DailyRate"
import type * as Money from "@/shared/domain/Money"
import type * as PayoutRatio from "@/shared/domain/PayoutRatio"
import type * as YearMonth from "@/shared/domain/YearMonth"

export type IncomeSourceId = Brand.Branded<string, "IncomeSourceId">

export const incomeSourceId = (value: string): IncomeSourceId => value as IncomeSourceId

/**
 * Re-exported rather than redefined: a commitment runs over the same kind of
 * period, and "is this running in month M" should have one answer
 * (shared/domain/ActivePeriod.ts).
 */
export { ActivePeriod, InvalidPeriod, make as activePeriod } from "@/shared/domain/ActivePeriod"

/**
 * A default for every month, with explicit overrides (spec §11). Zero is a
 * valid override — an unbilled month is a real thing, not a missing value.
 */
export class BillableDaysPlan extends Data.Class<{
  readonly standard: BillableDays.BillableDays
  readonly overrides: ReadonlyMap<YearMonth.YearMonth, BillableDays.BillableDays>
}> {}

export const daysIn = (
  plan: BillableDaysPlan,
  month: YearMonth.YearMonth
): BillableDays.BillableDays => plan.overrides.get(month) ?? plan.standard

export const isOverridden = (plan: BillableDaysPlan, month: YearMonth.YearMonth): boolean =>
  plan.overrides.has(month)

export const withOverride = (
  plan: BillableDaysPlan,
  month: YearMonth.YearMonth,
  days: BillableDays.BillableDays
): BillableDaysPlan =>
  new BillableDaysPlan({ ...plan, overrides: new Map(plan.overrides).set(month, days) })

/** Clearing is not "override with the default": the month goes back to following it. */
export const withoutOverride = (
  plan: BillableDaysPlan,
  month: YearMonth.YearMonth
): BillableDaysPlan => {
  const overrides = new Map(plan.overrides)
  overrides.delete(month)
  return new BillableDaysPlan({ ...plan, overrides })
}

export class FreelanceIncome extends Data.TaggedClass("FreelanceIncome")<{
  readonly id: IncomeSourceId
  readonly personId: PersonId
  readonly name: string
  readonly dailyRate: DailyRate.DailyRate
  /** An estimate, and the UI is required to say so — never a guaranteed transfer (§10). */
  readonly estimatedPayoutRatio: PayoutRatio.PayoutRatio
  readonly billableDays: BillableDaysPlan
  readonly period: ActivePeriod
  readonly enabled: boolean
}> {}

export class SalaryIncome extends Data.TaggedClass("SalaryIncome")<{
  readonly id: IncomeSourceId
  readonly personId: PersonId
  readonly name: string
  readonly monthlyNetBeforeTax: Money.Money
  readonly monthlyIncomeTax: Money.Money
  /** Informational only. Spec §12 is explicit that no gross-to-net engine exists. */
  readonly annualGross: Money.Money | undefined
  readonly period: ActivePeriod
  readonly enabled: boolean
}> {}

export type IncomeSource = FreelanceIncome | SalaryIncome

export const idOf = (source: IncomeSource): IncomeSourceId => source.id

export const ownerOf = (source: IncomeSource): PersonId => source.personId

export const isEnabled = (source: IncomeSource): boolean => source.enabled

export const periodOf = (source: IncomeSource): ActivePeriod => source.period
