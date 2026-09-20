/**
 * Record what a holding is actually worth now (CAP-04, CAP-06, spec §71).
 *
 * A new snapshot, never an edit of the last one: the history is the point —
 * it is what lets a balance be corrected without losing what was believed
 * before, and what makes §2.3 recalculate from reality rather than from
 * Delta's own forecast.
 *
 * `today` is passed in rather than read from a clock. The domain holds no
 * `Date` and has no timezone, so only the caller knows what day it is where
 * the person is standing; a use case that guessed would refuse valid dates in
 * one half of the world.
 */
import { Data, Effect } from "effect"

import { BalanceSnapshot } from "@/modules/capital/core/domain/BalanceSnapshot"
import { basisOf } from "@/modules/capital/core/domain/Holding"
import { ValuationHistory } from "@/modules/capital/core/ports/secondary/ValuationHistory"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"

import type {
  BalanceSnapshot as Snapshot,
  BalanceSnapshotId
} from "@/modules/capital/core/domain/BalanceSnapshot"
import type { Holding } from "@/modules/capital/core/domain/Holding"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

/** CAP-04: a balance you have not had yet is a typo, not a forecast. */
export class ValuationInTheFuture extends Data.TaggedError("ValuationInTheFuture")<{
  readonly date: LocalDate.LocalDate
  readonly today: LocalDate.LocalDate
}> {}

export interface ValuationDraft {
  /** The holding itself, because its kind decides the basis (spec §71). */
  readonly holding: Holding
  readonly date: string
  readonly amountEuros: number
  readonly today: string
  /** Present when correcting a mistyped snapshot rather than adding one. */
  readonly existing: BalanceSnapshotId | undefined
}

export type RecordValuationError =
  | Money.InvalidMoney
  | LocalDate.InvalidLocalDate
  | ValuationInTheFuture
  | PersistenceError

export const recordValuation = (
  draft: ValuationDraft
): Effect.Effect<Snapshot, RecordValuationError, typeof ValuationHistory.Identifier> =>
  Effect.gen(function* () {
    const date = yield* Effect.fromResult(LocalDate.parse(draft.date))
    const today = yield* Effect.fromResult(LocalDate.parse(draft.today))
    if (LocalDate.isAfter(date, today)) {
      return yield* Effect.fail(new ValuationInTheFuture({ date, today }))
    }

    const amount = yield* Effect.fromResult(Money.fromEuros(draft.amountEuros))

    const valuations = yield* ValuationHistory
    const snapshot = new BalanceSnapshot({
      id: draft.existing ?? (yield* valuations.nextId),
      holdingId: draft.holding.id,
      date,
      amount,
      basis: basisOf(draft.holding)
    })

    yield* valuations.record(snapshot)
    return snapshot
  })
