import { Field, TextInput } from "@/dsl/Field"
import { Select } from "@/dsl/Select"
import { TaxScheduleFields } from "@/modules/commitments/primary_adapters/react/components/TaxScheduleFields"

import type { CommitmentFormState } from "@/modules/commitments/primary_adapters/react/components/CommitmentDraftState"

export interface CommitmentKindFieldsProps {
  readonly state: CommitmentFormState
  readonly onChange: (patch: Partial<CommitmentFormState>) => void
  readonly busy: boolean
}

const amountField = (label: string, value: string, onChange: (next: string) => void) => (
  <Field label={label}>
    {(ids) => (
      <TextInput
        {...ids}
        type="number"
        min={0}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    )}
  </Field>
)

const dateField = (
  label: string,
  value: string,
  onChange: (next: string) => void,
  hint?: string
) => (
  <Field label={label} {...(hint === undefined ? {} : { hint })}>
    {(ids) => (
      <TextInput
        {...ids}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    )}
  </Field>
)

/** Each kind asks for what it actually needs, and nothing it could guess wrong. */
export function CommitmentKindFields({ state, onChange, busy }: CommitmentKindFieldsProps) {
  if (state.kind === "OneOffExpense") {
    return (
      <>
        {amountField("Amount (€)", state.amountEuros, (amountEuros) => onChange({ amountEuros }))}
        {dateField("Date", state.oneOffDate, (oneOffDate) => onChange({ oneOffDate }))}
      </>
    )
  }

  if (state.kind === "Debt") {
    return (
      <>
        {amountField("Initial amount (€)", state.initialAmountEuros, (initialAmountEuros) =>
          onChange({ initialAmountEuros })
        )}
        {amountField("Monthly payment (€)", state.regularPaymentEuros, (regularPaymentEuros) =>
          onChange({ regularPaymentEuros })
        )}
        <Field label="Interest rate (%)" hint="0% is valid, and common for a family loan.">
          {(ids) => (
            <TextInput
              {...ids}
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={state.interestRatePercent}
              onChange={(event) => onChange({ interestRatePercent: event.target.value })}
            />
          )}
        </Field>
        {dateField("Start date", state.startDate, (startDate) => onChange({ startDate }))}
      </>
    )
  }

  if (state.kind === "TaxLiability") {
    return (
      <>
        {amountField("Total amount (€)", state.amountEuros, (amountEuros) =>
          onChange({ amountEuros })
        )}
        <Field label="Tax year (optional)">
          {(ids) => (
            <TextInput
              {...ids}
              type="number"
              value={state.taxYear}
              onChange={(event) => onChange({ taxYear: event.target.value })}
            />
          )}
        </Field>
        <Field label="Status" hint="An estimated liability is never presented as an exact one.">
          {(ids) => (
            <Select
              {...ids}
              value={state.taxStatus}
              onChange={(event) =>
                onChange({
                  taxStatus: event.target.value === "estimated" ? "estimated" : "confirmed"
                })
              }
            >
              <option value="confirmed">Confirmed</option>
              <option value="estimated">Estimated</option>
            </Select>
          )}
        </Field>
        <TaxScheduleFields
          schedule={state.schedule}
          busy={busy}
          onChange={(schedule) => onChange({ schedule })}
        />
      </>
    )
  }

  return (
    <>
      {amountField("Amount a month (€)", state.amountEuros, (amountEuros) =>
        onChange({ amountEuros })
      )}
      {dateField("Start date", state.startDate, (startDate) => onChange({ startDate }))}
      {dateField(
        "End date (optional)",
        state.endDate,
        (endDate) => onChange({ endDate }),
        "Leave empty while it is ongoing. A rate change is one rule ending and another starting."
      )}
    </>
  )
}
