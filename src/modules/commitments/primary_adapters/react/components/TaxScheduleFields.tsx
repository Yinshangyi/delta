import { useState } from "react"

import { Button } from "@/dsl/Button"
import { Field, TextInput } from "@/dsl/Field"
import * as DateText from "@/shared/presentation/DateText"

import type { ScheduleRowState } from "@/modules/commitments/primary_adapters/react/components/CommitmentDraftState"

export interface TaxScheduleFieldsProps {
  readonly schedule: ReadonlyArray<ScheduleRowState>
  readonly onChange: (schedule: ReadonlyArray<ScheduleRowState>) => void
  readonly busy: boolean
}

/**
 * Rows added and removed one at a time (CMT-07), because a real schedule is
 * whatever length the tax office says it is and its last instalment rarely
 * matches the others.
 */
export function TaxScheduleFields({ schedule, onChange, busy }: TaxScheduleFieldsProps) {
  const [date, setDate] = useState("")
  const [amount, setAmount] = useState("")

  return (
    <div className="flex flex-col gap-3 sm:col-span-2">
      <h4 className="text-ink text-sm font-medium">Payment schedule</h4>

      {schedule.length === 0 ? (
        <p className="text-muted text-xs">
          Add each payment on the date it is due. Delta never averages them.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {schedule.map((row, index) => (
            <li
              key={`${row.date}-${index}`}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="text-ink">
                {DateText.monthIso(row.date.slice(0, 7))} — €{row.amountEuros}
              </span>
              <Button
                tone="ghost"
                disabled={busy}
                onClick={() => onChange(schedule.filter((_, at) => at !== index))}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <Field label="Payment date">
          {(ids) => (
            <TextInput
              {...ids}
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          )}
        </Field>
        <Field label="Amount (€)">
          {(ids) => (
            <TextInput
              {...ids}
              type="number"
              min={0}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          )}
        </Field>
        <Button
          disabled={busy || date === "" || amount === ""}
          onClick={() => {
            onChange([...schedule, { date, amountEuros: amount }])
            setDate("")
            setAmount("")
          }}
        >
          Add payment
        </Button>
      </div>
    </div>
  )
}
