import { Effect } from "effect"

/** The module's bridge from React to Effect. */
import { appRuntime } from "@/bootstrap/runtime/AppRuntime"
import { ScenarioProjections } from "@/modules/scenarios/core/ports/secondary/ScenarioProjections"
import { Scenarios } from "@/modules/scenarios/core/ports/secondary/Scenarios"
import { applyScenario } from "@/modules/scenarios/core/use_cases/ApplyScenarioUseCase"
import { scenarioOverview } from "@/modules/scenarios/core/use_cases/ScenarioOverviewQuery"
import { timeCostOfOverrides } from "@/modules/scenarios/core/use_cases/TimeCostQuery"
import { today } from "@/shared/presentation/Today"

import type {
  Scenario,
  ScenarioId,
  ScenarioOverride
} from "@/modules/scenarios/core/domain/Scenario"

export const scenarioOverviewAtom = appRuntime.atom(scenarioOverview)

/** The baseline, for the list's "as things are" line. */
export const baselineAtom = appRuntime.atom(
  Effect.gen(function* () {
    const projections = yield* ScenarioProjections
    return yield* projections.under([])
  })
)

export const timeCostAtom = appRuntime.fn<ReadonlyArray<ScenarioOverride>>()((overrides) =>
  timeCostOfOverrides(overrides)
)

export const saveScenarioAtom = appRuntime.fn<Scenario>()((scenario) =>
  Effect.gen(function* () {
    const scenarios = yield* Scenarios
    yield* scenarios.save(scenario)
  })
)

export const deleteScenarioAtom = appRuntime.fn<ScenarioId>()((id) =>
  Effect.gen(function* () {
    const scenarios = yield* Scenarios
    yield* scenarios.remove(id)
  })
)

export const applyScenarioAtom = appRuntime.fn<Scenario>()((scenario) =>
  applyScenario(scenario, today())
)

export const nextScenarioIdAtom = appRuntime.fn<void>()(() =>
  Effect.gen(function* () {
    const scenarios = yield* Scenarios
    return yield* scenarios.nextId
  })
)
