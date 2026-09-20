/**
 * Income sources in SQLite: one table with a `kind` discriminant, plus a row
 * per billable-day override.
 *
 * Reading is where the care is. A row is data from outside the program — it may
 * have been written by an older version, or restored from an import — so every
 * value is validated back into its domain type rather than cast, and a row that
 * cannot be is a `PersistenceError` rather than a half-built object loose in the
 * projection.
 */
import { Effect, Layer, Match, Result } from "effect"
import { SqlClient } from "effect/unstable/sql"

import { personId } from "@/modules/household/core/domain/Household"
import {
  ActivePeriod,
  BillableDaysPlan,
  FreelanceIncome,
  type IncomeSource,
  incomeSourceId,
  SalaryIncome
} from "@/modules/household/core/domain/IncomeSource"
import {
  IncomeSources,
  type IncomeSourcesShape
} from "@/modules/household/core/ports/secondary/IncomeSources"
import * as BillableDays from "@/shared/domain/BillableDays"
import * as DailyRate from "@/shared/domain/DailyRate"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import * as PayoutRatio from "@/shared/domain/PayoutRatio"
import { PersistenceError, wrap } from "@/shared/domain/PersistenceError"
import * as YearMonth from "@/shared/domain/YearMonth"

interface SourceRow {
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

interface OverrideRow {
  readonly income_source_id: string
  readonly month: string
  readonly days: number
}

const corrupt = (id: string, field: string) =>
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

const sourceOf = (row: SourceRow, overrides: ReadonlyArray<OverrideRow>) =>
  row.kind === "freelance" ? freelanceOf(row, overrides) : salaryOf(row)

export const IncomeSourcesLive: Layer.Layer<
  typeof IncomeSources.Identifier,
  never,
  SqlClient.SqlClient
> = Layer.effect(IncomeSources)(
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    const hydrate = (rows: ReadonlyArray<SourceRow>) =>
      Effect.gen(function* () {
        if (rows.length === 0) return []
        const overrides = yield* sql<OverrideRow>`
          SELECT income_source_id, month, days FROM billable_day_overrides
        `.pipe(Effect.mapError(wrap("load billable day overrides")))

        return yield* Effect.all(
          rows.map((row) =>
            sourceOf(
              row,
              overrides.filter((override) => override.income_source_id === row.id)
            )
          )
        )
      })

    const select = (person: string | undefined) =>
      (person === undefined
        ? sql<SourceRow>`SELECT * FROM income_sources ORDER BY rowid`
        : sql<SourceRow>`SELECT * FROM income_sources WHERE person_id = ${person} ORDER BY rowid`
      ).pipe(Effect.mapError(wrap("load income sources")), Effect.flatMap(hydrate))

    /** A salary has none, which is the empty map rather than a special case. */
    const overridesOf = (source: IncomeSource) =>
      Match.valueTags(source, {
        FreelanceIncome: (freelance) => freelance.billableDays.overrides,
        SalaryIncome: () => new Map<YearMonth.YearMonth, BillableDays.BillableDays>()
      })

    const saveOverrides = (source: IncomeSource) =>
      Effect.gen(function* () {
        yield* sql`DELETE FROM billable_day_overrides WHERE income_source_id = ${source.id}`
        for (const [month, days] of overridesOf(source)) {
          yield* sql`
            INSERT INTO billable_day_overrides (income_source_id, month, days)
            VALUES (${source.id}, ${month}, ${BillableDays.toNumber(days)})
          `
        }
      })

    const columnsOf = (source: IncomeSource) =>
      Match.valueTags(source, {
        FreelanceIncome: (freelance) => ({
          kind: "freelance",
          daily_rate_cents: Money.toCents(DailyRate.toMoney(freelance.dailyRate)) as number | null,
          payout_ratio_basis_points: freelance.estimatedPayoutRatio as number | null,
          standard_billable_days: BillableDays.toNumber(freelance.billableDays.standard) as
            | number
            | null,
          monthly_net_before_tax_cents: null as number | null,
          monthly_income_tax_cents: null as number | null,
          annual_gross_cents: null as number | null
        }),
        SalaryIncome: (salary) => ({
          kind: "salary",
          daily_rate_cents: null as number | null,
          payout_ratio_basis_points: null as number | null,
          standard_billable_days: null as number | null,
          monthly_net_before_tax_cents: Money.toCents(salary.monthlyNetBeforeTax) as number | null,
          monthly_income_tax_cents: Money.toCents(salary.monthlyIncomeTax) as number | null,
          annual_gross_cents:
            salary.annualGross === undefined ? null : Money.toCents(salary.annualGross)
        })
      })

    const shape: IncomeSourcesShape = {
      all: select(undefined),

      forPerson: (person) => select(person),

      save: (source) =>
        Effect.gen(function* () {
          const columns = columnsOf(source)
          yield* sql`
            INSERT OR REPLACE INTO income_sources (
              id, person_id, kind, name, start_date, end_date, enabled,
              daily_rate_cents, payout_ratio_basis_points, standard_billable_days,
              monthly_net_before_tax_cents, monthly_income_tax_cents, annual_gross_cents
            ) VALUES (
              ${source.id}, ${source.personId}, ${columns.kind}, ${source.name},
              ${LocalDate.toIso(source.period.startDate)},
              ${source.period.endDate === undefined ? null : LocalDate.toIso(source.period.endDate)},
              ${source.enabled ? 1 : 0},
              ${columns.daily_rate_cents}, ${columns.payout_ratio_basis_points},
              ${columns.standard_billable_days},
              ${columns.monthly_net_before_tax_cents}, ${columns.monthly_income_tax_cents},
              ${columns.annual_gross_cents}
            )
          `
          yield* saveOverrides(source)
        }).pipe(Effect.mapError(wrap("save an income source"))),

      setEnabled: (id, enabled) =>
        sql`UPDATE income_sources SET enabled = ${enabled ? 1 : 0} WHERE id = ${id}`.pipe(
          Effect.asVoid,
          Effect.mapError(wrap("enable or disable an income source"))
        ),

      remove: (id) =>
        sql`DELETE FROM income_sources WHERE id = ${id}`.pipe(
          Effect.asVoid,
          Effect.mapError(wrap("remove an income source"))
        )
    }

    return shape
  })
)
