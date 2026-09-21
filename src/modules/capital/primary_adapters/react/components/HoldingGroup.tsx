import { Button } from "@/dsl/Button"
import { CAPITAL_COPY } from "@/modules/capital/primary_adapters/react/CapitalVocabulary"
import { HoldingRow } from "@/modules/capital/primary_adapters/react/components/HoldingRow"

import type { HoldingId } from "@/modules/capital/core/domain/Holding"
import type { HoldingSummary } from "@/modules/capital/primary_adapters/react/HoldingSummary"

export interface HoldingGroupProps {
  readonly title: string
  /** What kind of fact this group holds — verified, or judged (spec §70). */
  readonly caption: string
  readonly summaries: ReadonlyArray<HoldingSummary>
  readonly selected: HoldingId | undefined
  readonly onSelect: (id: HoldingId) => void
  readonly onToggleIncluded: (id: HoldingId, included: boolean) => void
  readonly addLabel: string
  readonly onAdd: () => void
  readonly busy: boolean
}

/**
 * Accounts and assets are grouped apart (CAP-08) because they are different
 * kinds of fact: one is read off a statement, the other is a judgement about
 * what something would fetch.
 */
export function HoldingGroup({
  title,
  caption,
  summaries,
  selected,
  onSelect,
  onToggleIncluded,
  addLabel,
  onAdd,
  busy
}: HoldingGroupProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="bg-raised border-line flex flex-wrap items-baseline justify-between gap-2 rounded-t-lg border px-4 py-2.5">
        <p className="flex flex-wrap items-baseline gap-3">
          <span className="eyebrow">{title}</span>
          <span className="text-muted text-xs">{caption}</span>
        </p>
        <span className="eyebrow">{CAPITAL_COPY.includedColumn}</span>
      </div>

      {summaries.length === 0 ? null : (
        <ul className="border-line bg-surface -mt-3 rounded-b-lg border border-t-0">
          {summaries.map((summary) => (
            <HoldingRow
              key={summary.id}
              summary={summary}
              busy={busy}
              selected={summary.id === selected}
              onSelect={() => onSelect(summary.id)}
              onToggleIncluded={(included) => onToggleIncluded(summary.id, included)}
            />
          ))}
        </ul>
      )}

      <div>
        <Button disabled={busy} onClick={onAdd}>
          {addLabel}
        </Button>
      </div>
    </section>
  )
}
