import { useRef } from "react"

import { Button } from "@/dsl/Button"
import { SETTINGS_COPY } from "@/shell/settings/SettingsVocabulary"

import type { BackupSummary } from "@/bootstrap/backup/ImportBackup"

export interface BackupPanelProps {
  readonly lastExport: string | undefined
  readonly onExport: () => void
  readonly onChoose: (file: File) => void
  readonly busy: boolean
  readonly error: string | undefined
  readonly summary: BackupSummary | undefined
}

/** Already a local `YYYY-MM-DD`; anything else is shown as it was stored. */
const day = (stored: string): string =>
  /^\d{4}-\d{2}-\d{2}$/.test(stored) ? stored : stored.slice(0, 10)

/**
 * Backup given real visual weight rather than a buried link (DAT-01): this is
 * the only thing standing between a household's hand-entered finances and a
 * browser deciding it needs the space (spec §2.2).
 */
export function BackupPanel({
  lastExport,
  onExport,
  onChoose,
  busy,
  error,
  summary
}: BackupPanelProps) {
  const copy = SETTINGS_COPY.backup
  const picker = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className="text-muted text-sm">{copy.exportNote}</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button tone="primary" disabled={busy} onClick={onExport}>
            {copy.export}
          </Button>
          <p className="text-muted text-xs">
            {lastExport === undefined ? copy.never : `${copy.lastExported} ${day(lastExport)}`}
          </p>
        </div>
      </div>

      <div className="border-line flex flex-col gap-2 border-t pt-4">
        <h3 className="text-ink text-sm font-semibold">{copy.importTitle}</h3>
        <p className="text-muted text-sm">{copy.importNote}</p>

        <input
          ref={picker}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-label={copy.choose}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file !== undefined) onChoose(file)
            event.target.value = ""
          }}
        />

        <div>
          <Button disabled={busy} onClick={() => picker.current?.click()}>
            {copy.choose}
          </Button>
        </div>

        {summary === undefined ? null : (
          <p className="text-muted text-xs">
            {copy.reading} {day(summary.exportedAt)}
          </p>
        )}
        {error === undefined ? null : <p className="text-negative text-sm">{error}</p>}
      </div>
    </div>
  )
}
