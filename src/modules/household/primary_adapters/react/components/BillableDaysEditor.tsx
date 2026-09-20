import { useState } from "react"

import { Button } from "@/dsl/Button"
import { Field, TextInput } from "@/dsl/Field"
import * as DateText from "@/shared/presentation/DateText"

export interface BillableDaysEditorProps {
  readonly standard: number
  /** Keyed by ISO month, as `<input type="month">` produces it. */
  readonly overrides: ReadonlyMap<string, number>
  readonly onSet: (month: string, days: number) => void
  readonly onClear: (month: string) => void
  readonly busy: boolean
}

/**
 * Spec §11: a default, with named exceptions. An overridden month carries the
 * word "overridden" and a Clear action rather than a colour, so the
 * distinction survives greyscale (design-brief.md principle 5); clearing puts
 * the month back to following the default, which is not the same as setting it
 * to the default's number.
 */
export function BillableDaysEditor({
  standard,
  overrides,
  onSet,
  onClear,
  busy
}: BillableDaysEditorProps) {
  const [month, setMonth] = useState("")
  const [days, setDays] = useState("")
  const entries = [...overrides].sort(([a], [b]) => a.localeCompare(b))

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-1">
        {entries.map(([isoMonth, value]) => (
          <li key={isoMonth} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-ink">
              {DateText.monthIso(isoMonth)} — {value} days
              <span className="text-muted ml-2 text-xs">overridden</span>
            </span>
            <Button tone="ghost" disabled={busy} onClick={() => onClear(isoMonth)}>
              Clear
            </Button>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field label="Month">
          {(ids) => (
            <TextInput
              {...ids}
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
            />
          )}
        </Field>
        <Field label="Days" hint={`Default is ${standard}. Zero is a real answer.`}>
          {(ids) => (
            <TextInput
              {...ids}
              type="number"
              min={0}
              max={31}
              value={days}
              onChange={(event) => setDays(event.target.value)}
            />
          )}
        </Field>
        <Button
          disabled={busy || month === "" || days === ""}
          onClick={() => {
            onSet(month, Number(days))
            setMonth("")
            setDays("")
          }}
        >
          Override
        </Button>
      </div>
    </div>
  )
}
