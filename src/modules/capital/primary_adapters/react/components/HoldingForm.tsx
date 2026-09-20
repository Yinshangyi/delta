import { useState } from "react"

import { Button } from "@/dsl/Button"
import { Dialog } from "@/dsl/Dialog"
import { Field, TextInput } from "@/dsl/Field"
import { CAPITAL_COPY } from "@/modules/capital/primary_adapters/react/CapitalVocabulary"

import type { HoldingKind } from "@/modules/capital/core/domain/Holding"

export interface HoldingFormState {
  readonly name: string
  readonly institution: string
  readonly category: string
  readonly valueEuros: string
  readonly valuationDate: string
  readonly acquisitionCostEuros: string
  readonly acquisitionDate: string
}

export const emptyHoldingForm: HoldingFormState = {
  name: "",
  institution: "",
  category: "",
  valueEuros: "",
  valuationDate: "",
  acquisitionCostEuros: "",
  acquisitionDate: ""
}

export interface HoldingFormProps {
  readonly kind: HoldingKind
  readonly onSubmit: (state: HoldingFormState) => Promise<boolean>
  readonly onCancel: () => void
  readonly busy: boolean
  readonly error: string | undefined
}

/**
 * Two kinds, one form, and the difference is the wording as much as the
 * fields: an account asks for a balance, an asset asks what it would fetch —
 * and says, in the field's own hint, that this means net proceeds rather than
 * a listing price or what it cost (spec §78, CAP-05).
 *
 * Acquisition cost is last and visually subordinate, because it enters
 * nothing.
 */
export function HoldingForm({ kind, onSubmit, onCancel, busy, error }: HoldingFormProps) {
  const [state, setState] = useState<HoldingFormState>(emptyHoldingForm)
  const change = (patch: Partial<HoldingFormState>) => setState({ ...state, ...patch })
  const isAccount = kind === "BankAccount"
  const ready = state.name.trim() !== "" && state.valueEuros !== "" && state.valuationDate !== ""
  const copy = CAPITAL_COPY

  return (
    <Dialog
      open
      onClose={onCancel}
      title={isAccount ? "Add an account" : "Add an asset"}
      actions={
        <>
          <Button onClick={onCancel}>Cancel</Button>
          <Button
            tone="primary"
            disabled={!ready || busy}
            onClick={() => {
              void onSubmit(state).then((saved) => {
                if (saved) setState(emptyHoldingForm)
              })
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          {(ids) => (
            <TextInput
              {...ids}
              value={state.name}
              autoComplete="off"
              onChange={(event) => change({ name: event.target.value })}
            />
          )}
        </Field>

        {isAccount ? (
          <Field label="Institution (optional)">
            {(ids) => (
              <TextInput
                {...ids}
                value={state.institution}
                autoComplete="off"
                onChange={(event) => change({ institution: event.target.value })}
              />
            )}
          </Field>
        ) : (
          <Field label="Category (optional)" hint="A watch, a bag, a bicycle.">
            {(ids) => (
              <TextInput
                {...ids}
                value={state.category}
                autoComplete="off"
                onChange={(event) => change({ category: event.target.value })}
              />
            )}
          </Field>
        )}

        <Field
          label={isAccount ? "Current balance (€)" : "What it would fetch (€)"}
          {...(isAccount ? {} : { hint: copy.resaleHint })}
          {...(error === undefined ? {} : { error })}
        >
          {(ids) => (
            <TextInput
              {...ids}
              type="number"
              value={state.valueEuros}
              invalid={error !== undefined}
              onChange={(event) => change({ valueEuros: event.target.value })}
            />
          )}
        </Field>

        <Field label={isAccount ? "Balance date" : "Valuation date"}>
          {(ids) => (
            <TextInput
              {...ids}
              type="date"
              value={state.valuationDate}
              onChange={(event) => change({ valuationDate: event.target.value })}
            />
          )}
        </Field>

        {isAccount ? null : (
          <div className="border-line flex flex-col gap-3 border-t pt-4 sm:col-span-2">
            <p className="text-muted text-xs">{copy.acquisitionHint}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="What it cost (optional)">
                {(ids) => (
                  <TextInput
                    {...ids}
                    type="number"
                    min={0}
                    value={state.acquisitionCostEuros}
                    onChange={(event) => change({ acquisitionCostEuros: event.target.value })}
                  />
                )}
              </Field>
              <Field label="When (optional)">
                {(ids) => (
                  <TextInput
                    {...ids}
                    type="date"
                    value={state.acquisitionDate}
                    onChange={(event) => change({ acquisitionDate: event.target.value })}
                  />
                )}
              </Field>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  )
}
