import { useState } from "react"

import { Button } from "@/dsl/Button"
import { Field, TextInput } from "@/dsl/Field"
import { COMMITMENTS_COPY } from "@/modules/commitments/primary_adapters/react/CommitmentVocabulary"
import * as DateText from "@/shared/presentation/DateText"
import * as MoneyText from "@/shared/presentation/MoneyText"

import type { DebtSnapshot } from "@/modules/commitments/core/domain/DebtSnapshot"

export interface DebtBalanceFormProps {
  readonly history: ReadonlyArray<DebtSnapshot>
  readonly onRecord: (date: string, remainingEuros: string) => void
  readonly onRemove: (snapshot: DebtSnapshot) => void
  readonly busy: boolean
  readonly error: string | undefined
}

/**
 * Spec §23: the household must be able to say what is actually owed, and CMT-05
 * asks for the history to be visible and editable — a mistyped balance would
 * otherwise sit in the forecast permanently with no way to reach it.
 */
export function DebtBalanceForm({
  history,
  onRecord,
  onRemove,
  busy,
  error
}: DebtBalanceFormProps) {
  const copy = COMMITMENTS_COPY.detail
  const [date, setDate] = useState("")
  const [remaining, setRemaining] = useState("")

  return (
    <div className="border-line flex flex-col gap-3 border-t pt-4">
      <h4 className="text-ink text-sm font-semibold">{copy.recordBalance}</h4>

      <form
        className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault()
          onRecord(date, remaining)
          setDate("")
          setRemaining("")
        }}
      >
        <Field label={copy.balanceDate}>
          {(ids) => (
            <TextInput
              {...ids}
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          )}
        </Field>
        <Field label={copy.balanceAmount} {...(error === undefined ? {} : { error })}>
          {(ids) => (
            <TextInput
              {...ids}
              type="number"
              min={0}
              value={remaining}
              invalid={error !== undefined}
              onChange={(event) => setRemaining(event.target.value)}
            />
          )}
        </Field>
        <Button type="submit" disabled={busy || date === "" || remaining === ""}>
          {copy.recordSave}
        </Button>
      </form>

      {history.length === 0 ? null : (
        <div className="flex flex-col gap-1">
          <h5 className="text-muted text-xs font-medium">{copy.history}</h5>
          <ul className="flex flex-col gap-1">
            {history.map((snapshot) => (
              <li key={snapshot.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted">
                  {DateText.day(snapshot.date)} —{" "}
                  <span className="text-ink tabular-nums">
                    {MoneyText.money(snapshot.remainingAmount)}
                  </span>
                </span>
                <Button tone="ghost" disabled={busy} onClick={() => onRemove(snapshot)}>
                  {copy.removeSnapshot}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
