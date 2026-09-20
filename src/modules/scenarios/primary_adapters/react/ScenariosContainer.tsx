import { useAtomRefresh, useAtomSet, useAtomValue, useAtom } from "@effect/atom-react"
import { Exit, Match, Option } from "effect"
import { useEffect, useState } from "react"

import { FailureState } from "@/dsl/FailureState"
import { capitalOverviewAtom } from "@/modules/capital/primary_adapters/reactivity/CapitalAtoms"
import { Scenario, scenarioId, withoutOverride } from "@/modules/scenarios/core/domain/Scenario"
import { summarise } from "@/modules/scenarios/primary_adapters/react/ChangeSummary"
import { ApplyScenarioDialog } from "@/modules/scenarios/primary_adapters/react/components/ApplyScenarioDialog"
import { ScenarioBuilder } from "@/modules/scenarios/primary_adapters/react/components/ScenarioBuilder"
import { ScenarioList } from "@/modules/scenarios/primary_adapters/react/components/ScenarioList"
import { overrideFrom } from "@/modules/scenarios/primary_adapters/react/OverrideFromDraft"
import {
  DEFECT_MESSAGE,
  messageFor,
  SCENARIOS_COPY
} from "@/modules/scenarios/primary_adapters/react/ScenarioVocabulary"
import { previewAtom } from "@/modules/scenarios/primary_adapters/reactivity/PreviewAtom"
import {
  applyScenarioAtom,
  baselineAtom,
  deleteScenarioAtom,
  saveScenarioAtom,
  scenarioOverviewAtom,
  timeCostAtom
} from "@/modules/scenarios/primary_adapters/reactivity/ScenarioAtoms"
import { projectionAtom } from "@/modules/trajectory/primary_adapters/reactivity/ProjectionAtoms"
import * as LocalDate from "@/shared/domain/LocalDate"
import { resolveMutation, resolveStream, valueOrUndefined } from "@/shared/reactivity/AsyncState"

import type { HouseholdId } from "@/modules/household/core/domain/Household"
import type { BrokenReference } from "@/modules/scenarios/core/domain/BrokenReferences"
import type { OverrideId, ScenarioOverride } from "@/modules/scenarios/core/domain/Scenario"
import type { ScenarioOverview } from "@/modules/scenarios/core/use_cases/ScenarioOverviewQuery"
import type { ScenarioFailure } from "@/modules/scenarios/primary_adapters/react/ScenarioVocabulary"
import type * as YearMonth from "@/shared/domain/YearMonth"
import type { AsyncState } from "@/shared/reactivity/AsyncState"

export interface ScenariosContainerProps {
  readonly household: HouseholdId
}

const errorOf = (state: AsyncState<unknown, ScenarioFailure>): string | undefined =>
  Match.valueTags(state, {
    Idle: () => undefined,
    Loading: () => undefined,
    Success: () => undefined,
    Failure: ({ error }) => messageFor(error),
    Defect: () => DEFECT_MESSAGE
  })

export function ScenariosContainer({ household }: ScenariosContainerProps) {
  const overview = resolveStream(useAtomValue(scenarioOverviewAtom))
  const baseline = valueOrUndefined(useAtomValue(baselineAtom))

  return Match.valueTags(overview, {
    Idle: () => <p className="text-muted text-sm">Loading…</p>,
    Loading: () => <p className="text-muted text-sm">Loading…</p>,
    Failure: ({ error }) => (
      <FailureState title="Could not load your scenarios." detail={messageFor(error)} />
    ),
    Defect: () => <FailureState title="Could not load your scenarios." detail={DEFECT_MESSAGE} />,
    Success: ({ value }) => (
      <Scenarios
        household={household}
        overview={value}
        baseline={
          baseline === undefined
            ? undefined
            : Option.match(baseline, {
                onNone: () => undefined,
                onSome: (projection) =>
                  Match.valueTags(projection.result.status, {
                    Reachable: (reachable) => LocalDate.toYearMonth(reachable.targetDate),
                    NotReachable: (): YearMonth.YearMonth | undefined => undefined
                  })
              })
        }
      />
    )
  })
}

interface ScenariosProps {
  readonly household: HouseholdId
  readonly overview: ScenarioOverview
  readonly baseline: YearMonth.YearMonth | undefined
}

function Scenarios({ household, overview, baseline }: ScenariosProps) {
  const [editing, setEditing] = useState<Scenario | undefined>(undefined)
  const [applying, setApplying] = useState(false)
  const [, setPreview] = useAtom(previewAtom)

  // Read once, at the top: calling this inside the builder branch would make
  // it a conditional hook.
  const costResult = useAtomValue(timeCostAtom)
  const cost = resolveMutation(costResult)
  const costValue = valueOrUndefined(costResult)
  const runCost = useAtomSet(timeCostAtom)
  const save = useAtomSet(saveScenarioAtom, { mode: "promiseExit" })
  const remove = useAtomSet(deleteScenarioAtom, { mode: "promiseExit" })
  const apply = resolveMutation(useAtomValue(applyScenarioAtom))
  const runApply = useAtomSet(applyScenarioAtom, { mode: "promiseExit" })

  const refreshScenarios = useAtomRefresh(scenarioOverviewAtom)
  const refreshBaseline = useAtomRefresh(baselineAtom)
  const refreshProjection = useAtomRefresh(projectionAtom)
  const refreshCapital = useAtomRefresh(capitalOverviewAtom)

  const busy = Match.valueTags(cost, {
    Idle: () => false,
    Loading: () => true,
    Success: () => false,
    Failure: () => false,
    Defect: () => false
  })

  const nameOf = (reference: string) => overview.names.get(reference)
  const brokenOf = (scenario: Scenario): ReadonlyArray<BrokenReference> =>
    overview.scenarios.find((each) => each.scenario.id === scenario.id)?.broken ?? []

  /** Recomputed whenever the stack changes — nothing about a delta is stored. */
  useEffect(() => {
    if (editing !== undefined) runCost(editing.overrides)
  }, [editing, runCost])

  const withOverride = (scenario: Scenario, override: ScenarioOverride) =>
    new Scenario({ ...scenario, overrides: [...scenario.overrides, override] })

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{SCENARIOS_COPY.title}</h1>
        <p className="text-muted text-sm">{SCENARIOS_COPY.description}</p>
      </header>

      {editing === undefined ? (
        <ScenarioList
          baseline={baseline}
          busy={false}
          rows={overview.scenarios.map((each) => ({
            id: each.scenario.id,
            name: each.scenario.name,
            changes: each.scenario.overrides.map((override) => summarise(override, nameOf).detail),
            targetDate: undefined,
            months: undefined,
            broken: each.broken.length > 0
          }))}
          onOpen={(id) => {
            const found = overview.scenarios.find((each) => each.scenario.id === id)
            if (found !== undefined) setEditing(found.scenario)
          }}
          onDelete={(id) => {
            void remove(id).then((exit) => {
              if (Exit.isSuccess(exit)) refreshScenarios()
            })
          }}
          onNew={() =>
            setEditing(
              new Scenario({
                id: scenarioId(crypto.randomUUID()),
                householdId: household,
                name: "",
                overrides: []
              })
            )
          }
        />
      ) : (
        <ScenarioBuilder
          name={editing.name}
          onRename={(name) => setEditing(new Scenario({ ...editing, name }))}
          changes={editing.overrides.map((override) => summarise(override, nameOf))}
          broken={brokenOf(editing)}
          cost={costValue}
          freelance={overview.choices.freelance}
          salaried={overview.choices.salaried}
          commitments={overview.choices.commitments}
          holdings={overview.choices.holdings}
          busy={busy}
          onAdd={(draft) => {
            const override = overrideFrom(crypto.randomUUID(), draft)
            if (override !== undefined) setEditing(withOverride(editing, override))
          }}
          onRemove={(id: OverrideId) => setEditing(withoutOverride(editing, id))}
          onDiscard={() => setEditing(undefined)}
          onPreview={() => setPreview(editing)}
          onApply={() => setApplying(true)}
          onSave={() => {
            void save(editing).then((exit) => {
              if (Exit.isSuccess(exit)) {
                refreshScenarios()
                setEditing(undefined)
              }
            })
          }}
        />
      )}

      <ApplyScenarioDialog
        open={applying && editing !== undefined}
        busy={false}
        error={errorOf(apply)}
        changes={editing === undefined ? [] : editing.overrides.map((o) => summarise(o, nameOf))}
        onCancel={() => setApplying(false)}
        onConfirm={() => {
          if (editing === undefined) return
          void runApply(editing).then((exit) => {
            if (!Exit.isSuccess(exit)) return
            setApplying(false)
            setEditing(undefined)
            setPreview(undefined)
            refreshScenarios()
            refreshBaseline()
            refreshProjection()
            refreshCapital()
          })
        }}
      />
    </div>
  )
}
