/** In-memory holdings, with `inspect` for what a test needs to assert. */
import { Effect, Layer, Match } from "effect"

import { BankAccount, holdingId, PhysicalAsset } from "@/modules/capital/core/domain/Holding"
import { Holdings, type HoldingsShape } from "@/modules/capital/core/ports/secondary/Holdings"

import type { Holding } from "@/modules/capital/core/domain/Holding"

export interface HoldingsStubOptions {
  readonly holdings?: ReadonlyArray<Holding>
}

// Rebuilt through its own constructor: spreading a tagged class would produce a
// plain object that no longer matches its own variant.
const included = (holding: Holding, includedInCapital: boolean): Holding =>
  Match.valueTags(holding, {
    BankAccount: (account) => new BankAccount({ ...account, includedInCapital }),
    PhysicalAsset: (asset) => new PhysicalAsset({ ...asset, includedInCapital })
  })

export const makeHoldingsStub = (options: HoldingsStubOptions = {}) => {
  let holdings: ReadonlyArray<Holding> = options.holdings ?? []
  let minted = 0

  const shape: HoldingsShape = {
    nextId: Effect.sync(() => {
      minted += 1
      return holdingId(`holding-${minted}`)
    }),

    all: Effect.sync(() => holdings),

    forHousehold: (household) =>
      Effect.sync(() => holdings.filter((each) => each.householdId === household)),

    save: (holding) =>
      Effect.sync(() => {
        holdings = [...holdings.filter((each) => each.id !== holding.id), holding]
      }),

    setIncluded: (id, value) =>
      Effect.sync(() => {
        holdings = holdings.map((each) => (each.id === id ? included(each, value) : each))
      }),

    remove: (id) =>
      Effect.sync(() => {
        holdings = holdings.filter((each) => each.id !== id)
      })
  }

  return { layer: Layer.succeed(Holdings)(shape), inspect: () => ({ holdings }) }
}
