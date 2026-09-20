import { useAtomValue } from "@effect/atom-react"
import { Match, Option } from "effect"

import { householdOverviewAtom } from "@/modules/household/primary_adapters/reactivity/HouseholdAtoms"
import { resolveStream } from "@/shared/reactivity/AsyncState"

import type { HouseholdId } from "@/modules/household/core/domain/Household"
import type { ReactNode } from "react"

export interface WithHouseholdProps {
  readonly children: (household: HouseholdId) => ReactNode
}

/**
 * Hands the current household's id to a screen that belongs to another module.
 *
 * The alternative is every such screen reading the household itself, which
 * would make a module's identity something each of them re-derives. Behind the
 * gate there is always one, so the other branches render nothing rather than
 * a second copy of the gate's messages.
 */
export function WithHousehold({ children }: WithHouseholdProps) {
  const overview = resolveStream(useAtomValue(householdOverviewAtom))

  return Match.valueTags(overview, {
    Idle: () => null,
    Loading: () => null,
    Failure: () => null,
    Defect: () => null,
    Success: ({ value }) =>
      Option.match(value, {
        onNone: () => null,
        onSome: (found) => <>{children(found.household.id)}</>
      })
  })
}
