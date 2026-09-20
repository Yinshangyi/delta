import { Badge } from "@/dsl/Badge"
import { Switch } from "@/dsl/Switch"
import { HOUSEHOLD_COPY } from "@/modules/household/primary_adapters/react/HouseholdVocabulary"

import type { IncomeSummary } from "@/modules/household/primary_adapters/react/IncomeSummary"

export interface IncomeSourceRowProps {
  readonly summary: IncomeSummary
  readonly onToggle: (enabled: boolean) => void
  readonly busy: boolean
}

/**
 * A disabled source stays in place and stays readable — it is a record of a
 * contract that ended, not a mistake (spec §14). It is dimmed and says so,
 * rather than disappearing.
 */
export function IncomeSourceRow({ summary, onToggle, busy }: IncomeSourceRowProps) {
  const copy = HOUSEHOLD_COPY.income

  return (
    <li
      className={`border-line flex flex-col gap-2 border-t py-3 first:border-t-0 sm:flex-row sm:items-start sm:justify-between ${
        summary.enabled ? "" : "opacity-60"
      }`}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-ink truncate text-sm font-medium">{summary.name}</span>
          <span className="text-muted text-xs">{summary.kind}</span>
          {summary.estimate ? <Badge kind="estimated" /> : null}
          {/*
            Not a Badge: the kinds are the actual/forecast family, and the
            nearest one ("no change") means a target date that did not move.
            Off is a different distinction and borrowing that word for it would
            make both of them vaguer.
          */}
          {summary.enabled ? null : (
            <span className="border-line text-muted rounded border border-dashed px-1.5 py-0.5 text-xs font-medium">
              {copy.disabled}
            </span>
          )}
        </div>

        <p className="text-ink text-sm">{summary.headline}</p>
        <p className="text-muted text-xs">{summary.details.join(" · ")}</p>
        <p className="text-muted text-xs">{summary.period}</p>
        {summary.estimate ? <p className="text-muted text-xs">{copy.estimateNote}</p> : null}
        {summary.enabled ? null : <p className="text-muted text-xs">{copy.disabledNote}</p>}
      </div>

      <div className="shrink-0">
        <Switch
          checked={summary.enabled}
          disabled={busy}
          label={`${summary.name} on`}
          onChange={onToggle}
        />
      </div>
    </li>
  )
}
