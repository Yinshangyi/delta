/**
 * The only boundary between `effect/unstable/reactivity/AsyncResult` and
 * React. Atoms resolve to an `AsyncState`; components match on it and never
 * import `AsyncResult` themselves.
 *
 * That confinement is the point. If Delta ever moves off Effect's reactivity —
 * to Jotai, TanStack Query, or plain React state — this file and its two
 * resolvers change and every consumer keeps compiling.
 *
 * Keep it small. No `isLoading`, no `getOrElse`, no `match` helper: consumers
 * use `Match.valueTags` directly, which is the project idiom. Each helper added
 * here is one more thing to port if the boundary ever moves.
 */
import { Predicate } from "effect"
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult"

export type AsyncState<A, E> =
  | { readonly _tag: "Idle" }
  | { readonly _tag: "Loading" }
  | { readonly _tag: "Success"; readonly value: A }
  | { readonly _tag: "Failure"; readonly error: E }
  | { readonly _tag: "Defect"; readonly defect: Error }

const Idle: AsyncState<never, never> = { _tag: "Idle" }
const Loading: AsyncState<never, never> = { _tag: "Loading" }
const Success = <A>(value: A): AsyncState<A, never> => ({ _tag: "Success", value })
const Failure = <E>(error: E): AsyncState<never, E> => ({ _tag: "Failure", error })
const Defect = (defect: Error): AsyncState<never, never> => ({ _tag: "Defect", defect })

export const AsyncState = { Idle, Loading, Success, Failure, Defect }

/** A defect can be anything thrown; a screen needs something with a message. */
const asError = (defect: unknown): Error =>
  Predicate.isError(defect) ? defect : new globalThis.Error(String(defect))

/**
 * For command atoms — `runtime.fn(effect)`. `waiting` means a fired effect is
 * in flight, including a retry after a previous outcome landed, so it maps to
 * Loading: a button should spin again on the second click rather than freeze
 * showing the first result.
 */
export const resolveMutation = <A, E>(result: AsyncResult.AsyncResult<A, E>): AsyncState<A, E> =>
  result.waiting
    ? AsyncState.Loading
    : AsyncResult.matchWithError(result, {
        onInitial: () => AsyncState.Idle,
        onError: (error) => AsyncState.Failure(error),
        onDefect: (defect) => AsyncState.Defect(asError(defect)),
        onSuccess: (success) => AsyncState.Success(success.value)
      })

/**
 * For query atoms — `runtime.atom(effect | stream)`. A stream stays open, so
 * the runtime marks every emission `waiting`; matching on `waiting` here would
 * report Loading forever. Match by tag only, and treat Initial as Loading
 * because nothing has arrived yet.
 */
export const resolveStream = <A, E>(result: AsyncResult.AsyncResult<A, E>): AsyncState<A, E> =>
  AsyncResult.matchWithError(result, {
    onInitial: () => AsyncState.Loading,
    onError: (error) => AsyncState.Failure(error),
    onDefect: (defect) => AsyncState.Defect(asError(defect)),
    onSuccess: (success) => AsyncState.Success(success.value)
  })
