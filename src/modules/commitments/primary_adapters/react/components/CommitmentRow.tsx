import { Badge } from "@/dsl/Badge"
import { Switch } from "@/dsl/Switch"
import { COMMITMENTS_COPY } from "@/modules/commitments/primary_adapters/react/CommitmentVocabulary"
import { CommitmentIcon } from "@/modules/commitments/primary_adapters/react/components/CommitmentIcon"

import type { CommitmentSummary } from "@/modules/commitments/primary_adapters/react/CommitmentSummary"

export interface CommitmentRowProps {
  readonly summary: CommitmentSummary
  readonly selected: boolean
  readonly onSelect: () => void
  readonly onToggle: (enabled: boolean) => void
  readonly busy: boolean
}

/**
 * The row carries the state and the toggle only confirms it (CMT-09): a
 * disabled commitment is struck through and muted, and says the word "Off",
 * so scanning the list tells you which ones count without reading a switch.
 */
export function CommitmentRow({ summary, selected, onSelect, onToggle, busy }: CommitmentRowProps) {
  const copy = COMMITMENTS_COPY

  return (
    <li className="border-line border-t first:border-t-0">
      <div
        className={`flex items-start gap-3 px-3 py-3 ${selected ? "bg-raised" : "hover:bg-raised"}`}
      >
        <button
          type="button"
          onClick={onSelect}
          aria-current={selected ? "true" : undefined}
          className="flex min-w-0 grow items-start gap-3 text-left"
        >
          <span className="mt-0.5">
            <CommitmentIcon kind={summary.kind} />
          </span>

          <span className="flex min-w-0 flex-col gap-1">
            <span className="flex flex-wrap items-center gap-2">
              <span
                className={`truncate text-sm font-medium ${
                  summary.enabled ? "text-ink" : "text-muted line-through"
                }`}
              >
                {summary.name}
              </span>
              <span className="text-muted text-xs">{summary.kindLabel}</span>
              {summary.estimated ? <Badge kind="estimated" /> : null}
              {summary.enabled ? null : (
                <span className="border-line text-muted rounded border border-dashed px-1.5 py-0.5 text-xs font-medium">
                  {copy.disabled.label}
                </span>
              )}
            </span>

            <span className={`text-sm ${summary.enabled ? "text-ink" : "text-muted"}`}>
              {summary.headline}
            </span>
            {summary.detail === undefined ? null : (
              <span className="text-muted text-xs">{summary.detail}</span>
            )}
          </span>
        </button>

        <div className="shrink-0 pt-0.5">
          <Switch
            labelHidden
            checked={summary.enabled}
            disabled={busy}
            label={`${summary.name} on`}
            onChange={onToggle}
          />
        </div>
      </div>
    </li>
  )
}
