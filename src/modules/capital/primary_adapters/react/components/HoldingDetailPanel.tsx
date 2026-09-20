import { useState } from "react"

import { Badge } from "@/dsl/Badge"
import { Button } from "@/dsl/Button"
import { Field, TextInput } from "@/dsl/Field"
import { CAPITAL_COPY } from "@/modules/capital/primary_adapters/react/CapitalVocabulary"
import * as DateText from "@/shared/presentation/DateText"
import * as MoneyText from "@/shared/presentation/MoneyText"

import type { BalanceSnapshot } from "@/modules/capital/core/domain/BalanceSnapshot"
import type { HoldingSummary } from "@/modules/capital/primary_adapters/react/HoldingSummary"

export interface HoldingDetailPanelProps {
  readonly summary: HoldingSummary | undefined
  readonly history: ReadonlyArray<BalanceSnapshot>
  readonly onRecord: (date: string, amountEuros: string) => void
  readonly onRemoveValuation: (snapshot: BalanceSnapshot) => void
  readonly onDelete: () => void
  readonly busy: boolean
  readonly error: string | undefined
}

/**
 * Per-holding detail with its valuation history (CAP-08), and the form to add
 * to it (CAP-04, CAP-06).
 *
 * The current value is shown beside the field so the person corrects rather
 * than recalls — CAP-04's actual wording, and the difference between "what is
 * it now?" and "it was €20,000, what is it now?".
 */
export function HoldingDetailPanel({
  summary,
  history,
  onRecord,
  onRemoveValuation,
  onDelete,
  busy,
  error
}: HoldingDetailPanelProps) {
  const copy = CAPITAL_COPY
  const [date, setDate] = useState("")
  const [amount, setAmount] = useState("")

  if (summary === undefined) return null

  return (
    <aside className="border-line bg-surface flex flex-col gap-4 rounded-lg border p-4">
      <header className="flex flex-col gap-1">
        <h3 className="text-ink text-sm font-semibold">{summary.name}</h3>
        <div className="flex items-baseline gap-2">
          <p className="text-ink text-lg font-semibold tabular-nums">{summary.value}</p>
          {summary.estimated ? <Badge kind="estimated" /> : null}
        </div>
        {summary.asOf === undefined ? null : <p className="text-muted text-xs">{summary.asOf}</p>}
        {summary.stale ? <p className="text-muted text-xs">{copy.stale}</p> : null}
      </header>

      <form
        className="border-line flex flex-col gap-3 border-t pt-4"
        onSubmit={(event) => {
          event.preventDefault()
          onRecord(date, amount)
          setDate("")
          setAmount("")
        }}
      >
        <h4 className="text-ink text-sm font-semibold">{copy.record.title}</h4>
        <p className="text-muted text-xs">
          {copy.record.previous} {summary.value}
        </p>

        <Field label={copy.record.date}>
          {(ids) => (
            <TextInput
              {...ids}
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          )}
        </Field>
        <Field label={copy.record.amount} {...(error === undefined ? {} : { error })}>
          {(ids) => (
            <TextInput
              {...ids}
              type="number"
              value={amount}
              invalid={error !== undefined}
              onChange={(event) => setAmount(event.target.value)}
            />
          )}
        </Field>
        <div className="flex justify-end">
          <Button type="submit" disabled={busy || date === "" || amount === ""}>
            {copy.record.save}
          </Button>
        </div>
      </form>

      <div className="border-line flex flex-col gap-2 border-t pt-4">
        <h4 className="text-ink text-sm font-semibold">{copy.history}</h4>
        {history.length === 0 ? (
          <p className="text-muted text-sm">{copy.noHistory}</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {history.map((snapshot) => (
              <li key={snapshot.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted">
                  {DateText.day(snapshot.date)} —{" "}
                  <span className="text-ink tabular-nums">
                    {snapshot.basis === "estimated"
                      ? MoneyText.estimated(snapshot.amount)
                      : MoneyText.money(snapshot.amount)}
                  </span>
                </span>
                <Button tone="ghost" disabled={busy} onClick={() => onRemoveValuation(snapshot)}>
                  {copy.removeValuation}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Apart from everything else, and never the primary weight (CAP-09). */}
      <div className="border-line flex justify-end border-t pt-4">
        <Button tone="ghost" disabled={busy} onClick={onDelete}>
          {copy.remove.action}
        </Button>
      </div>
    </aside>
  )
}
