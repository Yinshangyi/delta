import { Button } from "@/dsl/Button"
import { EmptyState } from "@/dsl/EmptyState"
import { COMMITMENTS_COPY } from "@/modules/commitments/primary_adapters/react/CommitmentVocabulary"
import { CommitmentRow } from "@/modules/commitments/primary_adapters/react/components/CommitmentRow"

import type { CommitmentId } from "@/modules/commitments/core/domain/Commitment"
import type { CommitmentSummary } from "@/modules/commitments/primary_adapters/react/CommitmentSummary"

export interface CommitmentsListProps {
  readonly summaries: ReadonlyArray<CommitmentSummary>
  readonly selected: CommitmentId | undefined
  readonly onSelect: (id: CommitmentId) => void
  readonly onToggle: (id: CommitmentId, enabled: boolean) => void
  readonly onAdd: () => void
  readonly busy: boolean
}

/**
 * One flat list, every kind mixed (spec §28). Not grouped by type, and with no
 * nav section of its own for taxes or debt: the household thinks in terms of
 * what leaves each month, not in categories.
 */
export function CommitmentsList({
  summaries,
  selected,
  onSelect,
  onToggle,
  onAdd,
  busy
}: CommitmentsListProps) {
  const copy = COMMITMENTS_COPY

  return (
    <section className="flex flex-col gap-4">
      {summaries.length === 0 ? (
        <EmptyState title={copy.empty} description={copy.emptyDescription} />
      ) : (
        <ul className="border-line bg-surface rounded-lg border">
          {summaries.map((summary) => (
            <CommitmentRow
              key={summary.id}
              summary={summary}
              busy={busy}
              selected={summary.id === selected}
              onSelect={() => onSelect(summary.id)}
              onToggle={(enabled) => onToggle(summary.id, enabled)}
            />
          ))}
        </ul>
      )}

      <div>
        <Button tone="primary" disabled={busy} onClick={onAdd}>
          {copy.add}
        </Button>
      </div>
    </section>
  )
}
