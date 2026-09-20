/**
 * One month departs from the standard, or goes back to following it
 * (spec §11).
 *
 * The source being edited is passed in rather than looked up: the caller is
 * showing it, and a port method to re-read what is already on screen would earn
 * nothing. Zero is a real override — an unbilled month — and passing
 * `undefined` clears back to the default instead.
 */
import { Effect } from "effect"

import * as IncomeSource from "@/modules/household/core/domain/IncomeSource"
import { IncomeSources } from "@/modules/household/core/ports/secondary/IncomeSources"
import * as BillableDays from "@/shared/domain/BillableDays"
import * as YearMonth from "@/shared/domain/YearMonth"

import type { PersistenceError } from "@/shared/domain/PersistenceError"

const planWith = (
  source: IncomeSource.FreelanceIncome,
  month: YearMonth.YearMonth,
  days: number | undefined
): Effect.Effect<IncomeSource.BillableDaysPlan, BillableDays.InvalidBillableDays> =>
  days === undefined
    ? Effect.succeed(IncomeSource.withoutOverride(source.billableDays, month))
    : Effect.fromResult(BillableDays.fromNumber(days)).pipe(
        Effect.map((valid) => IncomeSource.withOverride(source.billableDays, month, valid))
      )

export const setBillableDaysOverride = (
  source: IncomeSource.FreelanceIncome,
  month: string,
  days: number | undefined
): Effect.Effect<
  IncomeSource.FreelanceIncome,
  BillableDays.InvalidBillableDays | YearMonth.InvalidYearMonth | PersistenceError,
  typeof IncomeSources.Identifier
> =>
  Effect.gen(function* () {
    const parsed = yield* Effect.fromResult(YearMonth.parse(month))
    const billableDays = yield* planWith(source, parsed, days)
    const updated = new IncomeSource.FreelanceIncome({ ...source, billableDays })
    const sources = yield* IncomeSources
    yield* sources.save(updated)
    return updated
  })
