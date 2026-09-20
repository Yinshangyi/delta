/** In-memory valuations, with `inspect` for what a test needs to assert. */
import { Effect, Layer } from "effect"

import { balanceSnapshotId } from "@/modules/capital/core/domain/BalanceSnapshot"
import {
  ValuationHistory,
  type ValuationHistoryShape
} from "@/modules/capital/core/ports/secondary/ValuationHistory"

import type { BalanceSnapshot } from "@/modules/capital/core/domain/BalanceSnapshot"

export interface ValuationHistoryStubOptions {
  readonly snapshots?: ReadonlyArray<BalanceSnapshot>
}

export const makeValuationHistoryStub = (options: ValuationHistoryStubOptions = {}) => {
  let snapshots: ReadonlyArray<BalanceSnapshot> = options.snapshots ?? []
  let minted = 0

  const shape: ValuationHistoryShape = {
    nextId: Effect.sync(() => {
      minted += 1
      return balanceSnapshotId(`valuation-${minted}`)
    }),

    all: Effect.sync(() => snapshots),

    forHolding: (holding) =>
      Effect.sync(() => snapshots.filter((each) => each.holdingId === holding)),

    record: (snapshot) =>
      Effect.sync(() => {
        snapshots = [...snapshots.filter((each) => each.id !== snapshot.id), snapshot]
      }),

    remove: (id) =>
      Effect.sync(() => {
        snapshots = snapshots.filter((each) => each.id !== id)
      })
  }

  return { layer: Layer.succeed(ValuationHistory)(shape), inspect: () => ({ snapshots }) }
}
