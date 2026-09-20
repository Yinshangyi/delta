import { Button } from "@/dsl/Button"
import { HoldingRow } from "@/modules/capital/primary_adapters/react/components/HoldingRow"

import type { HoldingId } from "@/modules/capital/core/domain/Holding"
import type { HoldingSummary } from "@/modules/capital/primary_adapters/react/HoldingSummary"

export interface HoldingGroupProps {
  readonly title: string
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
      <h2 className="text-ink text-sm font-semibold">{title}</h2>

      {summaries.length === 0 ? null : (
        <ul className="border-line bg-surface rounded-lg border">
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
