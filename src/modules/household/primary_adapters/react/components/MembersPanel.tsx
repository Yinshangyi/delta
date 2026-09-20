import { AddPersonForm } from "@/modules/household/primary_adapters/react/components/AddPersonForm"
import { HouseholdNameForm } from "@/modules/household/primary_adapters/react/components/HouseholdNameForm"
import { MemberCard } from "@/modules/household/primary_adapters/react/components/MemberCard"
import { HOUSEHOLD_COPY } from "@/modules/household/primary_adapters/react/HouseholdVocabulary"

import type { PersonId } from "@/modules/household/core/domain/Household"
import type { IncomeSourceId } from "@/modules/household/core/domain/IncomeSource"
import type { HouseholdOverview } from "@/modules/household/core/use_cases/HouseholdOverviewQuery"
import type { ReactNode } from "react"

export interface MembersPanelProps {
  readonly overview: HouseholdOverview
  readonly onRename: (to: string) => void
  readonly onAddPerson: (name: string) => void
  readonly onRemovePerson: (person: PersonId) => void
  readonly onToggleSource: (id: IncomeSourceId, enabled: boolean) => void
  readonly addIncomeFor: (person: PersonId) => ReactNode
  readonly busy: boolean
  readonly renameError: string | undefined
  readonly addPersonError: string | undefined
}

/** The whole of spec §39: who is here, what they earn, and how to change it. */
export function MembersPanel({
  overview,
  onRename,
  onAddPerson,
  onRemovePerson,
  onToggleSource,
  addIncomeFor,
  busy,
  renameError,
  addPersonError
}: MembersPanelProps) {
  const copy = HOUSEHOLD_COPY.members

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="text-muted text-sm">{copy.description}</p>
      </header>

      <HouseholdNameForm
        current={overview.household.name}
        onRename={onRename}
        busy={busy}
        error={renameError}
      />

      <div className="flex flex-col gap-4">
        {overview.members.map((member) => (
          <MemberCard
            key={member.person.id}
            member={member}
            busy={busy}
            onRemove={() => onRemovePerson(member.person.id)}
            onToggleSource={onToggleSource}
            addIncome={addIncomeFor(member.person.id)}
          />
        ))}
      </div>

      <AddPersonForm onAdd={onAddPerson} busy={busy} error={addPersonError} />
    </section>
  )
}
