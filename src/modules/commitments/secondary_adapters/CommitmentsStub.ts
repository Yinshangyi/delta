/** In-memory commitments, with `inspect` for what a test needs to assert. */
import { Effect, Layer, Match } from "effect"

import {
  commitmentId,
  Debt,
  OneOffExpense,
  RecurringExpense,
  RecurringTaxPayment,
  TaxLiability
} from "@/modules/commitments/core/domain/Commitment"
import {
  Commitments,
  type CommitmentsShape
} from "@/modules/commitments/core/ports/secondary/Commitments"

import type { Commitment } from "@/modules/commitments/core/domain/Commitment"

export interface CommitmentsStubOptions {
  readonly commitments?: ReadonlyArray<Commitment>
}

// Rebuilt through its own constructor: spreading a tagged class would produce a
// plain object that no longer matches its own variant.
const toggled = (commitment: Commitment, enabled: boolean): Commitment =>
  Match.valueTags(commitment, {
    RecurringExpense: (each) => new RecurringExpense({ ...each, enabled }),
    OneOffExpense: (each) => new OneOffExpense({ ...each, enabled }),
    Debt: (each) => new Debt({ ...each, enabled }),
    TaxLiability: (each) => new TaxLiability({ ...each, enabled }),
    RecurringTaxPayment: (each) => new RecurringTaxPayment({ ...each, enabled })
  })

export const makeCommitmentsStub = (options: CommitmentsStubOptions = {}) => {
  let commitments: ReadonlyArray<Commitment> = options.commitments ?? []
  let minted = 0

  const shape: CommitmentsShape = {
    nextId: Effect.sync(() => {
      minted += 1
      return commitmentId(`commitment-${minted}`)
    }),

    all: Effect.sync(() => commitments),

    forHousehold: (household) =>
      Effect.sync(() => commitments.filter((each) => each.householdId === household)),

    save: (commitment) =>
      Effect.sync(() => {
        commitments = [...commitments.filter((each) => each.id !== commitment.id), commitment]
      }),

    setEnabled: (id, enabled) =>
      Effect.sync(() => {
        commitments = commitments.map((each) => (each.id === id ? toggled(each, enabled) : each))
      }),

    remove: (id) =>
      Effect.sync(() => {
        commitments = commitments.filter((each) => each.id !== id)
      })
  }

  return { layer: Layer.succeed(Commitments)(shape), inspect: () => ({ commitments }) }
}
