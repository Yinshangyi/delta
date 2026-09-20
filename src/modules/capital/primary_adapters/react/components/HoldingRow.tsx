import { Badge } from "@/dsl/Badge"
import { Switch } from "@/dsl/Switch"
import { CAPITAL_COPY } from "@/modules/capital/primary_adapters/react/CapitalVocabulary"

import type { HoldingSummary } from "@/modules/capital/primary_adapters/react/HoldingSummary"

export interface HoldingRowProps {
  readonly summary: HoldingSummary
  readonly selected: boolean
  readonly onSelect: () => void
  readonly onToggleIncluded: (included: boolean) => void
  readonly busy: boolean
}

/**
 * An excluded holding stays in the list, visibly inert: its value is struck
 * through and muted and it says so in words (spec §72, CAP-07). It is not
 * gone, and it has not lost its value — it is simply not being counted.
 */
export function HoldingRow({
  summary,
  selected,
  onSelect,
  onToggleIncluded,
  busy
}: HoldingRowProps) {
  const copy = CAPITAL_COPY

  return (
    <li className="border-line border-t first:border-t-0">
      <div
        className={`flex items-start gap-3 px-3 py-3 ${selected ? "bg-raised" : "hover:bg-raised"}`}
      >
        <button
          type="button"
          onClick={onSelect}
          aria-current={selected ? "true" : undefined}
          className="flex min-w-0 grow flex-col gap-1 text-left"
        >
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-ink truncate text-sm font-medium">{summary.name}</span>
            {summary.subtitle === undefined ? null : (
              <span className="text-muted text-xs">{summary.subtitle}</span>
            )}
            {summary.estimated ? <Badge kind="estimated" /> : null}
            {summary.stale ? (
              <span className="border-line text-muted rounded border border-dashed px-1.5 py-0.5 text-xs font-medium">
                {copy.stale}
              </span>
            ) : null}
          </span>

          <span
            className={`text-sm tabular-nums ${
              summary.counted ? "text-ink" : "text-muted line-through"
            }`}
          >
            {summary.value}
          </span>

          {summary.asOf === undefined ? null : (
            <span className="text-muted text-xs">{summary.asOf}</span>
          )}
          {summary.counted ? null : <span className="text-muted text-xs">{copy.excludedNote}</span>}
        </button>

        <div className="shrink-0 pt-0.5">
          <Switch
            labelHidden
            checked={summary.included}
            disabled={busy}
            label={`${summary.name} ${copy.included.toLowerCase()}`}
            onChange={onToggleIncluded}
          />
        </div>
      </div>
    </li>
  )
}
