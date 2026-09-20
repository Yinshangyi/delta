/**
 * An `AsyncState` turned into the two things a form needs: whether to disable
 * the button, and what to say.
 *
 * Written once because every household form needs both, and a screen that
 * handled only `Failure` would swallow a defect into a button that stayed
 * enabled and did nothing.
 */
import { Match } from "effect"

import {
  DEFECT_MESSAGE,
  type HouseholdFailure,
  messageFor
} from "@/modules/household/primary_adapters/react/HouseholdVocabulary"

import type { AsyncState } from "@/shared/reactivity/AsyncState"

export const errorOf = (state: AsyncState<unknown, HouseholdFailure>): string | undefined =>
  Match.valueTags(state, {
    Idle: () => undefined,
    Loading: () => undefined,
    Success: () => undefined,
    Failure: ({ error }) => messageFor(error),
    Defect: () => DEFECT_MESSAGE
  })

export const isBusy = (state: AsyncState<unknown, HouseholdFailure>): boolean =>
  Match.valueTags(state, {
    Idle: () => false,
    Loading: () => true,
    Success: () => false,
    Failure: () => false,
    Defect: () => false
  })
