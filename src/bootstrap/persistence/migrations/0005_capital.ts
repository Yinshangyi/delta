/**
 * What the household owns, and what it has been worth (spec §68 to §71).
 *
 * One table with a `kind` discriminant, as for income and commitments. A
 * holding carries no amount of its own — that is §69, not an omission — so the
 * value columns live entirely in `balance_snapshots`.
 */
import { Effect } from "effect"
import { SqlClient } from "effect/unstable/sql"

const holdings = (sql: SqlClient.SqlClient) =>
  Effect.gen(function* () {
    yield* sql`
      CREATE TABLE holdings (
        id TEXT PRIMARY KEY NOT NULL,
        household_id TEXT NOT NULL REFERENCES households (id) ON DELETE CASCADE,
        kind TEXT NOT NULL,
        name TEXT NOT NULL,
        institution TEXT,
        category TEXT,
        acquisition_cost_cents INTEGER,
        acquisition_date TEXT,
        included_in_capital INTEGER NOT NULL,
        enabled INTEGER NOT NULL
      )
    `
    yield* sql`CREATE INDEX holdings_by_household ON holdings (household_id)`
  })

/** Cascaded, so deleting a holding takes its history with it (CAP-09). */
const balanceSnapshots = (sql: SqlClient.SqlClient) =>
  Effect.gen(function* () {
    yield* sql`
      CREATE TABLE balance_snapshots (
        id TEXT PRIMARY KEY NOT NULL,
        holding_id TEXT NOT NULL REFERENCES holdings (id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        amount_cents INTEGER NOT NULL,
        basis TEXT NOT NULL
      )
    `
    yield* sql`CREATE INDEX balance_snapshots_by_holding ON balance_snapshots (holding_id)`
  })

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* holdings(sql)
  yield* balanceSnapshots(sql)
})
