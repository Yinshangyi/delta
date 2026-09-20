/**
 * SQLite enforces foreign keys only when asked to, per connection, and the
 * default is off.
 *
 * Without this every `REFERENCES … ON DELETE CASCADE` in the migrations is
 * decorative: removing a debt leaves its snapshots behind, removing a person
 * leaves their income behind, and a row can point at a household that does not
 * exist. All of which looks exactly like a schema that works.
 *
 * It is applied where the client is built rather than at a call site, because
 * the one thing that must not happen is a connection that missed it.
 */
import { Effect, Layer } from "effect"
import { SqlClient } from "effect/unstable/sql"

import type { SqlError } from "effect/unstable/sql"

export const ForeignKeysOn: Layer.Layer<never, SqlError.SqlError, SqlClient.SqlClient> =
  Layer.effectDiscard(
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      yield* sql`PRAGMA foreign_keys = ON`
    })
  )
