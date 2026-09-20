/**
 * What the household is saving toward (spec §14).
 *
 * Several rows, one enabled — the model carries more than V1 shows, because a
 * second goal is a row rather than a schema change, and the alternative is a
 * single-row table that has to be rebuilt the first time someone wants two.
 */
import { Effect } from "effect"
import { SqlClient } from "effect/unstable/sql"

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* sql`
    CREATE TABLE financial_goals (
      id TEXT PRIMARY KEY NOT NULL,
      household_id TEXT NOT NULL REFERENCES households (id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      target_amount_cents INTEGER NOT NULL,
      enabled INTEGER NOT NULL
    )
  `
  yield* sql`CREATE INDEX financial_goals_by_household ON financial_goals (household_id)`
})
