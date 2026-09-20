import { Match } from "effect"

import { OnboardingScreen } from "@/modules/household/primary_adapters/react/components/OnboardingScreen"
import { messageFor } from "@/modules/household/primary_adapters/react/HouseholdVocabulary"
import { DEFECT_MESSAGE } from "@/modules/household/primary_adapters/react/HouseholdVocabulary"
import { createHouseholdAtom } from "@/modules/household/primary_adapters/reactivity/HouseholdAtoms"
import { useHouseholdMutation } from "@/modules/household/primary_adapters/reactivity/useHouseholdMutation"

export function OnboardingContainer() {
  const creation = useHouseholdMutation(createHouseholdAtom)

  const view = Match.valueTags(creation.state, {
    Idle: () => ({ busy: false, error: undefined }),
    Loading: () => ({ busy: true, error: undefined }),
    Success: () => ({ busy: false, error: undefined }),
    Failure: ({ error }) => ({ busy: false, error: messageFor(error) }),
    Defect: () => ({ busy: false, error: DEFECT_MESSAGE })
  })

  return (
    <OnboardingScreen
      busy={view.busy}
      error={view.error}
      onSubmit={(household, firstPerson) => {
        void creation.run({ household, firstPerson })
      }}
    />
  )
}
