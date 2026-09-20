/** In-memory income sources, with `inspect` for what a test needs to assert. */
import { Effect, Layer, Match } from "effect"

import {
  FreelanceIncome,
  type IncomeSource,
  SalaryIncome
} from "@/modules/household/core/domain/IncomeSource"
import {
  IncomeSources,
  type IncomeSourcesShape
} from "@/modules/household/core/ports/secondary/IncomeSources"

export interface IncomeSourcesStubOptions {
  readonly sources?: ReadonlyArray<IncomeSource>
}

export const makeIncomeSourcesStub = (options: IncomeSourcesStubOptions = {}) => {
  let sources: ReadonlyArray<IncomeSource> = options.sources ?? []
  let saves = 0

  const shape: IncomeSourcesShape = {
    all: Effect.sync(() => sources),

    forPerson: (person) => Effect.sync(() => sources.filter((s) => s.personId === person)),

    save: (source) =>
      Effect.sync(() => {
        saves += 1
        sources = [...sources.filter((s) => s.id !== source.id), source]
      }),

    setEnabled: (id, enabled) =>
      Effect.sync(() => {
        // Rebuilt through its own constructor: spreading a tagged class would
        // produce a plain object that no longer matches its own variant.
        const toggled = (source: IncomeSource): IncomeSource =>
          Match.valueTags(source, {
            FreelanceIncome: (freelance) => new FreelanceIncome({ ...freelance, enabled }),
            SalaryIncome: (salary) => new SalaryIncome({ ...salary, enabled })
          })
        sources = sources.map((source) => (source.id === id ? toggled(source) : source))
      }),

    remove: (id) =>
      Effect.sync(() => {
        sources = sources.filter((s) => s.id !== id)
      })
  }

  return { layer: Layer.succeed(IncomeSources)(shape), inspect: () => ({ saves, sources }) }
}
