import { useState } from "react"

import { Button } from "@/dsl/Button"
import { Field, TextInput } from "@/dsl/Field"
import { HOUSEHOLD_COPY } from "@/modules/household/primary_adapters/react/HouseholdVocabulary"

export interface HouseholdNameFormProps {
  readonly current: string
  readonly onRename: (to: string) => void
  readonly busy: boolean
  readonly error: string | undefined
}

/** HH-02's last criterion: the name chosen at first run stays editable. */
export function HouseholdNameForm({ current, onRename, busy, error }: HouseholdNameFormProps) {
  const [draft, setDraft] = useState(current)
  const copy = HOUSEHOLD_COPY.members
  const changed = draft.trim() !== current

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
      onSubmit={(event) => {
        event.preventDefault()
        onRename(draft)
      }}
    >
      <div className="grow">
        <Field label={copy.householdNameLabel} {...(error === undefined ? {} : { error })}>
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
      <Button type="submit" disabled={!changed || busy}>
        {copy.rename}
      </Button>
    </form>
  )
}
