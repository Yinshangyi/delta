/**
 * What a backup file is (DAT-01).
 *
 * **JSON, not the wasm client's binary export.** The ticket asks for the
 * decision to be deliberate: a binary copy is exact but opaque, and a
 * household whose only copy is a blob they cannot read has to trust that Delta
 * still opens in five years. JSON is inspectable, diffable, and survives a
 * schema change — rows for a table that no longer exists can be reported
 * rather than crashing an import.
 *
 * Rows are carried as they sit in the database: integer cents, ISO dates, the
 * same column names. No domain decoding on the way out and none on the way in,
 * so a backup cannot fail to round-trip because a validator grew stricter
 * between versions.
 */
import { Data } from "effect"

import type { BackupTable } from "@/bootstrap/backup/BackupTables"

/** A row as SQLite holds it: text, numbers and nulls. */
export type BackupValue = string | number | null
export type BackupRow = Readonly<Record<string, BackupValue>>

/**
 * Raised when the format changes incompatibly. It has not yet, and when it
 * does the import says so rather than applying half a file (DAT-02).
 */
export const BACKUP_VERSION = 1

export class BackupDocument extends Data.Class<{
  readonly application: "delta"
  readonly version: number
  readonly exportedAt: string
  readonly tables: Readonly<Record<BackupTable, ReadonlyArray<BackupRow>>>
}> {}

export class InvalidBackup extends Data.TaggedError("InvalidBackup")<{
  readonly reason: "not-json" | "not-a-delta-backup" | "unsupported-version" | "missing-tables"
  readonly detail: string
}> {}
