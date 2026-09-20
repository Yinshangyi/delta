/**
 * The monthly routine: read the balances off your banking app, type them in,
 * and see what moved (TRJ-05, spec §16, §62).
 *
 * **Blank means unchanged, not zero.** A household with four holdings checks
 * two of them this month, and a form that read the empty fields as €0 would
 * wipe out half their capital on a routine visit. Nothing is recorded for a
 * holding whose field was left alone.
 *
 * The whole pass is one call so that a failure on the third holding does not
 * leave the first two recorded and the screen showing a half-updated total.
 */
import { Effect } from "effect"

import { BalanceSnapshot } from "@/modules/capital/core/domain/BalanceSnapshot"
import { basisOf } from "@/modules/capital/core/domain/Holding"
import { validate } from "@/modules/capital/core/domain/ValuationDate"
import { ValuationHistory } from "@/modules/capital/core/ports/secondary/ValuationHistory"
import * as LocalDate from "@/shared/domain/LocalDate"
import * as Money from "@/shared/domain/Money"

import type { Holding } from "@/modules/capital/core/domain/Holding"
import type { RecordValuationError } from "@/modules/capital/core/use_cases/RecordValuationUseCase"

export interface BalanceEntry {
  readonly holding: Holding
  /** Empty means "not checked this month", and nothing is written. */
  readonly amountEuros: string
}

export interface ManyValuationsDraft {
  readonly entries: ReadonlyArray<BalanceEntry>
  readonly date: string
  readonly today: string
}

const entered = (entries: ReadonlyArray<BalanceEntry>) =>
  entries.filter((entry) => entry.amountEuros.trim() !== "")

export const recordManyValuations = (
  draft: ManyValuationsDraft
): Effect.Effect<
  ReadonlyArray<BalanceSnapshot>,
  RecordValuationError,
  typeof ValuationHistory.Identifier
> =>
  Effect.gen(function* () {
    const date = yield* Effect.fromResult(
      validate(
        yield* Effect.fromResult(LocalDate.parse(draft.date)),
        yield* Effect.fromResult(LocalDate.parse(draft.today))
      )
    )

    const valuations = yield* ValuationHistory
    const recorded: Array<BalanceSnapshot> = []

    for (const entry of entered(draft.entries)) {
      const snapshot = new BalanceSnapshot({
        id: yield* valuations.nextId,
        holdingId: entry.holding.id,
        date,
        amount: yield* Effect.fromResult(Money.fromEuros(Number(entry.amountEuros))),
        basis: basisOf(entry.holding)
      })
      yield* valuations.record(snapshot)
      recorded.push(snapshot)
    }

    return recorded
  })
