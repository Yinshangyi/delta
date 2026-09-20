import { useState } from "react"

import { Button } from "@/dsl/Button"
import { Field, TextInput } from "@/dsl/Field"
import { Select } from "@/dsl/Select"
import {
  CHANGE_LABELS,
  SCENARIOS_COPY
} from "@/modules/scenarios/primary_adapters/react/ScenarioVocabulary"

import type { OverrideKind } from "@/modules/scenarios/core/domain/Scenario"

export interface Choosable {
  readonly id: string
  readonly name: string
}

export interface ChangeDraft {
  readonly kind: OverrideKind
  readonly reference: string
  readonly value: string
  readonly date: string
  readonly name: string
}

export const emptyChangeDraft: ChangeDraft = {
  kind: "ChangeDailyRate",
  reference: "",
  value: "",
  date: "",
  name: ""
}

export interface AddChangeFormProps {
  readonly incomeSources: ReadonlyArray<Choosable>
  readonly commitments: ReadonlyArray<Choosable>
  readonly holdings: ReadonlyArray<Choosable>
  readonly onAdd: (draft: ChangeDraft) => void
  readonly busy: boolean
}

const KINDS = Object.keys(CHANGE_LABELS) as ReadonlyArray<OverrideKind>

const isKind = (value: string): value is OverrideKind =>
  (KINDS as ReadonlyArray<string>).includes(value)

const choicesFor = (
  kind: OverrideKind,
  props: AddChangeFormProps
): ReadonlyArray<Choosable> | undefined => {
  switch (kind) {
    case "ChangeDailyRate":
    case "ChangeBillableDays":
    case "ChangePayoutRatio":
    case "ChangeIncome":
      return props.incomeSources
    case "DisableCommitment":
      return props.commitments
    case "ExcludeHolding":
    case "ChangeHoldingValue":
      return props.holdings
    case "AddHypotheticalExpense":
      return undefined
  }
}

const valueLabelFor = (kind: OverrideKind): string | undefined => {
  switch (kind) {
    case "ChangeDailyRate":
      return "New daily rate (€)"
    case "ChangeBillableDays":
      return "Days a month"
    case "ChangePayoutRatio":
      return "Payout ratio (%)"
    case "ChangeIncome":
      return "New monthly net (€)"
    case "ChangeHoldingValue":
      return "New value (€)"
    case "AddHypotheticalExpense":
      return "Amount (€)"
    case "DisableCommitment":
    case "ExcludeHolding":
      return undefined
  }
}

/** Every override type is addable (SCN-06), and each asks only what it needs. */
export function AddChangeForm(props: AddChangeFormProps) {
  const [draft, setDraft] = useState<ChangeDraft>(emptyChangeDraft)
  const change = (patch: Partial<ChangeDraft>) => setDraft({ ...draft, ...patch })

  const choices = choicesFor(draft.kind, props)
  const valueLabel = valueLabelFor(draft.kind)
  const isPurchase = draft.kind === "AddHypotheticalExpense"
  const ready =
    (choices === undefined || draft.reference !== "") &&
    (valueLabel === undefined || draft.value !== "") &&
    (!isPurchase || (draft.name.trim() !== "" && draft.date !== ""))

  return (
    <form
      className="border-line flex flex-col gap-4 rounded-md border border-dashed p-4"
      onSubmit={(event) => {
        event.preventDefault()
        props.onAdd(draft)
        setDraft(emptyChangeDraft)
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Change">
          {(ids) => (
            <Select
              {...ids}
              value={draft.kind}
              onChange={(event) => {
                const next = event.target.value
                if (isKind(next)) setDraft({ ...emptyChangeDraft, kind: next })
              }}
            >
              {KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {CHANGE_LABELS[kind]}
                </option>
              ))}
            </Select>
          )}
        </Field>

        {choices === undefined ? null : (
          <Field label="Which">
            {(ids) => (
              <Select
                {...ids}
                value={draft.reference}
                onChange={(event) => change({ reference: event.target.value })}
              >
                <option value="">Choose…</option>
                {choices.map((choice) => (
                  <option key={choice.id} value={choice.id}>
                    {choice.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}

        {isPurchase ? (
          <>
            <Field label="What is it">
              {(ids) => (
                <TextInput
                  {...ids}
                  value={draft.name}
                  autoComplete="off"
                  onChange={(event) => change({ name: event.target.value })}
                />
              )}
            </Field>
            <Field label="When">
              {(ids) => (
                <TextInput
                  {...ids}
                  type="date"
                  value={draft.date}
                  onChange={(event) => change({ date: event.target.value })}
                />
              )}
            </Field>
          </>
        ) : null}

        {valueLabel === undefined ? null : (
          <Field label={valueLabel}>
            {(ids) => (
              <TextInput
                {...ids}
                type="number"
                value={draft.value}
                onChange={(event) => change({ value: event.target.value })}
              />
            )}
          </Field>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={!ready || props.busy}>
          {SCENARIOS_COPY.builder.add}
        </Button>
      </div>
    </form>
  )
}
