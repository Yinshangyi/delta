import { Field, TextInput } from "@/dsl/Field"
import { BillableDaysEditor } from "@/modules/household/primary_adapters/react/components/BillableDaysEditor"
import { HOUSEHOLD_COPY } from "@/modules/household/primary_adapters/react/HouseholdVocabulary"

import type { IncomeDraft } from "@/modules/household/primary_adapters/react/components/IncomeDraftState"

export interface FreelanceFieldsProps {
  readonly draft: IncomeDraft
  readonly onChange: (patch: Partial<IncomeDraft>) => void
  readonly busy: boolean
}

export function FreelanceFields({ draft, onChange, busy }: FreelanceFieldsProps) {
  const copy = HOUSEHOLD_COPY.income

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Daily rate (€)">
          {(ids) => (
            <TextInput
              {...ids}
              type="number"
              min={0}
              value={draft.dailyRateEuros}
              onChange={(event) => onChange({ dailyRateEuros: event.target.value })}
            />
          )}
        </Field>

        <Field label="Estimated payout ratio (%)" hint={copy.estimateNote}>
          {(ids) => (
            <TextInput
              {...ids}
              type="number"
              min={0}
              max={100}
              value={draft.estimatedPayoutPercent}
              onChange={(event) => onChange({ estimatedPayoutPercent: event.target.value })}
            />
          )}
        </Field>
      </div>

      <Field label="Billable days a month">
        {(ids) => (
          <TextInput
            {...ids}
            type="number"
            min={0}
            max={31}
            value={draft.standardBillableDays}
            onChange={(event) => onChange({ standardBillableDays: event.target.value })}
          />
        )}
      </Field>

      <BillableDaysEditor
        standard={Number(draft.standardBillableDays)}
        overrides={draft.overrides}
        busy={busy}
        onSet={(month, days) => onChange({ overrides: new Map(draft.overrides).set(month, days) })}
        onClear={(month) => {
          const overrides = new Map(draft.overrides)
          overrides.delete(month)
          onChange({ overrides })
        }}
      />
    </>
  )
}
