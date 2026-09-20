/**
 * Backup and restore, as atoms.
 *
 * In the shell rather than a module because a backup is the *whole* database,
 * which belongs to no single module — the same reason the migrations live in
 * `bootstrap/`.
 */
import { Effect } from "effect"

import { exportBackup, toFileContents } from "@/bootstrap/backup/ExportBackup"
import { importBackup, summarise } from "@/bootstrap/backup/ImportBackup"
import { appRuntime } from "@/bootstrap/runtime/AppRuntime"

import type { BackupDocument } from "@/bootstrap/backup/BackupDocument"

export const exportBackupAtom = appRuntime.fn<string>()((exportedAt) =>
  exportBackup(exportedAt).pipe(Effect.map(toFileContents))
)

export const summariseBackupAtom = appRuntime.fn<BackupDocument>()((document) =>
  summarise(document)
)

export const importBackupAtom = appRuntime.fn<BackupDocument>()((document) =>
  importBackup(document)
)
