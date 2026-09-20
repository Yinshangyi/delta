import { Button } from "@/dsl/Button"
import { Dialog } from "@/dsl/Dialog"
import { COMMITMENTS_COPY } from "@/modules/commitments/primary_adapters/react/CommitmentVocabulary"

export interface DeleteCommitmentDialogProps {
  readonly name: string | undefined
  /** Debts lose their recorded balances too, which CMT-10 requires saying. */
  readonly isDebt: boolean
  readonly busy: boolean
  readonly error: string | undefined
  readonly onConfirm: () => void
  readonly onDisableInstead: () => void
  readonly onCancel: () => void
}

/**
 * Names what is lost before it is lost (CMT-10), including the effect on the
 * target date, and offers the reversible alternative in the same breath —
 * most people reaching for delete want the commitment to stop counting, which
 * switching it off does without discarding the record.
 */
export function DeleteCommitmentDialog({
  name,
  isDebt,
  busy,
  error,
  onConfirm,
  onDisableInstead,
  onCancel
}: DeleteCommitmentDialogProps) {
  const copy = COMMITMENTS_COPY.remove

  return (
    <Dialog
      open={name !== undefined}
      onClose={onCancel}
      title={copy.title}
      actions={
        <>
          <Button onClick={onCancel}>{copy.cancel}</Button>
          <Button disabled={busy} onClick={onDisableInstead}>
            {copy.disableInstead}
          </Button>
          {/*
            Secondary, deliberately: CMT-10 asks that delete not carry the same
            weight as the primary action, and here the primary action is the
            one that can be undone.
          */}
          <Button disabled={busy} onClick={onConfirm}>
            {copy.confirm}
          </Button>
        </>
      }
    >
      <p className="text-ink text-sm">{name}</p>
      <p className="text-muted mt-2 text-sm">{copy.warning}</p>
      {isDebt ? <p className="text-muted mt-2 text-sm">{copy.debtWarning}</p> : null}
      <p className="text-muted mt-2 text-sm">{copy.alternative}</p>
      {error === undefined ? null : <p className="text-negative mt-3 text-sm">{error}</p>}
    </Dialog>
  )
}
