import { useAtomValue } from "@effect/atom-react"
import { Exit, Match, Option } from "effect"
import { useState } from "react"

import { FailureState } from "@/dsl/FailureState"
import { AddIncomeForm } from "@/modules/household/primary_adapters/react/components/AddIncomeForm"
import {
  freelanceDraftFor,
  type IncomeDraft,
  salaryDraftFor
} from "@/modules/household/primary_adapters/react/components/IncomeDraftState"
import { MembersPanel } from "@/modules/household/primary_adapters/react/components/MembersPanel"
import { RemovePersonDialog } from "@/modules/household/primary_adapters/react/components/RemovePersonDialog"
import { errorOf, isBusy } from "@/modules/household/primary_adapters/react/FailureText"
import { messageFor } from "@/modules/household/primary_adapters/react/HouseholdVocabulary"
import { OnboardingContainer } from "@/modules/household/primary_adapters/react/OnboardingContainer"
import {
  addFreelanceIncomeAtom,
  addPersonAtom,
  addSalaryIncomeAtom,
  householdOverviewAtom,
  removePersonAtom,
  renameHouseholdAtom,
  setIncomeSourceEnabledAtom
} from "@/modules/household/primary_adapters/reactivity/HouseholdAtoms"
import { useHouseholdMutation } from "@/modules/household/primary_adapters/reactivity/useHouseholdMutation"
import { resolveStream } from "@/shared/reactivity/AsyncState"

import type { Person, PersonId } from "@/modules/household/core/domain/Household"
import type { HouseholdOverview } from "@/modules/household/core/use_cases/HouseholdOverviewQuery"

/**
 * Reads atoms, forwards values as props. The only decision it makes is the one
 * the data forces: an absent household means setup has not happened, which is
 * onboarding rather than an empty list (spec §65).
 */
export function HouseholdContainer() {
  const overview = resolveStream(useAtomValue(householdOverviewAtom))

  return Match.valueTags(overview, {
    Idle: () => <p className="text-muted text-sm">Loading…</p>,
    Loading: () => <p className="text-muted text-sm">Loading…</p>,
    Success: ({ value }) =>
      Option.match(value, {
        onNone: () => <OnboardingContainer />,
        onSome: (found) => <HouseholdScreen overview={found} />
      }),
    Failure: ({ error }) => (
      <FailureState title="Could not load your household." detail={messageFor(error)} />
    ),
    Defect: () => (
      <FailureState
        title="Could not load your household."
        detail="Something went wrong. Reloading usually clears this."
      />
    )
  })
}

interface HouseholdScreenProps {
  readonly overview: HouseholdOverview
}

function HouseholdScreen({ overview }: HouseholdScreenProps) {
  const rename = useHouseholdMutation(renameHouseholdAtom)
  const add = useHouseholdMutation(addPersonAtom)
  const remove = useHouseholdMutation(removePersonAtom)
  const toggle = useHouseholdMutation(setIncomeSourceEnabledAtom)
  const freelance = useHouseholdMutation(addFreelanceIncomeAtom)
  const salary = useHouseholdMutation(addSalaryIncomeAtom)
  const [pending, setPending] = useState<Person | undefined>(undefined)

  const busy = [rename, add, remove, toggle, freelance, salary].some((mutation) =>
    isBusy(mutation.state)
  )

  const submitIncome = async (person: PersonId, draft: IncomeDraft): Promise<boolean> => {
    return draft.kind === "freelance"
      ? Exit.isSuccess(await freelance.run(freelanceDraftFor(person, draft)))
      : Exit.isSuccess(await salary.run(salaryDraftFor(person, draft)))
  }

  return (
    <>
      <MembersPanel
        overview={overview}
        busy={busy}
        renameError={errorOf(rename.state)}
        addPersonError={errorOf(add.state)}
        onRename={(to) => void rename.run({ id: overview.household.id, to })}
        onAddPerson={(person) => void add.run({ household: overview.household.id, person })}
        onRemovePerson={(person) =>
          setPending(overview.members.find((member) => member.person.id === person)?.person)
        }
        onToggleSource={(id, enabled) => void toggle.run({ id, enabled })}
        addIncomeFor={(person) => (
          <AddIncomeForm
            busy={busy}
            error={errorOf(freelance.state) ?? errorOf(salary.state)}
            onSubmit={(draft) => submitIncome(person, draft)}
          />
        )}
      />

      <RemovePersonDialog
        person={pending?.name}
        busy={busy}
        error={errorOf(remove.state)}
        onCancel={() => setPending(undefined)}
        onConfirm={() => {
          if (pending === undefined) return
          // Closing regardless would throw away the refusal: removing the last
          // person is refused with a reason (spec §40), and the dialog is
          // where that reason is read.
          void remove.run(pending.id).then((exit) => {
            if (Exit.isSuccess(exit)) setPending(undefined)
          })
        }}
      />
    </>
  )
}
