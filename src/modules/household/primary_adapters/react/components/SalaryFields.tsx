import { Field, TextInput } from "@/dsl/Field"
import { HOUSEHOLD_COPY } from "@/modules/household/primary_adapters/react/HouseholdVocabulary"

import type { IncomeDraft } from "@/modules/household/primary_adapters/react/components/IncomeDraftState"

export interface SalaryFieldsProps {
  readonly draft: IncomeDraft
  readonly onChange: (patch: Partial<IncomeDraft>) => void
}

export function SalaryFields({ draft, onChange }: SalaryFieldsProps) {
  const copy = HOUSEHOLD_COPY.income

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Monthly net before tax (€)">
          {(ids) => (
            <TextInput
              {...ids}
              type="number"
              min={0}
              value={draft.monthlyNetBeforeTaxEuros}
              onChange={(event) => onChange({ monthlyNetBeforeTaxEuros: event.target.value })}
            />
          )}
        </Field>

        <Field label="Monthly income tax (€)">
          {(ids) => (
            <TextInput
              {...ids}
              type="number"
              min={0}
              value={draft.monthlyIncomeTaxEuros}
              onChange={(event) => onChange({ monthlyIncomeTaxEuros: event.target.value })}
            />
          )}
        </Field>
      </div>

      <Field label="Annual gross (€, optional)" hint={copy.annualGrossNote}>
        {(ids) => (
          <TextInput
            {...ids}
            type="number"
            min={0}
            value={draft.annualGrossEuros}
            onChange={(event) => onChange({ annualGrossEuros: event.target.value })}
          />
        )}
      </Field>
    </>
  )
}
