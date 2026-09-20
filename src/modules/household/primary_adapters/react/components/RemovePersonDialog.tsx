import { Button } from "@/dsl/Button"
import { Dialog } from "@/dsl/Dialog"
import { HOUSEHOLD_COPY } from "@/modules/household/primary_adapters/react/HouseholdVocabulary"

export interface RemovePersonDialogProps {
  readonly person: string | undefined
  readonly error: string | undefined
  readonly busy: boolean
  readonly onConfirm: () => void
  readonly onCancel: () => void
}

/**
 * Spec §40 asks for the consequence before the act, not after: the income goes
 * with the person, and the target date moves out. The refusal to remove the
 * last person arrives here too, as a reason in place of a silent no-op.
 */
export function RemovePersonDialog({
  person,
  error,
  busy,
  onConfirm,
  onCancel
}: RemovePersonDialogProps) {
  const copy = HOUSEHOLD_COPY.members

  return (
    <Dialog
      open={person !== undefined}
      onClose={onCancel}
      title={copy.removeTitle}
      actions={
        <>
          <Button onClick={onCancel}>{copy.cancel}</Button>
          {/*
            Not a red button: semantic colour touches figures only (index.css,
            design-brief.md principle 5). Inside a dialog that says what is
            about to be lost, the word is the warning.
          */}
          <Button tone="primary" disabled={busy} onClick={onConfirm}>
            {copy.removeConfirm}
          </Button>
        </>
      }
    >
      <p className="text-ink text-sm">{person}</p>
      <p className="text-muted mt-2 text-sm">{copy.removeWarning}</p>
      {error === undefined ? null : <p className="text-negative mt-3 text-sm">{error}</p>}
    </Dialog>
  )
}
