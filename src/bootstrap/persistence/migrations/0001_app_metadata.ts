/**
 * `ImportDatabaseUseCase` restores a backup by handing SQLite an arbitrary
 * file the user picked. Without a marker of our own there is no way to tell a
 * Delta backup from any other SQLite database, and the import would replace
 * someone's finances with whatever they clicked.
 */
import { Effect } from "effect"
import { SqlClient } from "effect/unstable/sql"

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* sql`
    CREATE TABLE app_metadata (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    )
  `

  yield* sql`INSERT INTO app_metadata (key, value) VALUES ('application', 'delta')`
})
