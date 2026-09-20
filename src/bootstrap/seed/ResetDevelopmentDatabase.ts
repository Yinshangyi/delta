/**
 * Get back to a known state in one step (DAT-04).
 *
 * Two actions rather than one command, because of where the database lives.
 * Delta's SQLite file is inside OPFS, in a browser worker — there is no path
 * on disk for a shell script to delete, so `pnpm reset-dev-db` cannot exist in
 * the form the ticket pictures. Both of these are therefore in-app and
 * development-only.
 *
 * **Reset to seed data** empties every table and seeds. Fast, and the one to
 * reach for.
 *
 * **Delete the database** removes the OPFS file entirely, so the next load
 * runs every migration against nothing. That is the one that catches a
 * migration bug, which emptying tables cannot.
 */
import { Effect } from "effect"
import { SqlClient } from "effect/unstable/sql"

import { BACKUP_TABLES } from "@/bootstrap/backup/BackupTables"
import { seedDevelopmentData, type SeedServices } from "@/bootstrap/seed/DevelopmentSeed"
import { wrap } from "@/shared/domain/PersistenceError"

import type { PersistenceError } from "@/shared/domain/PersistenceError"

/** The name the worker opens — see SqliteOpfs.worker.ts. */
const DATABASE_FILE = "delta.db"

export const resetToSeed = (
  today: string
): Effect.Effect<void, PersistenceError, SeedServices | SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    yield* sql
      .withTransaction(
        Effect.gen(function* () {
          // Reverse order: foreign keys are enforced, so a child goes first.
          for (const table of [...BACKUP_TABLES].reverse()) {
            yield* sql`DELETE FROM ${sql.literal(table)}`
          }
        })
      )
      .pipe(Effect.mapError(wrap("empty the development database")))

    yield* seedDevelopmentData(today)
  })

/**
 * Removes the OPFS file. The worker is holding it open, so this can only
 * succeed once the page stops using it — the caller reloads immediately after,
 * and a failure here is reported rather than swallowed.
 */
export const deleteDatabaseFile = (): Effect.Effect<void, PersistenceError> =>
  Effect.tryPromise({
    try: async () => {
      const root = await navigator.storage.getDirectory()
      await root.removeEntry(DATABASE_FILE)
    },
    catch: wrap("delete the development database file")
  })
