/**
 * The household, its people, and what they earn (spec §5, §6, §8, §12).
 *
 * Money is stored as integer cents and dates as ISO text, which is what the
 * domain already holds — so a row needs no conversion, only validation on the
 * way back in.
 *
 * Income sources are one table with a `kind` discriminant and nullable columns
 * per variant, rather than a table each. The variants share most of their
 * shape, the set is small, and every query wants all of a person's income at
 * once.
 */
import { Effect } from "effect"
import { SqlClient } from "effect/unstable/sql"

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* sql`
    CREATE TABLE households (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL
    )
  `

  yield* sql`
    CREATE TABLE people (
      id TEXT PRIMARY KEY NOT NULL,
      household_id TEXT NOT NULL REFERENCES households (id) ON DELETE CASCADE,
      name TEXT NOT NULL
    )
  `

  yield* sql`CREATE INDEX people_by_household ON people (household_id)`

  yield* sql`
    CREATE TABLE income_sources (
      id TEXT PRIMARY KEY NOT NULL,
      person_id TEXT NOT NULL REFERENCES people (id) ON DELETE CASCADE,
      kind TEXT NOT NULL CHECK (kind IN ('freelance', 'salary')),
      name TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT,
      enabled INTEGER NOT NULL DEFAULT 1,

      daily_rate_cents INTEGER,
      payout_ratio_basis_points INTEGER,
      standard_billable_days INTEGER,

      monthly_net_before_tax_cents INTEGER,
      monthly_income_tax_cents INTEGER,
      annual_gross_cents INTEGER
    )
  `

  yield* sql`CREATE INDEX income_sources_by_person ON income_sources (person_id)`

  /**
   * Overrides are rows rather than a JSON column: a month is looked up, edited
   * and cleared one at a time, and spec §11 wants an override distinguishable
   * from the default — which an absent row says exactly.
   */
  yield* sql`
    CREATE TABLE billable_day_overrides (
      income_source_id TEXT NOT NULL REFERENCES income_sources (id) ON DELETE CASCADE,
      month TEXT NOT NULL,
      days INTEGER NOT NULL,
      PRIMARY KEY (income_source_id, month)
    )
  `
})
