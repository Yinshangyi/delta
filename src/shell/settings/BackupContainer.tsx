import { useAtomSet, useAtomValue } from "@effect/atom-react"
import { Exit, Match, Result } from "effect"
import { useState } from "react"

import { backupFileName, downloadFile } from "@/bootstrap/backup/DownloadFile"
import { parseBackup } from "@/bootstrap/backup/ImportBackup"
import { readLastExport, writeLastExport } from "@/bootstrap/backup/LastExport"
import { resolveMutation, valueOrUndefined } from "@/shared/reactivity/AsyncState"
import {
  exportBackupAtom,
  importBackupAtom,
  summariseBackupAtom
} from "@/shell/settings/BackupAtoms"
import { BackupPanel } from "@/shell/settings/BackupPanel"
import { RestoreBackupDialog } from "@/shell/settings/RestoreBackupDialog"
import { SETTINGS_COPY } from "@/shell/settings/SettingsVocabulary"

import type { BackupDocument, InvalidBackup } from "@/bootstrap/backup/BackupDocument"
import type { AsyncState } from "@/shared/reactivity/AsyncState"

const GENERIC_FAILURE = "Could not read that file."

const messageFor = (invalid: InvalidBackup): string => SETTINGS_COPY.backup.failed[invalid.reason]

const busyOf = <A,>(state: AsyncState<A, unknown>): boolean =>
  Match.valueTags(state, {
    Idle: () => false,
    Loading: () => true,
    Success: () => false,
    Failure: () => false,
    Defect: () => false
  })

export function BackupContainer() {
  const [lastExport, setLastExport] = useState<string | undefined>(readLastExport)
  const [pending, setPending] = useState<BackupDocument | undefined>(undefined)
  const [fileError, setFileError] = useState<string | undefined>(undefined)

  const exporting = resolveMutation(useAtomValue(exportBackupAtom))
  const runExport = useAtomSet(exportBackupAtom, { mode: "promiseExit" })
  const summarised = useAtomValue(summariseBackupAtom)
  const runSummarise = useAtomSet(summariseBackupAtom, { mode: "promiseExit" })
  const restoring = resolveMutation(useAtomValue(importBackupAtom))
  const runImport = useAtomSet(importBackupAtom, { mode: "promiseExit" })

  const busy = busyOf(exporting) || busyOf(restoring)

  const onExport = () => {
    const exportedAt = new Date().toISOString()
    void runExport(exportedAt).then((exit) => {
      if (!Exit.isSuccess(exit)) return
      downloadFile(backupFileName(exportedAt), exit.value)
      writeLastExport(exportedAt)
      setLastExport(exportedAt)
    })
  }

  const onChoose = (file: File) => {
    setFileError(undefined)
    void file.text().then((contents) => {
      const parsed = parseBackup(contents)
      Result.match(parsed, {
        onFailure: (invalid) => setFileError(messageFor(invalid)),
        onSuccess: (document) => {
          setPending(document)
          void runSummarise(document)
        }
      })
    })
  }

  return (
    <>
      <BackupPanel
        lastExport={lastExport}
        onExport={onExport}
        onChoose={onChoose}
        busy={busy}
        error={fileError}
        summary={undefined}
      />

      <RestoreBackupDialog
        summary={pending === undefined ? undefined : valueOrUndefined(summarised)}
        busy={busy}
        error={fileError}
        onCancel={() => {
          setPending(undefined)
          setFileError(undefined)
        }}
        onConfirm={() => {
          if (pending === undefined) return
          void runImport(pending).then((exit) => {
            if (Exit.isSuccess(exit)) {
              setPending(undefined)
              /*
                Everything on screen was read from the database that has just
                been replaced. Reloading is the honest way to show the restored
                plan, and it also clears any scenario preview.
              */
              globalThis.location.reload()
            } else {
              setFileError(GENERIC_FAILURE)
            }
          })
        }}
      />
    </>
  )
}
