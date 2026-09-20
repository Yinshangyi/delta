/**
 * Everything the scenario screens need in one read: the saved scenarios, the
 * live entities their overrides point at, and which of them are broken.
 *
 * The live entities come along because two things need them — resolving an
 * override to a name, and deciding whether it still points at anything — and
 * a screen that fetched them separately could show a name for something it had
 * already marked missing.
 */
import { Data, Effect, Match } from "effect"

import { Holdings } from "@/modules/capital/core/ports/secondary/Holdings"
import { Commitments } from "@/modules/commitments/core/ports/secondary/Commitments"
import { IncomeSources } from "@/modules/household/core/ports/secondary/IncomeSources"
import { brokenReferences } from "@/modules/scenarios/core/domain/BrokenReferences"
import { Scenarios } from "@/modules/scenarios/core/ports/secondary/Scenarios"

import type { IncomeSource } from "@/modules/household/core/domain/IncomeSource"
import type {
  BrokenReference,
  LiveEntities
} from "@/modules/scenarios/core/domain/BrokenReferences"
import type { Scenario } from "@/modules/scenarios/core/domain/Scenario"
import type { PersistenceError } from "@/shared/domain/PersistenceError"

export class ScenarioWithHealth extends Data.Class<{
  readonly scenario: Scenario
  readonly broken: ReadonlyArray<BrokenReference>
}> {}

export class Choice extends Data.Class<{
  readonly id: string
  readonly name: string
}> {}

/**
 * The entities each kind of change can actually affect, kept apart.
 *
 * A "change a salary" offered against a freelance source produces an override
 * that silently does nothing — the kind of quiet no-op this codebase keeps
 * turning up — so the choice is never offered in the first place.
 */
export class ScenarioChoices extends Data.Class<{
  readonly freelance: ReadonlyArray<Choice>
  readonly salaried: ReadonlyArray<Choice>
  readonly commitments: ReadonlyArray<Choice>
  readonly holdings: ReadonlyArray<Choice>
}> {}

export class ScenarioOverview extends Data.Class<{
  readonly scenarios: ReadonlyArray<ScenarioWithHealth>
  readonly live: LiveEntities
  readonly choices: ScenarioChoices
  /** Id to name, for rendering an override as a decision rather than a row. */
  readonly names: ReadonlyMap<string, string>
}> {}

const choiceOf = (entity: { readonly id: string; readonly name: string }) =>
  new Choice({ id: entity.id, name: entity.name })

const freelanceOf = (sources: ReadonlyArray<IncomeSource>): ReadonlyArray<Choice> =>
  sources.flatMap((source) =>
    Match.valueTags(source, {
      FreelanceIncome: (each): ReadonlyArray<Choice> => [choiceOf(each)],
      SalaryIncome: (): ReadonlyArray<Choice> => []
    })
  )

const salariedOf = (sources: ReadonlyArray<IncomeSource>): ReadonlyArray<Choice> =>
  sources.flatMap((source) =>
    Match.valueTags(source, {
      FreelanceIncome: (): ReadonlyArray<Choice> => [],
      SalaryIncome: (each): ReadonlyArray<Choice> => [choiceOf(each)]
    })
  )

export const scenarioOverview: Effect.Effect<
  ScenarioOverview,
  PersistenceError,
  | typeof Scenarios.Identifier
  | typeof IncomeSources.Identifier
  | typeof Commitments.Identifier
  | typeof Holdings.Identifier
> = Effect.gen(function* () {
  const scenarios = yield* Scenarios
  const incomes = yield* IncomeSources
  const commitments = yield* Commitments
  const holdings = yield* Holdings

  const sources = yield* incomes.all
  const owed = yield* commitments.all
  const owned = yield* holdings.all

  const live: LiveEntities = {
    incomeSources: sources.map((each) => each.id),
    commitments: owed.map((each) => each.id),
    holdings: owned.map((each) => each.id)
  }

  const names = new Map<string, string>([
    ...sources.map((each) => [each.id, each.name] as const),
    ...owed.map((each) => [each.id, each.name] as const),
    ...owned.map((each) => [each.id, each.name] as const)
  ])

  return new ScenarioOverview({
    scenarios: (yield* scenarios.all).map(
      (scenario) => new ScenarioWithHealth({ scenario, broken: brokenReferences(scenario, live) })
    ),
    live,
    choices: new ScenarioChoices({
      freelance: freelanceOf(sources),
      salaried: salariedOf(sources),
      commitments: owed.map(choiceOf),
      holdings: owned.map(choiceOf)
    }),
    names
  })
})
