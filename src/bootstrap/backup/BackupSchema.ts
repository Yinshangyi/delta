/**
 * The backup file as a schema, so a file from disk is decoded rather than
 * trusted (DAT-02).
 *
 * Rows are `Record<string, string | number | null>` — the shape SQLite returns
 * — deliberately loose. A backup's job is to survive: validating each column
 * against today's domain rules would mean a file written last year stops
 * importing because a rule tightened, which is the opposite of a backup. The
 * strictness that matters is at the envelope: is this Delta's file, and is it
 * a version this build understands.
 */
import { Schema } from "effect"

import { BACKUP_TABLES } from "@/bootstrap/backup/BackupTables"

const BackupValue = Schema.Union([Schema.String, Schema.Number, Schema.Null])

const BackupRow = Schema.Record(Schema.String, BackupValue)

const Rows = Schema.Array(BackupRow)

/**
 * Built from the table list rather than written out, so a table added there is
 * carried here without a second edit anybody could forget.
 */
const Tables = Schema.Struct(
  Object.fromEntries(BACKUP_TABLES.map((table) => [table, Rows])) as Record<
    (typeof BACKUP_TABLES)[number],
    typeof Rows
  >
)

export const BackupFile = Schema.Struct({
  application: Schema.Literal("delta"),
  version: Schema.Number,
  exportedAt: Schema.String,
  tables: Tables
})

/** Indented: a backup nobody can read is a backup nobody can check. */
export const BackupJson = Schema.fromJsonString(BackupFile, { space: 2 })
