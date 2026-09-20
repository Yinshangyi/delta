import { Button } from "@/dsl/Button"
import { Dialog } from "@/dsl/Dialog"
import { CAPITAL_COPY } from "@/modules/capital/primary_adapters/react/CapitalVocabulary"

export interface DeleteHoldingDialogProps {
  readonly name: string | undefined
  readonly valuations: number
  readonly busy: boolean
  readonly error: string | undefined
  readonly onConfirm: () => void
  readonly onExcludeInstead: () => void
  readonly onCancel: () => void
}

/**
 * Names the valuation history that goes with it (CAP-09), and offers leaving
 * the holding out of capital in the same breath — which is what someone
 * reaching for delete usually means when the thing still exists.
 */
export function DeleteHoldingDialog({
  name,
  valuations,
  busy,
  error,
  onConfirm,
  onExcludeInstead,
  onCancel
}: DeleteHoldingDialogProps) {
  const copy = CAPITAL_COPY.remove

  return (
    <Dialog
      open={name !== undefined}
      onClose={onCancel}
      title={copy.title}
      actions={
        <>
          <Button onClick={onCancel}>{copy.cancel}</Button>
          <Button disabled={busy} onClick={onExcludeInstead}>
            {copy.excludeInstead}
          </Button>
          <Button disabled={busy} onClick={onConfirm}>
            {copy.confirm}
          </Button>
        </>
      }
    >
      <p className="text-ink text-sm">{name}</p>
      <p className="text-muted mt-2 text-sm">{copy.warning}</p>
      <p className="text-muted mt-2 text-sm">
        {valuations === 1
          ? "One recorded value will be deleted with it."
          : `${valuations} recorded values will be deleted with it.`}
      </p>
      <p className="text-muted mt-2 text-sm">{copy.alternative}</p>
      {error === undefined ? null : <p className="text-negative mt-3 text-sm">{error}</p>}
    </Dialog>
  )
}
