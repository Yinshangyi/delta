/**
 * Run a commitment mutation and, if it succeeded, re-read what the screens
 * show.
 *
 * Both atoms are refreshed because the two are entangled: recording a debt
 * balance changes the history *and* the overview's outstanding total, and a
 * screen that refreshed only one would show a figure contradicting the row
 * beneath it.
 */
import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react"
import { Exit } from "effect"
import { useCallback } from "react"

import {
  commitmentsOverviewAtom,
  debtHistoryAtom
} from "@/modules/commitments/primary_adapters/reactivity/CommitmentAtoms"
import { type AsyncState, resolveMutation } from "@/shared/reactivity/AsyncState"

import type { Atom } from "effect/unstable/reactivity"

export interface CommitmentMutation<Arg, A, E> {
  readonly state: AsyncState<A, E>
  readonly run: (argument: Arg) => Promise<Exit.Exit<A, E>>
}

export const useCommitmentMutation = <Arg, A, E>(
  atom: Atom.AtomResultFn<Arg, A, E>
): CommitmentMutation<Arg, A, E> => {
  const state = resolveMutation(useAtomValue(atom))
  const set = useAtomSet(atom, { mode: "promiseExit" })
  const refreshOverview = useAtomRefresh(commitmentsOverviewAtom)
  const refreshHistory = useAtomRefresh(debtHistoryAtom)

  const run = useCallback(
    async (argument: Arg) => {
      const exit = await set(argument)
      if (Exit.isSuccess(exit)) {
        refreshOverview()
        refreshHistory()
      }
      return exit
    },
    [set, refreshOverview, refreshHistory]
  )

  return { state, run }
}
