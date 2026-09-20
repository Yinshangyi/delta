/**
 * Run a capital mutation and, if it succeeded, re-read everything it moved.
 *
 * Three atoms, because a single toggle moves all three: the holdings list, the
 * net-worth figure, and the projected target date. CAP-07's whole point is
 * that the date is visible while toggling, and a refresh that missed it would
 * leave the answer to the question stale on screen.
 */
import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react"
import { Exit } from "effect"
import { useCallback } from "react"

import {
  capitalOverviewAtom,
  netWorthAtom
} from "@/modules/capital/primary_adapters/reactivity/CapitalAtoms"
import { projectionAtom } from "@/modules/trajectory/primary_adapters/reactivity/ProjectionAtoms"
import { type AsyncState, resolveMutation } from "@/shared/reactivity/AsyncState"

import type { Atom } from "effect/unstable/reactivity"

export interface CapitalMutation<Arg, A, E> {
  readonly state: AsyncState<A, E>
  readonly run: (argument: Arg) => Promise<Exit.Exit<A, E>>
}

export const useCapitalMutation = <Arg, A, E>(
  atom: Atom.AtomResultFn<Arg, A, E>
): CapitalMutation<Arg, A, E> => {
  const state = resolveMutation(useAtomValue(atom))
  const set = useAtomSet(atom, { mode: "promiseExit" })
  const refreshOverview = useAtomRefresh(capitalOverviewAtom)
  const refreshNetWorth = useAtomRefresh(netWorthAtom)
  const refreshProjection = useAtomRefresh(projectionAtom)

  const run = useCallback(
    async (argument: Arg) => {
      const exit = await set(argument)
      if (Exit.isSuccess(exit)) {
        refreshOverview()
        refreshNetWorth()
        refreshProjection()
      }
      return exit
    },
    [set, refreshOverview, refreshNetWorth, refreshProjection]
  )

  return { state, run }
}
