import { useAtomValue } from "@effect/atom-react"
import { Match, Option } from "effect"

import { FailureState } from "@/dsl/FailureState"
import { messageFor } from "@/modules/household/primary_adapters/react/HouseholdVocabulary"
import { OnboardingContainer } from "@/modules/household/primary_adapters/react/OnboardingContainer"
import { householdOverviewAtom } from "@/modules/household/primary_adapters/reactivity/HouseholdAtoms"
import { resolveStream } from "@/shared/reactivity/AsyncState"

import type { ReactNode } from "react"

export interface HouseholdGateProps {
  readonly children: ReactNode
}

/**
 * Nothing in the app means anything without a household (spec §5, §65), so
 * first run is a gate rather than a prompt inside Settings: there is no
 * dashboard to show behind it, and no section that would do anything.
 *
 * Once the household exists this is transparent — the same atom the household
 * screens read, so the check costs one query for the whole app.
 */
export function HouseholdGate({ children }: HouseholdGateProps) {
  const overview = resolveStream(useAtomValue(householdOverviewAtom))

  return Match.valueTags(overview, {
    Idle: () => <Centered>Loading…</Centered>,
    Loading: () => <Centered>Loading…</Centered>,
    Success: ({ value }) =>
      Option.match(value, {
        onNone: () => <Centered>{<OnboardingContainer />}</Centered>,
        onSome: () => <>{children}</>
      }),
    Failure: ({ error }) => (
      <Centered>
        <FailureState title="Could not open your data." detail={messageFor(error)} />
      </Centered>
    ),
    Defect: () => (
      <Centered>
        <FailureState
          title="Could not open your data."
          detail="Something went wrong. Reloading usually clears this."
        />
      </Centered>
    )
  })
}

function Centered({ children }: { readonly children: ReactNode }) {
  return (
    <main className="bg-ground text-ink flex min-h-dvh items-center justify-center px-4 py-10">
      {children}
    </main>
  )
}
