import { BACKUP_TABLES } from "@/bootstrap/backup/BackupTables"
import { Button } from "@/dsl/Button"
import { Dialog } from "@/dsl/Dialog"
import { SETTINGS_COPY } from "@/shell/settings/SettingsVocabulary"

import type { BackupSummary } from "@/bootstrap/backup/ImportBackup"

export interface RestoreBackupDialogProps {
  readonly summary: BackupSummary | undefined
  readonly busy: boolean
  readonly error: string | undefined
  readonly onConfirm: () => void
  readonly onCancel: () => void
}

/** `income_sources` → `income sources`, so the list reads as things owned. */
const readable = (table: string): string => table.replaceAll("_", " ")

/**
 * Says plainly that restoring replaces everything, and shows what is in the
 * file against what is here before a single row is written (DAT-02).
 *
 * The comparison is per kind rather than a total: "12 commitments become 4" is
 * a sentence someone can check against their own memory, and "37 rows become
 * 29" is not.
 */
export function RestoreBackupDialog({
  summary,
  busy,
  error,
  onConfirm,
  onCancel
}: RestoreBackupDialogProps) {
  const copy = SETTINGS_COPY.backup.restore

  const changed =
    summary === undefined
      ? []
      : BACKUP_TABLES.filter(
          (table) => summary.existing[table] !== 0 || summary.incoming[table] !== 0
        )

  return (
    <Dialog
      open={summary !== undefined}
      onClose={onCancel}
      title={copy.title}
      actions={
        <>
          <Button onClick={onCancel}>{copy.cancel}</Button>
          <Button disabled={busy} onClick={onConfirm}>
            {copy.confirm}
          </Button>
        </>
      }
    >
      <p className="text-muted text-sm">{copy.note}</p>
      {summary === undefined ? null : (
        <p className="text-muted mt-2 text-sm">
          {copy.exportedOn} {summary.exportedAt.slice(0, 10)}.
        </p>
      )}

      <h3 className="text-ink mt-4 text-sm font-semibold">{copy.willReplace}</h3>
      <ul className="mt-2 flex flex-col gap-1">
        {changed.map((table) => (
          <li key={table} className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-muted">{readable(table)}</span>
            <span className="text-ink tabular-nums">
              {summary?.existing[table] ?? 0} → {summary?.incoming[table] ?? 0}
            </span>
          </li>
        ))}
      </ul>

      {error === undefined ? null : <p className="text-negative mt-3 text-sm">{error}</p>}
    </Dialog>
  )
}
