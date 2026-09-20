/**
 * Freelance income: a daily rate, an estimated payout ratio, a billable-days
 * plan and a period (spec §8, §9, §10, §11).
 *
 * Every number arrives as a plain one from a form and leaves as a branded type
 * or a typed error — there is no path by which an unvalidated rate reaches the
 * database. The ratio is per source, never a constant here (§10).
 */
import { Effect } from "effect"

import * as IncomeSource from "@/modules/household/core/domain/IncomeSource"
import { IncomeSources } from "@/modules/household/core/ports/secondary/IncomeSources"
import { periodFrom } from "@/modules/household/core/use_cases/PeriodFrom"
import * as BillableDays from "@/shared/domain/BillableDays"
import * as DailyRate from "@/shared/domain/DailyRate"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as PayoutRatio from "@/shared/domain/PayoutRatio"
import * as YearMonth from "@/shared/domain/YearMonth"

import type { PersonId } from "@/modules/household/core/domain/Household"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export interface FreelanceIncomeDraft {
  readonly personId: PersonId
  readonly name: string
  readonly dailyRateEuros: number
  readonly estimatedPayoutPercent: number
  readonly standardBillableDays: number
  /** Keyed by ISO month, as an `<input type="month">` produces it. */
  readonly overrides: ReadonlyMap<string, number>
  readonly startDate: string
  readonly endDate: string | undefined
}

export type AddFreelanceIncomeError =
  | LocalDate.InvalidLocalDate
  | YearMonth.InvalidYearMonth
  | DailyRate.InvalidDailyRate
  | PayoutRatio.InvalidPayoutRatio
  | BillableDays.InvalidBillableDays
  | IncomeSource.InvalidPeriod
  | PersistenceError

const planFrom = (
  standard: number,
  overrides: ReadonlyMap<string, number>
): Effect.Effect<
  IncomeSource.BillableDaysPlan,
  BillableDays.InvalidBillableDays | YearMonth.InvalidYearMonth
> =>
  Effect.gen(function* () {
    const validated = new Map<YearMonth.YearMonth, BillableDays.BillableDays>()
    for (const [month, days] of overrides) {
      validated.set(
        yield* Effect.fromResult(YearMonth.parse(month)),
        yield* Effect.fromResult(BillableDays.fromNumber(days))
      )
    }
    return new IncomeSource.BillableDaysPlan({
      standard: yield* Effect.fromResult(BillableDays.fromNumber(standard)),
      overrides: validated
    })
  })

export const addFreelanceIncome = (
  draft: FreelanceIncomeDraft
): Effect.Effect<
  IncomeSource.FreelanceIncome,
  AddFreelanceIncomeError,
  typeof IncomeSources.Identifier
> =>
  Effect.gen(function* () {
    const dailyRate = yield* Effect.fromResult(DailyRate.fromEuros(draft.dailyRateEuros))
    const ratio = yield* Effect.fromResult(PayoutRatio.fromPercent(draft.estimatedPayoutPercent))
    const billableDays = yield* planFrom(draft.standardBillableDays, draft.overrides)
    const period = yield* periodFrom(draft.startDate, draft.endDate)

    const sources = yield* IncomeSources
    const source = new IncomeSource.FreelanceIncome({
      id: yield* sources.nextId,
      personId: draft.personId,
      name: draft.name,
      dailyRate,
      estimatedPayoutRatio: ratio,
      billableDays,
      period,
      enabled: true
    })
    yield* sources.save(source)
    return source
  })
