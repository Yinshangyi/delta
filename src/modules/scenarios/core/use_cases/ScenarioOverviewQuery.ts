/**
 * Everything the scenario screens need in one read: the saved scenarios, the
 * live entities their overrides point at, and which of them are broken.
 *
 * The live entities come along because two things need them — resolving an
 * override to a name, and deciding whether it still points at anything — and
 * a screen that fetched them separately could show a name for something it had
 * already marked missing.
 */
import { Data, Effect } from "effect"

import { Holdings } from "@/modules/capital/core/ports/secondary/Holdings"
import { Commitments } from "@/modules/commitments/core/ports/secondary/Commitments"
import { IncomeSources } from "@/modules/household/core/ports/secondary/IncomeSources"
import { brokenReferences } from "@/modules/scenarios/core/domain/BrokenReferences"
import { Scenarios } from "@/modules/scenarios/core/ports/secondary/Scenarios"

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

export class ScenarioOverview extends Data.Class<{
  readonly scenarios: ReadonlyArray<ScenarioWithHealth>
  readonly live: LiveEntities
  /** Id to name, for rendering an override as a decision rather than a row. */
  readonly names: ReadonlyMap<string, string>
}> {}

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
    names
  })
})
