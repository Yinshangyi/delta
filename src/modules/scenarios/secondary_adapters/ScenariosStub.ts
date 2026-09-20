/** In-memory scenarios, with `inspect` for what a test needs to assert. */
import { Effect, Layer } from "effect"

import { scenarioId } from "@/modules/scenarios/core/domain/Scenario"
import { Scenarios, type ScenariosShape } from "@/modules/scenarios/core/ports/secondary/Scenarios"

import type { Scenario } from "@/modules/scenarios/core/domain/Scenario"

export interface ScenariosStubOptions {
  readonly scenarios?: ReadonlyArray<Scenario>
}

export const makeScenariosStub = (options: ScenariosStubOptions = {}) => {
  let scenarios: ReadonlyArray<Scenario> = options.scenarios ?? []
  let minted = 0

  const shape: ScenariosShape = {
    nextId: Effect.sync(() => {
      minted += 1
      return scenarioId(`scenario-${minted}`)
    }),
    all: Effect.sync(() => scenarios),
    forHousehold: (household) =>
      Effect.sync(() => scenarios.filter((each) => each.householdId === household)),
    save: (scenario) =>
      Effect.sync(() => {
        scenarios = [...scenarios.filter((each) => each.id !== scenario.id), scenario]
      }),
    remove: (id) =>
      Effect.sync(() => {
        scenarios = scenarios.filter((each) => each.id !== id)
      })
  }

  return { layer: Layer.succeed(Scenarios)(shape), inspect: () => ({ scenarios }) }
}
