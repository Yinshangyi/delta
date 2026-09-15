/** Each layer build is a fresh, empty database: no shared state, no teardown. */
import { SqliteClient } from "@effect/sql-sqlite-wasm"

import type { Layer } from "effect"
import type { SqlClient, SqlError } from "effect/unstable/sql"

export const DatabaseInMemory: Layer.Layer<
  SqliteClient.SqliteClient | SqlClient.SqlClient,
  SqlError.SqlError
> = SqliteClient.layerMemory({})
