import { Button } from "@/dsl/Button"
import { IncomeSourceRow } from "@/modules/household/primary_adapters/react/components/IncomeSourceRow"
import { HOUSEHOLD_COPY } from "@/modules/household/primary_adapters/react/HouseholdVocabulary"
import { summarise } from "@/modules/household/primary_adapters/react/IncomeSummary"

import type { IncomeSourceId } from "@/modules/household/core/domain/IncomeSource"
import type { MemberIncome } from "@/modules/household/core/use_cases/HouseholdOverviewQuery"

export interface MemberCardProps {
  readonly member: MemberIncome
  readonly onRemove: () => void
  readonly onToggleSource: (id: IncomeSourceId, enabled: boolean) => void
  readonly busy: boolean
  readonly addIncome: React.ReactNode
}

/** One person: their name, what they earn, and the two things you can do. */
export function MemberCard({ member, onRemove, onToggleSource, busy, addIncome }: MemberCardProps) {
  const copy = HOUSEHOLD_COPY.members

  return (
    <article className="border-line bg-surface rounded-lg border p-4">
      <header className="flex items-center justify-between gap-3">
        <h3 className="text-ink truncate text-sm font-semibold">{member.person.name}</h3>
        <Button tone="ghost" disabled={busy} onClick={onRemove}>
          {copy.remove}
        </Button>
      </header>

      {member.sources.length === 0 ? (
        <p className="text-muted mt-3 text-sm">{copy.noIncome}</p>
      ) : (
        <ul className="mt-2">
          {member.sources.map((source) => (
            <IncomeSourceRow
              key={source.id}
              summary={summarise(source)}
              busy={busy}
              onToggle={(enabled) => onToggleSource(source.id, enabled)}
            />
          ))}
        </ul>
      )}

      <div className="mt-3">{addIncome}</div>
    </article>
  )
}
