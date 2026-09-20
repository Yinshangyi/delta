import { useState } from "react"

import { Button } from "@/dsl/Button"
import { Field, TextInput } from "@/dsl/Field"
import { HOUSEHOLD_COPY } from "@/modules/household/primary_adapters/react/HouseholdVocabulary"

export interface AddPersonFormProps {
  readonly onAdd: (name: string) => void
  readonly busy: boolean
  readonly error: string | undefined
}

/** A person needs only a name (spec §6), so the form asks for only a name. */
export function AddPersonForm({ onAdd, busy, error }: AddPersonFormProps) {
  const [draft, setDraft] = useState("")
  const copy = HOUSEHOLD_COPY.members

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
      onSubmit={(event) => {
        event.preventDefault()
        onAdd(draft)
        setDraft("")
      }}
    >
      <div className="grow">
        <Field
          label={copy.addLabel}
          hint={copy.addHint}
          {...(error === undefined ? {} : { error })}
        >
          {(ids) => (
            <TextInput
              {...ids}
              value={draft}
              autoComplete="off"
              invalid={error !== undefined}
              onChange={(event) => setDraft(event.target.value)}
            />
          )}
        </Field>
      </div>
      <Button type="submit" disabled={draft.trim() === "" || busy}>
        {copy.add}
      </Button>
    </form>
  )
}
