import { Button } from "@/dsl/Button"
import { Dialog } from "@/dsl/Dialog"
import { SCENARIOS_COPY } from "@/modules/scenarios/primary_adapters/react/ScenarioVocabulary"

import type { ChangeSummary } from "@/modules/scenarios/primary_adapters/react/ChangeSummary"

export interface ApplyScenarioDialogProps {
  readonly open: boolean
  readonly changes: ReadonlyArray<ChangeSummary>
  readonly busy: boolean
  readonly error: string | undefined
  readonly onConfirm: () => void
  readonly onCancel: () => void
}

/**
 * Lists exactly what will change before anything does (SCN-08). Applying is
 * the only step in this whole epic that writes to the real plan, so it is the
 * only one that asks.
 */
export function ApplyScenarioDialog({
  open,
  changes,
  busy,
  error,
  onConfirm,
  onCancel
}: ApplyScenarioDialogProps) {
  const copy = SCENARIOS_COPY.apply

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={copy.title}
      actions={
        <>
          <Button onClick={onCancel}>{copy.cancel}</Button>
          <Button tone="primary" disabled={busy} onClick={onConfirm}>
            {copy.confirm}
          </Button>
        </>
      }
    >
      <ul className="flex flex-col gap-2">
        {changes.map((change) => (
          <li key={change.id} className="flex flex-col gap-0.5">
            <span className="text-muted text-xs">{change.label}</span>
            <span className="text-ink text-sm">{change.detail}</span>
          </li>
        ))}
      </ul>
      <p className="text-muted mt-3 text-sm">{copy.note}</p>
      {error === undefined ? null : <p className="text-negative mt-3 text-sm">{error}</p>}
    </Dialog>
  )
}
