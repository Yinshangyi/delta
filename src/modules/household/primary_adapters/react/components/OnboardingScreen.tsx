import { useState } from "react"

import { Button } from "@/dsl/Button"
import { Field, TextInput } from "@/dsl/Field"
import { HOUSEHOLD_COPY } from "@/modules/household/primary_adapters/react/HouseholdVocabulary"

export interface OnboardingScreenProps {
  readonly onSubmit: (household: string, firstPerson: string) => void
  readonly busy: boolean
  readonly error: string | undefined
}

/**
 * The first screen a new database shows (spec §65). It asks for exactly what
 * the domain requires to exist — a household name and one person — and nothing
 * it could guess wrong: no default names, no assumed number of people, no
 * suggested amounts.
 */
export function OnboardingScreen({ onSubmit, busy, error }: OnboardingScreenProps) {
  const [household, setHousehold] = useState("")
  const [firstPerson, setFirstPerson] = useState("")
  const copy = HOUSEHOLD_COPY.onboarding
  const ready = household.trim() !== "" && firstPerson.trim() !== ""

  return (
    <form
      className="mx-auto flex w-full max-w-md flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(household, firstPerson)
      }}
    >
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="text-muted text-sm">{copy.description}</p>
      </header>

      <Field label={copy.householdLabel} hint={copy.householdHint}>
        {(ids) => (
          <TextInput
            {...ids}
            value={household}
            autoComplete="off"
            onChange={(event) => setHousehold(event.target.value)}
          />
        )}
      </Field>

      <Field
        label={copy.personLabel}
        hint={copy.personHint}
        {...(error === undefined ? {} : { error })}
      >
        {(ids) => (
          <TextInput
            {...ids}
            value={firstPerson}
            autoComplete="off"
            invalid={error !== undefined}
            onChange={(event) => setFirstPerson(event.target.value)}
          />
        )}
      </Field>

      <div className="flex justify-end">
        <Button type="submit" tone="primary" disabled={!ready || busy}>
          {copy.submit}
        </Button>
      </div>
    </form>
  )
}
