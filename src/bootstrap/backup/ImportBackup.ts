/**
 * Replace everything with the contents of a file (DAT-02).
 *
 * **Atomic.** The whole restore runs inside one transaction: a file that turns
 * out to be malformed half way through leaves the household's data exactly as
 * it was. Nothing is deleted until the file has decoded, and the deletion and
 * the insert are the same transaction.
 *
 * Nothing is validated against domain rules on the way in, by design — see
 * BackupSchema. What is checked is the envelope: that this is Delta's file and
 * a version this build understands.
 */
import { Effect, Result, Schema } from "effect"
import { SqlClient } from "effect/unstable/sql"

import { BACKUP_VERSION, InvalidBackup } from "@/bootstrap/backup/BackupDocument"
import { BackupJson } from "@/bootstrap/backup/BackupSchema"
import { BACKUP_TABLES, type BackupTable } from "@/bootstrap/backup/BackupTables"
import { wrap } from "@/shared/domain/PersistenceError"

import type { BackupDocument, BackupRow } from "@/bootstrap/backup/BackupDocument"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export const parseBackup = (contents: string): Result.Result<BackupDocument, InvalidBackup> => {
  const decoded = Schema.decodeUnknownResult(BackupJson)(contents)

  return Result.match(decoded, {
    onFailure: (issue) =>
      Result.fail(
        new InvalidBackup({
          reason: contents.trim().startsWith("{") ? "not-a-delta-backup" : "not-json",
          detail: String(issue)
        })
      ),
    onSuccess: (file) =>
      file.version > BACKUP_VERSION
        ? Result.fail(
            new InvalidBackup({
              reason: "unsupported-version",
              detail: `The file was written by a newer version of Delta (format ${file.version}; this build reads ${BACKUP_VERSION}).`
            })
          )
        : Result.succeed(file as BackupDocument)
  })
}

/** What a restore is about to do, before it does any of it (DAT-02). */
export interface BackupSummary {
  readonly exportedAt: string
  readonly incoming: Readonly<Record<BackupTable, number>>
  readonly existing: Readonly<Record<BackupTable, number>>
}

const countOf = (sql: SqlClient.SqlClient, table: BackupTable) =>
  sql<{ readonly rows: number }>`
    SELECT COUNT(*) AS rows FROM ${sql.literal(table)}
  `.pipe(
    Effect.map((result) => result[0]?.rows ?? 0),
    Effect.mapError(wrap(`count the ${table} table`))
  )

export const summarise = (
  document: BackupDocument
): Effect.Effect<BackupSummary, PersistenceError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const existing = {} as Record<BackupTable, number>
    const incoming = {} as Record<BackupTable, number>

    for (const table of BACKUP_TABLES) {
      existing[table] = yield* countOf(sql, table)
      incoming[table] = document.tables[table].length
    }

    return { exportedAt: document.exportedAt, existing, incoming }
  })

const insert = (sql: SqlClient.SqlClient, table: BackupTable, row: BackupRow) => {
  const columns = Object.keys(row)
  if (columns.length === 0) return Effect.void

  return sql`
    INSERT INTO ${sql.literal(table)} ${sql.insert(row)}
  `.pipe(Effect.asVoid)
}

export const importBackup = (
  document: BackupDocument
): Effect.Effect<void, PersistenceError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    yield* sql
      .withTransaction(
        Effect.gen(function* () {
          /*
            Deleted in reverse, inserted forwards: foreign keys are enforced,
            so a child has to go before its parent and arrive after it.
          */
          for (const table of [...BACKUP_TABLES].reverse()) {
            yield* sql`DELETE FROM ${sql.literal(table)}`
          }

          for (const table of BACKUP_TABLES) {
            for (const row of document.tables[table]) {
              yield* insert(sql, table, row)
            }
          }
        })
      )
      .pipe(Effect.mapError(wrap("restore from a backup")))
  })
