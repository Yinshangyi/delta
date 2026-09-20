import { useState } from "react"

import { Button } from "@/dsl/Button"
import { Field, TextInput } from "@/dsl/Field"
import { Select } from "@/dsl/Select"
import { FreelanceFields } from "@/modules/household/primary_adapters/react/components/FreelanceFields"
import {
  emptyIncomeDraft,
  type IncomeDraft,
  isReady
} from "@/modules/household/primary_adapters/react/components/IncomeDraftState"
import { SalaryFields } from "@/modules/household/primary_adapters/react/components/SalaryFields"
import { HOUSEHOLD_COPY } from "@/modules/household/primary_adapters/react/HouseholdVocabulary"

export interface AddIncomeFormProps {
  /**
   * Answers whether the draft was saved. The form cannot tell from its own
   * state — clearing on submit would throw away a rejected draft and leave the
   * person retyping it, and staying open on success reads as nothing having
   * happened.
   */
  readonly onSubmit: (draft: IncomeDraft) => Promise<boolean>
  readonly busy: boolean
  readonly error: string | undefined
}

/**
 * One form for both variants, because the two share a name and a period and
 * differ only in what they are paid on. The kind selector switches the middle
 * of the form; nothing about either variant is the other's default.
 */
export function AddIncomeForm({ onSubmit, busy, error }: AddIncomeFormProps) {
  const [draft, setDraft] = useState<IncomeDraft>(emptyIncomeDraft)
  const [open, setOpen] = useState(false)
  const copy = HOUSEHOLD_COPY.income
  const change = (patch: Partial<IncomeDraft>) => setDraft({ ...draft, ...patch })

  if (!open) {
    return <Button onClick={() => setOpen(true)}>Add income</Button>
  }

  return (
    <form
      className="border-line mt-2 flex flex-col gap-4 border-t pt-4"
      onSubmit={(event) => {
        event.preventDefault()
        void onSubmit(draft).then((saved) => {
          if (!saved) return
          setDraft(emptyIncomeDraft)
          setOpen(false)
        })
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kind">
          {(ids) => (
            <Select
              {...ids}
              value={draft.kind}
              onChange={(event) =>
                change({ kind: event.target.value === "salary" ? "salary" : "freelance" })
              }
            >
              <option value="freelance">{copy.freelance}</option>
              <option value="salary">{copy.salary}</option>
            </Select>
          )}
        </Field>

        <Field label="Name">
          {(ids) => (
            <TextInput
              {...ids}
              value={draft.name}
              autoComplete="off"
              onChange={(event) => change({ name: event.target.value })}
            />
          )}
        </Field>

        <Field label="Start date">
          {(ids) => (
            <TextInput
              {...ids}
              type="date"
              value={draft.startDate}
              onChange={(event) => change({ startDate: event.target.value })}
            />
          )}
        </Field>

        <Field label="End date (optional)" hint="Leave empty while it is ongoing.">
          {(ids) => (
            <TextInput
              {...ids}
              type="date"
              value={draft.endDate}
              onChange={(event) => change({ endDate: event.target.value })}
            />
          )}
        </Field>
      </div>

      {draft.kind === "freelance" ? (
        <FreelanceFields draft={draft} onChange={change} busy={busy} />
      ) : (
        <SalaryFields draft={draft} onChange={change} />
      )}

      {error === undefined ? null : <p className="text-negative text-sm">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button
          onClick={() => {
            setDraft(emptyIncomeDraft)
            setOpen(false)
          }}
        >
          Cancel
        </Button>
        <Button type="submit" tone="primary" disabled={!isReady(draft) || busy}>
          Save income
        </Button>
      </div>
    </form>
  )
}
