import { useState } from "react"

import { Button } from "@/dsl/Button"
import { Dialog } from "@/dsl/Dialog"
import { Field, TextInput } from "@/dsl/Field"
import { Select } from "@/dsl/Select"
import { KIND_LABELS } from "@/modules/commitments/primary_adapters/react/CommitmentVocabulary"
import {
  type CommitmentFormState,
  emptyCommitmentForm,
  isReady
} from "@/modules/commitments/primary_adapters/react/components/CommitmentDraftState"
import { CommitmentKindFields } from "@/modules/commitments/primary_adapters/react/components/CommitmentKindFields"

import type { CommitmentKind } from "@/modules/commitments/core/domain/Commitment"

export interface CommitmentFormProps {
  readonly open: boolean
  /** Present when editing; the kind is then fixed, because it is not the same thing. */
  readonly initial: CommitmentFormState | undefined
  readonly onSubmit: (state: CommitmentFormState) => Promise<boolean>
  readonly onCancel: () => void
  readonly busy: boolean
  readonly error: string | undefined
}

const KINDS = Object.keys(KIND_LABELS) as ReadonlyArray<CommitmentKind>

const isKind = (value: string): value is CommitmentKind =>
  (KINDS as ReadonlyArray<string>).includes(value)

/**
 * One form for all five kinds. Editing keeps the kind it already is — turning
 * a debt into a subscription is not an edit, it is two different things — so
 * the selector is only offered when adding.
 */
export function CommitmentForm({
  open,
  initial,
  onSubmit,
  onCancel,
  busy,
  error
}: CommitmentFormProps) {
  const [state, setState] = useState<CommitmentFormState>(initial ?? emptyCommitmentForm)
  const change = (patch: Partial<CommitmentFormState>) => setState({ ...state, ...patch })

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={initial === undefined ? "Add a commitment" : "Edit commitment"}
      actions={
        <>
          <Button onClick={onCancel}>Cancel</Button>
          <Button
            tone="primary"
            disabled={!isReady(state) || busy}
            onClick={() => {
              void onSubmit(state).then((saved) => {
                if (saved) setState(emptyCommitmentForm)
              })
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {initial === undefined ? (
          <Field label="Kind">
            {(ids) => (
              <Select
                {...ids}
                value={state.kind}
                onChange={(event) => {
                  const next = event.target.value
                  if (isKind(next)) change({ kind: next })
                }}
              >
                {KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {KIND_LABELS[kind]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        ) : null}

        <Field label="Name">
          {(ids) => (
            <TextInput
              {...ids}
              value={state.name}
              autoComplete="off"
              onChange={(event) => change({ name: event.target.value })}
            />
          )}
        </Field>

        <CommitmentKindFields state={state} onChange={change} busy={busy} />
      </div>

      {error === undefined ? null : <p className="text-negative mt-3 text-sm">{error}</p>}
    </Dialog>
  )
}
