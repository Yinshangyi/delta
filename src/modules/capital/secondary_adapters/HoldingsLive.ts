/**
 * Holdings in SQLite. A row is data from outside the program, so every value
 * is validated back into its type rather than cast, and a row that cannot be
 * is a `PersistenceError` rather than a half-built holding in a total.
 */
import { Effect, Layer, Match } from "effect"
import { SqlClient } from "effect/unstable/sql"

import { BankAccount, holdingId, PhysicalAsset } from "@/modules/capital/core/domain/Holding"
import { Holdings, type HoldingsShape } from "@/modules/capital/core/ports/secondary/Holdings"
import { householdId } from "@/modules/household/core/domain/Household"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"
import { type PersistenceError, wrap } from "@/shared/domain/PersistenceError"

import type { Holding } from "@/modules/capital/core/domain/Holding"

interface HoldingRow {
  readonly id: string
  readonly household_id: string
  readonly kind: string
  readonly name: string
  readonly institution: string | null
  readonly category: string | null
  readonly acquisition_cost_cents: number | null
  readonly acquisition_date: string | null
  readonly included_in_capital: number
  readonly enabled: number
}

type Sql = SqlClient.SqlClient

const shared = (row: HoldingRow) => ({
  id: holdingId(row.id),
  householdId: householdId(row.household_id),
  name: row.name,
  includedInCapital: row.included_in_capital === 1,
  enabled: row.enabled === 1
})

const holdingOf = (row: HoldingRow): Effect.Effect<Holding, PersistenceError> => {
  const failed = wrap(`read the holding ${row.id}`)

  if (row.kind === "BankAccount") {
    return Effect.succeed(
      new BankAccount({ ...shared(row), institution: row.institution ?? undefined })
    )
  }

  if (row.kind === "PhysicalAsset") {
    return Effect.gen(function* () {
      return new PhysicalAsset({
        ...shared(row),
        category: row.category ?? undefined,
        acquisitionCost:
          row.acquisition_cost_cents === null
            ? undefined
            : yield* Effect.fromResult(Money.fromCents(row.acquisition_cost_cents)),
        acquisitionDate:
          row.acquisition_date === null
            ? undefined
            : yield* Effect.fromResult(LocalDate.parse(row.acquisition_date))
      })
    }).pipe(Effect.mapError(failed))
  }

  return Effect.fail(failed(`unknown holding kind ${row.kind}`))
}

const columnsOf = (holding: Holding) =>
  Match.valueTags(holding, {
    BankAccount: (account) => ({
      kind: "BankAccount",
      institution: account.institution ?? null,
      category: null as string | null,
      acquisition_cost_cents: null as number | null,
      acquisition_date: null as string | null
    }),
    PhysicalAsset: (asset) => ({
      kind: "PhysicalAsset",
      institution: null as string | null,
      category: asset.category ?? null,
      acquisition_cost_cents:
        asset.acquisitionCost === undefined ? null : Money.toCents(asset.acquisitionCost),
      acquisition_date:
        asset.acquisitionDate === undefined ? null : LocalDate.toIso(asset.acquisitionDate)
    })
  })

const select = (sql: Sql) => (household: string | undefined) =>
  (household === undefined
    ? sql<HoldingRow>`SELECT * FROM holdings ORDER BY rowid`
    : sql<HoldingRow>`SELECT * FROM holdings WHERE household_id = ${household} ORDER BY rowid`
  ).pipe(
    Effect.mapError(wrap("load holdings")),
    Effect.flatMap((rows) => Effect.all(rows.map(holdingOf)))
  )

const saveHolding = (sql: Sql) => (holding: Holding) => {
  const columns = columnsOf(holding)
  return sql`
    INSERT OR REPLACE INTO holdings (
      id, household_id, kind, name, institution, category,
      acquisition_cost_cents, acquisition_date, included_in_capital, enabled
    ) VALUES (
      ${holding.id}, ${holding.householdId}, ${columns.kind}, ${holding.name},
      ${columns.institution}, ${columns.category}, ${columns.acquisition_cost_cents},
      ${columns.acquisition_date}, ${holding.includedInCapital ? 1 : 0},
      ${holding.enabled ? 1 : 0}
    )
  `.pipe(Effect.asVoid, Effect.mapError(wrap("save a holding")))
}

export const HoldingsLive: Layer.Layer<typeof Holdings.Identifier, never, SqlClient.SqlClient> =
  Layer.effect(Holdings)(
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      const shape: HoldingsShape = {
        nextId: Effect.sync(() => holdingId(crypto.randomUUID())),
        all: select(sql)(undefined),
        forHousehold: (household) => select(sql)(household),
        save: saveHolding(sql),
        setIncluded: (id, included) =>
          sql`UPDATE holdings SET included_in_capital = ${included ? 1 : 0} WHERE id = ${id}`.pipe(
            Effect.asVoid,
            Effect.mapError(wrap("include or exclude a holding"))
          ),
        remove: (id) =>
          sql`DELETE FROM holdings WHERE id = ${id}`.pipe(
            Effect.asVoid,
            Effect.mapError(wrap("remove a holding"))
          )
      }
      return shape
    })
  )
