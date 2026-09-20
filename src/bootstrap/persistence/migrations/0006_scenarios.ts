/**
 * Scenarios and their overrides (spec §35).
 *
 * The overrides table has a column per parameter rather than a JSON blob: a
 * blob cannot be read back into a closed union without trusting whatever was
 * written, and the whole point of the union is that an unhandled kind is a
 * type error rather than a silent no-op at runtime.
 *
 * There is no column for a result. A scenario stores changes and recomputes
 * on every read (SCN-02), so a stale answer has nowhere to hide.
 */
import { Effect } from "effect"
import { SqlClient } from "effect/unstable/sql"

const scenarios = (sql: SqlClient.SqlClient) =>
  Effect.gen(function* () {
    yield* sql`
      CREATE TABLE scenarios (
        id TEXT PRIMARY KEY NOT NULL,
        household_id TEXT NOT NULL REFERENCES households (id) ON DELETE CASCADE,
        name TEXT NOT NULL
      )
    `
    yield* sql`CREATE INDEX scenarios_by_household ON scenarios (household_id)`
  })

const overrides = (sql: SqlClient.SqlClient) =>
  Effect.gen(function* () {
    yield* sql`
      CREATE TABLE scenario_overrides (
        id TEXT PRIMARY KEY NOT NULL,
        scenario_id TEXT NOT NULL REFERENCES scenarios (id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        kind TEXT NOT NULL,
        income_source_id TEXT,
        commitment_id TEXT,
        holding_id TEXT,
        amount_cents INTEGER,
        basis_points INTEGER,
        days INTEGER,
        date TEXT,
        name TEXT
      )
    `
    yield* sql`CREATE INDEX scenario_overrides_by_scenario ON scenario_overrides (scenario_id)`
  })

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* scenarios(sql)
  yield* overrides(sql)
})
