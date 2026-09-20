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
import { Effect, Layer, Match } from "effect"
import { SqlClient } from "effect/unstable/sql"

import {
  IncomeSources,
  type IncomeSourcesShape
} from "@/modules/household/core/ports/secondary/IncomeSources"
import {
  type OverrideRow,
  type SourceRow,
  sourceOf
} from "@/modules/household/secondary_adapters/IncomeSourceRows"
import * as BillableDays from "@/shared/domain/BillableDays"
import * as DailyRate from "@/shared/domain/DailyRate"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import { wrap } from "@/shared/domain/PersistenceError"
import * as YearMonth from "@/shared/domain/YearMonth"

import type { IncomeSource } from "@/modules/household/core/domain/IncomeSource"

type Sql = SqlClient.SqlClient

const hydrate = (sql: Sql) => (rows: ReadonlyArray<SourceRow>) =>
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

const select = (sql: Sql) => (person: string | undefined) =>
  (person === undefined
    ? sql<SourceRow>`SELECT * FROM income_sources ORDER BY rowid`
    : sql<SourceRow>`SELECT * FROM income_sources WHERE person_id = ${person} ORDER BY rowid`
  ).pipe(Effect.mapError(wrap("load income sources")), Effect.flatMap(hydrate(sql)))

/** A salary has none, which is the empty map rather than a special case. */
const overridesOf = (source: IncomeSource) =>
  Match.valueTags(source, {
    FreelanceIncome: (freelance) => freelance.billableDays.overrides,
    SalaryIncome: () => new Map<YearMonth.YearMonth, BillableDays.BillableDays>()
  })

const saveOverrides = (sql: Sql) => (source: IncomeSource) =>
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

const saveSource = (sql: Sql) => (source: IncomeSource) =>
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
    yield* saveOverrides(sql)(source)
  }).pipe(Effect.mapError(wrap("save an income source")))

export const IncomeSourcesLive: Layer.Layer<
  typeof IncomeSources.Identifier,
  never,
  SqlClient.SqlClient
> = Layer.effect(IncomeSources)(
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const shape: IncomeSourcesShape = {
      all: select(sql)(undefined),
      forPerson: (person) => select(sql)(person),
      save: saveSource(sql),
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
