import { bytes } from "@/shared/presentation/ByteText"
import { SETTINGS_COPY } from "@/shell/settings/SettingsVocabulary"

export interface StoragePanelProps {
  readonly persisted: boolean
  readonly usedBytes: number | undefined
  readonly quotaBytes: number | undefined
}

const copy = SETTINGS_COPY.storage

/**
 * Props in, JSX out. The state is a sentence rather than a green tick: whether
 * the browser will keep months of hand-entered records is not something to
 * encode in a colour.
 */
export function StoragePanel({ persisted, usedBytes, quotaBytes }: StoragePanelProps) {
  const usage =
    usedBytes === undefined
      ? copy.unknown
      : quotaBytes === undefined
        ? `Using ${bytes(usedBytes)}`
        : `Using ${bytes(usedBytes)} of ${bytes(quotaBytes)} available`

  return (
    <div className="flex flex-col gap-2 text-sm">
      <p className={persisted ? "text-ink" : "text-estimated"}>
        {persisted ? copy.persistent : copy.notPersistent}
      </p>
      <p className="text-muted">{usage}</p>
    </div>
  )
}
