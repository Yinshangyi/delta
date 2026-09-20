/**
 * Run a household mutation and, if it succeeded, re-read the overview.
 *
 * Every household mutation needs the same two things afterwards — the screen
 * refreshed, and any typed failure kept for display — and a screen that forgot
 * the refresh would show stale data that looks like a failed save. Doing it
 * once here is what makes "takes effect immediately" (spec §40, §14) true of
 * every mutation rather than of the ones that remembered.
 */
import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react"
import { Exit } from "effect"
import { useCallback } from "react"

import { householdOverviewAtom } from "@/modules/household/primary_adapters/reactivity/HouseholdAtoms"
import { type AsyncState, resolveMutation } from "@/shared/reactivity/AsyncState"

import type { Atom } from "effect/unstable/reactivity"

export interface HouseholdMutation<Arg, A, E> {
  readonly state: AsyncState<A, E>
  readonly run: (argument: Arg) => Promise<Exit.Exit<A, E>>
}

export const useHouseholdMutation = <Arg, A, E>(
  atom: Atom.AtomResultFn<Arg, A, E>
): HouseholdMutation<Arg, A, E> => {
  const state = resolveMutation(useAtomValue(atom))
  const set = useAtomSet(atom, { mode: "promiseExit" })
  const refresh = useAtomRefresh(householdOverviewAtom)

  const run = useCallback(
    async (argument: Arg) => {
      const exit = await set(argument)
      if (Exit.isSuccess(exit)) refresh()
      return exit
    },
    [set, refresh]
  )

  return { state, run }
}
