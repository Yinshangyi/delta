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
import * as BillableDays from "@/shared/domain/BillableDays"
import * as DailyRate from "@/shared/domain/DailyRate"
import * as PayoutRatio from "@/shared/domain/PayoutRatio"

import type { PersonId } from "@/modules/household/core/domain/Household"
import type * as LocalDate from "@/shared/domain/LocalDate"
import type { PersistenceError } from "@/shared/domain/PersistenceError"
import type * as YearMonth from "@/shared/domain/YearMonth"

export interface FreelanceIncomeDraft {
  readonly personId: PersonId
  readonly name: string
  readonly dailyRateEuros: number
  readonly estimatedPayoutPercent: number
  readonly standardBillableDays: number
  readonly overrides: ReadonlyMap<YearMonth.YearMonth, number>
  readonly startDate: LocalDate.LocalDate
  readonly endDate: LocalDate.LocalDate | undefined
}

export type AddFreelanceIncomeError =
  | DailyRate.InvalidDailyRate
  | PayoutRatio.InvalidPayoutRatio
  | BillableDays.InvalidBillableDays
  | IncomeSource.InvalidPeriod
  | PersistenceError

const planFrom = (
  standard: number,
  overrides: ReadonlyMap<YearMonth.YearMonth, number>
): Effect.Effect<IncomeSource.BillableDaysPlan, BillableDays.InvalidBillableDays> =>
  Effect.gen(function* () {
    const validated = new Map<YearMonth.YearMonth, BillableDays.BillableDays>()
    for (const [month, days] of overrides) {
      validated.set(month, yield* Effect.fromResult(BillableDays.fromNumber(days)))
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
    const period = yield* Effect.fromResult(
      IncomeSource.activePeriod(draft.startDate, draft.endDate)
    )

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
