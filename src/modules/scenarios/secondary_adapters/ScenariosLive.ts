/**
 * Scenarios in SQLite. Overrides are rewritten wholesale on save, so removing
 * one is a save rather than a second operation nobody would remember to call.
 */
import { Effect, Layer } from "effect"
import { SqlClient } from "effect/unstable/sql"

import { householdId } from "@/modules/household/core/domain/Household"
import { Scenario, scenarioId } from "@/modules/scenarios/core/domain/Scenario"
import { Scenarios, type ScenariosShape } from "@/modules/scenarios/core/ports/secondary/Scenarios"
import { columnsOf } from "@/modules/scenarios/secondary_adapters/OverrideColumns"
import { overrideOf, type OverrideRow } from "@/modules/scenarios/secondary_adapters/OverrideRows"
import { wrap } from "@/shared/domain/PersistenceError"

interface ScenarioRow {
  readonly id: string
  readonly household_id: string
  readonly name: string
}

type Sql = SqlClient.SqlClient

const hydrate = (sql: Sql) => (rows: ReadonlyArray<ScenarioRow>) =>
  Effect.gen(function* () {
    if (rows.length === 0) return []
    const overrides = yield* sql<OverrideRow>`
      SELECT * FROM scenario_overrides ORDER BY position
    `.pipe(Effect.mapError(wrap("load scenario overrides")))

    return yield* Effect.all(
      rows.map((row) =>
        Effect.gen(function* () {
          return new Scenario({
            id: scenarioId(row.id),
            householdId: householdId(row.household_id),
            name: row.name,
            overrides: yield* Effect.all(
              overrides
                .filter((override) => override.scenario_id === row.id)
                .map((override) => overrideOf(override))
            )
          })
        })
      )
    )
  })

const select = (sql: Sql) => (household: string | undefined) =>
  (household === undefined
    ? sql<ScenarioRow>`SELECT * FROM scenarios ORDER BY rowid`
    : sql<ScenarioRow>`SELECT * FROM scenarios WHERE household_id = ${household} ORDER BY rowid`
  ).pipe(Effect.mapError(wrap("load scenarios")), Effect.flatMap(hydrate(sql)))

const saveScenario = (sql: Sql) => (scenario: Scenario) =>
  Effect.gen(function* () {
    yield* sql`
      INSERT OR REPLACE INTO scenarios (id, household_id, name)
      VALUES (${scenario.id}, ${scenario.householdId}, ${scenario.name})
    `
    yield* sql`DELETE FROM scenario_overrides WHERE scenario_id = ${scenario.id}`

    for (const [position, override] of scenario.overrides.entries()) {
      const columns = columnsOf(override)
      yield* sql`
        INSERT INTO scenario_overrides (
          id, scenario_id, position, kind, income_source_id, commitment_id, holding_id,
          amount_cents, basis_points, days, date, name
        ) VALUES (
          ${override.id}, ${scenario.id}, ${position}, ${columns.kind},
          ${columns.income_source_id}, ${columns.commitment_id}, ${columns.holding_id},
          ${columns.amount_cents}, ${columns.basis_points}, ${columns.days},
          ${columns.date}, ${columns.name}
        )
      `
    }
  }).pipe(Effect.mapError(wrap("save a scenario")))

export const ScenariosLive: Layer.Layer<typeof Scenarios.Identifier, never, SqlClient.SqlClient> =
  Layer.effect(Scenarios)(
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      const shape: ScenariosShape = {
        nextId: Effect.sync(() => scenarioId(crypto.randomUUID())),
        all: select(sql)(undefined),
        forHousehold: (household) => select(sql)(household),
        save: saveScenario(sql),
        remove: (id) =>
          sql`DELETE FROM scenarios WHERE id = ${id}`.pipe(
            Effect.asVoid,
            Effect.mapError(wrap("remove a scenario"))
          )
      }
      return shape
    })
  )
