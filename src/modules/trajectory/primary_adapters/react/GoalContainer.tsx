import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react"
import { Exit, Match, Option } from "effect"

import { FailureState } from "@/dsl/FailureState"
import { GoalPanel } from "@/modules/trajectory/primary_adapters/react/components/GoalPanel"
import {
  DEFECT_MESSAGE,
  messageFor
} from "@/modules/trajectory/primary_adapters/react/GoalVocabulary"
import {
  activeGoalAtom,
  setFinancialGoalAtom,
  setGoalEnabledAtom
} from "@/modules/trajectory/primary_adapters/reactivity/GoalAtoms"
import * as Money from "@/shared/domain/Money"
import { type AsyncState, resolveMutation, resolveStream } from "@/shared/reactivity/AsyncState"

import type { HouseholdId } from "@/modules/household/core/domain/Household"
import type { GoalFailure } from "@/modules/trajectory/primary_adapters/react/GoalVocabulary"

export interface GoalContainerProps {
  /**
   * Passed in rather than read again here: the goal belongs to a household,
   * and the screen that renders this already knows which one.
   */
  readonly household: HouseholdId
}

const isBusy = (state: AsyncState<unknown, GoalFailure>): boolean =>
  Match.valueTags(state, {
    Idle: () => false,
    Loading: () => true,
    Success: () => false,
    Failure: () => false,
    Defect: () => false
  })

const errorOf = (state: AsyncState<unknown, GoalFailure>): string | undefined =>
  Match.valueTags(state, {
    Idle: () => undefined,
    Loading: () => undefined,
    Success: () => undefined,
    Failure: ({ error }) => messageFor(error),
    Defect: () => DEFECT_MESSAGE
  })

export function GoalContainer({ household }: GoalContainerProps) {
  const goal = resolveStream(useAtomValue(activeGoalAtom))
  const save = resolveMutation(useAtomValue(setFinancialGoalAtom))
  const runSave = useAtomSet(setFinancialGoalAtom, { mode: "promiseExit" })
  const runToggle = useAtomSet(setGoalEnabledAtom, { mode: "promiseExit" })
  const refresh = useAtomRefresh(activeGoalAtom)

  const after = (exit: Exit.Exit<unknown, unknown>) => {
    if (Exit.isSuccess(exit)) refresh()
  }

  return Match.valueTags(goal, {
    Idle: () => <p className="text-muted text-sm">Loading…</p>,
    Loading: () => <p className="text-muted text-sm">Loading…</p>,
    Failure: ({ error }) => (
      <FailureState title="Could not load the goal." detail={messageFor(error)} />
    ),
    Defect: () => <FailureState title="Could not load the goal." detail={DEFECT_MESSAGE} />,
    Success: ({ value }) => {
      const current = Option.getOrUndefined(value)
      return (
        <GoalPanel
          key={current?.id ?? "none"}
          name={current?.name ?? ""}
          targetEuros={current === undefined ? "" : String(Money.toEuros(current.targetAmount))}
          enabled={current?.enabled}
          busy={isBusy(save)}
          error={errorOf(save)}
          onSave={(name, targetEuros) => {
            void runSave({ household, name, targetEuros: Number(targetEuros) }).then(after)
          }}
          onToggle={(enabled) => {
            if (current === undefined) return
            void runToggle({ id: current.id, enabled }).then(after)
          }}
        />
      )
    }
  })
}
