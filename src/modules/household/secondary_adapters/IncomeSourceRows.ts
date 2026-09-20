/**
 * Rows into domain values.
 *
 * A row is data from outside the program — written by an older version,
 * restored from an import, edited by hand — so every value is validated rather
 * than cast, and one that cannot be becomes a PersistenceError rather than a
 * half-built object loose in the projection.
 */
import { Effect, Result } from "effect"

import { personId } from "@/modules/household/core/domain/Household"
import {
  ActivePeriod,
  BillableDaysPlan,
  FreelanceIncome,
  incomeSourceId,
  SalaryIncome
} from "@/modules/household/core/domain/IncomeSource"
import * as BillableDays from "@/shared/domain/BillableDays"
import * as DailyRate from "@/shared/domain/DailyRate"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import * as PayoutRatio from "@/shared/domain/PayoutRatio"
import { PersistenceError } from "@/shared/domain/PersistenceError"
import * as YearMonth from "@/shared/domain/YearMonth"

export interface SourceRow {
  readonly id: string
  readonly person_id: string
  readonly kind: string
  readonly name: string
  readonly start_date: string
  readonly end_date: string | null
  readonly enabled: number
  readonly daily_rate_cents: number | null
  readonly payout_ratio_basis_points: number | null
  readonly standard_billable_days: number | null
  readonly monthly_net_before_tax_cents: number | null
  readonly monthly_income_tax_cents: number | null
  readonly annual_gross_cents: number | null
}

export interface OverrideRow {
  readonly income_source_id: string
  readonly month: string
  readonly days: number
}

export const corrupt = (id: string, field: string) =>
  new PersistenceError({ operation: `read income source ${id}`, cause: `unreadable ${field}` })

const required = <A, E>(
  result: Result.Result<A, E>,
  id: string,
  field: string
): Effect.Effect<A, PersistenceError> =>
  Effect.fromResult(result).pipe(Effect.mapError(() => corrupt(id, field)))

const periodOf = (row: SourceRow) =>
  Effect.gen(function* () {
    const startDate = yield* required(LocalDate.parse(row.start_date), row.id, "start date")
    const endDate =
      row.end_date === null
        ? undefined
        : yield* required(LocalDate.parse(row.end_date), row.id, "end date")
    return new ActivePeriod({ startDate, endDate })
  })

const moneyOf = (cents: number | null, id: string, field: string) =>
  cents === null ? Effect.fail(corrupt(id, field)) : required(Money.fromCents(cents), id, field)

const freelanceOf = (row: SourceRow, overrides: ReadonlyArray<OverrideRow>) =>
  Effect.gen(function* () {
    const rate = yield* moneyOf(row.daily_rate_cents, row.id, "daily rate")
    const dailyRate = yield* required(DailyRate.fromMoney(rate), row.id, "daily rate")
    const ratio = yield* required(
      PayoutRatio.fromPercent((row.payout_ratio_basis_points ?? -1) / 100),
      row.id,
      "payout ratio"
    )
    const standard = yield* required(
      BillableDays.fromNumber(row.standard_billable_days ?? -1),
      row.id,
      "billable days"
    )
    const perMonth = new Map<YearMonth.YearMonth, BillableDays.BillableDays>()
    for (const override of overrides) {
      const month = yield* required(YearMonth.parse(override.month), row.id, "override month")
      const days = yield* required(BillableDays.fromNumber(override.days), row.id, "override days")
      perMonth.set(month, days)
    }

    return new FreelanceIncome({
      id: incomeSourceId(row.id),
      personId: personId(row.person_id),
      name: row.name,
      dailyRate,
      estimatedPayoutRatio: ratio,
      billableDays: new BillableDaysPlan({ standard, overrides: perMonth }),
      period: yield* periodOf(row),
      enabled: row.enabled === 1
    })
  })

const salaryOf = (row: SourceRow) =>
  Effect.gen(function* () {
    const annualGross =
      row.annual_gross_cents === null
        ? undefined
        : yield* moneyOf(row.annual_gross_cents, row.id, "annual gross")

    return new SalaryIncome({
      id: incomeSourceId(row.id),
      personId: personId(row.person_id),
      name: row.name,
      monthlyNetBeforeTax: yield* moneyOf(
        row.monthly_net_before_tax_cents,
        row.id,
        "net before tax"
      ),
      monthlyIncomeTax: yield* moneyOf(row.monthly_income_tax_cents, row.id, "income tax"),
      annualGross,
      period: yield* periodOf(row),
      enabled: row.enabled === 1
    })
  })

export const sourceOf = (row: SourceRow, overrides: ReadonlyArray<OverrideRow>) =>
  row.kind === "freelance" ? freelanceOf(row, overrides) : salaryOf(row)
