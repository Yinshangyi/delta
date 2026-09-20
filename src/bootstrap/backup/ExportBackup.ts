/**
 * Every row the household owns, in one document (DAT-01).
 *
 * Reads the tables directly rather than going through each module's port. A
 * port returns what the domain models; a backup has to return what is actually
 * stored, including anything a port does not currently expose. The two are the
 * same today and the difference is the whole point of a backup.
 *
 * Nothing is transmitted anywhere: this produces a string, and the caller
 * hands it to the browser's own download.
 */
import { Effect, Schema } from "effect"
import { SqlClient } from "effect/unstable/sql"

import { BACKUP_VERSION, BackupDocument } from "@/bootstrap/backup/BackupDocument"
import { BackupJson } from "@/bootstrap/backup/BackupSchema"
import { BACKUP_TABLES, type BackupTable } from "@/bootstrap/backup/BackupTables"
import { wrap } from "@/shared/domain/PersistenceError"

import type { BackupRow } from "@/bootstrap/backup/BackupDocument"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

const rowsOf = (
  sql: SqlClient.SqlClient,
  table: BackupTable
): Effect.Effect<ReadonlyArray<BackupRow>, PersistenceError> =>
  sql<BackupRow>`SELECT * FROM ${sql.literal(table)} ORDER BY rowid`.pipe(
    Effect.mapError(wrap(`export the ${table} table`))
  )

export const exportBackup = (
  exportedAt: string
): Effect.Effect<BackupDocument, PersistenceError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    const tables = {} as Record<BackupTable, ReadonlyArray<BackupRow>>
    for (const table of BACKUP_TABLES) {
      tables[table] = yield* rowsOf(sql, table)
    }

    return new BackupDocument({
      application: "delta",
      version: BACKUP_VERSION,
      exportedAt,
      tables
    })
  })

/**
 * Encoded through the same schema an import decodes with, so a file this build
 * writes is a file this build can read — and a change to one side cannot
 * silently diverge from the other.
 */
export const toFileContents = (document: BackupDocument): string =>
  `${Schema.encodeSync(BackupJson)(document)}\n`
