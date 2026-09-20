/** In-memory debt snapshots, with `inspect` for what a test needs to assert. */
import { Effect, Layer } from "effect"

import { debtSnapshotId } from "@/modules/commitments/core/domain/DebtSnapshot"
import {
  DebtHistory,
  type DebtHistoryShape
} from "@/modules/commitments/core/ports/secondary/DebtHistory"

import type { DebtSnapshot } from "@/modules/commitments/core/domain/DebtSnapshot"

export interface DebtHistoryStubOptions {
  readonly snapshots?: ReadonlyArray<DebtSnapshot>
}

export const makeDebtHistoryStub = (options: DebtHistoryStubOptions = {}) => {
  let snapshots: ReadonlyArray<DebtSnapshot> = options.snapshots ?? []
  let minted = 0

  const shape: DebtHistoryShape = {
    nextId: Effect.sync(() => {
      minted += 1
      return debtSnapshotId(`snapshot-${minted}`)
    }),

    all: Effect.sync(() => snapshots),

    forDebt: (debt) => Effect.sync(() => snapshots.filter((each) => each.debtId === debt)),

    record: (snapshot) =>
      Effect.sync(() => {
        snapshots = [...snapshots.filter((each) => each.id !== snapshot.id), snapshot]
      }),

    remove: (id) =>
      Effect.sync(() => {
        snapshots = snapshots.filter((each) => each.id !== id)
      })
  }

  return { layer: Layer.succeed(DebtHistory)(shape), inspect: () => ({ snapshots }) }
}
