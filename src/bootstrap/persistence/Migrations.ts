/**
 * Spec §51.
 *
 * The schema is global — a projection joins across every module — so
 * migrations live here rather than with the module whose tables they create.
 * This is the one place SQL is allowed outside `secondary_adapters/`.
 *
 * Each migration runs in a transaction, so a failure leaves the schema at the
 * last good version rather than half-applied.
 */
import { SqliteMigrator } from "@effect/sql-sqlite-wasm"

import type { Layer } from "effect"
import type { SqlClient } from "effect/unstable/sql"
import type { Migrator, SqlError } from "effect/unstable/sql"

/**
 * Resolved at build time — there is no file system in a browser to read them
 * from. Files are named `<id>_<name>.ts` and applied in id order.
 */
const loader = SqliteMigrator.fromGlob(
  import.meta.glob("./migrations/*.ts") as Record<string, () => Promise<unknown>>
)

export const MigrationsLive: Layer.Layer<
  never,
  SqlError.SqlError | Migrator.MigrationError,
  SqlClient.SqlClient
> = SqliteMigrator.layer({ loader })
