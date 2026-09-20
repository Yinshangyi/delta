import { useState } from "react"

import { Button } from "@/dsl/Button"
import { Dialog } from "@/dsl/Dialog"
import { Field, TextInput } from "@/dsl/Field"
import * as MoneyText from "@/shared/presentation/MoneyText"

import type { ValuedHolding } from "@/modules/capital/core/domain/TotalCapital"

export interface UpdateBalancesFormProps {
  readonly holdings: ReadonlyArray<ValuedHolding>
  readonly today: string
  readonly onSubmit: (date: string, amounts: ReadonlyMap<string, string>) => Promise<boolean>
  readonly onCancel: () => void
  readonly busy: boolean
  readonly error: string | undefined
}

/**
 * The whole monthly routine in one pass (TRJ-05, spec §62): read the balances
 * off your banking app, type them in, see what moved. No transaction is
 * entered at any point.
 *
 * **Blank means unchanged**, and the form says so in as many words rather than
 * relying on the reader to infer it — the failure mode is silent and expensive.
 * Each field carries the prior value beside it so a balance is corrected
 * rather than recalled.
 */
export function UpdateBalancesForm({
  holdings,
  today,
  onSubmit,
  onCancel,
  busy,
  error
}: UpdateBalancesFormProps) {
  const [date, setDate] = useState(today)
  const [amounts, setAmounts] = useState<ReadonlyMap<string, string>>(new Map())
  const entered = [...amounts.values()].filter((value) => value.trim() !== "").length

  return (
    <Dialog
      open
      onClose={onCancel}
      title="Update balances"
      actions={
        <>
          <Button onClick={onCancel}>Cancel</Button>
          <Button
            tone="primary"
            disabled={busy || entered === 0 || date === ""}
            onClick={() => {
              void onSubmit(date, amounts).then((saved) => {
                if (saved) setAmounts(new Map())
              })
            }}
          >
            {entered === 1 ? "Record 1 balance" : `Record ${entered} balances`}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-muted text-sm">
          Leave a field blank to leave that holding unchanged — nothing is recorded for it.
        </p>

        <Field label="As of" {...(error === undefined ? {} : { error })}>
          {(ids) => (
            <TextInput
              {...ids}
              type="date"
              value={date}
              invalid={error !== undefined}
              onChange={(event) => setDate(event.target.value)}
            />
          )}
        </Field>

        <div className="border-line flex flex-col gap-4 border-t pt-4">
          {holdings.map((valued) => (
            <Field
              key={valued.holding.id}
              label={valued.holding.name}
              hint={
                valued.valuation === undefined
                  ? "Nothing recorded yet."
                  : `Currently ${MoneyText.money(valued.valuation.amount)}`
              }
            >
              {(ids) => (
                <TextInput
                  {...ids}
                  type="number"
                  placeholder="unchanged"
                  value={amounts.get(valued.holding.id) ?? ""}
                  onChange={(event) => {
                    const next = new Map(amounts)
                    next.set(valued.holding.id, event.target.value)
                    setAmounts(next)
                  }}
                />
              )}
            </Field>
          ))}
        </div>
      </div>
    </Dialog>
  )
}
