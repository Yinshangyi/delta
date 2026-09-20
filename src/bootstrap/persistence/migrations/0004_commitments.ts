/**
 * Money leaving the household (spec §17 to §27).
 *
 * One table with a `kind` discriminant, like income sources: the variants
 * share most of their shape, the set is small and closed, and every screen
 * wants all of them at once — spec §28 is explicit that there are no separate
 * sections for taxes, debt and expenses.
 *
 * Two things get their own tables because they are lists rather than fields. A
 * tax schedule is dated rows precisely so it is never collapsed into a monthly
 * average (§25), and debt snapshots are a history the household adds to (§21).
 */
import { Effect } from "effect"
import { SqlClient } from "effect/unstable/sql"

const commitments = (sql: SqlClient.SqlClient) =>
  Effect.gen(function* () {
    yield* sql`
      CREATE TABLE commitments (
        id TEXT PRIMARY KEY NOT NULL,
        household_id TEXT NOT NULL REFERENCES households (id) ON DELETE CASCADE,
        kind TEXT NOT NULL,
        name TEXT NOT NULL,
        enabled INTEGER NOT NULL,
        amount_cents INTEGER,
        start_date TEXT,
        end_date TEXT,
        one_off_date TEXT,
        initial_amount_cents INTEGER,
        interest_rate_basis_points INTEGER,
        regular_payment_cents INTEGER,
        tax_year INTEGER,
        tax_status TEXT,
        person_id TEXT REFERENCES people (id) ON DELETE SET NULL
      )
    `
    yield* sql`CREATE INDEX commitments_by_household ON commitments (household_id)`
  })

const scheduledPayments = (sql: SqlClient.SqlClient) =>
  sql`
    CREATE TABLE scheduled_payments (
      commitment_id TEXT NOT NULL REFERENCES commitments (id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      PRIMARY KEY (commitment_id, date)
    )
  `

/** Cascaded, so deleting a debt takes its history with it (CMT-10). */
const debtSnapshots = (sql: SqlClient.SqlClient) =>
  Effect.gen(function* () {
    yield* sql`
      CREATE TABLE debt_snapshots (
        id TEXT PRIMARY KEY NOT NULL,
        debt_id TEXT NOT NULL REFERENCES commitments (id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        remaining_amount_cents INTEGER NOT NULL
      )
    `
    yield* sql`CREATE INDEX debt_snapshots_by_debt ON debt_snapshots (debt_id)`
  })

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* commitments(sql)
  yield* scheduledPayments(sql)
  yield* debtSnapshots(sql)
})
